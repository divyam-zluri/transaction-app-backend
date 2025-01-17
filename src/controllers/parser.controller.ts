import { Request, Response } from "express";
import { TransactionService } from "../services/parsedData.service";

export class ParserController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  public async parser(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(401).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const { validTransactions, warnings } =
        await this.transactionService.parseAndStoreTransactions(file.path);

      res.status(201).json({
        success: true,
        message:
          warnings.length === 0
            ? "Data Parsed and Inserted Successfully"
            : "Some records were skipped due to errors",
        warnings,
      });
    } catch (error: any) {
      console.error("Error processing file:", error);
      res.status(500).json({
        success: false,
        message: "There is a problem with the file",
        error: error.message,
      });
    }
  }
}
