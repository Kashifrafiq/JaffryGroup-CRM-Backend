import { ConfigService } from '@nestjs/config';
export declare class S3StorageService {
    private readonly configService;
    private readonly client;
    private readonly bucket;
    private readonly region;
    static sanitizePathSegment(raw: string, maxLen: number): string;
    static normalizeDigitalOceanEndpoint(endpoint: string, bucket: string | undefined): string | undefined;
    constructor(configService: ConfigService);
    private isTruthy;
    isConfigured(): boolean;
    createPresignedPutUrl(objectKey: string, contentType: string, expiresSeconds?: number): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    buildCustomerDocumentsFolder(customerId: string, firstName: string, lastName: string): string;
    buildDocumentObjectKey(params: {
        customerId: string;
        firstName: string;
        lastName: string;
        documentId: string;
        originalFilename: string;
    }): string;
}
