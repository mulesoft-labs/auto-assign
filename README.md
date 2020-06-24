# auto-assign [![CircleCI](https://circleci.com/gh/mulesoft-labs/auto-assign.svg?style=svg)](https://circleci.com/gh/mulesoft-labs/auto-assign)
Assigns PRs automatically using round robin strategy.
Auto assign supports multiple teams, and it works taking a PR owner's name and searching 
through teams member list, once the team is determined the reviewers list is used to 
assign a reviewer, team's names are used as key because of that each one must be different, each team has its own reviewers queue.

## Installation

To install auto-assign you need to add an auto_assign.yml file into your repo, in the
.github folder using the next structure

## Structure of auto_assign.yml

```bash
scope: prod
teams:
  - name: team_name_1
    members:
      - github_user_name_1
      - github_user_name_2
    
    reviewers:
      - github_user_name_1
      - github_user_name_2

  - name: team_name_2
    members:
      - github_user_name_3
      - github_user_name_4
    
    reviewers:
      - github_user_name_5
```
