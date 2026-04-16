import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
export declare class AuthApiController {
    private readonly authService;
    constructor(authService: AuthService);
    health(): {
        ok: boolean;
        login: string;
        associateLogin: string;
    };
    adminLoginHelp(): {
        ok: boolean;
        reason: string;
        method: string;
        path: string;
        bodyExample: {
            email: string;
            password: string;
        };
        headers: {
            'Content-Type': string;
        };
    };
    adminLogin(adminLoginDto: AdminLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/entities/user-role.enum").UserRole.ADMIN;
        };
    }>;
    associateLoginHelp(): {
        ok: boolean;
        reason: string;
        method: string;
        path: string;
        bodyExample: {
            email: string;
            password: string;
        };
        headers: {
            'Content-Type': string;
        };
    };
    associateLogin(associateLoginDto: AdminLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/entities/user-role.enum").UserRole.ASSOCIATE;
        };
    }>;
}
