import { Request, Response, NextFunction } from "express";
import { check } from "../services/pageLimit.service";

export async function pageLimit(req: Request, res: Response, next: NextFunction){
  if(!check(req.query.page as string, req.query.limit as string)){
    res.status(400).json({
      message: "Invalid page or limit",
    });
    return;
  }
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);
  if(page < 1 || limit < 1){
    res.status(400).json({
      message: "Invalid page or limit",
    });
    return;
  }
  if(limit > 1000){
    res.status(400).json({
      message: "Limit should be less than 1000",
    });
    return;
  }
  next();
}