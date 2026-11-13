import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "warn";
    })[];
}, "error" | "warn" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
export { prisma };
//# sourceMappingURL=prisma.d.ts.map