import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { AdminLoginDto } from './dto/admin-login.dto';
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    adminLogin(adminLoginDto: AdminLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole.ADMIN;
        };
    }>;
    associateLogin(associateLoginDto: AdminLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole.ASSOCIATE;
        };
    }>;
    private findUserForLogin;
    private getUserNames;
}
