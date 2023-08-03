declare const enum ENodeType {
  ELEMENT = 1,
  TEXT = 3,
}
export interface IFakeDomNode {
  _childNodes: IFakeDomNode[];
  _attributes: Record<string, string>;
  tagName: string;
  textContent: string;
  style?: {
    cssText?: string;
  };
  data?: string;
  innerText?: string;
  appendChild: (child: IFakeDomNode) => void;
  insertBefore: (child: IFakeDomNode, before: IFakeDomNode) => void;
  parentNode: IFakeDomNode | null;
  readonly nextSibling: IFakeDomNode | null;
  addEventListener: (type: string, listener: (e: any) => void) => void;
  removeEventListener: (type: string, listener: (e: any) => void) => void;
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
  get innerHTML(): string;
  get firstChild(): IFakeDomNode;
  removeChild: (child: IFakeDomNode) => void;
  get childNodes(): IFakeDomNode[];
  nodeType: ENodeType;
}

export declare class FakeDomNode implements IFakeDomNode {
  _childNodes: IFakeDomNode[];
  _attributes: Record<string, string>;
  style?: {
    cssText?: string;
  };
  _parentNode: IFakeDomNode | null;
  tagName: string;
  nodeType: ENodeType;
  data?: string;
  innerText?: string;
  constructor(tagName: string);
  appendChild(child: IFakeDomNode): void;
  insertBefore(child: IFakeDomNode, before: IFakeDomNode): void;
  addEventListener(type: string, listener: (e: any) => void): void;
  removeEventListener(type: string, listener: (e: any) => void): void;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  get nextSibling(): IFakeDomNode | null;
  get parentNode(): IFakeDomNode | null;
  set parentNode(node: IFakeDomNode | null);
  get innerHTML(): string;
  get textContent(): string;
  set textContent(text: string);
  get firstChild(): IFakeDomNode;
  removeChild(child: IFakeDomNode): void;
  get childNodes(): IFakeDomNode[];
}

declare function throwNotImplemented(...anyParam: any[]): void;

export declare const fakeDocument: {
  createElement: (tagName: string, options?: unknown) => FakeDomNode;
  createTextNode: (text: string) => FakeDomNode;
  createElementNS: typeof throwNotImplemented;
};
