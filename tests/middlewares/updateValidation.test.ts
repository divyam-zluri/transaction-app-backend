import { Request, Response, NextFunction } from 'express';
import { updateValidation } from '../../src/middlewares/updateValidation.middleware';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';

jest.mock('../../src/utils/orm');

describe('updateValidation middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockEm: any;

  beforeEach(() => {
    req = {
      body: {},
      params: { id: '1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    mockEm = {
      findOne: jest.fn(),
    };
    (getEntityManager as jest.Mock).mockResolvedValue(mockEm);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if data types are invalid', async () => {
    req.body = { date: 123, description: 'Test', originalAmount: '100', currency: 123 };

    await updateValidation(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid data type',
    });
  });

  it('should return 400 if date format is invalid', async () => {
    req.body = { date: '01-01-2023', description: 'Test', originalAmount: 100, currency: 'USD' };

    await updateValidation(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid date format. Expected format: YYYY-MM-DD',
    });
  });

  it('should return 400 if date value is invalid', async () => {
    req.body = { date: '2023-13-01', description: 'Test', originalAmount: 100, currency: 'USD' };

    await updateValidation(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid date value',
    });
  });

  it('should return 400 if originalAmount is negative', async () => {
    req.body = { date: '2023-01-01', description: 'Test', originalAmount: -100, currency: 'USD' };

    await updateValidation(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Amount cannot be negative',
    });
  });

  it('should return 400 if transaction with same date and description already exists', async () => {
    req.body = { date: '2023-01-01', description: 'Test', originalAmount: 100, currency: 'USD' };
    mockEm.findOne.mockResolvedValue({ id: 2 });

    await updateValidation(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Transaction with same date and description already exists',
    });
  });

  it('should call next if validation passes', async () => {
    req.body = { date: '2023-01-01', description: 'Test', originalAmount: 100, currency: 'USD' };
    mockEm.findOne.mockResolvedValue(null);

    await updateValidation(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});