import i18n from "i18n";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response, NextFunction } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18n.configure({
  locales: ["ar", "en"],
  defaultLocale: "en",
  directory: path.join(__dirname, "../../locales"),
  queryParameter: "lang",
  cookie: "lang",
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
  objectNotation: true,
  register: global,
});

export const i18nMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req._t = req.__;
  req._tn = req.__n;
  res._t = res.__;
  res._tn = res.__n;
  next();
};

export default i18n;
