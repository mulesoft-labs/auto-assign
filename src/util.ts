export function includesSkipKeywords (labels: string[], skipKeywords: string[]): boolean {
  let lowerCaseLabels = labels.map(x => x.toString().toLowerCase())
  let labelsSet = new Set(lowerCaseLabels)
  for (const skipKeyword of skipKeywords) {
    if (labelsSet.has(skipKeyword.toLowerCase())) {
      return true
    }
  }
  return false
}