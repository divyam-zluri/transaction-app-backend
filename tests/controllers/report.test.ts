import { Request, Response } from 'express';
import { transactionSummaryReport } from '../../src/controllers/report.controller';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';

jest.mock('../../src/utils/orm');

describe('transactionSummaryReport', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockEm: any;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockEm = {
      find: jest.fn(),
    };
    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if startYear or endYear is not provided', async () => {
    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide both startYear and endYear',
    });
  });

  it('should return 400 if startYear or endYear is invalid', async () => {
    req.query = { startYear: 'invalid', endYear: '2023' };

    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide a valid year value',
    });
  });

  it('should return 400 if startYear is greater than endYear or endYear is in the future', async () => {
    req.query = { startYear: '2025', endYear: '2023' };

    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: `Please provide a valid year range. Year must be less than ${new Date().getFullYear() + 1}`,
    });
  });

  it('should return 404 if no transactions are found', async () => {
    req.query = { startYear: '2020', endYear: '2021' };
    mockEm.find.mockResolvedValue([]);

    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No transactions found for the specified year range',
    });
  });

  it('should return 200 with transaction summary report', async () => {
    req.query = { startYear: '2020', endYear: '2021' };
    const transactions = [
      { originalAmount: 100, currency: 'USD' },
      { originalAmount: 200, currency: 'USD' },
      { originalAmount: 300, currency: 'EUR' },
    ];
    mockEm.find.mockResolvedValue(transactions);

    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        totalTransactions: 3,
        totalAmount: 600,
        averageAmount: 200,
        currencyBreakdown: {
          USD: 300,
          EUR: 300,
        },
      },
    });
  });

  it('should return 500 if there is an error generating the report', async () => {
    req.query = { startYear: '2020', endYear: '2021' };
    const error = new Error('Database error');
    mockEm.find.mockRejectedValue(error);

    await transactionSummaryReport(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error generating transaction summary report',
      error: error.message,
    });
  });
});