import multer from "multer";
import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
    }
  }
}
export class FileUploadService {
  public uploadCSV() {
    return multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 1 * 1024 * 1024 }, // Here i am setting the limit 1MB
      fileFilter: (req, file, cb) => {
        const allowedExtensions = /csv$/;  // Here i am checking the file extension i.e .csv
        const extName = allowedExtensions.test(file.originalname.toLowerCase());
        const mimeType = file.mimetype === "text/csv";

        if (extName && mimeType) {
          cb(null, true);
        } else {
          cb(null, false);
          req.fileValidationError = "Only .csv files are allowed and must be less than 1MB!";
        }
      },
    });
  }
}

export const fileUploadService = new FileUploadService();
