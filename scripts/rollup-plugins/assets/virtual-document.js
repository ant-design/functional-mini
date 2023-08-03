export class FakeDomNode {
  constructor(tagName) {
    this._childNodes = [];
    this._attributes = {};
    this._parentNode = null;
    this.nodeType = 1;
    this.tagName = tagName;
  }
  appendChild(child) {
    this._childNodes.push(child);
    child.parentNode = this;
  }
  insertBefore(child, before) {
    if (before === null) {
      this.appendChild(child);
      return;
    }
    const index = this._childNodes.indexOf(before);
    if (index === -1) {
      throw new Error('Node not found');
    }
    this._childNodes.splice(index, 0, child);
    child.parentNode = this;
  }
  addEventListener(type, listener) {}
  removeEventListener(type, listener) {}
  setAttribute(name, value) {
    this._attributes[name] = value;
  }
  removeAttribute(name) {
    delete this._attributes[name];
  }
  get nextSibling() {
    const siblings = this.parentNode?._childNodes || [];
    const index = siblings.indexOf(this);
    return siblings[index + 1] || null;
  }
  get parentNode() {
    return this._parentNode;
  }
  set parentNode(node) {
    this._parentNode = node;
  }
  get innerHTML() {
    let html = '';
    const serializeNode = (node) => {
      let ret = '';
      if (node.nodeType === 1) {
        ret += `<${node.tagName}`;
        for (const [name, value] of Object.entries(node._attributes)) {
          ret += ` ${name}="${value}"`;
        }
        ret += `>${
          node._childNodes.length ? node.innerHTML : node.textContent
        }</${node.tagName}>`;
      } else if (node.nodeType === 3) {
        ret += node.textContent;
      } else {
        throw new Error(`unknown node type ${node.nodeType}`);
      }
      return ret;
    };
    if (this._childNodes?.length) {
      this._childNodes.forEach((child) => {
        html += serializeNode(child);
      });
    } else {
      return serializeNode(this);
    }
    return html;
  }
  get textContent() {
    if (this.nodeType === 3) {
      return String(this.data) || '';
    } else {
      return this.innnerText;
    }
  }
  set textContent(text) {
    if (this.nodeType === 3) {
      this.data = text;
    } else {
      this.innnerText = text;
    }
  }
  get firstChild() {
    return this._childNodes[0];
  }
  removeChild(child) {
    const index = this._childNodes.indexOf(child);
    if (index === -1) {
      throw new Error('Node not found');
    }
    this._childNodes.splice(index, 1);
    child.parentNode = null;
  }
  get childNodes() {
    return this._childNodes;
  }
}
function throwNotImplemented(...anyParam) {
  throw new Error('not implemented!');
}

export const virtualDocument = {
  createElement: (tagName, options) => {
    const node = new FakeDomNode(tagName);
    return node;
  },
  createTextNode: (text) => {
    const node = new FakeDomNode('#text');
    node.nodeType = 3;
    node.textContent = text;
    return node;
  },
  createElementNS: throwNotImplemented,
};
