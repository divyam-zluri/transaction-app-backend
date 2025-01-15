import express from 'express';
import request from 'supertest';
import { conversionValidation } from '../../src/middlewares/conversionValidation.middleware'; // Adjust the import path accordingly
import { currencyConversionRates } from '../../src/globals/currencyConversionRates';

// Mock the currencyConversionRates object
jest.mock('../../src/globals/currencyConversionRates', () => ({
    currencyConversionRates: {
        get: jest.fn(),
    },
}));

const app = express();
app.use(express.json());
app.use(conversionValidation); // Use the middleware

describe('conversionValidation Middleware', () => {
    it('should return 400 if currency code is invalid', async () => {
        // Mock the get method to return undefined for an invalid currency code
        (currencyConversionRates.get as jest.Mock).mockReturnValueOnce(undefined);

        const response = await request(app).post('/').send({
            currency: 'INVALID_CURRENCY', // Invalid currency code
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            succes: false,
            message: 'Invalid Currency Code',
        });
    });

    it('should call next() if currency code is valid', async () => {
        // Mock the get method to return a valid value for a valid currency code
        (currencyConversionRates.get as jest.Mock).mockReturnValueOnce(true);

        const response = await request(app).post('/').send({
            currency: 'USD', // Valid currency code
        });

        expect(response.status).not.toBe(400); // Ensure no error response is sent
    });
});
