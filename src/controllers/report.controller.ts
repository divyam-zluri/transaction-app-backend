import { Request, Response } from 'express';
import { Transaction } from '../entities/transactions';
import { getEntityManager } from '../utils/orm';

export async function transactionSummaryReport(req: Request, res: Response) {
  const { startYear, endYear } = req.query;
  if (!startYear || !endYear) {
    res.status(400).json({
      success: false,
      message: 'Please provide both startYear and endYear',
    });
    return;
  }
  try {
    if(isNaN(Number(startYear)) || isNaN(Number(endYear)) || Number(startYear) < 0 || Number(endYear) < 0){
      res.status(400).json({
        success: false,
        message: 'Please provide a valid year value',
      });
      return;
    }
    if(startYear > endYear || Number(endYear) > new Date().getFullYear()+1){
      res.status(400).json({
        success: false,
        message: `Please provide a valid year range. Year must be less than ${new Date().getFullYear()+1}`
      });
      return;
    }
    const em = await getEntityManager(); 
    const transactions = await em.find(Transaction, {
      date: {
        $gte: new Date(startYear as string),
        $lte: new Date(endYear as string),
      },
    });
    if (transactions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No transactions found for the specified year range',
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