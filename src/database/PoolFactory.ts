import { createPool, Factory } from "generic-pool";
import { Client } from "ts-postgres";

export class PoolFactory {
    public createNewPool() {
        const factory: Factory<Client> = {
            create: async () => {
                const client = new Client({
                    host: process.env.DB_HOST,
                    port: 5432,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                });

                return client.connect().then(() => {
                    // tslint:disable:no-console
                    client.on("error", console.log);
                    return client;
                });
            },

            destroy: async (client: Client) => {
                return client.end().then();
            },

            validate: (client: Client) => {
                return Promise.resolve(!client.closed);
            },
        };

        const opts = {
            max: 10, // maximum size of the pool
            min: 2, // minimum size of the pool
            testOnBorrow: true, // should the pool validate resources before giving them to clients
        };

        return createPool(factory, opts);
    }
}
