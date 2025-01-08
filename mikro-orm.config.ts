import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Transaction } from "./src/entities/transactions";
import dotenv from 'dotenv';

dotenv.config();

const config: Options<PostgreSqlDriver> = {
  driver: PostgreSqlDriver, 
  entities: [Transaction],
  dbName: process.env.DB_NAME,
  host: process.env.DB_HOST, 
  port: 5432, 
  user: process.env.DB_USERNAME, 
  password: process.env.DB_PASSWORD, 
  debug: true, 
  migrations: {
    path: './migrations', 
    pathTs: './src/migrations', 
    glob: '!(*.d).{js,ts}',
  },
  driverOptions: {
    connection: {
      ssl: true, 
    },
  },
};
export default config;

