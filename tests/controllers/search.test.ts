import { Request, Response } from 'express';
import { search } from '../../src/controllers/search.controller';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';
import { isValid } from 'date-fns';

jest.mock('../../src/utils/orm');
jest.mock('date-fns', () => ({
  isValid: jest.fn(),
}));

describe('search', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let em: any;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    em = {
      findAndCount: jest.fn(),
    };
    (getEntityManager as jest.Mock).mockResolvedValue(em);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if date is invalid', async () => {
    (isValid as jest.Mock).mockReturnValue(false);
    req.query = { date: 'invalid-date' };
    await search(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide a valid date',
    });
  });

  it('should return 200 with filtered transactions by description', async () => {
    (isValid as jest.Mock).mockReturnValue(true);
    req.query = { description: 'PayPal', page: '1', limit: '10' };
    const transactions = [
      {
        id: 1,
        date: new Date('2021-01-01'),
        description: 'PayPal',
        originalAmount: 100,
        currency: 'USD',
        amountInINR: 7400,
        isDeleted: false,
      },
    ];
    em.findAndCount.mockResolvedValue([transactions, 1]);

    await search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Data has been fetched',
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        originalAmount: transaction.originalAmount,
        currency: transaction.currency,
        amountInINR: transaction.amountInINR,
        isDeleted: transaction.isDeleted,
      })),
      total: 1,
      page: 1,
      pages: 1,
    });
  });

  it('should return 200 with filtered transactions by amount', async () => {
    (isValid as jest.Mock).mockReturnValue(true);
    req.query = { amount: '100', page: '1', limit: '10' };
    const transactions = [
      {
        id: 1,
        date: new Date('2021-01-01'),
        description: 'PayPal',
        originalAmount: 100,
        currency: 'USD',
        amountInINR: 7400,
        isDeleted: false,
      },
    ];
    em.findAndCount.mockResolvedValue([transactions, 1]);

    await search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Data has been fetched',
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        originalAmount: transaction.originalAmount,
        currency: transaction.currency,
        amountInINR: transaction.amountInINR,
        isDeleted: transaction.isDeleted,
      })),
      total: 1,
      page: 1,
      pages: 1,
    });
  });

  it('should return 200 with filtered transactions by date', async () => {
    (isValid as jest.Mock).mockReturnValue(true);
    req.query = { date: '2021-01-01', page: '1', limit: '10' };
    const transactions = [
      {
        id: 1,
        date: new Date('2021-01-01'),
        description: 'PayPal',
        originalAmount: 100,
        currency: 'USD',
        amountInINR: 7400,
        isDeleted: false,
      },
    ];
    em.findAndCount.mockResolvedValue([transactions, 1]);

    await search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Data has been fetched',
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        originalAmount: transaction.originalAmount,
        currency: transaction.currency,
        amountInINR: transaction.amountInINR,
        isDeleted: transaction.isDeleted,
      })),
      total: 1,
      page: 1,
      pages: 1,
    });
  });

  it('should return 200 with filtered transactions by currency', async () => {
    (isValid as jest.Mock).mockReturnValue(true);
    req.query = { currency: 'USD', page: '1', limit: '10' };
    const transactions = [
      {
        id: 1,
        date: new Date('2021-01-01'),
        description: 'PayPal',
        originalAmount: 100,
        currency: 'USD',
        amountInINR: 7400,
        isDeleted: false,
      },
    ];
    em.findAndCount.mockResolvedValue([transactions, 1]);

    await search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Data has been fetched',
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        originalAmount: transaction.originalAmount,
        currency: transaction.currency,
        amountInINR: transaction.amountInINR,
        isDeleted: transaction.isDeleted,
      })),
      total: 1,
      page: 1,
      pages: 1,
    });
  });

  it('should return 500 if there is an error fetching transactions', async () => {
    (isValid as jest.Mock).mockReturnValue(true);
    req.query = { description: 'PayPal', page: '1', limit: '10' };
    em.findAndCount.mockRejectedValue(new Error('Database error'));

    await search(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'An error occurred while fetching transactions',
    });
  });
});