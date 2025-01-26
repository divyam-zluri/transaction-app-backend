import { getEntityManager } from "../utils/orm";
import { Transaction } from "../entities/transactions";
import {Request, Response} from 'express';
import {z} from 'zod';

export async function deleteSelected(req : Request, res : Response) {
  const { ids } = req.body;
  const { isDeleted } = req.query;
  
  if(isDeleted !== undefined && isDeleted !== 'true' && isDeleted !== 'false') {
    res.status(400).json({ 
      message: 'Invalid request, isDeleted must be a boolean' 
    });
    return;
  }
  const deleted = isDeleted === 'true' ? true : false;
  const schema = z.array(z.number());

  const validateNumberArray = (data: any) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors
      });
      return false;
    }
    return true;
  };
  
  if (!validateNumberArray(ids)) {
    return;
  }

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
        transaction.isDeleted = deleted;
      });
      
      await em.flush();
      res.status(200).json({ message: `Selected transactions ${deleted == true ? 'deleted' : 'restored'} successfully` });
    } catch (error) {
      console.error('Error deleting selected transactions:', error);
      res.status(500).json({ message: 'Error deleting selected transactions' });
    }
  }