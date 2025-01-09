import express from "express";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { MikroORM } from "@mikro-orm/core";
import config from "../../mikro-orm.config";
import { Transaction } from "../entities/transactions";

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

export class TransactionController {
  public async getData(req: Request, res: Response) {
    try {
      const orm = await MikroORM.init(config);
      const em = orm.em.fork();

      const data = await em.find(Transaction, {});

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions.",
        error: error.message,
      });
    }
  }

  public async addTransaction(req: Request, res: Response) {
    try {
      const { date, description, originalAmount, currency } = req.body;
      const orm = await MikroORM.init(config);

      const transaction = new Transaction();
      transaction.date = date;
      transaction.description = description;
      transaction.originalAmount = originalAmount;
      transaction.currency = currency;
      transaction.amountInINR = originalAmount*80;

      const em = orm.em.fork();
      await em.persist(transaction).flush();
      orm.close();

      res.status(201).json({
        transaction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Failed to add transactions.",
        error: error.message,
      });
    }
  }
}
