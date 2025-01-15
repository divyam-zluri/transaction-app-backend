import express from 'express';
import request from 'supertest';
import { updateValidation } from '../../src/middlewares/updateValidation.middleware';
import { MikroORM } from '@mikro-orm/core';
import { Transaction } from '../../src/entities/transactions';

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

const app = express();
app.use(express.json());
app.use('/:id', updateValidation); // Use the middleware with a route parameter

describe('updateValidation Middleware', () => {
    let mockEm: any;

    beforeEach(() => {
        mockEm = {
            findOne: jest.fn(),
        };

        // Mock the MikroORM initialization to return our mocked EntityManager
        (MikroORM.init as jest.Mock).mockResolvedValue({
            em: {
                fork: jest.fn().mockReturnValue(mockEm),
            },
        });
    });

    it('should return 400 if data types are incorrect', async () => {
        const response = await request(app).put('/1').send({
            date: 123, // Invalid type
            description: 456, // Invalid type
            originalAmount: "100", // Invalid type
            currency: true, // Invalid type
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Invalid data type",
        });
    });

    it('should return 400 if originalAmount is negative', async () => {
        const response = await request(app).put('/1').send({
            date: "2025-01-12",
            description: "Test Transaction",
            originalAmount: -100, // Negative amount
            currency: "USD",
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: 'Amount cannot be negative',
        });
    });

    it('should return 400 if transaction with same date and description already exists', async () => {
        mockEm.findOne.mockResolvedValueOnce({ id: 2 }); // Simulate existing transaction with a different ID

        const response = await request(app).put('/1').send({
            date: "2025-01-12",
            description: "Test Transaction",
            originalAmount: 100,
            currency: "USD",
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: 'Transaction with same date and description already exists',
        });
    });

    it('should return 400 if the date format is invalid', async () => {
        const response = await request(app).put('/1').send({
            date: "01-01-2025", // Invalid date format
            description: "Test Transaction",
            originalAmount: 100,
            currency: "USD",
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Invalid date format. Expected format: YYYY-MM-DD",
        });
    });

    it('should return 400 if the date value is invalid', async () => {
        const response = await request(app).put('/1').send({
            date: "2025-13-01", // Invalid date value
            description: "Test Transaction",
            originalAmount: 100,
            currency: "USD",
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Invalid date value",
        });
    });

    it('should call next() for valid data', async () => {
        mockEm.findOne.mockResolvedValueOnce(null); // Simulate no duplicate found

        const response = await request(app).put('/1').send({
            date: "2025-01-12",
            description: "Valid Transaction",
            originalAmount: 100,
            currency: "USD",
        });

        expect(response.status).not.toBe(400); // Ensure no error response is sent
    });
});