import i18n from "i18n";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response, NextFunction } from "express";
import fs from "fs";

const bundledDir = path.dirname(fileURLToPath(import.meta.url));
const possibleDirs = [
  path.join(bundledDir, "../../src/locales"),
  path.join(bundledDir, "../../locales"),
  path.join(process.cwd(), "src/locales"),
  path.join(process.cwd(), "locales"),
];

const localeDir = possibleDirs.find((dir) => fs.existsSync(dir)) || possibleDirs[0];

i18n.configure({
  locales: ["ar", "en"],
  defaultLocale: "en",
  directory: localeDir,
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
