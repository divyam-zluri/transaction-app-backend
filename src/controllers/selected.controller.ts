import { getEntityManager } from "../utils/orm";
import { Transaction } from "../entities/transactions";
import {Request, Response} from 'express';

export async function deleteSelected(req : Request, res : Response) {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Invalid request, ids must be a non-empty array' });
      return;
    }
  
    try {
      const em = await getEntityManager();
      const transactions = await em.find(Transaction, { id: ids });
  
      if (transactions.length === 0) {
        res.status(404).json({ message: 'No transactions found with the provided ids' });
        return;
      }
  
      transactions.forEach(transaction => {
        transaction.isDeleted = true;
      });
  
      await em.flush();
      res.status(200).json({ message: 'Selected transactions deleted successfully' });
    } catch (error) {
      console.error('Error deleting selected transactions:', error);
      res.status(500).json({ message: 'Error deleting selected transactions' });
    }
  }