"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
// Fail-fast env validation - never start with insecure defaults
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(1000).max(65535).default(4000),
    DATABASE_URL: zod_1.z.string().min(10, 'DATABASE_URL required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET must be >=32 chars'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT_REFRESH_SECRET must be >=32 chars'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    COOKIE_SECRET: zod_1.z.string().min(16).optional(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(5),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    FRONTEND_URL: zod_1.z.string().optional(),
    HELMET_CSP_ENABLED: zod_1.z.string().optional(),
});
let env;
try {
    exports.env = env = envSchema.parse(process.env);
}
catch (e) {
    if (e instanceof zod_1.z.ZodError) {
        console.error('❌ Invalid environment configuration:');
        e.errors.forEach((err) => console.error(`  - ${err.path.join('.')}: ${err.message}`));
        process.exit(1);
    }
    throw e;
}
exports.default = env;
//# sourceMappingURL=env.js.map