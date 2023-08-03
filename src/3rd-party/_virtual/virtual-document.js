function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var FakeDomNode = /*#__PURE__*/function () {
  function FakeDomNode(tagName) {
    _classCallCheck(this, FakeDomNode);
    this._childNodes = [];
    this._attributes = {};
    this._parentNode = null;
    this.nodeType = 1;
    this.tagName = tagName;
  }
  _createClass(FakeDomNode, [{
    key: "appendChild",
    value: function appendChild(child) {
      this._childNodes.push(child);
      child.parentNode = this;
    }
  }, {
    key: "insertBefore",
    value: function insertBefore(child, before) {
      if (before === null) {
        this.appendChild(child);
        return;
      }
      var index = this._childNodes.indexOf(before);
      if (index === -1) {
        throw new Error('Node not found');
      }
      this._childNodes.splice(index, 0, child);
      child.parentNode = this;
    }
  }, {
    key: "addEventListener",
    value: function addEventListener(type, listener) {}
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener) {}
  }, {
    key: "setAttribute",
    value: function setAttribute(name, value) {
      this._attributes[name] = value;
    }
  }, {
    key: "removeAttribute",
    value: function removeAttribute(name) {
      delete this._attributes[name];
    }
  }, {
    key: "nextSibling",
    get: function get() {
      var _this$parentNode;
      var siblings = ((_this$parentNode = this.parentNode) === null || _this$parentNode === void 0 ? void 0 : _this$parentNode._childNodes) || [];
      var index = siblings.indexOf(this);
      return siblings[index + 1] || null;
    }
  }, {
    key: "parentNode",
    get: function get() {
      return this._parentNode;
    },
    set: function set(node) {
      this._parentNode = node;
    }
  }, {
    key: "innerHTML",
    get: function get() {
      var _this$_childNodes;
      var html = '';
      var serializeNode = function serializeNode(node) {
        var ret = '';
        if (node.nodeType === 1) {
          ret += "<".concat(node.tagName);
          for (var _i = 0, _Object$entries = Object.entries(node._attributes); _i < _Object$entries.length; _i++) {
            var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
              name = _Object$entries$_i[0],
              value = _Object$entries$_i[1];
            ret += " ".concat(name, "=\"").concat(value, "\"");
          }
          ret += ">".concat(node._childNodes.length ? node.innerHTML : node.textContent, "</").concat(node.tagName, ">");
        } else if (node.nodeType === 3) {
          ret += node.textContent;
        } else {
          throw new Error("unknown node type ".concat(node.nodeType));
        }
        return ret;
      };
      if ((_this$_childNodes = this._childNodes) !== null && _this$_childNodes !== void 0 && _this$_childNodes.length) {
        this._childNodes.forEach(function (child) {
          html += serializeNode(child);
        });
      } else {
        return serializeNode(this);
      }
      return html;
    }
  }, {
    key: "textContent",
    get: function get() {
      if (this.nodeType === 3) {
        return String(this.data) || '';
      } else {
        return this.innnerText;
      }
    },
    set: function set(text) {
      if (this.nodeType === 3) {
        this.data = text;
      } else {
        this.innnerText = text;
      }
    }
  }, {
    key: "firstChild",
    get: function get() {
      return this._childNodes[0];
    }
  }, {
    key: "removeChild",
    value: function removeChild(child) {
      var index = this._childNodes.indexOf(child);
      if (index === -1) {
        throw new Error('Node not found');
      }
      this._childNodes.splice(index, 1);
      child.parentNode = null;
    }
  }, {
    key: "childNodes",
    get: function get() {
      return this._childNodes;
    }
  }]);
  return FakeDomNode;
}();
function throwNotImplemented() {
  throw new Error('not implemented!');
}
var virtualDocument = {
  createElement: function createElement(tagName, options) {
    var node = new FakeDomNode(tagName);
    return node;
  },
  createTextNode: function createTextNode(text) {
    var node = new FakeDomNode('#text');
    node.nodeType = 3;
    node.textContent = text;
    return node;
  },
  createElementNS: throwNotImplemented
};

export { FakeDomNode, virtualDocument };
