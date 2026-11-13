export declare const register: (data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
}) => Promise<{
    id: string;
    email: string;
    name: string;
    role: import(".prisma/client").$Enums.Role;
    institutionId: string | null;
}>;
export declare const login: (email: string, password: string, ip?: string, ua?: string) => Promise<{
    user: {
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        institutionId: string | null;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare const refresh: (token: string, ip?: string, ua?: string) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    };
}>;
export declare const logout: (refreshToken: string) => Promise<void>;
export declare const me: (userId: string) => Promise<{
    id: string;
    email: string;
    name: string;
    role: import(".prisma/client").$Enums.Role;
    institutionId: string | null;
    createdAt: Date;
    institution: {
        type: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        city: string | null;
        website: string | null;
        createdById: string | null;
    } | null;
} | null>;
//# sourceMappingURL=auth.service.d.ts.map