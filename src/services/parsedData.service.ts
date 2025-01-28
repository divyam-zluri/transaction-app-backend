import Papa from "papaparse";
import { Transaction } from "../entities/transactions";
import { formatDate, getConversionRate } from "./parserHelper.service";
import { parse, isValid } from "date-fns";
import fs from "fs/promises";
import { getEntityManager } from "../utils/orm";

interface DataTypes {
  Date: string;
  Description: string;
  Amount: number;
  Currency: string;
}

export class TransactionService {
  public async parseAndStoreTransactions(filePath: string): Promise<{ validTransactions: Transaction[], warnings: string[] }> {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const warnings: string[] = [];
    const parsed = Papa.parse<DataTypes>(fileContent, {
      delimiter: ",",
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.data.length === 0) {
      throw new Error("CSV file is empty");
    }

    const em = await getEntityManager(); 

    const dateDescriptionPairs = parsed.data.map((data) => {
      const date = formatDate(data.Date);
      return {
        date,
        description: data.Description.replace(/\s+/g, ' ').trim(),
      };
    }).filter(pair => pair.date !== null);

    const existingTransactions = await em.find(Transaction, {
      $or: dateDescriptionPairs,
    });

    const existingSet = new Set(
      existingTransactions.map(
        (transaction) =>
          `${transaction.date.toISOString()}|${transaction.description.replace(/\s+/g, ' ').trim()}`
      )
    );

    const validTransactions: Transaction[] = [];
    const seenEntries = new Set<string>();

    for (const data of parsed.data) {
      try {
        // Validation checks
        if (!data.Date || !data.Description || typeof data.Amount !== 'number' || data.Amount <= 0 || !data.Currency) {
          warnings.push(`Invalid record: ${JSON.stringify(data)}`);
          continue;
        }

        const conversionRate = getConversionRate(data.Currency.toUpperCase());
        if (!conversionRate) {
          warnings.push(`Invalid currency code: ${data.Currency}`);
          continue;
        }

        const date = formatDate(data.Date);
        if (!date) {
          warnings.push(`Invalid date format: ${data.Date}`);
          continue;
        }

        const parsedDate = parse(data.Date, 'dd-MM-yyyy', new Date());
        if (!isValid(parsedDate)) {
          warnings.push(`Invalid date: ${data.Date}`);
          continue;
        }

        if(parsedDate < new Date("1990-01-01")) {
          warnings.push(`Date cannot be before 1990-01-01: ${data.Date}`);
          continue;
        }
        if(parsedDate > new Date()) {
          warnings.push(`Date cannot be in the future: ${data.Date}`);
          continue;
        }
        
        const key = `${date.toISOString()}|${data.Description.replace(/\s+/g, ' ').trim()}`;
        if (seenEntries.has(key) || existingSet.has(key)) {
          warnings.push(`Duplicate transaction: ${JSON.stringify(data)}`);
          continue;
        }
        
        seenEntries.add(key);

        // Create a new transaction
        const transaction = new Transaction();
        transaction.date = date;
        transaction.description = data.Description.replace(/\s+/g, ' ').trim();
        transaction.originalAmount = data.Amount;
        transaction.currency = data.Currency.toUpperCase();
        transaction.amountInINR = data.Amount * conversionRate;

        validTransactions.push(transaction);
      } catch (error) {
        warnings.push(`Error processing record: ${JSON.stringify(data)} - ${error}`);
      }
    }

    if (validTransactions.length > 0) {
      await em.persistAndFlush(validTransactions);
    }
    return { validTransactions, warnings: warnings };
  }
}