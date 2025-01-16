import multer from "multer";
import { Request, Response, NextFunction } from "express";

export function uploadCSV(req: Request, res: Response, next: NextFunction) {
  const upload = multer({
    dest: 'uploads/',
    // storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB file size limit
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedExtensions = /csv$/;  // Check for CSV file extension
      const extName = allowedExtensions.test(file.originalname.toLowerCase());
      const mimeType = file.mimetype === "text/csv";

      if (extName && mimeType) {
        cb(null, true); // Accept file
      } else {
        // Send response directly if file is invalid
        res.status(400).json({
          success: false,
          message: "Only .csv files are allowed and must be less than 1MB!",
        });
        return;  
      }
    },
  }).single('file'); 
  upload(req, res, (err) => {
    if (err) {
      // Handle multer errors
      res.status(400).json({
        success: false,
        message: err.message,
      });
    } else {
      next();
    }
  });
}




