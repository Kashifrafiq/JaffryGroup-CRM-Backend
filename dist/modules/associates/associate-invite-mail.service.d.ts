import { ConfigService } from '@nestjs/config';
type InviteMailInput = {
    to: string;
    inviteLink: string;
};
export declare class AssociateInviteMailService {
    private readonly configService;
    private readonly logger;
    private transporter?;
    constructor(configService: ConfigService);
    sendAssociateInvite(input: InviteMailInput): Promise<void>;
}
export {};
