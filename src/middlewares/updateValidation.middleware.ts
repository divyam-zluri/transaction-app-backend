import { Request, Response, NextFunction } from "express";
import { Transaction } from "../entities/transactions";
import { MikroORM } from "@mikro-orm/core";
import config from "../../mikro-orm.config";

export async function updateValidation(req: Request, res: Response, next: NextFunction){
    const orm = await MikroORM.init(config);
    const em = orm.em.fork();

    const { date, description } = req.body;
    if(!date || !description){
        next();
    }

    const duplicate = await em.findOne(Transaction, {date, description});
    if(duplicate){
        res.status(400).json({
            success: false, 
            message: 'Transaction with same date and description already exists'
        })
        return;
    }
}