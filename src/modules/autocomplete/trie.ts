import type { AutocompleteSuggestion } from './autocomplete.types';

class TrieNode {
    children: Map<string, TrieNode> = new Map();
    isWord = false;
    frequency = 0;
    text = '';
}

export class AutocompleteTrie {
    private root = new TrieNode();

    insert(text: string, weight = 1): void {
        const normalized = text.trim().toLowerCase();
        if (!normalized) return;

        let node = this.root;

        for (const char of normalized) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }

        node.isWord = true;
        node.frequency += weight;
        node.text = normalized;
    }

    getSuggestions(prefix: string, limit = 10): AutocompleteSuggestion[] {
        const normalizedPrefix = prefix.trim().toLowerCase();
        if (!normalizedPrefix) return [];

        let node = this.root;

        for (const char of normalizedPrefix) {
            const next = node.children.get(char);
            if (!next) return [];
            node = next;
        }

        const collected: AutocompleteSuggestion[] = [];
        this.collect(node, collected);

        return collected
            .sort((a, b) => {
                if (b.frequency !== a.frequency) return b.frequency - a.frequency;

                // prefer multi-word phrases
                const aWords = a.text.split(' ').length;
                const bWords = b.text.split(' ').length;

                if (bWords !== aWords) return bWords - aWords;

                // then shorter strings
                if (a.text.length !== b.text.length) return a.text.length - b.text.length;

                return a.text.localeCompare(b.text);
            })
            .slice(0, limit);
    }

    private collect(node: TrieNode, results: AutocompleteSuggestion[]): void {
        if (node.isWord) {
            results.push({
                text: node.text,
                frequency: node.frequency
            });
        }

        for (const child of node.children.values()) {
            this.collect(child, results);
        }
    }
}