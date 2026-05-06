import { ApplicationTypesService } from './application-types.service';
export declare class ApplicationTypesController {
    private readonly applicationTypesService;
    constructor(applicationTypesService: ApplicationTypesService);
    findActive(): Promise<{
        id: string;
        code: string;
        name: string;
        sortOrder: number;
    }[]>;
    getWorkflowTemplate(applicationTypeId: string): Promise<{
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
        }[];
        documents: {
            id: string;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
        }[];
    }>;
}
