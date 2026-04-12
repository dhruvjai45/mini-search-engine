import type { TermPosting } from './indexer.types';

export function buildTermPostings(tokens: string[]): TermPosting[] {
  const termMap = new Map<string, number[]>();

  tokens.forEach((token, index) => {
    const positions = termMap.get(token) ?? [];
    positions.push(index + 1);
    termMap.set(token, positions);
  });

  return Array.from(termMap.entries()).map(([term, positions]) => ({
    term,
    termFrequency: positions.length,
    positions
  }));
}