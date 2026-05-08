export declare class AssociateInvite {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roleLabel?: string | null;
    department?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    profilePhoto?: string | null;
    tokenHash: string;
    expiresAt: Date;
    acceptedAt?: Date | null;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
