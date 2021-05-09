export class QueueDB {
    public repo: string;
    public teamName: string;
    public data: string[];

    constructor(repo: string, teamName: string, data: string[]) {
        this.repo = repo;
        this.teamName = teamName;
        this.data = data;
    }
}
