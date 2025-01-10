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
  
export class ParserController{
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
                            const transaction = new Transaction();
                            transaction.date = formatDate(data.Date);  // format the date properly
                            transaction.description = data.Description;
                            transaction.originalAmount = data.Amount;
                            transaction.currency = data.Currency;
                            transaction.amountInINR = data.Amount * 80;
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