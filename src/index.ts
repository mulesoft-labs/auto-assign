import { Application } from 'probot'
import { Handler } from './handler'

var handler = new Handler()

export = (app: Application) => {
  app.on('pull_request.opened', async context => { handler.handlePullRequest })
}
