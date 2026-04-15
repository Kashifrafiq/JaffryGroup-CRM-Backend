"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true });
    const host = process.env.HOST ?? '0.0.0.0';
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port, host);
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    common_1.Logger.log(`Server running on http://${displayHost}:${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map