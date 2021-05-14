import { Pool } from "pg";

import { IAppStorage } from "./IAppStorage";
import { QueueDB } from "./QueueDB";

export class DataBasePostgreSQL implements IAppStorage {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null> {
        return (async () => {
            const client = await this.pool.connect();
            try {
                const resultIterator = await client.query("SELECT data FROM queue WHERE repo = $1 AND team = $2", [
                    repo,
                    configTeamName,
                ]);

                if (resultIterator.rows.length > 0) {
                    return new QueueDB(repo, configTeamName, (resultIterator.rows[0].data as string).split(","));
                } else {
                    return null;
                }
            } finally {
                // Make sure to release the client before any error handling,
                // just in case the error handling itself throws an error.
                client.release();
            }
        })().catch((err) => {
            // console.log(err.stack)
            throw new Error(`Couldn't get Team queue for ${configTeamName} in repo ${repo} :: Reason: ${err}`);
        });
    }

    public async setTeamQueue(queueDB: QueueDB) {
        // validate if the register already exists in DB
        const preExists = await this.getTeamQueue(queueDB.repo, queueDB.teamName);

        let query = "INSERT INTO queue (repo, team, data) VALUES($1, $2, $3)";
        if (preExists) {
            query = "UPDATE queue SET data = $1 WHERE repo = $2 AND team = $3";
        }

        const queryParams = [queueDB.repo, queueDB.teamName, queueDB.data.toString()];

        (async () => {
            const client = await this.pool.connect();
            try {
                await client.query(query, queryParams);
                await client.query("COMMIT");
            } finally {
                // Make sure to release the client before any error handling,
                // just in case the error handling itself throws an error.
                client.release();
            }
        })().catch((err) => {
            // console.log(err.stack)
            throw new Error(
                `Couldn't set Team queue for ${queueDB.teamName} in repo ${queueDB.repo} :: Reason: ${err}`
            );
        });
    }
}
