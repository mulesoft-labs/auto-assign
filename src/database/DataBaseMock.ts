import { IAppStorage } from "./IAppStorage";
import { QueueDB } from "./QueueDB";

export class DataBaseMock implements IAppStorage {
    private _repositoriesState: QueueDB[] = [];

    public getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null> {
        let target: QueueDB;

        for (const queue of this._repositoriesState) {
            if (queue.repo === repo && configTeamName === queue.teamName) {
                target = queue;
                break;
            }
        }

        return new Promise<QueueDB | null>((resolve) => {
            resolve(target ? target : null);
        });
    }

    public setTeamQueue(queueDB: QueueDB) {
        let found: boolean = false;

        for (let i = 0; i < this._repositoriesState.length; i++) {
            if (
                this._repositoriesState[i].repo === queueDB.repo &&
                this._repositoriesState[i].teamName === queueDB.teamName
            ) {
                this._repositoriesState[i] = queueDB;
                found = true;
                break;
            }
        }

        if (!found) {
            this._repositoriesState.push(queueDB);
        }

        return queueDB;
    }
}
