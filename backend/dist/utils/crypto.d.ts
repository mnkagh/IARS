import type { AuthUser } from '../middleware/auth';
export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const hashToken: (token: string) => string;
export declare const generateAccessToken: (user: AuthUser) => string;
export declare const generateRefreshToken: (user: AuthUser) => string;
export declare const verifyRefreshToken: (token: string) => {
    id: string;
};
//# sourceMappingURL=crypto.d.ts.map