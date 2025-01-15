import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transaction } from '../entities/transactions';
import config from '../../mikro-orm.config';
import Papa from 'papaparse';
import fs from 'fs';

export async function downloadTransactions(req: Request, res: Response) {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

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