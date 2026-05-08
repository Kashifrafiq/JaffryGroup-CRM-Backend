import { UserRole } from '../users/entities/user-role.enum';
import { RemindersService } from './reminders.service';
import { CreateCustomerReminderDto } from './dto/create-customer-reminder.dto';
import { UpdateCustomerReminderDto } from './dto/update-customer-reminder.dto';
type JwtRequestUser = {
    id: string;
    email: string;
    role: UserRole;
};
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    create(customerId: string, dto: CreateCustomerReminderDto, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-reminder.entity").CustomerReminder>;
    findByCustomer(customerId: string, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-reminder.entity").CustomerReminder[]>;
    findOne(customerId: string, reminderId: string, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-reminder.entity").CustomerReminder>;
    update(customerId: string, reminderId: string, dto: UpdateCustomerReminderDto, req: {
        user: JwtRequestUser;
    }): Promise<import("./entities/customer-reminder.entity").CustomerReminder>;
    remove(customerId: string, reminderId: string, req: {
        user: JwtRequestUser;
    }): Promise<void>;
}
export {};
