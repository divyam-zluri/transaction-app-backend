import express from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { ParserController } from "../controllers/parser.controller";
import { idValidation } from "../middlewares/idValidation.middleware";
import { dataValidation } from "../middlewares/dataValidation.middleware";
import { updateValidation } from "../middlewares/updateValidation.middleware";
import { fileUploadService } from "../services/fileUpload.service";
import { fileUpload } from "../middlewares/fileUpload.middleware";
import { conversionValidation } from "../middlewares/conversionValidation.middleware";

const router = express.Router();
const transactionController = new TransactionController();
const parserController = new ParserController();

router.get("/",transactionController.getData);
router.post("/add-transaction", dataValidation, conversionValidation, transactionController.addTransaction);
router.put("/update-transaction/:id", idValidation, updateValidation, transactionController.updateTransaction);
router.delete("/delete-transaction/:id", idValidation, transactionController.deleteTransaction);
router.post('/uplaodCSV',fileUploadService.uploadCSV().single('file'), fileUpload, parserController.parser.bind(parserController));

export default router;
