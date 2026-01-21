/**
 * Formats a resource name from kebab-case/snake_case to Proper Case
 * "create-agent-skill" → "Create Agent Skill"
 * "commit_push_pr" → "Commit Push Pr"
 */
export function formatResourceName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
