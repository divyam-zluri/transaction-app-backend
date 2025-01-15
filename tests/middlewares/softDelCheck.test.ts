import { Request, Response, NextFunction } from 'express';
import { softDelCheck } from '../../src/middlewares/softDelCheck.middleware';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transaction } from '../../src/entities/transactions';

jest.mock('@mikro-orm/postgresql');

describe('softDelCheck Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnThis(),
        findOne: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if the transaction does not exist', async () => {
    mockRequest.params = { id: '1' };
    const mockFindOne = jest.fn().mockResolvedValue(null);
    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnValue({
          findOne: mockFindOne,
        }),
      },
    });

    await softDelCheck(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'The id does not exist',
    });
  });

  it('should return 404 if the transaction is soft deleted', async () => {
    mockRequest.params = { id: '1' };
    const mockFindOne = jest.fn().mockResolvedValue({ id: 1, isDeleted: true });
    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnValue({
          findOne: mockFindOne,
        }),
      },
    });

    await softDelCheck(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Transaction not found',
    });
  });

  it('should call next if the transaction exists and is not soft deleted', async () => {
    mockRequest.params = { id: '1' };
    const mockFindOne = jest.fn().mockResolvedValue({ id: 1, isDeleted: false });
    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: jest.fn().mockReturnValue({
          findOne: mockFindOne,
        }),
      },
    });

    await softDelCheck(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});