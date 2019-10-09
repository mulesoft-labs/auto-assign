import { Context } from 'probot'
import { includesSkipKeywords } from './util'
import { Team } from './team'
import { AppConfig } from './interfaces'
import { Assigner } from './assigner'

export class Handler {

  teams = new Map<string, Team<string>>()

  public async handlePullRequest(context: Context): Promise<void> {
    let config: AppConfig | null;

    config = await context.config<AppConfig | null>('auto_assign.yml')

    if (!config) {
      throw new Error('the configuration file failed to load')
    }
    let repo = context.payload.repository.html_url
    var team = new Team<string>();
    if (this.teams.has(repo)) {
      team = this.teams.get(repo)
      if (team.length() != config.teamMembers.length) {
        team = this.fillTeam(config, repo)
      }
    } else {
      team = this.fillTeam(config, repo)
    }

    const payload = context.payload
    const labels = payload.pull_request.labels

    if (config.skipKeywords && includesSkipKeywords(labels, config.skipKeywords)) {
      context.log('skips adding reviewers')
      return
    }

    const assigner = new Assigner(context)
    assigner.assignPR(team)
    team.proceed()
  }

  private fillTeam(config: AppConfig, repo: string): Team<string> {
    let team = new Team<string>()
    config.teamMembers.forEach(member => {
      team.append(member);
    });
    this.teams.set(repo, team)
    return team
  }
}