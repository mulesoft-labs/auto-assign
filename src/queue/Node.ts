export class Node<T> {
    public value: T;
    public next: Node<T>;
    public prev: Node<T>;

    constructor(val: T) {
        this.value = val;
        this.next = this;
        this.prev = this;
    }
}
