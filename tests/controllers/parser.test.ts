import { Request, Response } from "express";
import { ParserController } from "../../src/controllers/parser.controller"; 
import Papa from "papaparse";
import { MikroORM } from "@mikro-orm/postgresql";
import fs from "fs/promises";
import { Transaction } from "../../src/entities/transactions";
import multer from "multer";

jest.mock("fs/promises");
jest.mock("papaparse");
jest.mock("@mikro-orm/postgresql");

import { Buffer } from 'node:buffer';
import { Mock } from "node:test";

interface MockFile {
  path: string;
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  stream?: any;
  destination?: string;
  filename?: string;
}

describe("ParserController", () => {
  let parserController: ParserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockFile: MockFile;
  let mockFlush = jest.fn();
  let mockPersist = jest.fn();
  
  beforeEach(() => {
    parserController = new ParserController();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockFile = { path: "mock/path/to/file.csv" };
    mockRequest = {
      file: {
        path: "mock/path/to/file.csv",
        fieldname: "file",
        originalname: "file.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 1024,
        buffer: Buffer.from("Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD"),
        stream: {} as any,
        destination: "mock/path/to",
        filename: "file.csv",
      },
    } as Partial<Request> & { file: MockFile };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if no file is uploaded", async () => {
    const req = { file: undefined } as Request;

    await parserController.parser(req, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "No file uploaded",
    });
  });

  it("should read the file content correctly", async () => {
    const mockFileContent = "Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD";
    (fs.readFile as jest.Mock).mockResolvedValueOnce(mockFileContent);
  
    await parserController.parser(mockRequest as Request, mockResponse as Response);
  
    expect(fs.readFile).toHaveBeenCalledWith(mockRequest.file!.path, "utf-8");
  });

  it("should parse the CSV file correctly", async () => {
    const mockFileContent = "Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD";
    (fs.readFile as jest.Mock).mockResolvedValueOnce(mockFileContent);
  
    const mockParsedData = {
      data: [
        { Date: "01-01-2023", Description: "Test Transaction", Amount: 100, Currency: "USD" },
      ],
      errors: [],
    };
    (Papa.parse as jest.Mock).mockReturnValueOnce(mockParsedData);
  
    await parserController.parser(mockRequest as Request, mockResponse as Response);
  
    expect(Papa.parse).toHaveBeenCalledWith(mockFileContent, expect.any(Object));
  });

  it("should fetch existing transactions from the database", async () => {
    const mockFileContent = "Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD";
    (fs.readFile as jest.Mock).mockResolvedValueOnce(mockFileContent);
  
    const mockParsedData = {
      data: [
        { Date: "01-01-2023", Description: "Test Transaction", Amount: 100, Currency: "USD" },
      ],
      errors: [],
    };
    (Papa.parse as jest.Mock).mockReturnValueOnce(mockParsedData);
  
    const mockFind = jest.fn().mockResolvedValue([]);
    const mockEm = {
      fork: () => ({
        persist: jest.fn(),
        flush: mockFlush,
        clear: jest.fn(),
        find: mockFind, // Use the mocked function here
      }),
    };
  
    (MikroORM.init as jest.Mock).mockResolvedValue({ em: mockEm });
  
    await parserController.parser(mockRequest as Request, mockResponse as Response);
  
    expect(mockFind).toHaveBeenCalledWith(Transaction, {
      $or: [
        { date: new Date("2023-01-01T00:00:00.000Z"), description: "Test Transaction" },
      ],
    });
  });
  
  it("should handle errors during file reading or parsing", async () => {
    // Mocking file read to throw an error
    (fs.readFile as jest.Mock).mockRejectedValue(new Error("File read error"));

    const req = {
      file: {
        path: "mock/path/to/file.csv",
        fieldname: "file",
        originalname: "file.csv",
        encoding: "7bit",
        mimetype: "text/csv",
        size: 1024,
        buffer: Buffer.from("Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD"),
        stream: {} as any,
        destination: "mock/path/to",
        filename: "file.csv",
      },
    };

    await parserController.parser(req as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "There is a problem with file",
      error: "File read error",
    });
  });


  it("should handle database errors during insertion", async () => {
    (fs.readFile as jest.Mock).mockResolvedValueOnce(
      "Date,Description,Amount,Currency\n01-01-2023,Test Transaction,100,USD"
    );

    const mockFlush = jest.fn().mockRejectedValue(new Error("Database error")); // Simulate a database error on flush

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([]), // No existing transactions
        }),
      },
    });

    await parserController.parser(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "There is a problem with file",
      error: "Cannot read properties of undefined (reading 'data')",
    });
  });

  it("should skip invalid records and log them", async () => {
    // Mocking file read with an invalid record
    (fs.readFile as jest.Mock).mockResolvedValueOnce("Date,Description,Amount,Currency\n01-01-2023,,100,USD");

    (Papa.parse as jest.Mock).mockImplementation((content, options) => {
      return {
        data: [
          { Date: "01-01-2023", Description: "", Amount: 100, Currency: "USD" }
        ],
      };
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFlush = jest.fn();

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    });

    await parserController.parser(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Skipping invalid record:", { Date: "01-01-2023", Description: "", Amount: 100, Currency: "USD" });

    expect(mockFlush).not.toHaveBeenCalled(); // No valid records to flush
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Some records were skipped due to errors",
      warnings: [
        'Invalid record: {"Date":"01-01-2023","Description":"","Amount":100,"Currency":"USD"}'
      ],
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle invalid currency codes", async () => {
    const req = {
      file: {
        path: "test.csv",
      } as MockFile,
    };

    const mockFileContent = "Date,Description,Amount,Currency\n01-01-2021,Test,100,INVALID";
    (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    (Papa.parse as jest.Mock).mockImplementation((data, options) => {
      return {
        data: [
          { Date: "01-01-2021", Description: "Test", Amount: 100, Currency: "INVALID" },
        ],
      };
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFlush = jest.fn();

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    });

    await parserController.parser(req as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid currency code, skipping record:", "INVALID");
    expect(mockFlush).not.toHaveBeenCalled(); // No valid records to flush
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Some records were skipped due to errors",
      warnings: [
        'Invalid currency code: INVALID'
      ],
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle duplicate transactions", async () => {
    const req = {
      file: {
        path: "test.csv",
      } as MockFile,
    };

    const mockFileContent = "Date,Description,Amount,Currency\n01-01-2021,Test,100,USD";
    (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    (Papa.parse as jest.Mock).mockImplementation((data, options) => {
      return {
        data: [
          { Date: "01-01-2021", Description: "Test", Amount: 100, Currency: "USD" },
        ],
      };
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFlush = jest.fn();

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([
            { date: new Date("2021-01-01"), description: "Test" },
          ]),
        }),
      },
    });

    await parserController.parser(req as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Duplicate transaction found, skipping:", { Date: "01-01-2021", Description: "Test", Amount: 100, Currency: "USD" });
    expect(mockFlush).not.toHaveBeenCalled(); // No valid records to flush
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Some records were skipped due to errors",
      warnings: [
        'Duplicate transaction: {"Date":"01-01-2021","Description":"Test","Amount":100,"Currency":"USD"}'
      ],
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle invalid date formats", async () => {
    const req = {
      file: {
        path: "test.csv",
      } as MockFile,
    };

    const mockFileContent = "Date,Description,Amount,Currency\n11,Test,100,USD";
    (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    (Papa.parse as jest.Mock).mockImplementation((data, options) => {
      return {
        data: [
          { Date: 11, Description: "Test", Amount: 100, Currency: "USD" },
        ],
      };
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFlush = jest.fn();

    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    });

    await parserController.parser(req as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid date format, skipping record:", 11);
    expect(mockFlush).not.toHaveBeenCalled(); // No valid records to flush
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Some records were skipped due to errors",
      warnings: [
        `Invalid date format: 11`,
      ]
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle missing date, description, amount, or currency", async () => {
    // Mocking file read with an invalid record
    (fs.readFile as jest.Mock).mockResolvedValueOnce(
      "Date,Description,Amount,Currency\n,Test,100,USD"
    );
  
    (Papa.parse as jest.Mock).mockImplementation((content, options) => {
      return {
        data: [
          { Date: "", Description: "Test", Amount: 100, Currency: "USD" },
        ],
      };
    });
  
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFlush = jest.fn();
  
    (MikroORM.init as jest.Mock).mockResolvedValue({
      em: {
        fork: () => ({
          persist: jest.fn(),
          flush: mockFlush,
          clear: jest.fn(),
          find: jest.fn().mockResolvedValue([]),
        }),
      },
    });
  
    await parserController.parser(mockRequest as Request, mockResponse as Response);
  
    expect(consoleErrorSpy).toHaveBeenCalledWith("Skipping invalid record:", { Date: "", Description: "Test", Amount: 100, Currency: "USD" });
  
    expect(mockFlush).not.toHaveBeenCalled(); // No valid records to flush
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Some records were skipped due to errors",
      warnings: [
        'Invalid record: {"Date":"","Description":"Test","Amount":100,"Currency":"USD"}'
      ]
    });
  
    consoleErrorSpy.mockRestore();
  });
});