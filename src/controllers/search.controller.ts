import { Request, Response } from 'express';
import { Transaction } from '../entities/transactions';
import { isValid } from 'date-fns';
import { getEntityManager } from '../utils/orm';

export async function search(req: Request, res: Response) {
  const { description, amount, date, currency, page = 1, limit = 10, isDeleted} = req.query;
  const deleted = isDeleted === 'true' ? true : false;
  // Validate date
  if (date && !isValid(new Date(date as string))) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid date',
    });
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
      filters.originalAmount = parseFloat(amount as string); // Filter by amount
    }
    if (date) {
      filters.date = new Date(date as string); // Exact date match
    }
    if (currency) {
      filters.currency = currency; // Filter by currency
    }

    // Pagination logic
    const pageNumber = Math.max(1, parseInt(page as string, 10)); // Ensure page is at least 1
    const limitNumber = Math.max(1, parseInt(limit as string, 10)); // Ensure limit is at least 1
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
