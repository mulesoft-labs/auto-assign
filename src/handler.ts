import { Context } from 'probot'
import { includesSkipKeywords } from './util'
import { Team } from './team'

interface AppConfig {
  teamMembers: string[],
  skipKeywords?: string[]
}

export class Handler {
  team: Team<string> = new Team<string>();

  private validateMembers(members: string[]) {
    if (members && members.length > 0) {
      members.forEach(member => {
        this.team.append(member)
      });
    }
  }

  public async handlePullRequest(context: Context): Promise<void> {
    let config: AppConfig | null;

    config = await context.config<AppConfig | null>('auto_assign.yml')

    if (!config) {
      throw new Error('the configuration file failed to load')
    }

    this.validateMembers(config.teamMembers)

    const payload = context.payload
    const owner = payload.pull_request.user.login
    const labels = payload.pull_request.labels

    if (config.skipKeywords && includesSkipKeywords(labels, config.skipKeywords)) {
      context.log('skips adding reviewers')
      return
    }

    let reviewer = this.team.next(owner)
    if (!reviewer) {
      context.log('there is no candidate to review')
      return
    }

    let result: any
    try {
      const params = context.issue({
        reviewers: [reviewer]
      })
      result = await context.github.pullRequests.createReviewRequest(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
    this.team.proceed()
  }
}