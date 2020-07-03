import { Context } from 'probot'
import {Team} from "./handler";

export function includesSkipKeywords (labels: any, skipKeywords: string[]): boolean {
  let lowerCaseLabels = labels.map((x: { name: string; }) => x.name.toLowerCase())
  let labelsSet = new Set(lowerCaseLabels)
  for (const skipKeyword of skipKeywords) {
    if (labelsSet.has(skipKeyword.toLowerCase())) {
      return true
    }
  }
  return false
}

export function getOwner(context: Context,isPR: Boolean): string{
  const payload = context.payload
  const owner = isPR ? payload.pull_request.user.login : payload.issue.user.login
  return owner
}

export function getTeam(member: string, teams: Team[]): Team | null{
  let teamTarget: Team
  let defaultTeam: Team
  for (var i = 0, len = teams.length; i < len; i++) {
    var team = teams[i];
    if (team.name === 'default') {
      defaultTeam = team;
    } else if (team.members.includes(member)) {
      teamTarget = teams[i];
      break;
    }
  }
  return teamTarget? teamTarget : defaultTeam
}
