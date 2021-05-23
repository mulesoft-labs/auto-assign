import { Node } from "./Node";

export class Queue<T> {
    private _head?: Node<T>;
    private _length: number;

    constructor(array: T[]) {
        this._length = 0;
        array.forEach((t) => this.append(t));
    }

    public next(owner?: T): T | undefined {
        if (!this._head) {
            return undefined;
        }
        if (this._head.value === owner) {
            if (this._length <= 1) {
                return undefined;
            } else {
                this.swapFirstTwo();
            }
        }
        return this._head.value;
    }

    public proceed(): void {
        if (this._head) {
            this._head = this._head.next;
        }
    }

    public length(): number {
        return this._length;
    }

    public toArray(): T[] {
        const result: T[] = [];
        if (this._head) {
            let node = this._head;
            for (let i = 0; i < this._length; i++) {
                result.push(node.value);
                node = node.next;
            }
        }
        return result;
    }

    // Adds the element at the end of the linked list
    public append(val: T): boolean {
        if (this.contains(val)) {
            return false;
        }
        const newItem = new Node<T>(val);
        if (this._head) {
            this.insertBetween(newItem, this._head.prev, this._head);
        } else {
            this._head = newItem;
        }
        this._length++;
        return true;
    }

    public toBack(t: T): void {
        if (this.contains(t)) {
            this.remove(t);
            this.append(t);
        }
    }

    public remove(val: T): void {
        const del = this.get(val);
        if (del) {
            if (this._length === 1) {
                this._head = undefined;
            } else if (this._length > 1) {
                if (del === this._head) {
                    this._head = del.next;
                }
                del.next.prev = del.prev;
                del.prev.next = del.next;
            }
            this._length--;
        }
    }

    private swapFirstTwo() {
        if (this._head) {
            const a = this._head;
            this._head = this._head.next;
            this.unlink(a);
            this.insertBetween(a, this._head, this._head.next);
        }
    }

    private get(t: T): Node<T> | undefined {
        let node = this._head;
        for (let i = 0; i < this._length; i++) {
            if (node) {
                if (node.value === t) {
                    return node;
                } else {
                    node = node.next;
                }
            }
        }
        return undefined;
    }

    private unlink(node: Node<T>) {
        this.link(node.prev, node.next);
    }

    private contains(val: T): boolean {
        let node = this._head;
        for (let i = 0; i < this._length; i++) {
            if (node) {
                if (node.value === val) {
                    return true;
                } else {
                    node = node.next;
                }
            }
        }
        return false;
    }

    private insertBetween(node: Node<T>, a: Node<T>, b: Node<T>) {
        a.next = node;
        node.next = b;
        b.prev = node;
        node.prev = a;
    }

    private link(first: Node<T>, second: Node<T>) {
        first.next = second;
        second.prev = first;
    }
}
