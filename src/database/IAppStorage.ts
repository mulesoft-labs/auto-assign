import { QueueDB } from "./QueueDB";

export interface IAppStorage {
    getTeamQueue(repo: string, configTeamName: string): Promise<QueueDB | null>;

    setTeamQueue(queueDB: QueueDB): void;
}
