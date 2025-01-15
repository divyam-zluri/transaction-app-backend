import { Request, Response } from "express";
import { TransactionController } from "../../src/controllers/transaction.controller";
import { MikroORM } from "@mikro-orm/core";
import { Transaction } from "../../src/entities/transactions";
import { currencyConversionRates } from "../../src/globals/currencyConversionRates";

jest.mock("@mikro-orm/core");
// Remove the mock for currencyConversionRates
// jest.mock("../../src/globals/currencyConversionRates");
// Mock MikroORM decorators for the Transaction entity
jest.mock("../../src/entities/transactions", () => ({
    Transaction: jest.fn().mockImplementation(() => ({
        id: 1,
        date: "2025-01-12",
        description: "Test Transaction",
        originalAmount: 100,
        currency: "USD",
    })),
}));

describe("TransactionController", () => {
  let transactionController: TransactionController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    transactionController = new TransactionController();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getData", () => {
    it("should fetch transactions and return 200", async () => {
      const mockTransactions = [{ id: 1, date: "2021-01-01", description: "Test", originalAmount: 100, currency: "USD", amountInINR: 7400 }];
      const emMock = { find: jest.fn().mockResolvedValue(mockTransactions), fork: jest.fn().mockReturnThis() };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });

      await transactionController.getData(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Data has been fetched",
        transaction: mockTransactions,
      });
    });

    it("should handle errors and return 500", async () => {
      const errorMessage = "Failed to fetch transactions.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await transactionController.getData(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to fetch transactions.",
        error: errorMessage,
      });
    });
  });

  describe("addTransaction", () => {
    it("should add a new transaction and return 201", async () => {
      req = {
        body: {
          date: "2021-01-01",
          description: "Test",
          originalAmount: 100,
          currency: "USD",
        },
      };
      const emMock = { persist: jest.fn().mockReturnThis(), flush: jest.fn().mockResolvedValue(undefined), fork: jest.fn().mockReturnThis() };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });

      await transactionController.addTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "New Transaction added",
        transaction: expect.objectContaining({
          date: "2021-01-01",
          description: "Test",
          originalAmount: 100,
          currency: "USD",
          id: 1,
          amountInINR: 8617,
        }),
      });
    });

    it("should handle errors and return 400", async () => {
      req = {
        body: {
          date: "2021-01-01",
          description: "Test",
          originalAmount: 100,
          currency: "USD",
        },
      };
      const errorMessage = "Failed to add transaction.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await transactionController.addTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to add transaction.",
        error: errorMessage,
      });
    });
    
  });

  describe("updateTransaction", () => {
    it("should update a transaction and return 201", async () => {
      req = {
        params: { id: "1" },
        body: {
          description: "Updated Test",
          date: "2021-01-02",
          currency: "EUR",
          originalAmount: 200,
        },
      };
      const mockTransaction = { id: 1, date: "2021-01-01", description: "Test", originalAmount: 100, currency: "USD", amountInINR: 7400 };
      const emMock = { findOne: jest.fn().mockResolvedValue(mockTransaction), flush: jest.fn().mockResolvedValue(undefined), fork: jest.fn().mockReturnThis() };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });

      await transactionController.updateTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: `Transaction 1 has been updated`,
        transaction: expect.objectContaining({
          description: "Updated Test",
          date: "2021-01-02",
          currency: "EUR",
          id: 1,
          originalAmount: 200,
          amountInINR: 17660,
        }),
      });
    });

    it("should handle errors and return 409", async () => {
      req = {
        params: { id: "1" },
        body: {
          description: "Updated Test",
          date: "2021-01-02",
          currency: "EUR",
          originalAmount: 200,
        },
      };
      const errorMessage = "Failed to update transaction.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await transactionController.updateTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to update transaction.",
        error: errorMessage,
      });
    });

    it("should return 400 if the currency conversion rate is not found", async () => {
        req = {
          params: { id: "1" },
          body: {
            description: "Updated Test",
            date: "2021-01-02",
            currency: "EU",
            originalAmount: 200,
          },
        };
        const mockTransaction = { id: 1, date: "2021-01-01", description: "Test", originalAmount: 100, currency: "USD", amountInINR: 7400 };
        const emMock = { findOne: jest.fn().mockResolvedValue(mockTransaction), flush: jest.fn().mockResolvedValue(undefined), fork: jest.fn().mockReturnThis() };
        (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
        await transactionController.updateTransaction(req as Request, res as Response);
  
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Check your currency code",
        });
      });
  });

  describe("deleteTransaction", () => {
    it("should delete a transaction and return 200", async () => {
      req = {
        params: { id: "1" },
      };
      const mockTransaction = { id: 1, date: "2021-01-01", description: "Test", originalAmount: 100, currency: "USD", amountInINR: 7400 };
      const emMock = { findOne: jest.fn().mockResolvedValue(mockTransaction), remove: jest.fn().mockReturnThis(), flush: jest.fn().mockResolvedValue(undefined), fork: jest.fn().mockReturnThis() };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });

      await transactionController.deleteTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Transaction deleted successfully",
        transaction: mockTransaction,
      });
    });

    it("should handle errors and return 500", async () => {
      req = {
        params: { id: "1" },
      };
      const errorMessage = "Failed to delete transaction.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await transactionController.deleteTransaction(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to delete transaction",
        error: errorMessage,
      });
    });

    it("should return 401 if the transaction ID does not exist", async () => {
        req = {
          params: { id: "1" },
        };
        const emMock = { findOne: jest.fn().mockResolvedValue(null), remove: jest.fn().mockReturnThis(), flush: jest.fn().mockResolvedValue(undefined), fork: jest.fn().mockReturnThis() };
        (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
        await transactionController.deleteTransaction(req as Request, res as Response);
  
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "The ID doesn't exist",
        });
      });
  });

  describe("softDeleteTransaction", () => {
    it("should soft delete a transaction and return 200", async () => {
      req = { params: { id: "1" } };
      const mockTransaction = {
        id: 1,
        date: "2021-01-01",
        description: "Test",
        originalAmount: 100,
        currency: "USD",
        amountInINR: 7400,
        isDeleted: false,
      };
      const emMock = {
        findOne: jest.fn().mockResolvedValue(mockTransaction),
        flush: jest.fn().mockResolvedValue(undefined),
        fork: jest.fn().mockReturnThis(),
      };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
      await transactionController.softDeleteTransaction(req as Request, res as Response);
  
      expect(mockTransaction.isDeleted).toBe(true);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Transaction soft deleted successfully",
        transaction: mockTransaction,
      });
    });
  
    it("should return 401 if the transaction ID does not exist", async () => {
      req = { params: { id: "1" } };
      const emMock = {
        findOne: jest.fn().mockResolvedValue(null),
        fork: jest.fn().mockReturnThis(),
      };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
      await transactionController.softDeleteTransaction(req as Request, res as Response);
  
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "The ID doesn't exist",
      });
    });
  
    it("should handle errors and return 500", async () => {
      req = { params: { id: "1" } };
      const errorMessage = "Failed to soft delete transaction.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));
  
      await transactionController.softDeleteTransaction(req as Request, res as Response);
  
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to soft delete transaction",
        error: errorMessage,
      });
    });
  });
  
  describe("restoreTransaction", () => {
    it("should restore a transaction and return 200", async () => {
      req = { params: { id: "1" } };
      const mockTransaction = {
        id: 1,
        date: "2021-01-01",
        description: "Test",
        originalAmount: 100,
        currency: "USD",
        amountInINR: 7400,
        isDeleted: true,
      };
      const emMock = {
        findOne: jest.fn().mockResolvedValue(mockTransaction),
        flush: jest.fn().mockResolvedValue(undefined),
        fork: jest.fn().mockReturnThis(),
      };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
      await transactionController.restoreTransaction(req as Request, res as Response);
  
      expect(mockTransaction.isDeleted).toBe(false);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Transaction restored successfully",
        transaction: mockTransaction,
      });
    });
  
    it("should return 401 if the transaction ID does not exist", async () => {
      req = { params: { id: "1" } };
      const emMock = {
        findOne: jest.fn().mockResolvedValue(null),
        fork: jest.fn().mockReturnThis(),
      };
      (MikroORM.init as jest.Mock).mockResolvedValue({ em: emMock });
  
      await transactionController.restoreTransaction(req as Request, res as Response);
  
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "The ID doesn't exist",
      });
    });
  
    it("should handle errors and return 500", async () => {
      req = { params: { id: "1" } };
      const errorMessage = "Failed to restore transaction.";
      (MikroORM.init as jest.Mock).mockRejectedValue(new Error(errorMessage));
  
      await transactionController.restoreTransaction(req as Request, res as Response);
  
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Failed to restore transaction",
        error: errorMessage,
      });
    });
  });
});