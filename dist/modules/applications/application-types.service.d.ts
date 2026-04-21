import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
export declare class ApplicationTypesService {
    private readonly applicationTypeRepository;
    constructor(applicationTypeRepository: Repository<ApplicationType>);
    findActive(): Promise<ApplicationType[]>;
    findActiveById(id: string): Promise<ApplicationType>;
    findActiveByCode(code: string): Promise<ApplicationType | null>;
    findActiveByNameIgnoreCase(name: string): Promise<ApplicationType | null>;
}
