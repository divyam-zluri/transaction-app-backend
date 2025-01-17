import  { Request, Response, NextFunction } from 'express';
import { Transaction } from '../entities/transactions';
import { getEntityManager } from '../utils/orm';

export async function softDelCheck(req: Request, res: Response, next: NextFunction){
    const em = await getEntityManager();

    const id = Number(req.params.id);
    const transaction = await em.findOne(Transaction, {id});
    if(!transaction){
        res.status(404).json({
            success: false,
            message: 'The id does not exist'
        })
        return;
    }
    if(transaction.isDeleted){
        res.status(404).json({
            success: false,
            message: 'Transaction not found'
        })
        return;
    }
    next();
}