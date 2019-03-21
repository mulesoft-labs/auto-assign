import { Application } from 'probot'
import { Handler } from './handler'

var handler = new Handler()

export = (app: Application) => {
  app.log('app started')
  app.on('pull_request.opened', async context => { 
    app.log('pull request opened')
    handler.handlePullRequest(context)
  })
}
