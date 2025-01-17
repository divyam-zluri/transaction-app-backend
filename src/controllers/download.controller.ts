import { Request, Response } from 'express';
import { Transaction } from '../entities/transactions';
import Papa from 'papaparse';
import fs from 'fs';
import { getEntityManager } from '../utils/orm';

export async function downloadTransactions(req: Request, res: Response) {
  const em = await getEntityManager(); 
  try {
    const transactions = await em.find(Transaction, {});

    const csv = Papa.unparse(transactions, {
      header: true,
    });

    const filePath = './transactions.csv';
    fs.writeFileSync(filePath, csv);

    res.download(filePath, 'transactions.csv', (err) => {
      if (err) {
        console.error('Error downloading the file:', err);
        res.status(500).send('Error downloading the file');
      }

      // Clean up the file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: (error as Error).message,
    });
  }
}