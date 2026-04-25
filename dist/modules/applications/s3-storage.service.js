"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var S3StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = require("path");
let S3StorageService = S3StorageService_1 = class S3StorageService {
    configService;
    client;
    bucket;
    region;
    static sanitizePathSegment(raw, maxLen) {
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
    static normalizeDigitalOceanEndpoint(endpoint, bucket) {
        if (!endpoint)
            return undefined;
        if (!bucket)
            return endpoint;
        try {
            const u = new URL(endpoint);
            if (!u.hostname.endsWith('.digitaloceanspaces.com'))
                return endpoint;
            const escaped = bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`^${escaped}\\.([a-z0-9]+)\\.digitaloceanspaces\\.com$`, 'i');
            const m = u.hostname.match(re);
            if (m) {
                u.hostname = `${m[1]}.digitaloceanspaces.com`;
                return u.origin;
            }
        }
        catch {
            return endpoint;
        }
        return endpoint;
    }
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('AWS_REGION', 'us-east-1').trim();
        this.bucket = this.configService.get('AWS_S3_BUCKET', '').trim() || undefined;
        const key = this.configService.get('AWS_ACCESS_KEY_ID', '').trim();
        const secret = this.configService.get('AWS_SECRET_ACCESS_KEY', '').trim();
        const rawEndpoint = this.configService.get('S3_ENDPOINT', '').trim() ||
            this.configService.get('SPACES_ENDPOINT', '').trim() ||
            this.configService.get('DO_SPACES_ENDPOINT', '').trim() ||
            '';
        const endpoint = S3StorageService_1.normalizeDigitalOceanEndpoint(rawEndpoint, this.bucket);
        const forcePathStyle = this.isTruthy(this.configService.get('S3_FORCE_PATH_STYLE'));
        if (!this.bucket || !key || !secret) {
            this.client = null;
            return;
        }
        this.client = new client_s3_1.S3Client({
            region: this.region,
            endpoint: endpoint || undefined,
            forcePathStyle: forcePathStyle || undefined,
            credentials: { accessKeyId: key, secretAccessKey: secret },
        });
    }
    isTruthy(value) {
        if (!value)
            return false;
        return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    isConfigured() {
        return this.client !== null && !!this.bucket;
    }
    async createPresignedPutUrl(objectKey, contentType, expiresSeconds = 900) {
        if (!this.client || !this.bucket) {
            throw new common_1.ServiceUnavailableException('Object storage uploads are not configured. Set AWS_S3_BUCKET (Space name), AWS_REGION (e.g. nyc3), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. For DigitalOcean Spaces also set S3_ENDPOINT=https://<region>.digitaloceanspaces.com');
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiresSeconds });
        return { uploadUrl, bucket: this.bucket, key: objectKey, expiresIn: expiresSeconds };
    }
    async createPresignedGetUrl(objectKey, expiresSeconds = 900) {
        if (!this.client || !this.bucket) {
            throw new common_1.ServiceUnavailableException('Object storage uploads are not configured. Set AWS_S3_BUCKET (Space name), AWS_REGION (e.g. nyc3), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. For DigitalOcean Spaces also set S3_ENDPOINT=https://<region>.digitaloceanspaces.com');
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
        });
        const readUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiresSeconds });
        return { readUrl, bucket: this.bucket, key: objectKey, expiresIn: expiresSeconds };
    }
    buildCustomerDocumentsFolder(customerId, firstName, lastName) {
        const nameSlug = S3StorageService_1.sanitizePathSegment(`${firstName}_${lastName}`.trim(), 120);
        const idShort = customerId.replace(/-/g, '').slice(0, 8);
        return `documents/${nameSlug}_${idShort}`;
    }
    buildDocumentObjectKey(params) {
        const folder = this.buildCustomerDocumentsFolder(params.customerId, params.firstName, params.lastName);
        const base = (0, path_1.basename)(params.originalFilename.replace(/\\/g, '/'));
        const safeName = S3StorageService_1.sanitizePathSegment(base, 200);
        return `${folder}/${params.documentId}-${safeName}`;
    }
};
exports.S3StorageService = S3StorageService;
exports.S3StorageService = S3StorageService = S3StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageService);
//# sourceMappingURL=s3-storage.service.js.map