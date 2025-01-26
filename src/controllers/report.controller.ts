import { Request, Response } from 'express';
import { Transaction } from '../entities/transactions';
import { getEntityManager } from '../utils/orm';
import { z } from 'zod';

const reportSchema = z.object({
  startYear: z.preprocess((val) => parseInt(val as string, 10), z.number().int().min(0)),
  endYear: z.preprocess((val) => parseInt(val as string, 10), z.number().int().min(0)),
});

export async function transactionSummaryReport(req: Request, res: Response) {
  const validationResult = reportSchema.safeParse(req.query);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.errors,
    });
    return;
  }

  const { startYear, endYear } = validationResult.data;

  if (startYear > endYear || endYear > new Date().getFullYear() + 1) {
    res.status(400).json({
      success: false,
      message: `Please provide a valid year range. Year must be less than ${new Date().getFullYear() + 1}`,
    });
    return;
  }

  try {
    const em = await getEntityManager();
    const transactions = await em.find(Transaction, {
      date: {
        $gte: new Date(`${startYear}-01-01`),
        $lte: new Date(`${endYear}-12-31`),
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