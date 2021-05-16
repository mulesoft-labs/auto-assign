import { Pool } from "pg";

export class PoolFactory {
    public createNewPool(): Pool {
        return new Pool({
            // pg.Client options
            connectionString: process.env.DATABASE_URL, // e.g. postgres://user:password@host:5432/database

            // pg.Pool options
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            max: 10,
        });
    }
}
