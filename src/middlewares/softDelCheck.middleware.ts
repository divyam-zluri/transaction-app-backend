import  { Request, Response, NextFunction } from 'express';
import { MikroORM } from '@mikro-orm/postgresql';
import config from '../../mikro-orm.config';
import { Transaction } from '../entities/transactions';

export async function softDelCheck(req: Request, res: Response, next: NextFunction){
    const orm = await MikroORM.init(config);
    const em = orm.em.fork();

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