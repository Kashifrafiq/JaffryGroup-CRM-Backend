export declare class CustomerInvite {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    property?: string | null;
    address?: string | null;
    profilePhoto?: string | null;
    tokenHash: string;
    expiresAt: Date;
    acceptedAt?: Date | null;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
