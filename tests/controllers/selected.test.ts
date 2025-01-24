import { Request, Response } from 'express';
import { deleteSelected } from '../../src/controllers/selected.controller';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';

jest.mock('../../src/utils/orm');

describe('deleteSelected', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let em: any;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    em = {
      find: jest.fn(),
      flush: jest.fn(),
    };
    (getEntityManager as jest.Mock).mockResolvedValue(em);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if ids are not provided or empty', async () => {
    req.body = { ids: [] };
    await deleteSelected(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid request, ids must be a non-empty array' });
  });

  it('should return 404 if no transactions are found with the provided ids', async () => {
    req.body = { ids: [1, 2, 3] };
    em.find.mockResolvedValue([]);
    await deleteSelected(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'No transactions found with the provided ids' });
  });

  it('should soft delete selected transactions and return 200 when isDeleted is true', async () => {
    req.body = { ids: [1, 2] };
    req.query = { isDeleted: 'true' };
    const transactions = [
      { id: 1, isDeleted: false },
      { id: 2, isDeleted: false },
    ];
    em.find.mockResolvedValue(transactions);
    await deleteSelected(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Selected transactions deleted successfully' });
    expect(em.find).toHaveBeenCalledWith(Transaction, { id: [1, 2] });
    expect(transactions[0].isDeleted).toBe(true);
    expect(transactions[1].isDeleted).toBe(true);
    expect(em.flush).toHaveBeenCalled();
  });

  it('should restore selected transactions and return 200 when isDeleted is false', async () => {
    req.body = { ids: [1, 2] };
    req.query = { isDeleted: 'false' };
    const transactions = [
      { id: 1, isDeleted: true },
      { id: 2, isDeleted: true },
    ];
    em.find.mockResolvedValue(transactions);
    await deleteSelected(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Selected transactions deleted successfully' });
    expect(em.find).toHaveBeenCalledWith(Transaction, { id: [1, 2] });
    expect(transactions[0].isDeleted).toBe(false);
    expect(transactions[1].isDeleted).toBe(false);
    expect(em.flush).toHaveBeenCalled();
  });

  it('should return 500 if there is an error deleting transactions', async () => {
    req.body = { ids: [1, 2, 3] };
    em.find.mockRejectedValue(new Error('Database error'));
    await deleteSelected(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error deleting selected transactions' });
  });
});