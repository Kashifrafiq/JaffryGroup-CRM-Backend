import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { InviteAssociateDto } from './dto/invite-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';
import { AssociateInvite } from './entities/associate-invite.entity';
import { AssociateInviteMailService } from './associate-invite-mail.service';
export declare class AssociatesService {
    private readonly associateRepository;
    private readonly inviteRepository;
    private readonly userRepository;
    private readonly taskRepository;
    private readonly configService;
    private readonly inviteMailService;
    constructor(associateRepository: Repository<AssociateProfile>, inviteRepository: Repository<AssociateInvite>, userRepository: Repository<User>, taskRepository: Repository<Task>, configService: ConfigService, inviteMailService: AssociateInviteMailService);
    createAssociate(createAssociateDto: CreateAssociateDto, createdBy?: Pick<User, 'id' | 'role'>): Promise<AssociateProfile>;
    inviteAssociate(dto: InviteAssociateDto, createdBy: Pick<User, 'id' | 'role'>): Promise<{
        inviteSent: true;
        email: string;
        expiresAt: Date;
    }>;
    findAll(): Promise<AssociateProfile[]>;
    findOne(id: string): Promise<AssociateProfile>;
    update(id: string, dto: UpdateAssociateDto): Promise<AssociateProfile>;
    remove(id: string): Promise<void>;
    private splitName;
    private hashToken;
    private getInviteExpiryDate;
    private assertEmailIsAvailableForInvite;
}
