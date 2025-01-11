import {Request, Response} from 'express';
import Papa from "papaparse";
import { MikroORM } from '@mikro-orm/postgresql';
import config from '../../mikro-orm.config';
import { Transaction } from '../entities/transactions';

interface dataTypes{
    Date: string,
    Description: string,
    Amount: number,
    Currency: string
}

// Map of currency conversion rates to INR
const currencyConversionRates: Map<string, number> = new Map([
    ["INR", 1],        // Indian Rupee
    ["USD", 86.170],   // US Dollar
    ["EUR", 88.300],   // Euro
    ["GBP", 105.290],  // British Pound
    ["AUD", 53.218],   // Australian Dollar
    ["CAD", 59.727],   // Canadian Dollar
    ["CHF", 94.187],   // Swiss Franc
    ["JPY", 0.543],    // Japanese Yen
    ["CNY", 11.713],   // Chinese Yuan Renminbi
    ["MYR", 19.074],   // Malaysian Ringgit
    ["ZAR", 4.541],    // South African Rand
    ["NZD", 48.042],   // New Zealand Dollar
    ["RUB", 0.832],    // Russian Ruble
    ["BRL", 14.061],   // Brazilian Real
    ["MXN", 4.202],    // Mexican Peso
    ["THB", 2.476],    // Thai Baht
    ["SGD", 62.707],   // Singapore Dollar
    ["AED", 23.410],   // UAE Dirham
    ["SAR", 22.899],   // Saudi Riyal
    ["KWD", 278.493],  // Kuwaiti Dinar
    ["BHD", 221.243],  // Bahraini Dinar
    ["OMR", 216.515]   // Omani Rial
]);

export class ParserController{
    private getConversionRate(currencyCode: string): number | undefined {
        return currencyConversionRates.get(currencyCode);
    }
    public async parser(req: Request, res: Response){
        try{
            const file = req.file;

            if(!file){
                res.status(401).json({
                    success: false,
                    message: 'No file uploaded'
                });
                return;
            }
            
            const fileContent = file.buffer.toString('utf-8');

            const parsed = Papa.parse<dataTypes>(fileContent, {
                delimiter: ',',
                dynamicTyping: true,
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
            });
            
            const formatDate = (dateString: string) => {
                const [day, month, year] = dateString.split('-');
                return new Date(`${year}-${month}-${day}`); // Convert to Date object in yyyy-mm-dd format
            };
            try {
                const orm = await MikroORM.init(config);
                const em = orm.em.fork();
                const batchSize = 100; // Adjust batch size for testing
                for (let i = 0; i < parsed.data.length; i += batchSize) {
                    const batch = parsed.data.slice(i, i + batchSize);
                    const transactions = batch.map(data => {
                        try {
                            if(data.Currency && !this.getConversionRate(data.Currency)){
                                console.error('Invalid currency code:', data.Currency);
                                return null;  // skip invalid records
                            }

                            const transaction = new Transaction();
                            transaction.date = formatDate(data.Date);  // format the date properly
                            transaction.description = data.Description;
                            transaction.originalAmount = data.Amount;
                            transaction.currency = data.Currency;
                            transaction.amountInINR = data.Amount * this.getConversionRate(data.Currency)!;  // convert to INR
                            return transaction;
                        } catch (error) {
                            console.error('Error processing row', data, error);
                            return null;  // skip invalid records
                        }
                    }).filter(Boolean);  
             
                    if (transactions.length > 0) {
                        await em.persistAndFlush(transactions);
                    }
                }
             
                res.status(201).json({
                    success: true,
                    message: "Data Parsed and Inserted Successfully",
                    parsed
                });
             } catch (error: any) {
                console.error('Error inserting data:', error);
                res.status(500).json({
                    success: false,
                    message: "There is a problem with file",
                    error: error.message,
                });
             }
        }catch(error: any){
            res.status(500).json({
                success: false,
                message: "There is a problem with file",
                error: error.message,
            });
        }
    }
}