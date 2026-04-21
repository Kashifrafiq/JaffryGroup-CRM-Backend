import { EntityManager } from 'typeorm';
export declare class ApplicationWorkflowService {
    instantiateForNewApplication(manager: EntityManager, customerApplicationId: string, applicationTypeId: string): Promise<void>;
}
