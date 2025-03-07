import { Transaction } from "../entities/transactions";
import { currencyConversionRates } from "../globals/currencyConversionRates";
import { getEntityManager } from "../utils/orm";

export class TransactionService {
  public async getTransactions(page: number = 1, limit: number = 10, deleted : boolean) {
    const em = await getEntityManager();
    const offset = (page - 1) * limit;
    const [transactions, total] = await em.findAndCount(
      Transaction,
      { isDeleted: deleted },
      { orderBy: { date: "desc" }, limit, offset }
    );

    if(page > 1 && page > Math.ceil(total / limit)) {
      throw new Error("Invalid page number. Pages cannot be greater than total pages");
    }

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  public async createTransaction(data: any) {
    const { date, description, originalAmount, currency } = data;
    const em = await getEntityManager();

    if (!currencyConversionRates.has(currency.toUpperCase())) {
      throw new Error("Invalid currency code");
    }

    const transaction = new Transaction();
    transaction.date = date;
    transaction.description = description.trim().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    transaction.originalAmount = originalAmount;
    transaction.currency = currency.toUpperCase();
    transaction.amountInINR =
      originalAmount * currencyConversionRates.get(transaction.currency)!;

    await em.persist(transaction).flush();
    return transaction;
  }

  public async updateTransaction(id: number, data: any) {
    const em = await getEntityManager();
    const transaction = await em.findOne(Transaction, id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (data.description !== undefined) transaction.description = data.description.trim().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
    if (data.date !== undefined) transaction.date = data.date;

    if (data.currency !== undefined) {
      if (!currencyConversionRates.has(data.currency.toUpperCase())) {
        throw new Error("Invalid currency code");
      }
      transaction.currency = data.currency.toUpperCase();
      transaction.amountInINR =
        transaction.originalAmount * currencyConversionRates.get(transaction.currency)!;
    }

    if (data.originalAmount !== undefined) {
      transaction.originalAmount = data.originalAmount;
      transaction.amountInINR =
        transaction.originalAmount * currencyConversionRates.get(transaction.currency)!;
    }

    await em.flush();
    return transaction;
  }

  public async deleteTransaction(id: number) {
    const em = await getEntityManager();
    const transaction = await em.findOne(Transaction, id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await em.remove(transaction).flush();
    return transaction;
  }

  public async softDeleteTransaction(id: number) {
    const em = await getEntityManager();
    const transaction = await em.findOne(Transaction, id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    transaction.isDeleted = true;
    await em.flush();
    return transaction;
  }

  public async restoreTransaction(id: number) {
    const em = await getEntityManager();
    const transaction = await em.findOne(Transaction, id);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    transaction.isDeleted = false;
    await em.flush();
    return transaction;
  }
}

const transactionService = new TransactionService();
export default transactionService;