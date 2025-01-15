import { Request, Response, NextFunction } from "express";
import { Transaction } from "../entities/transactions";
import { MikroORM } from "@mikro-orm/core";
import config from "../../mikro-orm.config";

export async function updateValidation(req: Request, res: Response, next: NextFunction){
    const orm = await MikroORM.init(config);
    const em = orm.em.fork();

    const { date, description, originalAmount, currency } = req.body;
    if ((date && typeof date !== "string") || 
        (description && typeof description !== "string") || 
        (originalAmount && typeof originalAmount !== "number") || 
        (currency && typeof currency !== "string")) {
        res.status(400).json({
        success: false,
        message: "Invalid data type",
        });
        return;
    }
    if(date){
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            res.status(400).json({
            success: false,
            message: "Invalid date format. Expected format: YYYY-MM-DD",
            });
            return;
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            res.status(400).json({
            success: false,
            message: "Invalid date value",
            });
            return;
        }
    }
    if(originalAmount && originalAmount < 0){
        res.status(400).json({
            success: false,
            message: 'Amount cannot be negative'
        })
        return;
    }
    if(date && description){
        const duplicate = await em.findOne(Transaction, {date, description});
        if(duplicate && (duplicate.id !== Number(req.params.id))){
            res.status(400).json({
                success: false, 
                message: 'Transaction with same date and description already exists'
            })
            return;
        }
    }
    next();
}