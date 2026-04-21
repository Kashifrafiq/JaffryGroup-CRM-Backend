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
}
