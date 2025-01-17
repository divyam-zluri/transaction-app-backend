import { Request, Response } from 'express';
import { ParserController } from '../../src/controllers/parser.controller';
import { TransactionService } from '../../src/services/parsedData.service';
import multer  from 'multer';

jest.mock('../../src/services/parsedData.service');

interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

describe('ParserController', () => {
  let parserController: ParserController;
  let req: Partial<CustomRequest>;
  let res: Partial<Response>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  beforeEach(() => {
    parserController = new ParserController();
    mockTransactionService = new TransactionService() as jest.Mocked<TransactionService>;
    parserController['transactionService'] = mockTransactionService;

    req = {
      file: {
        path: 'mockFilePath',
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 1234,
        destination: 'mockDestination',
        filename: 'mockFilename',
        buffer: Buffer.from(''),
        stream: {} as any,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no file is uploaded', async () => {
    req.file = undefined;

    await parserController.parser(req as CustomRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No file uploaded',
    });
  });

  it('should return 201 if file is processed successfully without warnings', async () => {
    mockTransactionService.parseAndStoreTransactions.mockResolvedValue({
      validTransactions: [],
      warnings: [],
    });

    await parserController.parser(req as CustomRequest, res as Response);

    expect(mockTransactionService.parseAndStoreTransactions).toHaveBeenCalledWith('mockFilePath');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Data Parsed and Inserted Successfully',
      warnings: [],
    });
  });

  it('should return 201 if file is processed successfully with warnings', async () => {
    mockTransactionService.parseAndStoreTransactions.mockResolvedValue({
      validTransactions: [],
      warnings: ['Warning 1', 'Warning 2'],
    });

    await parserController.parser(req as CustomRequest, res as Response);

    expect(mockTransactionService.parseAndStoreTransactions).toHaveBeenCalledWith('mockFilePath');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Some records were skipped due to errors',
      warnings: ['Warning 1', 'Warning 2'],
    });
  });

  it('should return 500 if there is an error processing the file', async () => {
    const mockError = new Error('Mock error');
    mockTransactionService.parseAndStoreTransactions.mockRejectedValue(mockError);

    await parserController.parser(req as CustomRequest, res as Response);

    expect(mockTransactionService.parseAndStoreTransactions).toHaveBeenCalledWith('mockFilePath');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'There is a problem with the file',
      error: 'Mock error',
    });
  });
});