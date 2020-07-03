import { Context } from 'probot'
import {getOwner, getTeam, includesSkipKeywords} from './util'
import { Queue } from './queue'
import { Assigner } from './assigner'
import {AppStorage, DataBasePostgreSQL, DataBaseMock, QueueDB} from './dataBase'
import { Pool } from 'generic-pool'
import {Client} from "ts-postgres";

interface AppConfig {
  scope?: string
  teams?: Team[]
  skipKeywords?: string[]
}

export class Handler {

  private _dbMock: AppStorage

  public async handleIssue(context: Context,pool: Pool<Client>): Promise<void> {
    console.log("issue url: " + context.payload.issue.url);
    this.doAssign(context, false, pool)
  }

  public async handlePullRequest(context: Context, pool: Pool<Client>): Promise<void> {
    console.log("pull request url: " + context.payload.pull_request.url);
    this.doAssign(context, true, pool)
  }

  public async doAssign(context: Context, isPR: Boolean, pool: Pool<Client>): Promise<void> {
    const config: AppConfig | null = await context.config<AppConfig | null>('auto_assign.yml')
    var db: AppStorage = this.getAppStorage(config.scope, pool)
    if (!config) {
      throw new Error('the configuration file failed to load')
    }

    const payload = context.payload
    const labels = isPR ? payload.pull_request.labels : payload.issue.labels
    if (config.skipKeywords && includesSkipKeywords(labels, config.skipKeywords)) {
      context.log('skips adding reviewers')
      return
    }
    let repo: string = this.getUUID(context.payload.repository.html_url)
    let owner = getOwner(context, isPR)
    let ownerConfigTeam = getTeam(owner, config.teams)
    if (ownerConfigTeam){
      let dbTeamQueue: QueueDB | null = await db.getTeamQueue(repo, ownerConfigTeam.name)
      console.log(dbTeamQueue? dbTeamQueue : "New database register for " + owner +
          "'s team: " + ownerConfigTeam.name)
      var teamAssigneesQueue: Queue<string> = this.syncTeamConfig(ownerConfigTeam.assignees, dbTeamQueue? dbTeamQueue.data : null);
      let listAssignees = isPR ? payload.pull_request.assignees : payload.issue.assignees
      let oneAssignee = isPR ? payload.pull_request.assignee : payload.issue.assignee
      if (listAssignees.length > 0) {
        // move assignees to the bottom of the queue and dont assign new
        listAssignees.forEach((assignee: { login: string; }) => {
          console.log("Move to back to the queue due a manual assignation: " + assignee.login)
          teamAssigneesQueue.toBack(assignee.login);
        });
      } else if (oneAssignee && oneAssignee.length > 0) {
        console.log("Move to back to the queue due a manual assignation: " + oneAssignee.login)
        teamAssigneesQueue.toBack(oneAssignee.login)
      } else {
        // check and assign new
        const assigner = new Assigner(context)
        assigner.assign(teamAssigneesQueue, isPR)
        teamAssigneesQueue.proceed()
      }
      // manage persistence for each repo separately
      await db.setTeamQueue(new QueueDB(repo,ownerConfigTeam.name,teamAssigneesQueue.toArray()))
    } else{
      console.log("There are no configuration to process this " + (isPR? "PR":"issue") + " created by: " + owner)
    }
  }

  private getUUID(repo: string) {
    return encodeURIComponent(repo)
  }

  // synchronize configTeam with dbTeamQueue witch has the current order
  private syncTeamConfig(configTeamAssignees: string[], dbTeamQueue: string[]): Queue<string> {
    // in the first run we only have configTeamAssignees
    let queue = new Queue<string>(dbTeamQueue ? dbTeamQueue : configTeamAssignees)
    if (!configTeamAssignees || !dbTeamQueue) {
      return queue;
    }
    // when we have both, we will use dbTeamQueue order and the list of reviewers from config
    const dbSet = new Set(dbTeamQueue)
    const configSet = new Set(configTeamAssignees)
    configTeamAssignees.forEach(member => {
      if (!dbSet.has(member)) {
        console.log("Team member " + member + " added! ")
        queue.append(member)
      }
    })

    dbSet.forEach(member => {
      if (!configSet.has(member)) {
        console.log("Team member " + member + " removed! ")
        queue.remove(member)
      }
    })
    return queue;
  }

  private getAppStorage(scope: string, pool: Pool<Client>): AppStorage{
    if (scope === 'dev') {
      if (!this._dbMock){
        this._dbMock = new DataBaseMock()
      }
      return this._dbMock
    } else{
      return new DataBasePostgreSQL(pool)
    }
  }
}

export class Team {
  name: string
  members: string[]
  assignees: string[]
}