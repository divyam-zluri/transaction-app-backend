import express, { NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { Transaction } from './entities/transactions';

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 3001;


async function testDatabaseConnection() {
    try {
      console.log('Attempting to connect to the database...');
      const orm = await MikroORM.init(config);
      console.log('Successfully connected to the database!');
  
      // Fetch some basic info to verify connection
      const result = await orm.em.getConnection().execute('SELECT 1 + 1 AS result');
      console.log('Database test query result:', result);
  
      await orm.close();
      console.log('Connection closed successfully!');
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
}  

async function sample_transaction(){
    try{
        const orm = await MikroORM.init(config);
        const transaction = new Transaction();
        transaction.id = 1;
        transaction.date = new Date();
        transaction.description = 'This is a sample value';
        transaction.originalAmount = 10;
        transaction.currency = 'USD';
        transaction.amountInINR = 800;

        const em = orm.em.fork();
        await em.persist(transaction).flush();
        console.log('user id is:', transaction.id);
        console.log("The connection has been closed!");
        orm.close();
    }catch(err){
        console.log(err);
    }
}

async function finder() : Promise<boolean>{
    try{
        const orm = await MikroORM.init(config);

        const em = await orm.em.fork();

        const exists = await em.findOne(Transaction, 2);
        console.log(exists);
        console.log("connection closed");
        orm.close();

        return exists ? true : false;
    }catch(err){
        console.log(err);
        return false;
    }
}

async function getData(){
    try{
        const orm = await  MikroORM.init(config);
        const em = await orm.em.fork();

        const data = await em.find(Transaction,{});
        return data;
    }catch(err){
        console.log(err);
    }
}
app.get('/', async (req, res)=>{
    // await add_transaction();
    // const checked = await finder();
    // if(checked){
    //     res.send("FOUND!");
    //     return;
    // }else{
    //     res.send("NOT FOUND");
    //     return;
    // }

    const data = await getData();
    res.status(200).json({
        data,
    });
    // res.status(200).send('Hello World');
});

async function add_transaction(req: Request, res: Response, next : NextFunction){
    try{
        const desc = req.body.description;
        const original_Amount = req.body.originalAmount;
        const currency = req.body.currency;
        const indianCurrency = original_Amount*80;

        const orm = await MikroORM.init(config);
        const transaction = new Transaction();
        transaction.date = new Date();
        transaction.description = desc;
        transaction.originalAmount = original_Amount;
        transaction.currency = currency;
        transaction.amountInINR = indianCurrency;

        const em = orm.em.fork();
        await em.persist(transaction).flush();

        console.log('user id is:', transaction.id);
        console.log("The connection has been closed!");
        orm.close();
        next();
    }catch(err){
        console.log(err);
    }
}
app.post('/add-transaction', add_transaction,(req, res)=>{



})

app.listen(port, async ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});



