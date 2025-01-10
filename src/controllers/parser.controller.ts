import {Request, Response} from 'express';
import Papa from "papaparse";
import multer from 'multer';

interface dataTypes{
    Date: Date,
    Description: string,
    Amount: number,
    Currency: string
}
  
export class ParserController{

    public async parser(req: Request, res: Response){
        try{
            const file = req.file;

            if(!file){
                res.status(401).json({
                    success: false,
                    message: 'No file uploaded'
                });
                return;
            }
            
            const fileContent = file.buffer.toString('utf-8');

            const parsed = Papa.parse<dataTypes>(fileContent, {
                delimiter: ',',
                dynamicTyping: true,
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
            });
            
            // console.log(parsed);
            console.log(parsed.data[0].Date);
            res.status(201).json({
                success: true,
                message: "Data Parsed Successfully",
                parsed
            });
        }catch(error: any){
            res.status(500).json({
                success: false,
                message: "There is a problem with file",
                error: error.message,
            });
        }
    }
}