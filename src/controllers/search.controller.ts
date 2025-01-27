import { Request, Response } from 'express';
import { Transaction } from '../entities/transactions';
import { isValid } from 'date-fns';
import { getEntityManager } from '../utils/orm';
import { z } from 'zod';
import { currencyConversionRates } from '../globals/currencyConversionRates';

const searchSchema = z.object({
  description: z.string().optional(),
  amount: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  currency: z.string().optional(),
  page: z.preprocess((val) => (val ? parseInt(val as string, 10) : 1), z.number().default(1)),
  limit: z.preprocess((val) => (val ? parseInt(val as string, 10) : 10), z.number().default(10)),
  isDeleted: z.string().optional(),
}).refine((data) => data.description || data.amount || data.date || data.currency, {
  message: "At least one of 'description', 'amount', 'date', or 'currency' must be provided",
});

export async function search(req: Request, res: Response) {
  const validationResult = searchSchema.safeParse(req.query);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.errors,
    });
    return;
  }

  const { description, amount, date, currency, page, limit, isDeleted } = validationResult.data;
  const deleted = isDeleted === 'true' ? true : false;

  // Validate date
  if (date && !isValid(date)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid date',
    });
    return;
  }
  if(currency && !currencyConversionRates.get(currency.toUpperCase())) {
    res.status(400).json({
      success:false,
      message:'Please provide a valid currency'
    })
    return;
  }

  try {
    const em = await getEntityManager();

    // Build query filters
    const filters: Record<string, any> = { isDeleted: deleted };
    if (description) {
      filters.description = { $ilike: `%${description}%` }; // Case-insensitive search for description
    }
    if (amount) {
      filters.originalAmount = amount; // Filter by amount
    }
    if (date) {
      filters.date = date; // Exact date match
    }
    if (currency) {
      filters.currency = currency.toUpperCase(); // Filter by currency
    }

    // Pagination logic
    if(page < 1 || limit < 1){
      res.status(400).json({
        message: "Invalid page or limit",
      });
      return;
    }
    if(limit > 1000){
      res.status(400).json({
        message: "Limit should be less than 1000",
      });
      return;
    }
    const pageNumber = Math.max(1, page); // Ensure page is at least 1
    const limitNumber = Math.max(1, limit); // Ensure limit is at least 1
    const offset = (pageNumber - 1) * limitNumber;

    // Query database
    const [transactions, total] = await em.findAndCount(
      Transaction,
      filters,
      {
        orderBy: { date: 'desc' }, // Sort by date ascending
        limit: limitNumber,
        offset,
      }
    );
    if(pageNumber > 1 && pageNumber > Math.ceil(total / limitNumber)){
      res.status(400).json({
        message: "Invalid page number. Pages cannot be greater than total pages",
      });
      return;
    }

    // Check if no transactions were found
    if (transactions.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No data available',
        transactions: [],
        total: 0,
        page: pageNumber,
        pages: 0,
      });
      return;
    }

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNumber);

    // Format transactions
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      originalAmount: transaction.originalAmount,
      currency: transaction.currency,
      amountInINR: transaction.amountInINR,
      isDeleted: transaction.isDeleted,
    }));

    // Send response
    res.status(200).json({
      success: true,
      message: 'Data has been fetched',
      transactions: formattedTransactions,
      total,
      page: pageNumber,
      pages: totalPages,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching transactions',
    });
  }
}