import { TransactionService } from '../../src/services/transaction.service';
import { Transaction } from '../../src/entities/transactions';
import { currencyConversionRates } from '../../src/globals/currencyConversionRates';
import { getEntityManager } from '../../src/utils/orm';

jest.mock('../../src/utils/orm');
jest.mock('../../src/globals/currencyConversionRates', () => ({
  currencyConversionRates: new Map([
    ['USD', 75],
    ['EUR', 85],
  ]),
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get transactions with pagination', async () => {
    const mockTransactions = [new Transaction(), new Transaction()];
    (getEntityManager as jest.Mock).mockResolvedValue({
      findAndCount: jest.fn().mockResolvedValue([mockTransactions, 2]),
    });

    const result = await transactionService.getTransactions(1, 2);

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('should create a new transaction', async () => {
    const mockData = {
      date: new Date(),
      description: 'Test Transaction',
      originalAmount: 100,
      currency: 'USD',
    };
    const mockTransaction = new Transaction();
    (getEntityManager as jest.Mock).mockResolvedValue({
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn(),
    });

    const result = await transactionService.createTransaction(mockData);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.amountInINR).toBe(7500);
  });

  it('should throw an error for invalid currency code during creation', async () => {
    const mockData = {
      date: new Date(),
      description: 'Test Transaction',
      originalAmount: 100,
      currency: 'XYZ',
    };

    await expect(transactionService.createTransaction(mockData)).rejects.toThrow('Invalid currency code');
  });

  it('should throw an error for missing currency during creation', async () => {
    const mockData = {
      date: new Date(),
      description: 'Test Transaction',
      originalAmount: 100,
    };

    await expect(transactionService.createTransaction(mockData)).rejects.toThrow('Invalid currency code');
  });

  it('should update an existing transaction', async () => {
    const mockTransaction = new Transaction();
    mockTransaction.originalAmount = 100;
    mockTransaction.currency = 'USD';
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn(),
    });

    const result = await transactionService.updateTransaction(1, { originalAmount: 200, currency: 'EUR' });

    expect(result).toBeInstanceOf(Transaction);
    expect(result.amountInINR).toBe(17000);
  });

  it('should throw an error if transaction not found during update', async () => {
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(transactionService.updateTransaction(1, { description: 'Updated' })).rejects.toThrow('Transaction not found');
  });

  it('should throw an error for invalid currency during update', async () => {
    const mockTransaction = new Transaction();
    mockTransaction.originalAmount = 100;
    mockTransaction.currency = 'USD';

    const mockEm = {
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);

    await expect(
      transactionService.updateTransaction(1, { currency: 'INVALID' })
    ).rejects.toThrow('Invalid currency code');
  });

  it("should update the transaction's description and date", async () => {
    const mockTransaction = new Transaction();
    mockTransaction.description = "Old Description";
    mockTransaction.date = new Date("2023-01-01");

    const mockEm = {
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);

    const updates = {
      description: "Updated Description",
      date: new Date("2025-01-01"),
    };

    const result = await transactionService.updateTransaction(1, updates);

    expect(mockEm.findOne).toHaveBeenCalledWith(Transaction, 1);
    expect(mockTransaction.description).toBe(updates.description);
    expect(mockTransaction.date).toEqual(updates.date);
    expect(mockEm.flush).toHaveBeenCalled();
    expect(result).toBe(mockTransaction);
  });

  it("should not update fields that are not provided", async () => {
    const mockTransaction = new Transaction();
    mockTransaction.description = "Existing Description";
    mockTransaction.date = new Date("2023-01-01");

    const mockEm = {
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);

    const updates = {}; // No fields provided for update

    const result = await transactionService.updateTransaction(1, updates);

    expect(mockEm.findOne).toHaveBeenCalledWith(Transaction, 1);
    expect(mockTransaction.description).toBe("Existing Description");
    expect(mockTransaction.date).toEqual(new Date("2023-01-01"));
    expect(mockEm.flush).toHaveBeenCalled();
    expect(result).toBe(mockTransaction);
  });

  it("should use default page and limit values when not provided", async () => {
    const mockTransactions = [new Transaction(), new Transaction()];
    const mockEm = {
      findAndCount: jest.fn().mockResolvedValue([mockTransactions, 2]),
    };

    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);

    const result = await transactionService.getTransactions();

    expect(mockEm.findAndCount).toHaveBeenCalledWith(
      Transaction,
      { isDeleted: false },
      { orderBy: { date: "asc" }, limit: 10, offset: 0 }
    );

    expect(result).toEqual({
      transactions: mockTransactions,
      total: 2,
      page: 1,
      pages: 1,
    });
  });
  it('should delete a transaction', async () => {
    const mockTransaction = new Transaction();
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      remove: jest.fn().mockReturnThis(),
      flush: jest.fn(),
    });

    const result = await transactionService.deleteTransaction(1);

    expect(result).toBeInstanceOf(Transaction);
  });

  it('should throw an error if transaction not found during delete', async () => {
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(transactionService.deleteTransaction(1)).rejects.toThrow('Transaction not found');
  });

  it('should soft delete a transaction', async () => {
    const mockTransaction = new Transaction();
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn(),
    });

    const result = await transactionService.softDeleteTransaction(1);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.isDeleted).toBe(true);
  });

  it('should throw an error if transaction not found during soft delete', async () => {
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(transactionService.softDeleteTransaction(1)).rejects.toThrow('Transaction not found');
  });

  it('should restore a soft deleted transaction', async () => {
    const mockTransaction = new Transaction();
    mockTransaction.isDeleted = true;
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(mockTransaction),
      flush: jest.fn(),
    });

    const result = await transactionService.restoreTransaction(1);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.isDeleted).toBe(false);
  });

  it('should throw an error if transaction not found during restore', async () => {
    (getEntityManager as jest.Mock).mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(transactionService.restoreTransaction(1)).rejects.toThrow('Transaction not found');
  });
});