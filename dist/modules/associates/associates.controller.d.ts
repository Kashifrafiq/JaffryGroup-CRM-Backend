import { UserRole } from '../users/entities/user-role.enum';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';
import { AssociatesService } from './associates.service';
type JwtRequestUser = {
    id: string;
    email: string;
    role: UserRole;
};
export declare class AssociatesController {
    private readonly associatesService;
    constructor(associatesService: AssociatesService);
    create(createAssociateDto: CreateAssociateDto, req: {
        user: JwtRequestUser;
    }): Promise<import("../users/entities/associate-profile.entity").AssociateProfile>;
    findAll(): Promise<import("../users/entities/associate-profile.entity").AssociateProfile[]>;
    findOne(id: string): Promise<import("../users/entities/associate-profile.entity").AssociateProfile>;
    update(id: string, updateAssociateDto: UpdateAssociateDto): Promise<import("../users/entities/associate-profile.entity").AssociateProfile>;
    remove(id: string): Promise<void>;
}
export {};
