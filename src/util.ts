export function includesSkipKeywords (labels: any, skipKeywords: string[]): boolean {
  let lowerCaseLabels = labels.map((x: { name: string; }) => x.name.toLowerCase())
  let labelsSet = new Set(lowerCaseLabels)
  for (const skipKeyword of skipKeywords) {
    if (labelsSet.has(skipKeyword.toLowerCase())) {
      return true
    }
  }
  return false
}