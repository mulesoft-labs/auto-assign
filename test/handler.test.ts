import { Context } from 'probot'
import { Handler } from '../src/handler'

describe('handlePullRequest', () => {

  test('responds with the error if the configuration file failed to load', async () => {
    try {
      // tslint:disable-next-line:no-empty
      let context = createPRContext('reviewer1', ['WIP'], [])
      context.config = jest.fn().mockImplementation(async () => {})
      await new Handler().handlePullRequest(context)
    } catch (error) {
      expect(error).toEqual(new Error('the configuration file failed to load'))
    }
  })

  test('exits the process if pull requests labels include any skip word', async () => {
    let context = createPRContext('reviewer1', ['WIP'], ['wip'])
    const spy = jest.spyOn(context, 'log')
    await new Handler().handlePullRequest(context)

    expect(spy.mock.calls[0][0]).toEqual('skips adding reviewers')
  })

  test('assign other when owner is the next in the list', async () => {
    const handler = new Handler()
    let context = createPRContext('reviewer1', ['WIP'], [])
    let createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)

    expect(createReviewRequestSpy.mock.calls[0][0].reviewers).toHaveLength(1)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).not.toMatch('reviewer1')
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer2')

    
    context = createPRContext('reviewer2', ['WIP'], [])
    createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer1')

    context = createPRContext('reviewer1', ['WIP'], [])
    createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer3')

    context = createPRContext('reviewer1', ['WIP'], [])
    createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer2')

    context = createPRContext('reviewer1', ['WIP'], [])
    createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer3')

    context = createPRContext('reviewer3', ['WIP'], [])
    createReviewRequestSpy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')
    await handler.handlePullRequest(context)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch('reviewer1')
  })

})

function createPRContext(reviewer: string, labels: string[], skipWords: string[]) : Context {
  
  let event = {
    id: '123',
    name: 'pull_request',
    payload: {
      action: 'opened',
      number: '1',
      pull_request: {
        number: '1',
        title: 'test',
        labels: labels,
        user: {
          login: reviewer
        }
      },
      repository: {
        name: 'repo',
        owner: {
          login: 'repo-owner'
        }
      }
    }
  }

  let context = new Context(event, {} as any, {} as any)

  context.config = jest.fn().mockImplementation(async () => {
    return {
      teamMembers: ['reviewer1', 'reviewer2', 'reviewer3'],
      skipKeywords: skipWords
    }
  })

  context.github.pullRequests = {
    // tslint:disable-next-line:no-empty
    createReviewRequest: jest.fn().mockImplementation(async () => {})
  } as any

  context.log = jest.fn() as any

  return context
}