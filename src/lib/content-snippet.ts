export function contentSnippet(content: string, maxLength = 240): string {
  const compact = content.replace(/```[\s\S]*?```/g, ' ').replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}
