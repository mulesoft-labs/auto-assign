import { Context } from "probot";
import { Label } from "@octokit/graphql-schema";

import { Team } from "./assign/Team";

export function includesSkipKeywords(labels: Label[], skipKeywords: string[]): boolean {
    const lowerCaseLabels = labels.map((x: { name: string }) => x.name.toLowerCase());
    const labelsSet = new Set(lowerCaseLabels);
    for (const skipKeyword of skipKeywords) {
        if (labelsSet.has(skipKeyword.toLowerCase())) {
            return true;
        }
    }
    return false;
}

export function getOwner(context: Context, isPR: boolean): string {
    const payload = context.payload;
    return isPR ? payload.pull_request.user.login : payload.issue.user.login;
}

export function getTeam(member: string, teams: Team[] = []): Team | null {
    let teamTarget: Team | null = null;

    for (const team of teams) {
        if (team.name === "default") {
            teamTarget = team;
        }

        if (team.members && team.members.includes(member)) {
            teamTarget = team;
            break;
        }
    }

    return teamTarget;
}
