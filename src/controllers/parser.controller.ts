import { Request, Response } from "express";
import Papa from "papaparse";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../mikro-orm.config";
import { Transaction } from "../entities/transactions";
import { currencyConversionRates } from "../globals/currencyConversionRates";
import fs from "fs/promises";

interface dataTypes {
  Date: string;
  Description: string;
  Amount: number;
  Currency: string;
}

let warnings: string[] = [];

export class ParserController {
  private getConversionRate(currencyCode: string): number | undefined {
    return currencyConversionRates.get(currencyCode);
  }

  private formatDate(dateString: string): Date | null {
    if (typeof dateString !== 'string') {
      return null;
    }
    const [day, month, year] = dateString.split("-");
    if (!day || !month || !year) {
      return null;
    }
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? null : date;
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

      const fileContent = await fs.readFile(file.path, "utf-8");

      const parsed = Papa.parse<dataTypes>(fileContent, {
        delimiter: ",",
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      const orm = await MikroORM.init(config);
      const em = orm.em.fork();

      const dateDescriptionPairs = parsed.data.map((data) => {
        const date = this.formatDate(data.Date);
        return {
          date,
          description: data.Description,
        };
      }).filter(pair => pair.date !== null);

      const existingTransactions = await em.find(Transaction, {
        $or: dateDescriptionPairs,
      });

      const existingSet = new Set(
        existingTransactions.map(
          (transaction) =>
            `${transaction.date.toISOString()}|${transaction.description}`
        )
      );

      const validTransactions = [];
      const batchSize = 100;

      for (const data of parsed.data) {
        try {
          if (!data.Date || !data.Description || typeof data.Amount !== 'number' || data.Amount <= 0 || !data.Currency) {
            warnings.push(`Invalid record: ${JSON.stringify(data)}`);
            console.error("Skipping invalid record:", data);
            continue;
          }

          const conversionRate = this.getConversionRate(data.Currency);
          if (!conversionRate) {
            warnings.push(`Invalid currency code: ${data.Currency}`);
            console.error("Invalid currency code, skipping record:", data.Currency);
            continue;
          }

          const date = this.formatDate(data.Date);
          if (!date) {
            warnings.push(`Invalid date format: ${data.Date}`);
            console.error("Invalid date format, skipping record:", data.Date);
            continue;
          }

          const key = `${date.toISOString()}|${data.Description}`;
          if (existingSet.has(key)) {
            warnings.push(`Duplicate transaction: ${JSON.stringify(data)}`);
            console.error("Duplicate transaction found, skipping:", data);
            continue;
          }

          const transaction = new Transaction();
          transaction.date = date;
          transaction.description = data.Description;
          transaction.originalAmount = data.Amount;
          transaction.currency = data.Currency;
          transaction.amountInINR = data.Amount * conversionRate;

          validTransactions.push(transaction);

          if (validTransactions.length >= batchSize) {
            em.persist(validTransactions);
            await em.flush();
            em.clear();
            validTransactions.length = 0; // Reset batch
          }
        } catch (error) {
          warnings.push(`Error processing record: ${JSON.stringify(data)} - ${error}`);
          console.error("Error processing record:", data, error);
          continue;
        }
      }

      // Flush remaining transactions in the last batch
      if (validTransactions.length > 0) {
        em.persist(validTransactions);
        await em.flush();
        em.clear();
      }

      res.status(201).json({
        success: true,
        message: warnings.length === 0 ? "Data Parsed and Inserted Successfully" : "Some records were skipped due to errors",
        warnings,
        parsed,
      });
      warnings = [];
    } catch (error: any) {
      console.error("Error processing file:", error);
      res.status(500).json({
        success: false,
        message: "There is a problem with file",
        error: error.message,
      });
    }
  }
}