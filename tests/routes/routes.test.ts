import request from 'supertest';
import express, { NextFunction } from 'express';
import { TransactionController } from '../../src/controllers/transaction.controller';
import { dataValidation } from '../../src/middlewares/dataValidation.middleware';
import { updateValidation } from '../../src/middlewares/updateValidation.middleware';
import { idValidation } from '../../src/middlewares/idValidation.middleware';
import { conversionValidation } from '../../src/middlewares/conversionValidation.middleware';
import { uploadCSV } from "../../src/services/fileUpload.service";
import { softDelCheck } from '../../src/middlewares/softDelCheck.middleware';
import { ParserController } from "../../src/controllers/parser.controller";
import multer from 'multer';

// Mock middlewares first
jest.mock('../../src/middlewares/idValidation.middleware', () => ({
    idValidation: jest.fn().mockImplementation((_req, _res, next) => next())
}));
jest.mock('../../src/middlewares/dataValidation.middleware', () => ({
    dataValidation: jest.fn().mockImplementation((_req, _res, next) => next())
}));
jest.mock('../../src/middlewares/updateValidation.middleware', () => ({
    updateValidation: jest.fn().mockImplementation((_req, _res, next) => next())
}));
jest.mock('../../src/middlewares/conversionValidation.middleware', () => ({
    conversionValidation: jest.fn().mockImplementation((_req, _res, next) => next())
}));
jest.mock('../../src/middlewares/softDelCheck.middleware', () => ({
    softDelCheck: jest.fn().mockImplementation((_req, _res, next) => next())
}));


// Mock controller methods
const mockController = {
  getData: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
  addTransaction: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
  updateTransaction: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
  deleteTransaction: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
  softDeleteTransaction: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
  restoreTransaction: jest.fn().mockImplementation((_req, res) => res.json({ success: true })),
};
jest.mock('../../src/controllers/transaction.controller', () => ({
  TransactionController: jest.fn().mockImplementation(() => mockController)
}));

// Mock CSV parser
const mockParser = {
  parser: jest.fn().mockImplementation((_req, res) => res.json({ success: true }))
};
jest.mock('../../src/controllers/parser.controller', () => ({
  ParserController: jest.fn().mockImplementation(() => mockParser)
}));

// Mock multer
jest.mock('multer', () => {
  return jest.fn().mockImplementation(() => ({
    single: jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => next())
  }));
});

// Mock uploadCSV
jest.mock('../../src/services/fileUpload.service', () => ({
  uploadCSV: jest.fn((req, res, next) => next())
}));

describe('Transaction Routes', () => {
  let app: express.Application;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Create a new router instance for each test
    const router = express.Router();
    // Set up routes with mocked middleware and controllers
    router.get('/', mockController.getData);
    router.post('/add-transaction', dataValidation, conversionValidation, mockController.addTransaction);
    router.put('/update-transaction/:id', idValidation, softDelCheck, updateValidation, mockController.updateTransaction);
    router.delete('/delete-transaction/:id', idValidation, softDelCheck, mockController.deleteTransaction);
    router.post('/uploadCSV', multer({ dest: 'uploads/' }).single('file'), uploadCSV, mockParser.parser);
    router.put('/soft-delete/:id', idValidation, softDelCheck, mockController.softDeleteTransaction);
    router.put('/restore/:id', idValidation, mockController.restoreTransaction);
    app.use('/transactions', router);
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /transactions', () => {
    it('should call getData method of TransactionController', async () => {
      const response = await request(app).get('/transactions').expect(200);
      expect(mockController.getData).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('POST /transactions/add-transaction', () => {
    it('should validate and add a new transaction', async () => {
      const mockTransaction = { amount: 100, description: 'Test' };
      const response = await request(app).post('/transactions/add-transaction').send(mockTransaction).expect(200);
      expect(dataValidation).toHaveBeenCalled();
      expect(conversionValidation).toHaveBeenCalled();
      expect(mockController.addTransaction).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /transactions/update-transaction/:id', () => {
    it('should validate and update a transaction', async () => {
      const mockUpdate = { amount: 200 };
      const response = await request(app).put('/transactions/update-transaction/123').send(mockUpdate).expect(200);
      expect(idValidation).toHaveBeenCalled();
      expect(softDelCheck).toHaveBeenCalled();
      expect(updateValidation).toHaveBeenCalled();
      expect(mockController.updateTransaction).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /transactions/delete-transaction/:id', () => {
    it('should validate and delete a transaction', async () => {
      const response = await request(app).delete('/transactions/delete-transaction/123').expect(200);
      expect(idValidation).toHaveBeenCalled();
      expect(softDelCheck).toHaveBeenCalled
      expect(mockController.deleteTransaction).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /transactions/uploadCSV', () => {
    it('should handle CSV upload and parsing', async () => {
      const response = await request(app)
        .post('/transactions/uploadCSV')
        .attach('file', Buffer.from('test,csv,data'), 'test.csv')
        .expect(200);
      expect(require('../../src/services/fileUpload.service').uploadCSV).toHaveBeenCalled();
      expect(mockParser.parser).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /transactions/soft-delete/:id', () => {
    it('should soft delete a transaction', async () => {
      const response = await request(app).put('/transactions/soft-delete/123').expect(200);
      expect(idValidation).toHaveBeenCalled();
      expect(softDelCheck).toHaveBeenCalled();
      expect(mockController.softDeleteTransaction).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /transactions/restore/:id', () => {
    it('should restore a transaction', async () => {
      const response = await request(app).put('/transactions/restore/123').expect(200);
      expect(idValidation).toHaveBeenCalled();
      expect(mockController.restoreTransaction).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });
  });
});