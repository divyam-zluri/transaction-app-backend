import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transaction.routes';

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;

app.use('/api',transactionRoutes);

app.listen(port, async ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});



