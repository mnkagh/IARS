import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    institutionName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    institutionName?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    institutionName?: string | undefined;
}>, {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    institutionName?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    institutionName?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string | undefined;
}, {
    refreshToken?: string | undefined;
}>;
//# sourceMappingURL=auth.schema.d.ts.map