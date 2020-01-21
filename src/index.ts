import { Application } from 'probot'
import { Handler } from './handler'
import admin from 'firebase-admin'

// Fetch the service account key JSON file contents
const serviceAccount = require("../src/.private/auto-assign-firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://auto-assign.firebaseio.com"
})

const handler = new Handler()

export = (app: Application) => {
  app.log('app started')
  app.on('pull_request.opened', async context => { 
    app.log('pull request opened')
    handler.handlePullRequest(context, admin.firestore())
  })
  app.on('issue.opened', async context => { 
    app.log('issue opened')
    handler.handleIssue(context, admin.firestore())
  })
}
