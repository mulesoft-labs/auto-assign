import { Pool } from "generic-pool";
import { Context } from "probot";
import { Client } from "ts-postgres";

import { Assigner } from "./assign/assigner";
import { Team } from "./assign/Team";
import { DataBaseMock } from "./database/DataBaseMock";
import { DataBasePostgreSQL } from "./database/DataBasePostgreSQL";
import { IAppStorage } from "./database/IAppStorage";
import { QueueDB } from "./database/QueueDB";
import { Queue } from "./queue/queue";
import { getOwner, getTeam, includesSkipKeywords } from "./util";

interface IAppConfig {
    scope?: string;
    teams?: Team[];
    skipKeywords?: string[];
}

export class Handler {
    private _dbMock?: IAppStorage;

    public async handleIssue(context: Context, pool: Pool<Client>): Promise<void> {
        context.log(`Issue url: ${context.payload.issue.url}`);
        await this.doAssign(context, false, pool);
    }

    public async handlePullRequest(context: Context, pool: Pool<Client>): Promise<void> {
        context.log(`Pull request url: ${context.payload.pull_request.url}`);
        await this.doAssign(context, true, pool);
    }

    public async doAssign(context: Context, isPR: boolean, pool: Pool<Client>): Promise<void> {
        context.log("Getting auto_assign.yml ...");
        const config: IAppConfig | null = await context.config<IAppConfig | null>("auto_assign.yml");
        if (!config) {
            throw new Error("the configuration file failed to load");
        }
        const db: IAppStorage = this.getAppStorage(config.scope, pool);
        context.log("Obtained auto_assign.yml");
        const payload = context.payload;
        const labels = isPR ? payload.pull_request.labels : payload.issue.labels;
        if (config.skipKeywords && includesSkipKeywords(labels, config.skipKeywords)) {
            context.log("skips adding reviewers");
            return;
        }

        const repo: string = this.getUUID(context.payload.repository.html_url);
        context.log(`repo: ${repo}`);
        const owner = getOwner(context, isPR);
        context.log(`owner: ${owner}`);

        const ownerConfigTeam = getTeam(owner, config.teams);
        if (!ownerConfigTeam) {
            context.log(`There are no configuration to process this ${isPR ? "PR" : "issue"} created by: ${owner}`);
            return;
        }
        context.log(`ownerTeam: ${ownerConfigTeam.name}`);
        const dbTeamQueue: QueueDB | null = await db.getTeamQueue(repo, ownerConfigTeam.name);
        if (dbTeamQueue) {
            context.log(`Repo: ${dbTeamQueue.repo} :: Team Name: ${dbTeamQueue.teamName} :: Data ${dbTeamQueue.data}`);
        } else {
            context.log(`New database register for ${owner}'s team: ${ownerConfigTeam.name}`);
        }
        const teamAssigneesQueue: Queue<string> = this.syncTeamConfig(
            context,
            ownerConfigTeam.assignees,
            dbTeamQueue ? dbTeamQueue.data : null
        );
        const listAssignees = isPR ? payload.pull_request.assignees : payload.issue.assignees;
        const oneAssignee = isPR ? payload.pull_request.assignee : payload.issue.assignee;
        if (listAssignees.length > 0) {
            // move assignees to the bottom of the queue and dont assign new
            listAssignees.forEach((assignee: { login: string }) => {
                context.log(`Move to back to the queue due to a manual assignation: ${assignee.login}`);
                teamAssigneesQueue.toBack(assignee.login);
            });
        } else if (oneAssignee && oneAssignee.length > 0) {
            context.log(`Move to back to the queue due to a manual assignation: ${oneAssignee.login}`);
            teamAssigneesQueue.toBack(oneAssignee.login);
        } else {
            // check and assign new
            const assigner = new Assigner(context);
            await assigner.assign(teamAssigneesQueue, isPR);
            teamAssigneesQueue.proceed();
        }
        // manage persistence for each repo separately
        db.setTeamQueue(new QueueDB(repo, ownerConfigTeam.name, teamAssigneesQueue.toArray()));
    }

    private getUUID(repo: string) {
        return encodeURIComponent(repo);
    }

    // synchronize configTeam with dbTeamQueue witch has the current order
    private syncTeamConfig(
        context: Context,
        configTeamAssignees: string[],
        dbTeamQueue: string[] | null
    ): Queue<string> {
        // in the first run we only have configTeamAssignees
        const queue = new Queue<string>(dbTeamQueue ? dbTeamQueue : configTeamAssignees);
        if (!configTeamAssignees || !dbTeamQueue) {
            return queue;
        }
        // when we have both, we will use dbTeamQueue order and the list of reviewers from config
        const dbSet = new Set(dbTeamQueue);
        const configSet = new Set(configTeamAssignees);
        configTeamAssignees.forEach((member) => {
            if (!dbSet.has(member)) {
                context.log(`Team member ${member} added!`);
                queue.append(member);
            }
        });

        dbSet.forEach((member) => {
            if (!configSet.has(member)) {
                context.log(`Team member ${member} removed!`);
                queue.remove(member);
            }
        });
        return queue;
    }

    private getAppStorage(scope: string = "", pool: Pool<Client>): IAppStorage {
        if (scope === "dev") {
            if (!this._dbMock) {
                this._dbMock = new DataBaseMock();
            }
            return this._dbMock;
        } else {
            return new DataBasePostgreSQL(pool);
        }
    }
}
