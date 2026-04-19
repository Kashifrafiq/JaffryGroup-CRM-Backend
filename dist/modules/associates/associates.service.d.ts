import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';
export declare class AssociatesService {
    private readonly associateRepository;
    private readonly taskRepository;
    constructor(associateRepository: Repository<AssociateProfile>, taskRepository: Repository<Task>);
    createAssociate(createAssociateDto: CreateAssociateDto, createdBy?: Pick<User, 'id' | 'role'>): Promise<AssociateProfile>;
    findAll(): Promise<AssociateProfile[]>;
    findOne(id: string): Promise<AssociateProfile>;
    update(id: string, dto: UpdateAssociateDto): Promise<AssociateProfile>;
    remove(id: string): Promise<void>;
    private splitName;
}
