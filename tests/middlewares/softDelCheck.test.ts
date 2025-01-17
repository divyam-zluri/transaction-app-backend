import { Request, Response, NextFunction } from 'express';
import { softDelCheck } from '../../src/middlewares/softDelCheck.middleware';
import { getEntityManager } from '../../src/utils/orm';
import { Transaction } from '../../src/entities/transactions';

jest.mock('../../src/utils/orm');

describe('softDelCheck middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockEm: any;

  beforeEach(() => {
    req = {
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

  it('should return 404 if transaction does not exist', async () => {
    mockEm.findOne.mockResolvedValue(null);

    await softDelCheck(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'The id does not exist',
    });
  });

  it('should return 404 if transaction is soft deleted', async () => {
    mockEm.findOne.mockResolvedValue({ isDeleted: true });

    await softDelCheck(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Transaction not found',
    });
  });

  it('should call next if transaction exists and is not soft deleted', async () => {
    mockEm.findOne.mockResolvedValue({ isDeleted: false });

    await softDelCheck(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});