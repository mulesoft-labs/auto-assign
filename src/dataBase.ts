import {Client} from 'ts-postgres'
import { Pool } from 'generic-pool'

export interface AppStorage {
    getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null>
    setTeamQueue(queueDB: QueueDB): void
}
export class DataBasePostgreSQL implements AppStorage{
    private pool: Pool<Client>

    constructor(pool: Pool<Client>) {
        this.pool = pool
    }

    async getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null> {
        let pool = this.pool
        const resourcePromise = pool.acquire();
        return resourcePromise.then(async function(client){
            let resultIterator = await client.query("SELECT data FROM queue WHERE repo = $1 AND team = $2"
                ,[repo, configTeamName])
            // return object back to pool
            pool.release(client);
            if (resultIterator.rows){
                return new QueueDB(repo,configTeamName,(resultIterator.rows[0][0] as string).split(","))
            } else {
                return null
            }
        });
    }

    async setTeamQueue(queueDB: QueueDB) {
        let pool = this.pool
        const resourcePromise = pool.acquire();
        // validate if the register already exist in db
        let preExist = await this.getTeamQueue(queueDB.repo,queueDB.teamName)
        resourcePromise.then(function(client){
            if (preExist){
                client.query("UPDATE queue SET data = $1 WHERE repo = $2 AND team = $3"
                    ,[queueDB.data.toString(),queueDB.repo,queueDB.teamName])
            } else {
                client.query("INSERT INTO queue (repo,team,data) VALUES($1,$2,$3)"
                    , [queueDB.repo, queueDB.teamName, queueDB.data.toString()])
            }
            client.query('COMMIT')
            pool.release(client)
        });
    }
}

export class DataBaseMock implements AppStorage{
    private _dbQueues: QueueDB[]

    getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null> {
        let target: QueueDB
        if (this._dbQueues != null){
            for(let queue of this._dbQueues){
                if (queue.repo === repo && configTeamName === queue.teamName){
                    target = queue
                    break
                }
            }
        }
        return new Promise<QueueDB|null>(function(){return target? target: null})
    }

    setTeamQueue(queueDB: QueueDB) {
        let found: boolean = false
        if (this._dbQueues != null){
            for (var i = 0, len = this._dbQueues.length; i < len; i++) {
                if (this._dbQueues[i].repo === queueDB.repo && this._dbQueues[i].teamName === queueDB.teamName){
                    this._dbQueues[i] = queueDB
                    found = true
                    break
                }
            }
            if (!found){
                this._dbQueues.push(queueDB)
            }
        } else{
            this._dbQueues = [queueDB]
        }
        return queueDB
    }
}

export class QueueDB{
    repo: string
    teamName: string
    data: string[]

    constructor(repo: string, teamName: string, data: string[]) {
        this.repo = repo
        this.teamName = teamName
        this.data = data
    }
}