import { Request, Response } from "express";
import transactionService from "../services/transaction.service";

export class TransactionController {
  public async getData(req: Request, res: Response) {
    try {
      const { page, limit , isDeleted} = req.query;
      console.log(isDeleted);
      if(isDeleted !== undefined && isDeleted !== 'true' && isDeleted !== 'false') {
        res.status(400).json({ 
          message: 'Invalid request, isDeleted must be a boolean' 
        });
        return;
      }
      const deleted = isDeleted === 'true' ? true : false;
      const data = await transactionService.getTransactions(
        Number(page) || 1,
        Number(limit) || 10,
        Boolean(deleted) || false
      );
      res.status(200).json({
        success: true,
        message: "Data has been fetched",
        ...data,
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
      const transaction = await transactionService.createTransaction(req.body);
      res.status(201).json({
        success: true,
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
      const id = Number(req.params.id);
      const updatedTransaction = await transactionService.updateTransaction(
        id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: `Transaction ${id} has been updated`,
        transaction: updatedTransaction,
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
      const id = Number(req.params.id);
      const transaction = await transactionService.deleteTransaction(id);
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

  public async softDeleteTransaction(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const transaction = await transactionService.softDeleteTransaction(id);
      res.status(200).json({
        success: true,
        message: "Transaction soft deleted successfully",
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to soft delete transaction",
        error: error.message,
      });
    }
  }

  public async restoreTransaction(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const transaction = await transactionService.restoreTransaction(id);
      res.status(200).json({
        success: true,
        message: "Transaction restored successfully",
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to restore transaction",
        error: error.message,
      });
    }
  }
}
