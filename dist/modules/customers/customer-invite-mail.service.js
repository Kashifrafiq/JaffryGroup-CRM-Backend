"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CustomerInviteMailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerInviteMailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let CustomerInviteMailService = CustomerInviteMailService_1 = class CustomerInviteMailService {
    configService;
    logger = new common_1.Logger(CustomerInviteMailService_1.name);
    transporter;
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('SMTP_HOST')?.trim();
        const portRaw = this.configService.get('SMTP_PORT');
        const user = this.configService.get('SMTP_USER')?.trim();
        const pass = this.configService.get('SMTP_PASS')?.trim();
        if (!host || !portRaw || !user || !pass) {
            this.logger.warn('SMTP credentials are incomplete; customer invite emails cannot be sent.');
            return;
        }
        this.logger.log(`SMTP configured: ${user}@${host}:${portRaw} (password length ${pass.length})`);
        const port = Number(portRaw);
        const secureFlag = this.configService.get('SMTP_SECURE')?.trim().toLowerCase();
        const secure = secureFlag === 'true' || secureFlag === '1' || secureFlag === 'yes' || port === 465;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            ...(port === 587 && !secure ? { requireTLS: true } : {}),
        });
    }
    async sendCustomerInvite(input) {
        const from = this.configService.get('SMTP_FROM')?.trim();
        if (!from) {
            throw new Error('SMTP_FROM is required to send customer invite emails');
        }
        if (!this.transporter) {
            throw new Error('SMTP transport is not configured');
        }
        await this.transporter.sendMail({
            from,
            to: input.to,
            subject: 'Jaffry Group invited you to join Customer Portal',
            text: [
                'Jaffry Group has invited you to access the customer portal.',
                '',
                'Use the link below to set your password and activate your account:',
                input.inviteLink,
            ].join('\n'),
            html: [
                '<p>Jaffry Group has invited you to access the customer portal.</p>',
                '<p>Use the link below to set your password and activate your account:</p>',
                `<p><a href="${input.inviteLink}">${input.inviteLink}</a></p>`,
            ].join(''),
        });
    }
};
exports.CustomerInviteMailService = CustomerInviteMailService;
exports.CustomerInviteMailService = CustomerInviteMailService = CustomerInviteMailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CustomerInviteMailService);
//# sourceMappingURL=customer-invite-mail.service.js.map