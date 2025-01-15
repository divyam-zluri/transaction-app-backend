import request from 'supertest';
import express, { Request, Response } from 'express';
import { transactionSummaryReport } from '../../src/controllers/report.controller';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transaction } from '../../src/entities/transactions';

jest.mock('@mikro-orm/postgresql');

const app = express();
app.get('/api/transaction-summary', transactionSummaryReport);

describe('transactionSummaryReport', () => {
  let mockEm: any;

  beforeEach(() => {
    mockEm = {
      find: jest.fn(),
    };

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnValue(mockEm),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if startDate or endDate is missing', async () => {
    const response = await request(app).get('/api/transaction-summary?startDate=2023-01-01');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Please provide both startDate and endDate',
    });
  });

  it('should return 404 if no transactions are found for the specified date range', async () => {
    mockEm.find.mockResolvedValue([]);

    const response = await request(app).get('/api/transaction-summary?startDate=2023-01-01&endDate=2023-01-31');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'No transactions found for the specified date range',
    });
  });

  it('should return a summary report for the specified date range', async () => {
    const transactions = [
      { id: 1, date: new Date('2023-01-01'), description: 'Test Transaction 1', originalAmount: 100, currency: 'USD', amountInINR: 7500, isDeleted: false },
      { id: 2, date: new Date('2023-01-02'), description: 'Test Transaction 2', originalAmount: 200, currency: 'USD', amountInINR: 15000, isDeleted: false },
      { id: 3, date: new Date('2023-01-03'), description: 'Test Transaction 3', originalAmount: 300, currency: 'EUR', amountInINR: 22500, isDeleted: false },
    ];
    mockEm.find.mockResolvedValue(transactions);

    const response = await request(app).get('/api/transaction-summary?startDate=2023-01-01&endDate=2023-01-31');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
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

  it('should handle errors when generating the summary report', async () => {
    mockEm.find.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/transaction-summary?startDate=2023-01-01&endDate=2023-01-31');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Error generating transaction summary report',
      error: 'Database error',
    });
  });
});