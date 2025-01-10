import { Request, Response, NextFunction } from "express";
import { Transaction } from "../entities/transactions";
import { MikroORM } from "@mikro-orm/core";
import config from "../../mikro-orm.config";

export async function dataValidation(req: Request, res: Response, next: NextFunction){
    const orm = await MikroORM.init(config);
    const em = orm.em.fork();

    const { date, description, originalAmount, currency } = req.body;
    if (!date || !description || !originalAmount || !currency) {
        res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
        });
        return;
    }

    const ddate = await em.findOne(Transaction, {date});
    const desc = await em.findOne(Transaction, {description});

    if(ddate && desc){
        res.status(400).json({
            success: false, 
            message: 'Transaction already exists'
        })
        return;
    }
    next();
}