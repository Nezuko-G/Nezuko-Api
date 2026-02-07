import { TFunction } from "i18n";

declare module "express-serve-static-core" {
  interface Request {
    __: TFunction;
    __n: TFunction;
    _t: TFunction;
    _tn: TFunction;
  }

  interface Response {
    __: TFunction;
    __n: TFunction;
    _t: TFunction;
    _tn: TFunction;
  }
}
