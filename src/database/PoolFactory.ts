import { Pool } from "pg";

export class PoolFactory {
    public createNewPool(): Pool {
        return new Pool({
            // pg.Client options
            connectionString: process.env.DATABASE_URL + "?sslmode=require", // e.g. postgres://user:password@host:5432/database
            ssl: {
                rejectUnauthorized: false,
            },

            // pg.Pool options
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            max: 10,
        });
    }
}
