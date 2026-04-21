import { ApplicationType } from './application-type.entity';
export declare class ApplicationDocumentRequirement {
    id: string;
    applicationTypeId: string;
    applicationType: ApplicationType;
    requirementKey: string;
    sectionTitle: string;
    itemLabel: string;
    sortOrder: number;
}
