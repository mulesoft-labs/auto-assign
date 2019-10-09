
import { Context } from 'probot'
import { Team } from './team'

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

    public async assignPR(team: Team<string>) {
        // do magic
        try {
            const payload = this.context.payload
            const owner = payload.pull_request.user.login

            let reviewer = team.next(owner)
            if (!reviewer) {
                this.context.log('there is no candidate to review')
                return
            }
            console.log("candidate to be assigned: " + reviewer)


            // get user
            this.context.github.query(userQuery, {
                member: reviewer
            }).then((res) => {
                this.context.github.query(addAssignee, {
                    id: this.context.payload.pull_request.node_id,
                    assigneeIds: [res.user.id]
                }).catch((err) => {
                    console.log(err.message); // something bad happened
                });
            }).catch((err) => {
                console.log(err.message); // something bad happened
            });

        } catch (error) {
            this.context.log(error)
        }
    }

}