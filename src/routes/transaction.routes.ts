import express from 'express';
import { TransactionController } from '../controllers/transaction.controller';
const router = express.Router();

const transactionController = new TransactionController();

router.get('/', transactionController.getData);
router.post('/add-transaction', transactionController.addTransaction);
router.put('/update-transaction/:id', transactionController.updateTransaction);
// router.put('/delete-transaction/:id', deleteTransaction);

export default router;





