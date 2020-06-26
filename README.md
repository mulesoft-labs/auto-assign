# auto-assign [![CircleCI](https://circleci.com/gh/mulesoft-labs/auto-assign.svg?style=svg)](https://circleci.com/gh/mulesoft-labs/auto-assign)
Assigns PRs automatically using round robin strategy.
Auto assign supports multiple teams, and it works taking a PR owner's name and searching 
through teams member list, once the team is determined the reviewers list is used to 
assign a reviewer, team's names are used as key because of that each one must be different, each team has its own reviewers queue.

## Installation

To install auto-assign you need to follow the next steps.

1. Go to GitHub Settings/Developer settings and create a new GitHub App.
1. Set a name,Webhook URL and Webhook secret it must match with the environment variable WEBHOOK_SECRET.
1. The next permissions are required:
    1. Single file path: .github/auto_assign.yml access: Read-only
    1. Pull request: Read and write
    1. Issues: Read and write
1. Subscribe to:
    1. Issues
    1. Pull request
1. Add an auto_assign.yml file into your repo, in the .github folder using the next structure.
1. Install your GitHub App to your repository.

## Structure of auto_assign.yml

```bash
teams:
  - name: team_name_1
    members:
      - github_user_name_1
      - github_user_name_2
    
    assignees:
      - github_user_name_1
      - github_user_name_2

  - name: team_name_2
    members:
      - github_user_name_3
      - github_user_name_4
    
    assignees:
      - github_user_name_5
```
