export interface AppConfig {
    teamMembers: string[],
    teamIds: Map<string, number>,
    skipKeywords?: string[]
}
