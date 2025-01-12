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

      const transaction = await em.find(
        Transaction,
        {},
        { orderBy: { date: "asc" } }
      );

      res.status(200).json({
        success: true,
        message: "Data has been fetched",
        transaction,
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
      transaction.amountInINR = originalAmount * 80;

      const em = orm.em.fork();
      await em.persist(transaction).flush();
      orm.close();

      res.status(201).json({
        message: "New Transaction added",
        transaction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: "Failed to add transaction.",
        error: error.message,
      });
    }
  }

  public async updateTransaction(req: Request, res: Response) {
    try {
      const id: number = Number(req.params.id);
      const orm = await MikroORM.init(config);
      const em = orm.em.fork();

      const transaction = await em.findOne(Transaction, id);

      if (req.body.description !== undefined)
        transaction!.description = req.body.description;
      if (req.body.date !== undefined) transaction!.date = req.body.date;
      if (req.body.currency !== undefined)
        transaction!.currency = req.body.currency;
      if (req.body.originalAmount !== undefined) {
        transaction!.originalAmount = req.body.originalAmount;
        transaction!.amountInINR = transaction!.originalAmount * 80;
      }

      em.flush();

      res.status(201).json({
        message: `Transaction ${id} has been updated`,
        transaction,
      });
    } catch (error: any) {
      res.status(409).json({
        success: false,
        message: "Failed to update transaction.",
        error: error.message,
      });
    }
  }

  public async deleteTransaction(req: Request, res: Response) {
    try {
      const orm = await MikroORM.init(config);
      const em = orm.em.fork();
      const id: number = Number(req.params.id);

      const transaction = await em.findOne(Transaction, id);
      if (!transaction) {
        res.status(401).json({
          message: "The ID doesn't exist",
        });
        return;
      }
      await em.remove(transaction!).flush();

      res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
        error: error.message,
      });
    }
  }
}
