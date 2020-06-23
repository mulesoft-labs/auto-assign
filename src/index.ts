import { Application } from 'probot'
import { Handler } from './handler'
import { Client } from 'ts-postgres'
import { createPool } from 'generic-pool'

const pool = createPool({
  create: async () => {
    const client = new Client({
      host: "localhost",
      port: 5432,
      user: "srial",
      database: "probotdb"
    })
    return client.connect().then(() => {
      client.on('error', console.log);
      return client;
    });
  },
  destroy: async (client: Client) => {
    return client.end().then(() => { })
  },
  validate: (client: Client) => {
    return Promise.resolve(!client.closed);
  }
}, {max: 10, // maximum size of the pool
  min: 2, // minimum size of the pool
  testOnBorrow: true //should the pool validate resources before giving them to clients
});

const handler = new Handler()

export = (app: Application) => {
  app.log('app started')
  app.on('pull_request.opened', async context => {
    app.log('pull request opened')
    handler.handlePullRequest(context,pool)
    //handler.handlePullRequest(context, admin.firestore())
  })
  app.on('issues.opened', async context => { 
    app.log('issue opened')
    handler.handleIssue(context,pool)
  })
}
