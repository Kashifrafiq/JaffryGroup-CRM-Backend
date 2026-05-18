import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AssociatePipelineStep } from '../users/entities/associate-pipeline-step.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
export type PipelineStepAssignee = {
    id: string;
    name: string;
};
export declare class PipelineStepAssignmentService implements OnApplicationBootstrap {
    private readonly assignmentRepository;
    private readonly legacyCustomerAssignmentRepository;
    private readonly associateProfileRepository;
    private readonly pipelineProgressRepository;
    private readonly applicationRepository;
    private readonly logger;
    constructor(assignmentRepository: Repository<AssociatePipelineStep>, legacyCustomerAssignmentRepository: Repository<AssociateCustomer>, associateProfileRepository: Repository<AssociateProfile>, pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>, applicationRepository: Repository<CustomerApplication>);
    onApplicationBootstrap(): Promise<void>;
    migrateLegacyCustomerAssignments(): Promise<void>;
    resolvePipelineProgress(customerId: string, applicationId: string, stepIndex: number): Promise<CustomerApplicationPipelineProgress>;
    assignAssociatesToStep(pipelineProgressId: string, associateIds: string[]): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    unassignAssociateFromStep(pipelineProgressId: string, associateId: string): Promise<{
        pipelineProgressId: string;
        associateId: string;
        removed: boolean;
    }>;
    replaceAssociatesOnStep(pipelineProgressId: string, associateIds: string[]): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    assignAllStepsForCustomerToAssociate(customerId: string, associateId: string): Promise<number>;
    getCustomerIdsForAssociate(associateId: string): Promise<string[]>;
    hasAccessToCustomer(associateId: string, customerId: string): Promise<boolean>;
    hasAccessToApplication(associateId: string, customerApplicationId: string): Promise<boolean>;
    hasAccessToStep(associateId: string, customerApplicationId: string, stepIndex: number): Promise<boolean>;
    getAssigneesByProgressIds(progressIds: string[]): Promise<Map<string, PipelineStepAssignee[]>>;
    getAssigneesForCustomerApplications(customerId: string): Promise<Map<string, Map<number, PipelineStepAssignee[]>>>;
}
