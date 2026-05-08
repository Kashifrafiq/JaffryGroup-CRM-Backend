import { ConfigService } from '@nestjs/config';
type InviteMailInput = {
    to: string;
    inviteLink: string;
};
export declare class CustomerInviteMailService {
    private readonly configService;
    private readonly logger;
    private transporter?;
    constructor(configService: ConfigService);
    sendCustomerInvite(input: InviteMailInput): Promise<void>;
}
export {};
