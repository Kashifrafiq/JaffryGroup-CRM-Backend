import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/entities/user.entity';
export type JwtPayload = {
    sub: string;
    email: string;
    role: UserRole;
};
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): {
        id: string;
        email: string;
        role: UserRole;
    };
}
export {};
