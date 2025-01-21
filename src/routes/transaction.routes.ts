import express from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { ParserController } from "../controllers/parser.controller";
import { idValidation } from "../middlewares/idValidation.middleware";
import { dataValidation } from "../middlewares/dataValidation.middleware";
import { updateValidation } from "../middlewares/updateValidation.middleware";
import { uploadCSV } from "../services/fileUpload.service";
import { conversionValidation } from "../middlewares/conversionValidation.middleware";
import { softDelCheck } from "../middlewares/softDelCheck.middleware";
import { downloadTransactions } from "../controllers/download.controller";
import { transactionSummaryReport } from "../controllers/report.controller";
import { pageLimit } from "../middlewares/pageLimit.middleware";
import { deleteSelected } from "../controllers/selected.controller";

const router = express.Router();
const transactionController = new TransactionController();
const parserController = new ParserController();

router.get("/", pageLimit, transactionController.getData);
router.post("/add-transaction", dataValidation, conversionValidation, transactionController.addTransaction);
router.put("/update-transaction/:id", idValidation, softDelCheck, updateValidation, transactionController.updateTransaction);
router.delete("/delete-transaction/:id", idValidation, softDelCheck, transactionController.deleteTransaction);
router.post('/uploadCSV', uploadCSV, parserController.parser.bind(parserController));
router.put('/soft-delete/:id', idValidation, softDelCheck, transactionController.softDeleteTransaction);
router.put('/restore/:id', idValidation, transactionController.restoreTransaction);
router.get('/download', downloadTransactions);
router.get('/report', transactionSummaryReport);
router.delete('/delete-selected', deleteSelected);
export default router;
