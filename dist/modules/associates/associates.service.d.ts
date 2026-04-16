import { Repository } from 'typeorm';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreateAssociateDto } from './dto/create-associate.dto';
export declare class AssociatesService {
    private readonly associateRepository;
    constructor(associateRepository: Repository<AssociateProfile>);
    createAssociate(createAssociateDto: CreateAssociateDto, createdBy?: Pick<User, 'id' | 'role'>): Promise<AssociateProfile>;
    private splitName;
}
