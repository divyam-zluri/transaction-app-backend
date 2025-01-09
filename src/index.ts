import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { Transaction } from './entities/transactions';
import { Request, Response, NextFunction } from 'express';

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

async function sample_transaction(description: string, originalAmount : number, currency : string){
    try{
        const orm = await MikroORM.init(config);
        const transaction = new Transaction();
        transaction.date = new Date();
        transaction.description = description;
        transaction.originalAmount = originalAmount;
        transaction.currency = currency;
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

        const data = await em.find(Transaction, {});
        await em.flush();

        return data;
    }catch(err){
        console.log(err);
    }
}
app.get('/', async (req, res)=>{
    const data = await getData();
    res.status(200).json({
        data,
    });
});

async function add_transaction(req: Request, res: Response, next : NextFunction){
    try{
        console.log(req.body);
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
    res.status(201).json({
        message: "Received the body"
    });
})

app.listen(port, async ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});



