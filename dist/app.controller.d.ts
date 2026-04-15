import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getRoot(): {
        name: string;
        status: string;
        message: string;
        auth: {
            health: string;
            adminLoginGet: string;
            adminLoginPost: string;
        };
    };
}
