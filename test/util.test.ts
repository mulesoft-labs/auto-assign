import { includesSkipKeywords } from '../src/util'

describe('includesSkipKeywords', () => {
  test('returns true if the pull request labels includes skip word', () => {
    const labels = ['WIP']
    const skipWords = ['wip']

    const contains = includesSkipKeywords(labels, skipWords)

    expect(contains).toEqual(true)
  })

  test('returns false if the pull request labels does not include skip word', () => {
    const labels = ['']
    const skipWords = ['wip']

    const contains = includesSkipKeywords(labels, skipWords)

    expect(contains).toEqual(false)
  })
})
