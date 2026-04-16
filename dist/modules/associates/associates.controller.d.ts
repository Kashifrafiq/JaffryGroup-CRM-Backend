import { UserRole } from '../users/entities/user-role.enum';
import { CreateAssociateDto } from './dto/create-associate.dto';
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
}
export {};
