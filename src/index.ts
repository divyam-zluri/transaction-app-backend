import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 3001;

app.get('/', (req, res)=>{
    res.status(200).send('Hello World');
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
});



