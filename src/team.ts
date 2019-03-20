export class Team<T> {

  private _head?: Node<T>;
  private _length: number;

  constructor() {
    this._length = 0;
  }

  next(owner?: T): T | undefined {
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

  proceed() {
    if (this._head) {
      this._head = this._head.next;
    }
  }

  length() : number {
    return this._length;
  }

  private swapFirstTwo() {
    if (this._head) {
      let a = this._head;
      this._head = this._head.next;
      this.remove(a);
      this.insertBetween(a, this._head, this._head.next);
    }
  }

  // Adds the element at the end of the linked list
  public append(val: T): boolean {
    if (this.contains(val)) {
      return false;
    }
    let newItem = new Node<T>(val);
    if (this._head) {
      this.insertBetween(newItem, this._head.prev, this._head);
    } else {
      this._head = newItem;
    }
    this._length++;
    return true;
  }

  private remove(node: Node<T>) {
    this.link(node.prev, node.next);
  }

  private contains(val: T) : boolean {
    let node = this._head;
    for (let i = 0; i < this._length; i ++) {
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

export class Node<T> {
  value: T;
  next: Node<T>;
  prev: Node<T>;

  constructor(val: T) {
    this.value = val;
    this.next = this;
    this.prev = this;
  }
}