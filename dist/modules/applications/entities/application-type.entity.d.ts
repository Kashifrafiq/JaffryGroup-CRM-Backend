export declare class ApplicationType {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    metadata?: Record<string, unknown> | null;
    applications?: unknown[];
    createdAt: Date;
    updatedAt: Date;
}
