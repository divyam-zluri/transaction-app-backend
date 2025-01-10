import express from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { ParserController } from "../controllers/parser.controller";
import multer from 'multer';
const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});
const transactionController = new TransactionController();
const parserController = new ParserController();

router.get("/", transactionController.getData);
router.post("/add-transaction", transactionController.addTransaction);
router.put("/update-transaction/:id", transactionController.updateTransaction);
router.delete(
  "/delete-transaction/:id",
  transactionController.deleteTransaction
);
router.post('/uplaodCSV',upload.single('file'), parserController.parser.bind(parserController));

export default router;
