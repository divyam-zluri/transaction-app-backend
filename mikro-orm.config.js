"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const transactions_1 = require("./src/entities/transactions");
const config = {
    driver: postgresql_1.PostgreSqlDriver,
    entities: [transactions_1.Transaction],
    dbName: "transactions",
    host: "ep-bold-scene-a5yteoss.us-east-2.aws.neon.tech",
    port: 5432,
    user: "transactions_owner",
    password: "kDVh6FMj2etH",
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
exports.default = config;
