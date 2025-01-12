import { Request, Response, NextFunction } from 'express';
import { currencyConversionRates } from '../globals/currencyConversionRates';

export function conversionValidation(req: Request, res: Response, next: NextFunction){
    if(!currencyConversionRates.get(req.body.currency)){
        res.status(400).json({
            succes: false, 
            message: 'Invalid Currency Code'
        })
        return;
    }
    next();
}