import { Request, Response } from 'express';
import { TransactionController } from '../../src/controllers/transaction.controller';
import transactionService from '../../src/services/transaction.service';

jest.mock('../../src/services/transaction.service');

describe('TransactionController', () => {
  let transactionController: TransactionController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    transactionController = new TransactionController();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('should return 200 and data when transactions are fetched successfully', async () => {
      const mockData = { transactions: [], total: 0, page: 1, pages: 1 };
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(mockData);

      req.query = { page: '1', limit: '10', isDeleted: 'false' };

      await transactionController.getData(req as Request, res as Response);

      expect(transactionService.getTransactions).toHaveBeenCalledWith(1, 10, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data has been fetched',
        ...mockData,
      });
    });

    it('should return 200 and data with default page and limit when not provided', async () => {
      const mockData = { transactions: [], total: 0, page: 1, pages: 1 };
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(mockData);

      req.query = {};

      await transactionController.getData(req as Request, res as Response);

      expect(transactionService.getTransactions).toHaveBeenCalledWith(1, 10, false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data has been fetched',
        ...mockData,
      });
    });

    it('should return 200 and data when transactions are fetched successfully', async () => {
      const mockData = { transactions: [], total: 0, page: 1, pages: 1 };
      (transactionService.getTransactions as jest.Mock).mockResolvedValue(mockData);

      req.query = { page: '1', limit: '10', isDeleted: 'true' };

      await transactionController.getData(req as Request, res as Response);

      expect(transactionService.getTransactions).toHaveBeenCalledWith(1, 10, true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data has been fetched',
        ...mockData,
      });
    });

    it('should return 500 when there is an error fetching transactions', async () => {
      const mockError = new Error('Fetch error');
      (transactionService.getTransactions as jest.Mock).mockRejectedValue(mockError);

      await transactionController.getData(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch transactions.',
        error: "Cannot destructure property 'page' of '((cov_96fo0fi1a(...).s[19]++) , req.query)' as it is undefined.",
      });
    });
  });

  describe('addTransaction', () => {
    it('should return 201 and the transaction when added successfully', async () => {
      const mockTransaction = { id: 1, description: 'Test transaction' };
      (transactionService.createTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      req.body = { description: 'Test transaction' };

      await transactionController.addTransaction(req as Request, res as Response);

      expect(transactionService.createTransaction).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'New Transaction added',
        transaction: mockTransaction,
      });
    });

    it('should return 400 when there is an error adding the transaction', async () => {
      const mockError = new Error('Add error');
      (transactionService.createTransaction as jest.Mock).mockRejectedValue(mockError);

      await transactionController.addTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to add transaction.',
        error: 'Add error',
      });
    });
  });

  describe('updateTransaction', () => {
    it('should return 201 and the updated transaction when updated successfully', async () => {
      const mockTransaction = { id: 1, description: 'Updated transaction' };
      (transactionService.updateTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      req.params = { id: '1' };
      req.body = { description: 'Updated transaction' };

      await transactionController.updateTransaction(req as Request, res as Response);

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction 1 has been updated',
        transaction: mockTransaction,
      });
    });

    it('should return 409 when there is an error updating the transaction', async () => {
      const mockError = new Error('Update error');
      (transactionService.updateTransaction as jest.Mock).mockRejectedValue(mockError);

      await transactionController.updateTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update transaction.',
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });
  });

  describe('deleteTransaction', () => {
    it('should return 200 and the deleted transaction when deleted successfully', async () => {
      const mockTransaction = { id: 1, description: 'Deleted transaction' };
      (transactionService.deleteTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      req.params = { id: '1' };

      await transactionController.deleteTransaction(req as Request, res as Response);

      expect(transactionService.deleteTransaction).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction deleted successfully',
        transaction: mockTransaction,
      });
    });

    it('should return 500 when there is an error deleting the transaction', async () => {
      const mockError = new Error('Delete error');
      (transactionService.deleteTransaction as jest.Mock).mockRejectedValue(mockError);

      await transactionController.deleteTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete transaction',
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });
  });

  describe('softDeleteTransaction', () => {
    it('should return 200 and the soft deleted transaction when soft deleted successfully', async () => {
      const mockTransaction = { id: 1, description: 'Soft deleted transaction' };
      (transactionService.softDeleteTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      req.params = { id: '1' };

      await transactionController.softDeleteTransaction(req as Request, res as Response);

      expect(transactionService.softDeleteTransaction).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction soft deleted successfully',
        transaction: mockTransaction,
      });
    });

    it('should return 500 when there is an error soft deleting the transaction', async () => {
      const mockError = new Error('Soft delete error');
      (transactionService.softDeleteTransaction as jest.Mock).mockRejectedValue(mockError);

      await transactionController.softDeleteTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to soft delete transaction',
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });
  });

  describe('restoreTransaction', () => {
    it('should return 200 and the restored transaction when restored successfully', async () => {
      const mockTransaction = { id: 1, description: 'Restored transaction' };
      (transactionService.restoreTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      req.params = { id: '1' };

      await transactionController.restoreTransaction(req as Request, res as Response);

      expect(transactionService.restoreTransaction).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction restored successfully',
        transaction: mockTransaction,
      });
    });

    it('should return 500 when there is an error restoring the transaction', async () => {
      const mockError = new Error('Restore error');
      (transactionService.restoreTransaction as jest.Mock).mockRejectedValue(mockError);

      await transactionController.restoreTransaction(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to restore transaction',
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });
  });
});