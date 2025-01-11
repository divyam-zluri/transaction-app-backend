import {Request, Response, NextFunction} from 'express';

export async function fileUpload(req: Request, res: Response, next: NextFunction){
    if(req.fileValidationError){
        res.status(400).json({
            success: false,
            message: req.fileValidationError
        })
        return;
    }
    next();
}