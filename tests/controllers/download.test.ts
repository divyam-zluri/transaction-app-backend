import request from 'supertest';
import express, { Request, Response } from 'express';
import { downloadTransactions } from '../../src/controllers/download.controller';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transaction } from '../../src/entities/transactions';
import fs from 'fs';
import Papa from 'papaparse';

jest.mock('@mikro-orm/postgresql');
jest.mock('fs');
jest.mock('papaparse');

const app = express();
app.get('/api/download', downloadTransactions);

describe('downloadTransactions', () => {
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

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should simulate downloading the transactions as a CSV file', async () => {
    const transactions = [
      { id: 1, date: '2023-01-01', description: 'Test Transaction', originalAmount: 100, currency: 'USD', amountInINR: 7500, isDeleted: false },
    ];
    mockEm.find.mockResolvedValue(transactions);
    (Papa.unparse as jest.Mock).mockReturnValue('id,date,description,originalAmount,currency,amountInINR,isDeleted\n1,2023-01-01,Test Transaction,100,USD,7500,false');

    const mockDownload = jest.fn((filePath, fileName, callback) => {
      callback(); // Simulate the callback being called immediately
    });

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: mockDownload,
      send: jest.fn(), // Add the send method to the mock response
    };

    await downloadTransactions({} as unknown as Request, mockResponse as unknown as Response);

    expect(mockDownload).toHaveBeenCalledWith('./transactions.csv', 'transactions.csv', expect.any(Function));
    expect(fs.writeFileSync).toHaveBeenCalledWith('./transactions.csv', 'id,date,description,originalAmount,currency,amountInINR,isDeleted\n1,2023-01-01,Test Transaction,100,USD,7500,false');
    expect(fs.unlinkSync).toHaveBeenCalledWith('./transactions.csv');
  });

  it('should handle errors when fetching transactions', async () => {
    mockEm.find.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/download');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Error fetching transactions',
      error: 'Database error',
    });
  });

  it('should handle errors when writing the file', async () => {
    const transactions = [
      { id: 1, date: '2023-01-01', description: 'Test Transaction', originalAmount: 100, currency: 'USD', amountInINR: 7500, isDeleted: false },
    ];
    mockEm.find.mockResolvedValue(transactions);
    (Papa.unparse as jest.Mock).mockReturnValue('id,date,description,originalAmount,currency,amountInINR,isDeleted\n1,2023-01-01,Test Transaction,100,USD,7500,false');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File write error');
    });

    const response = await request(app).get('/api/download');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Error fetching transactions',
      error: 'File write error',
    });
  });

  it('should handle errors during the download process', async () => {
    const transactions = [
      { id: 1, date: '2023-01-01', description: 'Test Transaction', originalAmount: 100, currency: 'USD', amountInINR: 7500, isDeleted: false },
    ];
    mockEm.find.mockResolvedValue(transactions);
    (Papa.unparse as jest.Mock).mockReturnValue('id,date,description,originalAmount,currency,amountInINR,isDeleted\n1,2023-01-01,Test Transaction,100,USD,7500,false');

    const mockDownload = jest.fn((filePath, fileName, callback) => {
      callback(new Error('Download error')); // Simulate an error during the download process
    });

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: mockDownload,
      send: jest.fn(), // Add the send method to the mock response
    };

    await downloadTransactions({} as Request, mockResponse as unknown as Response);

    expect(mockDownload).toHaveBeenCalledWith('./transactions.csv', 'transactions.csv', expect.any(Function));
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith('Error downloading the file');
    expect(fs.writeFileSync).toHaveBeenCalledWith('./transactions.csv', 'id,date,description,originalAmount,currency,amountInINR,isDeleted\n1,2023-01-01,Test Transaction,100,USD,7500,false');
    expect(fs.unlinkSync).toHaveBeenCalledWith('./transactions.csv');
  });
});