import { Request, Response } from 'express';
import { MikroORM } from '@mikro-orm/postgresql';
import { Transaction } from '../entities/transactions';
import config from '../../mikro-orm.config';

export async function transactionSummaryReport(req: Request, res: Response) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({
      success: false,
      message: 'Please provide both startDate and endDate',
    });
    return;
  }

  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  try {
    const transactions = await em.find(Transaction, {
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    });

    if (transactions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No transactions found for the specified date range',
      });
      return;
    }

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.originalAmount, 0);
    const averageAmount = totalAmount / totalTransactions;

    const currencyBreakdown = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.currency]) {
        acc[transaction.currency] = 0;
      }
      acc[transaction.currency] += transaction.originalAmount;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        totalAmount,
        averageAmount,
        currencyBreakdown,
      },
    });
  } catch (error) {
    console.error('Error generating transaction summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating transaction summary report',
      error: (error as Error).message,
    });
  }
}