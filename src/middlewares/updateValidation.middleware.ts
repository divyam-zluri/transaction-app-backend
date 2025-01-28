import { Request, Response, NextFunction } from "express";
import { Transaction } from "../entities/transactions";
import { parse, isValid } from "date-fns";
import {getEntityManager} from "../utils/orm";
import { get } from "http";

export async function updateValidation(req: Request, res: Response, next: NextFunction){
    const em = await getEntityManager();

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
    if(description==""){
        res.status(400).json({
            success: false,
            message: 'Description cannot be empty'
        })
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
        const checkDate = parse(date, "yyyy-MM-dd", new Date());
        if (!isValid(checkDate)) {
          res.status(400).json({
            success: false,
            message: "Invalid date value",
          });
          return;
        }
        if(checkDate < new Date("1990-01-01")) {
            res.status(400).json({
              success:false,
              message:"Date cannot be before 1990-01-01"
            });
        }
        if(checkDate > new Date()) {
            res.status(400).json({
              success:false,
              message:"Date cannot be in the future"
            });
            return;
        }
    }
    
    if(originalAmount !== undefined && originalAmount <= 0){
        res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
        })
        return;
    }
    if(date && description){
        const temp = description.replace(/\s+/g, ' ').trim();
        const duplicate = await em.findOne(Transaction, {date, description : temp});
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