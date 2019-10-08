import { Context } from 'probot'
import { includesSkipKeywords } from './util'
import { Team } from './team'

interface AppConfig {
  teamMembers: string[],
  skipKeywords?: string[]
}

const queryAssignables = `
  query assignables{
    repository($name: String!, $owner: String!) {
      assignableUsers {
        nodes {
          user {
            id,
            name
          }
        }
      }
    }
  }
`

const addAssignee = `
  mutation assign($id: ID!, $assigneeIds: [ID!]!) {
    addAssigneesToAssignable(input: {assignableId: $id, assigneeIds: $assigneeIds}) {
      clientMutationId
    }
  }
`

export class Handler {
  team: Team<string> = new Team<string>();

  private validateMembers(members: string[]) {
    if (members && members.length > 0) {
      members.forEach(member => {
        this.team.append(member)
      });
    }
    console.log("Members: " + members)
  }

  public async handlePullRequest(context: Context): Promise<void> {
    let config: AppConfig | null;

    config = await context.config<AppConfig | null>('auto_assign.yml')

    if (!config) {
      throw new Error('the configuration file failed to load')
    }

    this.validateMembers(config.teamMembers)
    try {
      const payload = context.payload
      const owner = payload.pull_request.user.login
      const repoName = payload.repository.name;
      const repoOwner = payload.repository.owner.name;
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
      console.log("candidate to be assigned: " + reviewer)

      let result: any

      let assignablesResponse = context.github.query(queryAssignables, {
        name: repoName,
        owner: repoOwner,
      })
      context.log(assignablesResponse)


      context.github.query(addAssignee, {
        id: context.payload.issue.node_id,
        assigneeIds: [reviewer]
      })

      context.log(result)

    } catch (error) {
      context.log(error)
    }
    this.team.proceed()
  }
}