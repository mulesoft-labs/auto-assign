import { Application } from 'probot'
import { Handler } from './handler'

var handler = new Handler()

export = (app: Application) => {
  app.log('app started')
  app.on('*', async context => app.log(context))
  app.on('pull_request.opened', async context => { 
    handler.handlePullRequest 
    app.log('pull request opened')
  })
}
