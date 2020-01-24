import { Application } from 'probot'
import { Handler } from './handler'
import admin from 'firebase-admin'

// Fetch the service account key JSON file contents
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_APP_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: "https://auto-assign.firebaseio.com"
})

const handler = new Handler()

export = (app: Application) => {
  app.log('app started')
  app.on('pull_request.opened', async context => { 
    app.log('pull request opened')
    handler.handlePullRequest(context, admin.firestore())
  })
  app.on('issues.opened', async context => { 
    app.log('issue opened')
    handler.handleIssue(context, admin.firestore())
  })
}
