import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AssociateInvite } from '../associates/entities/associate-invite.entity';
import { AcceptAssociateInviteDto } from './dto/accept-associate-invite.dto';
import { CustomerInvite } from '../customers/entities/customer-invite.entity';
import { AcceptCustomerInviteDto } from './dto/accept-customer-invite.dto';
export declare class AuthService {
    private readonly usersRepository;
    private readonly invitesRepository;
    private readonly customerInvitesRepository;
    private readonly jwtService;
    private readonly dataSource;
    constructor(usersRepository: Repository<User>, invitesRepository: Repository<AssociateInvite>, customerInvitesRepository: Repository<CustomerInvite>, jwtService: JwtService, dataSource: DataSource);
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
    customerLogin(customerLoginDto: AdminLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole.CUSTOMER;
        };
    }>;
    validateAssociateInviteToken(token: string): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        roleLabel: string | null;
        department: string | null;
        phoneNumber: string | null;
        address: string | null;
        profilePhoto: string | null;
        expiresAt: Date;
    }>;
    acceptAssociateInvite(dto: AcceptAssociateInviteDto): Promise<{
        accepted: boolean;
        email: string;
        message: string;
    }>;
    validateCustomerInviteToken(token: string): Promise<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        property: string | null;
        address: string | null;
        profilePhoto: string | null;
        expiresAt: Date;
    }>;
    acceptCustomerInvite(dto: AcceptCustomerInviteDto): Promise<{
        accepted: boolean;
        email: string;
        message: string;
    }>;
    private findUserForLogin;
    private getUserNames;
    private hashToken;
    private findActiveInviteByToken;
    private findActiveCustomerInviteByToken;
}
