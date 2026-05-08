import { UserRole } from '../users/entities/user-role.enum';
import { ActivitiesService } from './activities.service';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
type JwtRequestUser = {
    id: string;
    email: string;
    role: UserRole;
};
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    create(customerId: string, dto: CreateCustomerActivityDto, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-activity.entity").CustomerActivity>;
    findByCustomer(customerId: string, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-activity.entity").CustomerActivity[]>;
    remove(customerId: string, activityId: string, req: {
        user: JwtRequestUser;
    }): Promise<void>;
}
export {};
