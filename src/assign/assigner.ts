import { Context } from "probot";
import { Queue } from "../queue/queue";
import { getOwner } from "../util";

const userQuery = `
query userQuery($member: String!) {
  user(login: $member) {
    id
  }
}
`;

const addAssignee = `
mutation assign($id: ID!, $assigneeIds: [ID!]!) {
  addAssigneesToAssignable(input: {assignableId: $id, assigneeIds: $assigneeIds}) {
    clientMutationId
  }
}
`;

export class Assigner {
    private readonly context: Context;

    public constructor(context: Context) {
        this.context = context;
    }

    public async assign(team: Queue<string>, isPR: boolean) {
        try {
            const owner = getOwner(this.context, isPR);
            await this.doAssign(team, owner, isPR);
        } catch (error) {
            this.context.log(error);
        }
    }

    public async doAssign(team: Queue<string>, owner: string, isPR: boolean) {
        const reviewer = team.next(owner);
        if (!reviewer) {
            this.context.log("there is no candidate to review");
            return;
        }
        this.context.log(`The ${isPR ? "PR" : "issue"} created by ${owner} will be assign to: ${reviewer}`);
        // get user
        this.context.octokit
            .graphql(userQuery, {
                member: reviewer,
            })
            .then((res) => {
                this.context.octokit
                    .graphql(addAssignee, {
                        id: isPR ? this.context.payload.pull_request.node_id : this.context.payload.issue.node_id,
                        assigneeIds: [(res as any).user.id],
                    })
                    .catch((err) => {
                        this.context.log(err.message); // something bad happened
                    });
            })
            .catch((err) => {
                this.context.log(err.message); // something bad happened
            });
    }
}
