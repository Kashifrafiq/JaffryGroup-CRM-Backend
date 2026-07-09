import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { basename } from 'path';

/**
 * S3-compatible uploads (AWS S3, **DigitalOcean Spaces**, MinIO, etc.).
 *
 * **DigitalOcean Spaces:** set `S3_ENDPOINT` to `https://<region>.digitaloceanspaces.com`
 * (e.g. `https://nyc3.digitaloceanspaces.com`), `AWS_S3_BUCKET` to your Space name,
 * `AWS_REGION` to the same region slug (`nyc3`), and Spaces access keys in
 * `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
 */
@Injectable()
export class S3StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly region: string;

  /**
   * If `S3_ENDPOINT` is the Space subdomain (`https://<bucket>.<region>.digitaloceanspaces.com`),
   * the SDK would also virtual-host the bucket and TLS would fail. Normalize to the regional base URL.
   */
  /** Safe single path segment (folder or filename stem); avoids slashes and odd S3 key issues. */
  static sanitizePathSegment(raw: string, maxLen: number): string {
    const s = raw
      .normalize('NFKC')
      .trim()
      .replace(/[/\\?#]+/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^\.+|\.+$/g, '');
    const out = s.slice(0, maxLen);
    return out.length > 0 ? out : 'unnamed';
  }

  static normalizeDigitalOceanEndpoint(endpoint: string, bucket: string | undefined): string | undefined {
    if (!endpoint) return undefined;
    if (!bucket) return endpoint;
    try {
      const u = new URL(endpoint);
      if (!u.hostname.endsWith('.digitaloceanspaces.com')) return endpoint;
      const escaped = bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`^${escaped}\\.([a-z0-9]+)\\.digitaloceanspaces\\.com$`, 'i');
      const m = u.hostname.match(re);
      if (m) {
        u.hostname = `${m[1]}.digitaloceanspaces.com`;
        return u.origin;
      }
    } catch {
      return endpoint;
    }
    return endpoint;
  }

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1').trim();
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '').trim() || undefined;
    const key = this.configService.get<string>('AWS_ACCESS_KEY_ID', '').trim();
    const secret = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '').trim();
    const rawEndpoint =
      this.configService.get<string>('S3_ENDPOINT', '').trim() ||
      this.configService.get<string>('SPACES_ENDPOINT', '').trim() ||
      this.configService.get<string>('DO_SPACES_ENDPOINT', '').trim() ||
      '';
    const endpoint = S3StorageService.normalizeDigitalOceanEndpoint(rawEndpoint, this.bucket);
    const forcePathStyle = this.isTruthy(this.configService.get<string>('S3_FORCE_PATH_STYLE'));

    if (!this.bucket || !key || !secret) {
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: this.region,
      endpoint: endpoint || undefined,
      forcePathStyle: forcePathStyle || undefined,
      credentials: { accessKeyId: key, secretAccessKey: secret },
    });
  }

  private isTruthy(value: string | undefined): boolean {
    if (!value) return false;
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  isConfigured(): boolean {
    return this.client !== null && !!this.bucket;
  }

  /**
   * Presigned PUT for direct browser upload. Caller must persist `key` on the document row
   * and verify it on `complete` to prevent tampering.
   */
  async createPresignedPutUrl(
    objectKey: string,
    contentType: string,
    expiresSeconds = 900,
  ): Promise<{ uploadUrl: string; bucket: string; key: string; expiresIn: number }> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException(
        'Object storage uploads are not configured. Set AWS_S3_BUCKET (Space name), AWS_REGION (e.g. nyc3), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. For DigitalOcean Spaces also set S3_ENDPOINT=https://<region>.digitaloceanspaces.com',
      );
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: expiresSeconds });
    return { uploadUrl, bucket: this.bucket, key: objectKey, expiresIn: expiresSeconds };
  }

  async createPresignedGetUrl(
    objectKey: string,
    expiresSeconds = 900,
  ): Promise<{ readUrl: string; bucket: string; key: string; expiresIn: number }> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException(
        'Object storage uploads are not configured. Set AWS_S3_BUCKET (Space name), AWS_REGION (e.g. nyc3), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. For DigitalOcean Spaces also set S3_ENDPOINT=https://<region>.digitaloceanspaces.com',
      );
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    const readUrl = await getSignedUrl(this.client, command, { expiresIn: expiresSeconds });
    return { readUrl, bucket: this.bucket, key: objectKey, expiresIn: expiresSeconds };
  }

  /** Best-effort delete; no-op when storage is not configured. */
  async deleteObject(objectKey: string): Promise<{ deleted: boolean; key: string }> {
    if (!this.client || !this.bucket || !objectKey.trim()) {
      return { deleted: false, key: objectKey };
    }
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
    return { deleted: true, key: objectKey };
  }

  /**
   * Object key prefix for a customer's uploads: `documents/{First_Last}_{id8}`.
   */
  buildCustomerDocumentsFolder(customerId: string, firstName: string, lastName: string): string {
    const nameSlug = S3StorageService.sanitizePathSegment(`${firstName}_${lastName}`.trim(), 120);
    const idShort = customerId.replace(/-/g, '').slice(0, 8);
    return `documents/${nameSlug}_${idShort}`;
  }

  buildApplicationFolder(applicationId: string, applicationName: string): string {
    const nameSlug = S3StorageService.sanitizePathSegment(applicationName.trim(), 80);
    const idShort = applicationId.replace(/-/g, '').slice(0, 8);
    return `${nameSlug}_${idShort}`;
  }

  buildRequirementFolder(documentName: string): string {
    return S3StorageService.sanitizePathSegment(documentName.trim(), 120);
  }

  /**
   * Full object key:
   * documents/{customerFolder}/{applicationFolder}/{requirementFolder}/{fileId}-{filename}
   */
  buildDocumentObjectKey(params: {
    customerId: string;
    firstName: string;
    lastName: string;
    applicationId: string;
    applicationName: string;
    documentName: string;
    fileId: string;
    originalFilename: string;
  }): string {
    const customerFolder = this.buildCustomerDocumentsFolder(
      params.customerId,
      params.firstName,
      params.lastName,
    );
    const applicationFolder = this.buildApplicationFolder(
      params.applicationId,
      params.applicationName,
    );
    const requirementFolder = this.buildRequirementFolder(params.documentName);
    const base = basename(params.originalFilename.replace(/\\/g, '/'));
    const safeName = S3StorageService.sanitizePathSegment(base, 200);
    return `${customerFolder}/${applicationFolder}/${requirementFolder}/${params.fileId}-${safeName}`;
  }

  buildDocumentRequirementPrefix(params: {
    customerId: string;
    firstName: string;
    lastName: string;
    applicationId: string;
    applicationName: string;
    documentName: string;
  }): string {
    const customerFolder = this.buildCustomerDocumentsFolder(
      params.customerId,
      params.firstName,
      params.lastName,
    );
    const applicationFolder = this.buildApplicationFolder(
      params.applicationId,
      params.applicationName,
    );
    const requirementFolder = this.buildRequirementFolder(params.documentName);
    return `${customerFolder}/${applicationFolder}/${requirementFolder}/`;
  }
}
