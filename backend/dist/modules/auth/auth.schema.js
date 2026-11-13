"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z.string().trim().email().max(255).toLowerCase(),
    password: zod_1.z.string().min(8).max(128)
        .regex(/[A-Z]/, 'Must contain uppercase')
        .regex(/[a-z]/, 'Must contain lowercase')
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    confirmPassword: zod_1.z.string(),
    institutionName: zod_1.z.string().trim().max(200).optional(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email().toLowerCase(),
    password: zod_1.z.string().min(1).max(128),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().optional(), // can also come from cookie
});
//# sourceMappingURL=auth.schema.js.map