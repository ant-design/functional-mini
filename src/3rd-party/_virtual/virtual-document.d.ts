declare const enum ENodeType {
  ELEMENT = 1,
  TEXT = 3,
}

export interface IFakeDomNode {
  readonly nodeType: ENodeType;
  readonly tagName: string;
  readonly style?: {
    cssText?: string;
  };
  readonly data?: string;
  readonly innerText?: string;
  readonly parentNode: IFakeDomNode | null;
  readonly nextSibling: IFakeDomNode | null;
  readonly textContent: string;
  readonly innerHTML: string;
  readonly firstChild: IFakeDomNode;
  readonly childNodes: IFakeDomNode[];

  appendChild: (child: IFakeDomNode) => void;
  insertBefore: (child: IFakeDomNode, before: IFakeDomNode) => void;
  addEventListener: (type: string, listener: (e: any) => void) => void;
  removeEventListener: (type: string, listener: (e: any) => void) => void;
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
  removeChild: (child: IFakeDomNode) => void;
}

declare function throwNotImplemented(...anyParam: any[]): void;

export declare const virtualDocument: {
  createElement: (tagName: string, options?: unknown) => IFakeDomNode;
  createTextNode: (text: string) => IFakeDomNode;
  createElementNS: typeof throwNotImplemented;
};
