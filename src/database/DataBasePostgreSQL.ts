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
        try {
            return this.pool.use(async (client) => {
                const resultIterator = await client.query("SELECT data FROM queue WHERE repo = $1 AND team = $2", [
                    repo,
                    configTeamName,
                ]);

                if (resultIterator.rows.length > 0) {
                    return new QueueDB(repo, configTeamName, (resultIterator.rows[0][0] as string).split(","));
                } else {
                    return null;
                }
            });
        } catch (e) {
            throw new Error(`Couldn't get Team queue for ${configTeamName} in repo ${repo} :: Reason: ${e}`);
        }
    }

    public async setTeamQueue(queueDB: QueueDB) {
        // validate if the register already exists in DB
        const preExists = await this.getTeamQueue(queueDB.repo, queueDB.teamName);

        let query = "INSERT INTO queue (repo, team, data) VALUES($1, $2, $3)";
        if (preExists) {
            query = "UPDATE queue SET data = $1 WHERE repo = $2 AND team = $3";
        }

        const queryParams = [queueDB.repo, queueDB.teamName, queueDB.data.toString()];

        try {
            // tslint:disable:await-promise
            await this.pool.use((client) => {
                client.query(query, queryParams);
                client.query("COMMIT");
            });
        } catch (e) {
            throw new Error(`Couldn't set Team queue for ${queueDB.teamName} in repo ${queueDB.repo} :: Reason: ${e}`);
        }
    }
}
