import { Request, Response, NextFunction } from 'express';
import { pageLimit } from '../../src/middlewares/pageLimit.middleware';
import { check } from '../../src/services/pageLimit.service';

jest.mock('../../src/services/pageLimit.service');

describe('pageLimit middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next if page and limit are valid', async () => {
    req.query!.page = '1';
    req.query!.limit = '10';
    (check as jest.Mock).mockReturnValue(true);

    await pageLimit(req as Request, res as Response, next);

    expect(check).toHaveBeenCalledWith('1', '10');
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if check fails', async () => {
    req.query!.page = 'a';
    req.query!.limit = '10';
    (check as jest.Mock).mockReturnValue(false);

    await pageLimit(req as Request, res as Response, next);

    expect(check).toHaveBeenCalledWith('a', '10');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page or limit' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if page is less than 1', async () => {
    req.query!.page = '0';
    req.query!.limit = '10';
    (check as jest.Mock).mockReturnValue(true);

    await pageLimit(req as Request, res as Response, next);

    expect(check).toHaveBeenCalledWith('0', '10');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page or limit' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if limit is less than 1', async () => {
    req.query!.page = '1';
    req.query!.limit = '0';
    (check as jest.Mock).mockReturnValue(true);

    await pageLimit(req as Request, res as Response, next);

    expect(check).toHaveBeenCalledWith('1', '0');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid page or limit' });
    expect(next).not.toHaveBeenCalled();
  });
});