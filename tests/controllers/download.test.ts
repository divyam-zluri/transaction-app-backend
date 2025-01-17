import { Request, Response } from 'express';
import { downloadTransactions } from '../../src/controllers/download.controller';
import { Transaction } from '../../src/entities/transactions';
import { getEntityManager } from '../../src/utils/orm';
import Papa from 'papaparse';
import fs from 'fs';

jest.mock('../../src/utils/orm');
jest.mock('papaparse');
jest.mock('fs');

describe('downloadTransactions', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockEm: any;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn(),
      send: jest.fn(), // Mock the send method
    };
    mockEm = {
      find: jest.fn(),
    };
    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should download transactions as CSV', async () => {
    const mockTransactions = [
      { id: 1, description: 'Test Transaction 1', amount: 100 },
      { id: 2, description: 'Test Transaction 2', amount: 200 },
    ];
    mockEm.find.mockResolvedValue(mockTransactions);
    (Papa.unparse as jest.Mock).mockReturnValue('id,description,amount\n1,Test Transaction 1,100\n2,Test Transaction 2,200');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

    await downloadTransactions(req as Request, res as Response);

    expect(mockEm.find).toHaveBeenCalledWith(Transaction, {});
    expect(Papa.unparse).toHaveBeenCalledWith(mockTransactions, { header: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith('./transactions.csv', 'id,description,amount\n1,Test Transaction 1,100\n2,Test Transaction 2,200');
    expect(res.download).toHaveBeenCalledWith('./transactions.csv', 'transactions.csv', expect.any(Function));
  });

  it('should handle errors during transaction fetching', async () => {
    const mockError = new Error('Database error');
    mockEm.find.mockRejectedValue(mockError);

    await downloadTransactions(req as Request, res as Response);

    expect(mockEm.find).toHaveBeenCalledWith(Transaction, {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error fetching transactions',
      error: 'Database error',
    });
  });

  it('should handle errors during file download', async () => {
    const mockTransactions = [
      { id: 1, description: 'Test Transaction 1', amount: 100 },
      { id: 2, description: 'Test Transaction 2', amount: 200 },
    ];
    mockEm.find.mockResolvedValue(mockTransactions);
    (Papa.unparse as jest.Mock).mockReturnValue('id,description,amount\n1,Test Transaction 1,100\n2,Test Transaction 2,200');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

    await downloadTransactions(req as Request, res as Response);

    const downloadCallback = (res.download as jest.Mock).mock.calls[0][2];
    downloadCallback(new Error('Download error'));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error downloading the file');
  });
});