import multer from "multer";
import { BadRequestError } from "@/shared/errors/errors.js";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new BadRequestError("Only JPEG, PNG, and PDF files are allowed"));
        }
        cb(null, true);
    },
});