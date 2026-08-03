import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('Hello World', { removeStopWords: false })).toEqual(['hello', 'world']);
  });

  it('strips punctuation and collapses extra whitespace', () => {
    expect(tokenize('Node.js,  REST-API!!', { removeStopWords: false })).toEqual(['node', 'js', 'rest', 'api']);
  });

  it('removes stop words by default', () => {
    expect(tokenize('this is a test of the search engine')).toEqual(['test', 'search', 'engine']);
  });

  it('keeps stop words when removeStopWords is false', () => {
    const result = tokenize('this is a test', { removeStopWords: false });
    expect(result).toContain('this');
    expect(result).toContain('is');
  });

  it('drops tokens shorter than minLength', () => {
    expect(tokenize('a bb ccc', { removeStopWords: false, minLength: 3 })).toEqual(['ccc']);
  });

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });

  it('normalizes accented characters', () => {
    expect(tokenize('café résumé', { removeStopWords: false })).toEqual(['cafe', 'resume']);
  });
});