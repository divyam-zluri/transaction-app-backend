import { Request, Response, NextFunction } from "express";
import { MikroORM } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import { dataValidation } from "../../src/middlewares/dataValidation.middleware";
import { Transaction } from "../../src/entities/transactions";
import {parse, isValid} from "date-fns";
import * as dateFns from "date-fns";

// Mock MikroORM functions
jest.mock("@mikro-orm/core")

// Mock PostgreSqlDriver so it's not used directly in the test environment
jest.mock("@mikro-orm/postgresql")
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

describe("dataValidation Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();
    let mockEm: Partial<EntityManager>;
  
    beforeEach(() => {
      mockRequest = {
        body: {
          date: "2023-10-10",
          description: "Test Transaction",
          originalAmount: 100,
          currency: "USD",
        },
      };
  
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      nextFunction = jest.fn();
  
      mockEm = {
        findOne: jest.fn(),
      };
  
      (MikroORM.init as jest.Mock).mockResolvedValue({
        em: {
          fork: () => mockEm,
        },
      });
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it("should return 400 if any required field is missing", async () => {
      mockRequest.body = { date: "2023-01-01", description: "Test" }; // Missing originalAmount and currency
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Please provide all the required fields",
      });
    });
  
    it("should return 400 if any field has an invalid data type", async () => {
      mockRequest.body = { date: "2023-01-01", description: "Test", originalAmount: "100", currency: "USD" }; // originalAmount is a string
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid data type",
      });
    });
  
    it("should return 400 if the date format is invalid", async () => {
      mockRequest.body = { date: "01-01-2023", description: "Test", originalAmount: 100, currency: "USD" }; // Invalid date format
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid date format. Expected format: YYYY-MM-DD",
      });
    });
  
    it("should return 400 if the date value is invalid", async () => {
      mockRequest.body = { date: "2023-01-33", description: "Test", originalAmount: 100, currency: "USD" };
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid date value",
      });
    });
  
  
    it("should return 400 if the amount is negative", async () => {
      mockRequest.body = { date: "2023-01-01", description: "Test", originalAmount: -100, currency: "USD" }; // Negative amount
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Amount cannot be negative",
      });
    });
  
    it("should return 400 if the transaction already exists", async () => {
      mockRequest.body = { date: "2023-01-01", description: "Test", originalAmount: 100, currency: "USD" };
  
      const mockFindOne = jest.fn().mockResolvedValue(true);
      (MikroORM.init as jest.Mock).mockResolvedValue({
        em: {
          fork: () => ({
            findOne: mockFindOne,
          }),
        },
      });
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Transaction already exists",
      });
    });
  
    it("should call next if all validations pass", async () => {
      mockRequest.body = { date: "2023-01-01", description: "Test", originalAmount: 100, currency: "USD" };
  
      const mockFindOne = jest.fn().mockResolvedValue(false);
      (MikroORM.init as jest.Mock).mockResolvedValue({
        em: {
          fork: () => ({
            findOne: mockFindOne,
          }),
        },
      });
  
      await dataValidation(mockRequest as Request, mockResponse as Response, nextFunction);
  
      expect(nextFunction).toHaveBeenCalled();
    });
  });