"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
(0, dotenv_1.config)();
const isTruthy = (value, defaultValue = false) => {
    if (value === undefined)
        return defaultValue;
    return ['true', '1', 'yes', 'on', 'require', 'required'].includes(value.trim().toLowerCase());
};
const useSsl = isTruthy(process.env.DB_SSL, false);
const rejectUnauthorized = isTruthy(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST?.trim() ?? 'localhost',
    port: Number(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME?.trim() ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME?.trim() ?? 'crm_backend',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    ssl: useSsl ? { rejectUnauthorized } : false,
});
//# sourceMappingURL=data-source.js.map