export class MinHeap<T> {
  private items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(value: T): void {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    if (this.items.length === 1) return this.items.pop();

    const root = this.items[0];
    const last = this.items.pop()!;
    this.items[0] = last;
    this.bubbleDown(0);

    return root;
  }

  toArray(): T[] {
    return [...this.items];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (this.compare(this.items[index], this.items[parent]) >= 0) {
        break;
      }

      [this.items[index], this.items[parent]] = [
        this.items[parent],
        this.items[index]
      ];

      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.items.length;

    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }

      if (right < length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) break;

      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index]
      ];

      index = smallest;
    }
  }
}