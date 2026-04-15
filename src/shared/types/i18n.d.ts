import { TFunction } from "i18n";
import { UserRole } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    __: TFunction;
    __n: TFunction;
    _t: TFunction;
    _tn: TFunction;
    user?: {
      id: string;
      tenantId: string;
      role: UserRole;
      type: "user";
    };
  }

  interface Response {
    __: TFunction;
    __n: TFunction;
    _t: TFunction;
    _tn: TFunction;
  }
}
