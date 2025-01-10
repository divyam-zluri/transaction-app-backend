import express from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { ParserController } from "../controllers/parser.controller";
import { idValidation } from "../middlewares/idValidation.middleware";
import { dataValidation } from "../middlewares/dataValidation.middleware";
import multer from 'multer';
const router = express.Router();

const upload = multer({storage: multer.memoryStorage()});
const transactionController = new TransactionController();
const parserController = new ParserController();

router.get("/",transactionController.getData);
router.post("/add-transaction", dataValidation, transactionController.addTransaction);
router.put("/update-transaction/:id", idValidation, transactionController.updateTransaction);
router.delete(
  "/delete-transaction/:id",
  idValidation,
  transactionController.deleteTransaction
);
router.post('/uplaodCSV',upload.single('file'), parserController.parser.bind(parserController));

export default router;
