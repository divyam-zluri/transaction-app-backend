import express from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { ParserController } from "../controllers/parser.controller";
import { idValidation } from "../middlewares/idValidation.middleware";
import { dataValidation } from "../middlewares/dataValidation.middleware";
import { updateValidation } from "../middlewares/updateValidation.middleware";
import { uploadCSV } from "../services/fileUpload.service";
import { conversionValidation } from "../middlewares/conversionValidation.middleware";
import multer from "multer";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const transactionController = new TransactionController();
const parserController = new ParserController();

router.get("/",transactionController.getData);
router.post("/add-transaction", dataValidation, conversionValidation, transactionController.addTransaction);
router.put("/update-transaction/:id", idValidation, updateValidation, transactionController.updateTransaction);
router.delete("/delete-transaction/:id", idValidation, transactionController.deleteTransaction);
router.post('/uplaodCSV', uploadCSV, parserController.parser.bind(parserController));
router.put('/soft-delete/:id', idValidation, transactionController.softDeleteTransaction);
router.put('/restore/:id', idValidation, transactionController.restoreTransaction);

export default router;
