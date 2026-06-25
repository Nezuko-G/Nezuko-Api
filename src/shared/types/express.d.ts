import type { UserRole } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
                tenantId: string;
            };
            superAdmin?: {
                id: string;
            };
            _t: (key: string, options?: Record<string, unknown>) => string;
        }
    }
}