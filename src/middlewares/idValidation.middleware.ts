import { Request, Response, NextFunction } from "express";

export async function idValidation(req: Request, res: Response, next: NextFunction){
    const id : number = Number(req.params.id);
    if(isNaN(id)){
        res.status(400).json({message: "Invalid ID"});
        return;
    }
    next();
}