import { expect, test } from 'vitest';
import {
  virtualDocument,
  FakeDomNode,
} from '../src/3rd-party/_virtual/virtual-document.js';

const { createTextNode } = virtualDocument;

test('should create a new instance with the correct tagName', () => {
  const myNode = new FakeDomNode('div');
  expect(myNode.tagName).to.equal('div');
});

test('should append a child node', () => {
  const parent = new FakeDomNode('div');
  const child = new FakeDomNode('span');
  parent.appendChild(child);
  expect(parent.childNodes).to.deep.equal([child]);
  expect(child.parentNode).to.equal(parent);
});

test('should insert a child node before another node', () => {
  const parent = new FakeDomNode('div');
  const child1 = new FakeDomNode('span');
  const child2 = new FakeDomNode('p');
  parent.appendChild(child1);
  parent.insertBefore(child2, child1);
  expect(parent.childNodes).to.deep.equal([child2, child1]);
  expect(child2.parentNode).to.equal(parent);
});

test('should set an attribute', () => {
  const node = new FakeDomNode('div');
  node.setAttribute('class', 'my-class');
  expect(node._attributes).to.deep.equal({ class: 'my-class' });
});

test('should remove an attribute', () => {
  const node = new FakeDomNode('div');
  node.setAttribute('class', 'my-class');
  node.removeAttribute('class');
  expect(node._attributes).to.deep.equal({});
});

test('should get the innerHTML', () => {
  const parent = new FakeDomNode('div');
  const child1 = new FakeDomNode('span');
  const child2 = new FakeDomNode('p');
  child1.textContent = 'Hello';
  child2.textContent = 'world';
  parent.appendChild(child1);
  parent.appendChild(child2);
  expect(parent.innerHTML).to.equal('<span>Hello</span><p>world</p>');
});

test('should get the innerHTML', () => {
  const parent = new FakeDomNode('div');
  const child1 = createTextNode('hello');
  const child2 = createTextNode('world');
  parent.appendChild(child1);
  parent.appendChild(child2);
  expect(parent.innerHTML).to.equal('helloworld');
});

test('should remove a child node', () => {
  const parent = new FakeDomNode('div');
  const child = new FakeDomNode('span');
  parent.appendChild(child);
  parent.removeChild(child);
  expect(parent.childNodes).to.deep.equal([]);
  expect(child.parentNode).to.equal(null);
});

test('should create a new element node', () => {
  const node = virtualDocument.createElement('div');
  expect(node.tagName).to.equal('div');
});

test('should create a new text node', () => {
  const node = virtualDocument.createTextNode('Hello world');
  expect(node.nodeType).to.equal(3);
  expect(node.textContent).to.equal('Hello world');
});

test('should get the first child node', () => {
  const parent = new FakeDomNode('div');
  const child1 = new FakeDomNode('span');
  const child2 = new FakeDomNode('p');
  parent.appendChild(child1);
  parent.appendChild(child2);
  expect(parent.firstChild).to.equal(child1);
});

test('should get the next sibling node', () => {
  const parent = new FakeDomNode('div');
  const child1 = new FakeDomNode('span');
  const child2 = new FakeDomNode('p');
  parent.appendChild(child1);
  parent.appendChild(child2);
  expect(child1.nextSibling).to.equal(child2);
});
