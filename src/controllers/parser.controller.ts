import { Request, Response } from "express";
import Papa from "papaparse";
import { MikroORM } from "@mikro-orm/postgresql";
import config from "../../mikro-orm.config";
import { Transaction } from "../entities/transactions";
import { currencyConversionRates } from "../globals/currencyConversionRates";

interface dataTypes {
  Date: string;
  Description: string;
  Amount: number;
  Currency: string;
}

export class ParserController {
  private getConversionRate(currencyCode: string): number | undefined {
    return currencyConversionRates.get(currencyCode);
  }
  public async parser(req: Request, res: Response) {
    try {
      const file = req.file;

      if (!file) {
        res.status(401).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const fileContent = file.buffer.toString("utf-8");

      const parsed = Papa.parse<dataTypes>(fileContent, {
        delimiter: ",",
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      const formatDate = (dateString: string) => {
        const [day, month, year] = dateString.split("-");
        return new Date(`${year}-${month}-${day}`);
      };

      try {
        const orm = await MikroORM.init(config);
        const em = orm.em.fork();

        // Here i am collecting Date and Description pairs
        const dateDescriptionPairs = parsed.data.map((data) => ({
          date: formatDate(data.Date),
          description: data.Description,
        }));

        // Query database for existing transactions in a single batch
        const existingTransactions = await em.find(Transaction, {
          $or: dateDescriptionPairs,
        });

        // Create a set of duplicate identifiers (date-description pairs)
        const duplicates = new Set(
          existingTransactions.map(
            (transaction) =>
              `${transaction.date.toISOString()}|${transaction.description}`
          )
        );

        const batchSize = 100; // Batch size for flushing
        let batchCount = 0; // Counter for batching

        for (let i = 0; i < parsed.data.length; i++) {
          const data = parsed.data[i];
          const transaction = new Transaction();

          try {
            if (!data.Date || !data.Description || !data.Amount || !data.Currency) {
              console.error("Skipping invalid record:", data);
              continue; // Skip invalid records
            }

            if (!this.getConversionRate(data.Currency)) {
              console.error("Invalid currency code:", data.Currency);
              continue; // Skip records with invalid currency codes
            }

            const date = formatDate(data.Date);
            const description = data.Description;

            // Check for duplicates using the pre-fetched set
            if (duplicates.has(`${date.toISOString()}|${description}`)) {
              console.log("Duplicate transaction found, skipping:", data);
              continue; // Skip duplicate records
            }

            transaction.date = date; // Format the date properly
            transaction.description = description;
            transaction.originalAmount = data.Amount;
            transaction.currency = data.Currency;
            transaction.amountInINR = data.Amount * this.getConversionRate(data.Currency)!; // Convert to INR

            em.persist(transaction);
            batchCount++;

            if (batchCount >= batchSize) {
              // Flush the batch and reset the counter
              await em.flush();
              em.clear(); // Clear the entity manager to free memory
              batchCount = 0;
            }
          } catch (error) {
            console.error("Error processing row", data, error);
            continue; // Skip invalid records
          }
        }

        // Flush remaining transactions in the last batch
        if (batchCount > 0) {
          await em.flush();
          em.clear();
        }

        res.status(201).json({
          success: true,
          message: "Data Parsed and Inserted Successfully",
          parsed,
        });
      } catch (error: any) {
        console.error("Error inserting data:", error);
        res.status(500).json({
          success: false,
          message: "There is a problem with file",
          error: error.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "There is a problem with file",
        error: error.message,
      });
    }
  }
}
