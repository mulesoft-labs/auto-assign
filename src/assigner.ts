import { Context } from 'probot'
import { Queue } from './queue'
import { getOwner } from './util'

const userQuery = `
query userQuery($member: String!) {
  user(login: $member) {
    id
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

export class Assigner {
    private context: Context

    public constructor(context: Context) {
        this.context = context
    }

    public async assign(team: Queue<string>, isPR: Boolean) {
        try {
            const owner = getOwner(this.context,isPR)
            this.doAssign(team, owner, isPR)
        } catch (error) {
            this.context.log(error)
        }
    }

    public async doAssign(team: Queue<string>, owner: string, isPR: Boolean) {

        let reviewer = team.next(owner)
        if (!reviewer) {
            this.context.log('there is no candidate to review')
            return
        }
        console.log("candidate to be assigned: " + reviewer)

        // get user
        this.context.github.graphql (userQuery, {
            member: reviewer
        }).then((res) => {
            this.context.github.graphql (addAssignee, {
                id: isPR ? this.context.payload.pull_request.node_id : this.context.payload.issue.node_id,
                assigneeIds: [(res as any).user.id]
            }).
            catch((err) => {
                console.log(err.message); // something bad happened
            });
        }).catch((err) => {
            console.log(err.message); // something bad happened
        });
    }
}