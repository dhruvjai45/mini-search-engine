import { LruCache } from './lruCache';

describe('LruCache', () => {
  it('evicts the least recently used entry when capacity is exceeded', () => {
    const cache = new LruCache<string, number>(2, 60000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // capacity is 2, so 'a' should be evicted

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('marks a key as recently used on get, protecting it from eviction', () => {
    const cache = new LruCache<string, number>(2, 60000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // 'a' is now most recently used
    cache.set('c', 3); // 'b' should be evicted instead

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
  });

  it('expires an entry after its TTL has passed', () => {
    const cache = new LruCache<string, number>(3, 1000);
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(0);
    cache.set('a', 1);
    nowSpy.mockReturnValue(1500); // past the 1000ms TTL
    expect(cache.get('a')).toBeUndefined();
    nowSpy.mockRestore();
  });
});