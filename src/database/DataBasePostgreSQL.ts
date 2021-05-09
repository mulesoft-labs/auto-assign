import { Pool } from "generic-pool";
import { Client } from "ts-postgres";

import { IAppStorage } from "./IAppStorage";
import { QueueDB } from "./QueueDB";

export class DataBasePostgreSQL implements IAppStorage {
    private readonly pool: Pool<Client>;

    constructor(pool: Pool<Client>) {
        this.pool = pool;
    }

    public async getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null> {
        const pool = this.pool;
        const resourcePromise = pool.acquire();
        return resourcePromise.then(async (client) => {
            const resultIterator = await client.query("SELECT data FROM queue WHERE repo = $1 AND team = $2", [
                repo,
                configTeamName,
            ]);
            // return object back to pool
            pool.release(client);
            if (resultIterator.rows.length > 0) {
                return new QueueDB(repo, configTeamName, (resultIterator.rows[0][0] as string).split(","));
            } else {
                return null;
            }
        });
    }

    public async setTeamQueue(queueDB: QueueDB) {
        const pool = this.pool;
        const resourcePromise = pool.acquire();
        // validate if the register already exist in db
        const preExist = await this.getTeamQueue(queueDB.repo, queueDB.teamName);
        resourcePromise.then((client) => {
            if (preExist) {
                client.query("UPDATE queue SET data = $1 WHERE repo = $2 AND team = $3", [
                    queueDB.data.toString(),
                    queueDB.repo,
                    queueDB.teamName,
                ]);
            } else {
                client.query("INSERT INTO queue (repo,team,data) VALUES($1,$2,$3)", [
                    queueDB.repo,
                    queueDB.teamName,
                    queueDB.data.toString(),
                ]);
            }
            client.query("COMMIT");
            pool.release(client);
        });
    }
}
