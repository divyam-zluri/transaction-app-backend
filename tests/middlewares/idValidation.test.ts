import express from 'express';
import request from 'supertest';
import { idValidation } from '../../src/middlewares/idValidation.middleware'; 

const app = express();
app.use('/:id', idValidation); 

describe('idValidation Middleware', () => {
    it('should return 400 if ID is not a number', async () => {
        const response = await request(app).get('/abc'); // Invalid ID
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid ID");
    });

    it('should call next() if ID is a valid number', async () => {
        const response = await request(app).get('/123'); // Valid ID
        expect(response.status).not.toBe(400); // Ensure no error response is sent
    });

    it('should return 400 if ID is NaN', async () => {
        const response = await request(app).get('/NaN'); // NaN as ID
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid ID");
    });
});
