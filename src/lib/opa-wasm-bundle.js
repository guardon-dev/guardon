// node_modules/@open-policy-agent/opa-wasm/dist/opa-wasm-browser.esm.js
var I = (s, e) => () => (e || s((e = { exports: {} }).exports, e), e.exports);
var ft = I((zs, ct) => {
  function gn(s) {
    if (typeof s == "string")
      try {
        return (JSON.parse(s), true);
      } catch (e) {
        if (e instanceof SyntaxError) return false;
        throw e;
      }
  }
  ct.exports = { "json.is_valid": gn };
});
var ut = I((ge) => {
  (function () {
    "use strict";
    var s = {
      not_string: /[^s]/,
      not_bool: /[^t]/,
      not_type: /[^T]/,
      not_primitive: /[^v]/,
      number: /[diefg]/,
      numeric_arg: /[bcdiefguxX]/,
      json: /[j]/,
      not_json: /[^j]/,
      text: /^[^\x25]+/,
      modulo: /^\x25{2}/,
      placeholder:
        /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
      key: /^([a-z_][a-z_\d]*)/i,
      key_access: /^\.([a-z_][a-z_\d]*)/i,
      index_access: /^\[(\d+)\]/,
      sign: /^[+-]/,
    };
    function e(o) {
      return n(i(o), arguments);
    }
    function t(o, a) {
      return e.apply(null, [o].concat(a || []));
    }
    function n(o, a) {
      var l = 1,
        c = o.length,
        f,
        d = "",
        g,
        m,
        h,
        y,
        w,
        A,
        E,
        N;
      for (g = 0; g < c; g++)
        if (typeof o[g] == "string") d += o[g];
        else if (typeof o[g] == "object") {
          if (((h = o[g]), h.keys))
            for (f = a[l], m = 0; m < h.keys.length; m++) {
              if (f == null)
                throw new Error(
                  e(
                    '[sprintf] Cannot access property "%s" of undefined value "%s"',
                    h.keys[m],
                    h.keys[m - 1]
                  )
                );
              f = f[h.keys[m]];
            }
          else h.param_no ? (f = a[h.param_no]) : (f = a[l++]);
          if (
            (s.not_type.test(h.type) &&
              s.not_primitive.test(h.type) &&
              f instanceof Function &&
              (f = f()),
            s.numeric_arg.test(h.type) && typeof f != "number" && isNaN(f))
          )
            throw new TypeError(e("[sprintf] expecting number but found %T", f));
          switch ((s.number.test(h.type) && (E = f >= 0), h.type)) {
            case "b":
              f = parseInt(f, 10).toString(2);
              break;
            case "c":
              f = String.fromCharCode(parseInt(f, 10));
              break;
            case "d":
            case "i":
              f = parseInt(f, 10);
              break;
            case "j":
              f = JSON.stringify(f, null, h.width ? parseInt(h.width) : 0);
              break;
            case "e":
              f = h.precision
                ? parseFloat(f).toExponential(h.precision)
                : parseFloat(f).toExponential();
              break;
            case "f":
              f = h.precision ? parseFloat(f).toFixed(h.precision) : parseFloat(f);
              break;
            case "g":
              f = h.precision ? String(Number(f.toPrecision(h.precision))) : parseFloat(f);
              break;
            case "o":
              f = (parseInt(f, 10) >>> 0).toString(8);
              break;
            case "s":
              ((f = String(f)), (f = h.precision ? f.substring(0, h.precision) : f));
              break;
            case "t":
              ((f = String(!!f)), (f = h.precision ? f.substring(0, h.precision) : f));
              break;
            case "T":
              ((f = Object.prototype.toString.call(f).slice(8, -1).toLowerCase()),
                (f = h.precision ? f.substring(0, h.precision) : f));
              break;
            case "u":
              f = parseInt(f, 10) >>> 0;
              break;
            case "v":
              ((f = f.valueOf()), (f = h.precision ? f.substring(0, h.precision) : f));
              break;
            case "x":
              f = (parseInt(f, 10) >>> 0).toString(16);
              break;
            case "X":
              f = (parseInt(f, 10) >>> 0).toString(16).toUpperCase();
              break;
          }
          s.json.test(h.type)
            ? (d += f)
            : (s.number.test(h.type) && (!E || h.sign)
                ? ((N = E ? "+" : "-"), (f = f.toString().replace(s.sign, "")))
                : (N = ""),
              (w = h.pad_char ? (h.pad_char === "0" ? "0" : h.pad_char.charAt(1)) : " "),
              (A = h.width - (N + f).length),
              (y = h.width && A > 0 ? w.repeat(A) : ""),
              (d += h.align ? N + f + y : w === "0" ? N + y + f : y + N + f));
        }
      return d;
    }
    var r = /* @__PURE__ */ Object.create(null);
    function i(o) {
      if (r[o]) return r[o];
      for (var a = o, l, c = [], f = 0; a; ) {
        if ((l = s.text.exec(a)) !== null) c.push(l[0]);
        else if ((l = s.modulo.exec(a)) !== null) c.push("%");
        else if ((l = s.placeholder.exec(a)) !== null) {
          if (l[2]) {
            f |= 1;
            var d = [],
              g = l[2],
              m = [];
            if ((m = s.key.exec(g)) !== null)
              for (d.push(m[1]); (g = g.substring(m[0].length)) !== ""; )
                if ((m = s.key_access.exec(g)) !== null) d.push(m[1]);
                else if ((m = s.index_access.exec(g)) !== null) d.push(m[1]);
                else throw new SyntaxError("[sprintf] failed to parse named argument key");
            else throw new SyntaxError("[sprintf] failed to parse named argument key");
            l[2] = d;
          } else f |= 2;
          if (f === 3)
            throw new Error(
              "[sprintf] mixing positional and named placeholders is not (yet) supported"
            );
          c.push({
            placeholder: l[0],
            param_no: l[1],
            keys: l[2],
            sign: l[3],
            pad_char: l[4],
            align: l[5],
            width: l[6],
            precision: l[7],
            type: l[8],
          });
        } else throw new SyntaxError("[sprintf] unexpected placeholder");
        a = a.substring(l[0].length);
      }
      return (r[o] = c);
    }
    (typeof ge < "u" && ((ge.sprintf = e), (ge.vsprintf = t)),
      typeof window < "u" &&
        ((window.sprintf = e),
        (window.vsprintf = t),
        typeof define == "function" &&
          define.amd &&
          define(function () {
            return { sprintf: e, vsprintf: t };
          })));
  })();
});
var pt = I((Zs, ht) => {
  var mn = ut().vsprintf,
    yn = (s, e) => mn(s, e);
  ht.exports = { sprintf: yn };
});
var gt = I((er, dt) => {
  var bn = (s, e) => e.split(RegExp(s));
  dt.exports = { "regex.split": bn };
});
var K = I(($) => {
  "use strict";
  var Y = { ANCHOR: "&", COMMENT: "#", TAG: "!", DIRECTIVES_END: "-", DOCUMENT_END: "." },
    re = {
      ALIAS: "ALIAS",
      BLANK_LINE: "BLANK_LINE",
      BLOCK_FOLDED: "BLOCK_FOLDED",
      BLOCK_LITERAL: "BLOCK_LITERAL",
      COMMENT: "COMMENT",
      DIRECTIVE: "DIRECTIVE",
      DOCUMENT: "DOCUMENT",
      FLOW_MAP: "FLOW_MAP",
      FLOW_SEQ: "FLOW_SEQ",
      MAP: "MAP",
      MAP_KEY: "MAP_KEY",
      MAP_VALUE: "MAP_VALUE",
      PLAIN: "PLAIN",
      QUOTE_DOUBLE: "QUOTE_DOUBLE",
      QUOTE_SINGLE: "QUOTE_SINGLE",
      SEQ: "SEQ",
      SEQ_ITEM: "SEQ_ITEM",
    },
    wn = "tag:yaml.org,2002:",
    Sn = {
      MAP: "tag:yaml.org,2002:map",
      SEQ: "tag:yaml.org,2002:seq",
      STR: "tag:yaml.org,2002:str",
    };
  function mt(s) {
    let e = [0],
      t = s.indexOf(`
`);
    for (; t !== -1; )
      ((t += 1),
        e.push(t),
        (t = s.indexOf(
          `
`,
          t
        )));
    return e;
  }
  function yt(s) {
    let e, t;
    return (
      typeof s == "string"
        ? ((e = mt(s)), (t = s))
        : (Array.isArray(s) && (s = s[0]),
          s &&
            s.context &&
            (s.lineStarts || (s.lineStarts = mt(s.context.src)),
            (e = s.lineStarts),
            (t = s.context.src))),
      { lineStarts: e, src: t }
    );
  }
  function Ce(s, e) {
    if (typeof s != "number" || s < 0) return null;
    let { lineStarts: t, src: n } = yt(e);
    if (!t || !n || s > n.length) return null;
    for (let i = 0; i < t.length; ++i) {
      let o = t[i];
      if (s < o) return { line: i, col: s - t[i - 1] + 1 };
      if (s === o) return { line: i + 1, col: 1 };
    }
    let r = t.length;
    return { line: r, col: s - t[r - 1] + 1 };
  }
  function En(s, e) {
    let { lineStarts: t, src: n } = yt(e);
    if (!t || !(s >= 1) || s > t.length) return null;
    let r = t[s - 1],
      i = t[s];
    for (
      ;
      i &&
      i > r &&
      n[i - 1] ===
        `
`;
    )
      --i;
    return n.slice(r, i);
  }
  function On({ start: s, end: e }, t, n = 80) {
    let r = En(s.line, t);
    if (!r) return null;
    let { col: i } = s;
    if (r.length > n)
      if (i <= n - 10) r = r.substr(0, n - 1) + "\u2026";
      else {
        let f = Math.round(n / 2);
        (r.length > i + f && (r = r.substr(0, i + f - 1) + "\u2026"),
          (i -= r.length - n),
          (r = "\u2026" + r.substr(1 - n)));
      }
    let o = 1,
      a = "";
    e &&
      (e.line === s.line && i + (e.col - s.col) <= n + 1
        ? (o = e.col - s.col)
        : ((o = Math.min(r.length + 1, n) - i), (a = "\u2026")));
    let l = i > 1 ? " ".repeat(i - 1) : "",
      c = "^".repeat(o);
    return `${r}
${l}${c}${a}`;
  }
  var X = class s {
      static copy(e) {
        return new s(e.start, e.end);
      }
      constructor(e, t) {
        ((this.start = e), (this.end = t || e));
      }
      isEmpty() {
        return typeof this.start != "number" || !this.end || this.end <= this.start;
      }
      setOrigRange(e, t) {
        let { start: n, end: r } = this;
        if (e.length === 0 || r <= e[0]) return ((this.origStart = n), (this.origEnd = r), t);
        let i = t;
        for (; i < e.length && !(e[i] > n); ) ++i;
        this.origStart = n + i;
        let o = i;
        for (; i < e.length && !(e[i] >= r); ) ++i;
        return ((this.origEnd = r + i), o);
      }
    },
    j = class s {
      static addStringTerminator(e, t, n) {
        if (
          n[n.length - 1] ===
          `
`
        )
          return n;
        let r = s.endOfWhiteSpace(e, t);
        return r >= e.length ||
          e[r] ===
            `
`
          ? n +
              `
`
          : n;
      }
      static atDocumentBoundary(e, t, n) {
        let r = e[t];
        if (!r) return true;
        let i = e[t - 1];
        if (
          i &&
          i !==
            `
`
        )
          return false;
        if (n) {
          if (r !== n) return false;
        } else if (r !== Y.DIRECTIVES_END && r !== Y.DOCUMENT_END) return false;
        let o = e[t + 1],
          a = e[t + 2];
        if (o !== r || a !== r) return false;
        let l = e[t + 3];
        return (
          !l ||
          l ===
            `
` ||
          l === "	" ||
          l === " "
        );
      }
      static endOfIdentifier(e, t) {
        let n = e[t],
          r = n === "<",
          i = r
            ? [
                `
`,
                "	",
                " ",
                ">",
              ]
            : [
                `
`,
                "	",
                " ",
                "[",
                "]",
                "{",
                "}",
                ",",
              ];
        for (; n && i.indexOf(n) === -1; ) n = e[(t += 1)];
        return (r && n === ">" && (t += 1), t);
      }
      static endOfIndent(e, t) {
        let n = e[t];
        for (; n === " "; ) n = e[(t += 1)];
        return t;
      }
      static endOfLine(e, t) {
        let n = e[t];
        for (
          ;
          n &&
          n !==
            `
`;
        )
          n = e[(t += 1)];
        return t;
      }
      static endOfWhiteSpace(e, t) {
        let n = e[t];
        for (; n === "	" || n === " "; ) n = e[(t += 1)];
        return t;
      }
      static startOfLine(e, t) {
        let n = e[t - 1];
        if (
          n ===
          `
`
        )
          return t;
        for (
          ;
          n &&
          n !==
            `
`;
        )
          n = e[(t -= 1)];
        return t + 1;
      }
      static endOfBlockIndent(e, t, n) {
        let r = s.endOfIndent(e, n);
        if (r > n + t) return r;
        {
          let i = s.endOfWhiteSpace(e, r),
            o = e[i];
          if (
            !o ||
            o ===
              `
`
          )
            return i;
        }
        return null;
      }
      static atBlank(e, t, n) {
        let r = e[t];
        return (
          r ===
            `
` ||
          r === "	" ||
          r === " " ||
          (n && !r)
        );
      }
      static nextNodeIsIndented(e, t, n) {
        return !e || t < 0 ? false : t > 0 ? true : n && e === "-";
      }
      static normalizeOffset(e, t) {
        let n = e[t];
        return n
          ? n !==
              `
` &&
            e[t - 1] ===
              `
`
            ? t - 1
            : s.endOfWhiteSpace(e, t)
          : t;
      }
      static foldNewline(e, t, n) {
        let r = 0,
          i = false,
          o = "",
          a = e[t + 1];
        for (
          ;
          a === " " ||
          a === "	" ||
          a ===
            `
`;
        ) {
          switch (a) {
            case `
`:
              ((r = 0),
                (t += 1),
                (o += `
`));
              break;
            case "	":
              (r <= n && (i = true), (t = s.endOfWhiteSpace(e, t + 2) - 1));
              break;
            case " ":
              ((r += 1), (t += 1));
              break;
          }
          a = e[t + 1];
        }
        return (o || (o = " "), a && r <= n && (i = true), { fold: o, offset: t, error: i });
      }
      constructor(e, t, n) {
        (Object.defineProperty(this, "context", { value: n || null, writable: true }),
          (this.error = null),
          (this.range = null),
          (this.valueRange = null),
          (this.props = t || []),
          (this.type = e),
          (this.value = null));
      }
      getPropValue(e, t, n) {
        if (!this.context) return null;
        let { src: r } = this.context,
          i = this.props[e];
        return i && r[i.start] === t ? r.slice(i.start + (n ? 1 : 0), i.end) : null;
      }
      get anchor() {
        for (let e = 0; e < this.props.length; ++e) {
          let t = this.getPropValue(e, Y.ANCHOR, true);
          if (t != null) return t;
        }
        return null;
      }
      get comment() {
        let e = [];
        for (let t = 0; t < this.props.length; ++t) {
          let n = this.getPropValue(t, Y.COMMENT, true);
          n != null && e.push(n);
        }
        return e.length > 0
          ? e.join(`
`)
          : null;
      }
      commentHasRequiredWhitespace(e) {
        let { src: t } = this.context;
        if ((this.header && e === this.header.end) || !this.valueRange) return false;
        let { end: n } = this.valueRange;
        return e !== n || s.atBlank(t, n - 1);
      }
      get hasComment() {
        if (this.context) {
          let { src: e } = this.context;
          for (let t = 0; t < this.props.length; ++t)
            if (e[this.props[t].start] === Y.COMMENT) return true;
        }
        return false;
      }
      get hasProps() {
        if (this.context) {
          let { src: e } = this.context;
          for (let t = 0; t < this.props.length; ++t)
            if (e[this.props[t].start] !== Y.COMMENT) return true;
        }
        return false;
      }
      get includesTrailingLines() {
        return false;
      }
      get jsonLike() {
        return (
          [re.FLOW_MAP, re.FLOW_SEQ, re.QUOTE_DOUBLE, re.QUOTE_SINGLE].indexOf(this.type) !== -1
        );
      }
      get rangeAsLinePos() {
        if (!this.range || !this.context) return;
        let e = Ce(this.range.start, this.context.root);
        if (!e) return;
        let t = Ce(this.range.end, this.context.root);
        return { start: e, end: t };
      }
      get rawValue() {
        if (!this.valueRange || !this.context) return null;
        let { start: e, end: t } = this.valueRange;
        return this.context.src.slice(e, t);
      }
      get tag() {
        for (let e = 0; e < this.props.length; ++e) {
          let t = this.getPropValue(e, Y.TAG, false);
          if (t != null) {
            if (t[1] === "<") return { verbatim: t.slice(2, -1) };
            {
              let [n, r, i] = t.match(/^(.*!)([^!]*)$/);
              return { handle: r, suffix: i };
            }
          }
        }
        return null;
      }
      get valueRangeContainsNewline() {
        if (!this.valueRange || !this.context) return false;
        let { start: e, end: t } = this.valueRange,
          { src: n } = this.context;
        for (let r = e; r < t; ++r)
          if (
            n[r] ===
            `
`
          )
            return true;
        return false;
      }
      parseComment(e) {
        let { src: t } = this.context;
        if (t[e] === Y.COMMENT) {
          let n = s.endOfLine(t, e + 1),
            r = new X(e, n);
          return (this.props.push(r), n);
        }
        return e;
      }
      setOrigRanges(e, t) {
        return (
          this.range && (t = this.range.setOrigRange(e, t)),
          this.valueRange && this.valueRange.setOrigRange(e, t),
          this.props.forEach((n) => n.setOrigRange(e, t)),
          t
        );
      }
      toString() {
        let {
          context: { src: e },
          range: t,
          value: n,
        } = this;
        if (n != null) return n;
        let r = e.slice(t.start, t.end);
        return s.addStringTerminator(e, t.end, r);
      }
    },
    U = class extends Error {
      constructor(e, t, n) {
        if (!n || !(t instanceof j)) throw new Error(`Invalid arguments for new ${e}`);
        (super(), (this.name = e), (this.message = n), (this.source = t));
      }
      makePretty() {
        if (!this.source) return;
        this.nodeType = this.source.type;
        let e = this.source.context && this.source.context.root;
        if (typeof this.offset == "number") {
          this.range = new X(this.offset, this.offset + 1);
          let t = e && Ce(this.offset, e);
          if (t) {
            let n = { line: t.line, col: t.col + 1 };
            this.linePos = { start: t, end: n };
          }
          delete this.offset;
        } else ((this.range = this.source.range), (this.linePos = this.source.rangeAsLinePos));
        if (this.linePos) {
          let { line: t, col: n } = this.linePos.start;
          this.message += ` at line ${t}, column ${n}`;
          let r = e && On(this.linePos, e);
          r &&
            (this.message += `:

${r}
`);
        }
        delete this.source;
      }
    },
    Re = class extends U {
      constructor(e, t) {
        super("YAMLReferenceError", e, t);
      }
    },
    ie = class extends U {
      constructor(e, t) {
        super("YAMLSemanticError", e, t);
      }
    },
    Be = class extends U {
      constructor(e, t) {
        super("YAMLSyntaxError", e, t);
      }
    },
    Ye = class extends U {
      constructor(e, t) {
        super("YAMLWarning", e, t);
      }
    };
  function Nn(s, e, t) {
    return (
      e in s
        ? Object.defineProperty(s, e, {
            value: t,
            enumerable: true,
            configurable: true,
            writable: true,
          })
        : (s[e] = t),
      s
    );
  }
  var je = class s extends j {
    static endOfLine(e, t, n) {
      let r = e[t],
        i = t;
      for (
        ;
        r &&
        r !==
          `
` &&
        !(n && (r === "[" || r === "]" || r === "{" || r === "}" || r === ","));
      ) {
        let o = e[i + 1];
        if (
          (r === ":" &&
            (!o ||
              o ===
                `
` ||
              o === "	" ||
              o === " " ||
              (n && o === ","))) ||
          ((r === " " || r === "	") && o === "#")
        )
          break;
        ((i += 1), (r = o));
      }
      return i;
    }
    get strValue() {
      if (!this.valueRange || !this.context) return null;
      let { start: e, end: t } = this.valueRange,
        { src: n } = this.context,
        r = n[t - 1];
      for (
        ;
        e < t &&
        (r ===
          `
` ||
          r === "	" ||
          r === " ");
      )
        r = n[--t - 1];
      let i = "";
      for (let a = e; a < t; ++a) {
        let l = n[a];
        if (
          l ===
          `
`
        ) {
          let { fold: c, offset: f } = j.foldNewline(n, a, -1);
          ((i += c), (a = f));
        } else if (l === " " || l === "	") {
          let c = a,
            f = n[a + 1];
          for (; a < t && (f === " " || f === "	"); ) ((a += 1), (f = n[a + 1]));
          f !==
            `
` && (i += a > c ? n.slice(c, a + 1) : l);
        } else i += l;
      }
      let o = n[e];
      switch (o) {
        case "	": {
          let a = "Plain value cannot start with a tab character";
          return { errors: [new ie(this, a)], str: i };
        }
        case "@":
        case "`": {
          let a = `Plain value cannot start with reserved character ${o}`;
          return { errors: [new ie(this, a)], str: i };
        }
        default:
          return i;
      }
    }
    parseBlockValue(e) {
      let { indent: t, inFlow: n, src: r } = this.context,
        i = e,
        o = e;
      for (
        let a = r[i];
        a ===
          `
` && !j.atDocumentBoundary(r, i + 1);
        a = r[i]
      ) {
        let l = j.endOfBlockIndent(r, t, i + 1);
        if (l === null || r[l] === "#") break;
        r[l] ===
        `
`
          ? (i = l)
          : ((o = s.endOfLine(r, l, n)), (i = o));
      }
      return (
        this.valueRange.isEmpty() && (this.valueRange.start = e),
        (this.valueRange.end = o),
        o
      );
    }
    parse(e, t) {
      this.context = e;
      let { inFlow: n, src: r } = e,
        i = t,
        o = r[i];
      return (
        o &&
          o !== "#" &&
          o !==
            `
` &&
          (i = s.endOfLine(r, t, n)),
        (this.valueRange = new X(t, i)),
        (i = j.endOfWhiteSpace(r, i)),
        (i = this.parseComment(i)),
        (!this.hasComment || this.valueRange.isEmpty()) && (i = this.parseBlockValue(i)),
        i
      );
    }
  };
  $.Char = Y;
  $.Node = j;
  $.PlainValue = je;
  $.Range = X;
  $.Type = re;
  $.YAMLError = U;
  $.YAMLReferenceError = Re;
  $.YAMLSemanticError = ie;
  $.YAMLSyntaxError = Be;
  $.YAMLWarning = Ye;
  $._defineProperty = Nn;
  $.defaultTagPrefix = wn;
  $.defaultTags = Sn;
});
var wt = I((bt) => {
  "use strict";
  var u = K(),
    J = class extends u.Node {
      constructor() {
        super(u.Type.BLANK_LINE);
      }
      get includesTrailingLines() {
        return true;
      }
      parse(e, t) {
        return ((this.context = e), (this.range = new u.Range(t, t + 1)), t + 1);
      }
    },
    oe = class extends u.Node {
      constructor(e, t) {
        (super(e, t), (this.node = null));
      }
      get includesTrailingLines() {
        return !!this.node && this.node.includesTrailingLines;
      }
      parse(e, t) {
        this.context = e;
        let { parseNode: n, src: r } = e,
          { atLineStart: i, lineStart: o } = e;
        !i &&
          this.type === u.Type.SEQ_ITEM &&
          (this.error = new u.YAMLSemanticError(
            this,
            "Sequence items must not have preceding content on the same line"
          ));
        let a = i ? t - o : e.indent,
          l = u.Node.endOfWhiteSpace(r, t + 1),
          c = r[l],
          f = c === "#",
          d = [],
          g = null;
        for (
          ;
          c ===
            `
` || c === "#";
        ) {
          if (c === "#") {
            let h = u.Node.endOfLine(r, l + 1);
            (d.push(new u.Range(l, h)), (l = h));
          } else {
            ((i = true), (o = l + 1));
            let h = u.Node.endOfWhiteSpace(r, o);
            (r[h] ===
              `
` &&
              d.length === 0 &&
              ((g = new J()), (o = g.parse({ src: r }, o))),
              (l = u.Node.endOfIndent(r, o)));
          }
          c = r[l];
        }
        if (
          (u.Node.nextNodeIsIndented(c, l - (o + a), this.type !== u.Type.SEQ_ITEM)
            ? (this.node = n(
                { atLineStart: i, inCollection: false, indent: a, lineStart: o, parent: this },
                l
              ))
            : c && o > t + 1 && (l = o - 1),
          this.node)
        ) {
          if (g) {
            let h = e.parent.items || e.parent.contents;
            h && h.push(g);
          }
          (d.length && Array.prototype.push.apply(this.props, d), (l = this.node.range.end));
        } else if (f) {
          let h = d[0];
          (this.props.push(h), (l = h.end));
        } else l = u.Node.endOfLine(r, t + 1);
        let m = this.node ? this.node.valueRange.end : l;
        return ((this.valueRange = new u.Range(t, m)), l);
      }
      setOrigRanges(e, t) {
        return ((t = super.setOrigRanges(e, t)), this.node ? this.node.setOrigRanges(e, t) : t);
      }
      toString() {
        let {
          context: { src: e },
          node: t,
          range: n,
          value: r,
        } = this;
        if (r != null) return r;
        let i = t ? e.slice(n.start, t.range.start) + String(t) : e.slice(n.start, n.end);
        return u.Node.addStringTerminator(e, n.end, i);
      }
    },
    V = class extends u.Node {
      constructor() {
        super(u.Type.COMMENT);
      }
      parse(e, t) {
        this.context = e;
        let n = this.parseComment(t);
        return ((this.range = new u.Range(t, n)), n);
      }
    };
  function Fe(s) {
    let e = s;
    for (; e instanceof oe; ) e = e.node;
    if (!(e instanceof me)) return null;
    let t = e.items.length,
      n = -1;
    for (let o = t - 1; o >= 0; --o) {
      let a = e.items[o];
      if (a.type === u.Type.COMMENT) {
        let { indent: l, lineStart: c } = a.context;
        if (l > 0 && a.range.start >= c + l) break;
        n = o;
      } else if (a.type === u.Type.BLANK_LINE) n = o;
      else break;
    }
    if (n === -1) return null;
    let r = e.items.splice(n, t - n),
      i = r[0].range.start;
    for (
      ;
      (e.range.end = i), e.valueRange && e.valueRange.end > i && (e.valueRange.end = i), e !== s;
    )
      e = e.context.parent;
    return r;
  }
  var me = class s extends u.Node {
      static nextContentHasIndent(e, t, n) {
        let r = u.Node.endOfLine(e, t) + 1;
        t = u.Node.endOfWhiteSpace(e, r);
        let i = e[t];
        return i
          ? t >= r + n
            ? true
            : i !== "#" &&
                i !==
                  `
`
              ? false
              : s.nextContentHasIndent(e, t, n)
          : false;
      }
      constructor(e) {
        super(e.type === u.Type.SEQ_ITEM ? u.Type.SEQ : u.Type.MAP);
        for (let n = e.props.length - 1; n >= 0; --n)
          if (e.props[n].start < e.context.lineStart) {
            ((this.props = e.props.slice(0, n + 1)), (e.props = e.props.slice(n + 1)));
            let r = e.props[0] || e.valueRange;
            e.range.start = r.start;
            break;
          }
        this.items = [e];
        let t = Fe(e);
        t && Array.prototype.push.apply(this.items, t);
      }
      get includesTrailingLines() {
        return this.items.length > 0;
      }
      parse(e, t) {
        this.context = e;
        let { parseNode: n, src: r } = e,
          i = u.Node.startOfLine(r, t),
          o = this.items[0];
        ((o.context.parent = this), (this.valueRange = u.Range.copy(o.valueRange)));
        let a = o.range.start - o.context.lineStart,
          l = t;
        l = u.Node.normalizeOffset(r, l);
        let c = r[l],
          f = u.Node.endOfWhiteSpace(r, i) === l,
          d = false;
        for (; c; ) {
          for (
            ;
            c ===
              `
` || c === "#";
          ) {
            if (
              f &&
              c ===
                `
` &&
              !d
            ) {
              let h = new J();
              if (((l = h.parse({ src: r }, l)), (this.valueRange.end = l), l >= r.length)) {
                c = null;
                break;
              }
              (this.items.push(h), (l -= 1));
            } else if (c === "#") {
              if (l < i + a && !s.nextContentHasIndent(r, l, a)) return l;
              let h = new V();
              if (
                ((l = h.parse({ indent: a, lineStart: i, src: r }, l)),
                this.items.push(h),
                (this.valueRange.end = l),
                l >= r.length)
              ) {
                c = null;
                break;
              }
            }
            if (((i = l + 1), (l = u.Node.endOfIndent(r, i)), u.Node.atBlank(r, l))) {
              let h = u.Node.endOfWhiteSpace(r, l),
                y = r[h];
              (!y ||
                y ===
                  `
` ||
                y === "#") &&
                (l = h);
            }
            ((c = r[l]), (f = true));
          }
          if (!c) break;
          if (l !== i + a && (f || c !== ":")) {
            if (l < i + a) {
              i > t && (l = i);
              break;
            } else if (!this.error) {
              let h = "All collection items must start at the same column";
              this.error = new u.YAMLSyntaxError(this, h);
            }
          }
          if (o.type === u.Type.SEQ_ITEM) {
            if (c !== "-") {
              i > t && (l = i);
              break;
            }
          } else if (c === "-" && !this.error) {
            let h = r[l + 1];
            if (
              !h ||
              h ===
                `
` ||
              h === "	" ||
              h === " "
            ) {
              let y = "A collection cannot be both a mapping and a sequence";
              this.error = new u.YAMLSyntaxError(this, y);
            }
          }
          let g = n(
            { atLineStart: f, inCollection: true, indent: a, lineStart: i, parent: this },
            l
          );
          if (!g) return l;
          if (
            (this.items.push(g),
            (this.valueRange.end = g.valueRange.end),
            (l = u.Node.normalizeOffset(r, g.range.end)),
            (c = r[l]),
            (f = false),
            (d = g.includesTrailingLines),
            c)
          ) {
            let h = l - 1,
              y = r[h];
            for (; y === " " || y === "	"; ) y = r[--h];
            y ===
              `
` && ((i = h + 1), (f = true));
          }
          let m = Fe(g);
          m && Array.prototype.push.apply(this.items, m);
        }
        return l;
      }
      setOrigRanges(e, t) {
        return (
          (t = super.setOrigRanges(e, t)),
          this.items.forEach((n) => {
            t = n.setOrigRanges(e, t);
          }),
          t
        );
      }
      toString() {
        let {
          context: { src: e },
          items: t,
          range: n,
          value: r,
        } = this;
        if (r != null) return r;
        let i = e.slice(n.start, t[0].range.start) + String(t[0]);
        for (let o = 1; o < t.length; ++o) {
          let a = t[o],
            { atLineStart: l, indent: c } = a.context;
          if (l) for (let f = 0; f < c; ++f) i += " ";
          i += String(a);
        }
        return u.Node.addStringTerminator(e, n.end, i);
      }
    },
    De = class extends u.Node {
      constructor() {
        (super(u.Type.DIRECTIVE), (this.name = null));
      }
      get parameters() {
        let e = this.rawValue;
        return e ? e.trim().split(/[ \t]+/) : [];
      }
      parseName(e) {
        let { src: t } = this.context,
          n = e,
          r = t[n];
        for (
          ;
          r &&
          r !==
            `
` &&
          r !== "	" &&
          r !== " ";
        )
          r = t[(n += 1)];
        return ((this.name = t.slice(e, n)), n);
      }
      parseParameters(e) {
        let { src: t } = this.context,
          n = e,
          r = t[n];
        for (
          ;
          r &&
          r !==
            `
` &&
          r !== "#";
        )
          r = t[(n += 1)];
        return ((this.valueRange = new u.Range(e, n)), n);
      }
      parse(e, t) {
        this.context = e;
        let n = this.parseName(t + 1);
        return (
          (n = this.parseParameters(n)),
          (n = this.parseComment(n)),
          (this.range = new u.Range(t, n)),
          n
        );
      }
    },
    qe = class s extends u.Node {
      static startCommentOrEndBlankLine(e, t) {
        let n = u.Node.endOfWhiteSpace(e, t),
          r = e[n];
        return r === "#" ||
          r ===
            `
`
          ? n
          : t;
      }
      constructor() {
        (super(u.Type.DOCUMENT),
          (this.directives = null),
          (this.contents = null),
          (this.directivesEndMarker = null),
          (this.documentEndMarker = null));
      }
      parseDirectives(e) {
        let { src: t } = this.context;
        this.directives = [];
        let n = true,
          r = false,
          i = e;
        for (; !u.Node.atDocumentBoundary(t, i, u.Char.DIRECTIVES_END); )
          switch (((i = s.startCommentOrEndBlankLine(t, i)), t[i])) {
            case `
`:
              if (n) {
                let o = new J();
                ((i = o.parse({ src: t }, i)), i < t.length && this.directives.push(o));
              } else ((i += 1), (n = true));
              break;
            case "#":
              {
                let o = new V();
                ((i = o.parse({ src: t }, i)), this.directives.push(o), (n = false));
              }
              break;
            case "%":
              {
                let o = new De();
                ((i = o.parse({ parent: this, src: t }, i)),
                  this.directives.push(o),
                  (r = true),
                  (n = false));
              }
              break;
            default:
              return (
                r
                  ? (this.error = new u.YAMLSemanticError(
                      this,
                      "Missing directives-end indicator line"
                    ))
                  : this.directives.length > 0 &&
                    ((this.contents = this.directives), (this.directives = [])),
                i
              );
          }
        return t[i]
          ? ((this.directivesEndMarker = new u.Range(i, i + 3)), i + 3)
          : (r
              ? (this.error = new u.YAMLSemanticError(
                  this,
                  "Missing directives-end indicator line"
                ))
              : this.directives.length > 0 &&
                ((this.contents = this.directives), (this.directives = [])),
            i);
      }
      parseContents(e) {
        let { parseNode: t, src: n } = this.context;
        this.contents || (this.contents = []);
        let r = e;
        for (; n[r - 1] === "-"; ) r -= 1;
        let i = u.Node.endOfWhiteSpace(n, e),
          o = r === e;
        for (
          this.valueRange = new u.Range(i);
          !u.Node.atDocumentBoundary(n, i, u.Char.DOCUMENT_END);
        ) {
          switch (n[i]) {
            case `
`:
              if (o) {
                let a = new J();
                ((i = a.parse({ src: n }, i)), i < n.length && this.contents.push(a));
              } else ((i += 1), (o = true));
              r = i;
              break;
            case "#":
              {
                let a = new V();
                ((i = a.parse({ src: n }, i)), this.contents.push(a), (o = false));
              }
              break;
            default: {
              let a = u.Node.endOfIndent(n, i),
                c = t(
                  {
                    atLineStart: o,
                    indent: -1,
                    inFlow: false,
                    inCollection: false,
                    lineStart: r,
                    parent: this,
                  },
                  a
                );
              if (!c) return (this.valueRange.end = a);
              (this.contents.push(c), (i = c.range.end), (o = false));
              let f = Fe(c);
              f && Array.prototype.push.apply(this.contents, f);
            }
          }
          i = s.startCommentOrEndBlankLine(n, i);
        }
        if (
          ((this.valueRange.end = i),
          n[i] && ((this.documentEndMarker = new u.Range(i, i + 3)), (i += 3), n[i]))
        ) {
          if (((i = u.Node.endOfWhiteSpace(n, i)), n[i] === "#")) {
            let a = new V();
            ((i = a.parse({ src: n }, i)), this.contents.push(a));
          }
          switch (n[i]) {
            case `
`:
              i += 1;
              break;
            case void 0:
              break;
            default:
              this.error = new u.YAMLSyntaxError(
                this,
                "Document end marker line cannot have a non-comment suffix"
              );
          }
        }
        return i;
      }
      parse(e, t) {
        ((e.root = this), (this.context = e));
        let { src: n } = e,
          r = n.charCodeAt(t) === 65279 ? t + 1 : t;
        return ((r = this.parseDirectives(r)), (r = this.parseContents(r)), r);
      }
      setOrigRanges(e, t) {
        return (
          (t = super.setOrigRanges(e, t)),
          this.directives.forEach((n) => {
            t = n.setOrigRanges(e, t);
          }),
          this.directivesEndMarker && (t = this.directivesEndMarker.setOrigRange(e, t)),
          this.contents.forEach((n) => {
            t = n.setOrigRanges(e, t);
          }),
          this.documentEndMarker && (t = this.documentEndMarker.setOrigRange(e, t)),
          t
        );
      }
      toString() {
        let { contents: e, directives: t, value: n } = this;
        if (n != null) return n;
        let r = t.join("");
        return (
          e.length > 0 &&
            ((t.length > 0 || e[0].type === u.Type.COMMENT) &&
              (r += `---
`),
            (r += e.join(""))),
          r[r.length - 1] !==
            `
` &&
            (r += `
`),
          r
        );
      }
    },
    We = class extends u.Node {
      parse(e, t) {
        this.context = e;
        let { src: n } = e,
          r = u.Node.endOfIdentifier(n, t + 1);
        return (
          (this.valueRange = new u.Range(t + 1, r)),
          (r = u.Node.endOfWhiteSpace(n, r)),
          (r = this.parseComment(r)),
          r
        );
      }
    },
    F = { CLIP: "CLIP", KEEP: "KEEP", STRIP: "STRIP" },
    Ue = class extends u.Node {
      constructor(e, t) {
        (super(e, t), (this.blockIndent = null), (this.chomping = F.CLIP), (this.header = null));
      }
      get includesTrailingLines() {
        return this.chomping === F.KEEP;
      }
      get strValue() {
        if (!this.valueRange || !this.context) return null;
        let { start: e, end: t } = this.valueRange,
          { indent: n, src: r } = this.context;
        if (this.valueRange.isEmpty()) return "";
        let i = null,
          o = r[t - 1];
        for (
          ;
          o ===
            `
` ||
          o === "	" ||
          o === " ";
        ) {
          if (((t -= 1), t <= e)) {
            if (this.chomping === F.KEEP) break;
            return "";
          }
          (o ===
            `
` && (i = t),
            (o = r[t - 1]));
        }
        let a = t + 1;
        i && (this.chomping === F.KEEP ? ((a = i), (t = this.valueRange.end)) : (t = i));
        let l = n + this.blockIndent,
          c = this.type === u.Type.BLOCK_FOLDED,
          f = true,
          d = "",
          g = "",
          m = false;
        for (let h = e; h < t; ++h) {
          for (let w = 0; w < l && r[h] === " "; ++w) h += 1;
          let y = r[h];
          if (
            y ===
            `
`
          )
            g ===
            `
`
              ? (d += `
`)
              : (g = `
`);
          else {
            let w = u.Node.endOfLine(r, h),
              A = r.slice(h, w);
            ((h = w),
              c && (y === " " || y === "	") && h < a
                ? (g === " "
                    ? (g = `
`)
                    : !m &&
                      !f &&
                      g ===
                        `
` &&
                      (g = `

`),
                  (d += g + A),
                  (g = (w < t && r[w]) || ""),
                  (m = true))
                : ((d += g + A),
                  (g =
                    c && h < a
                      ? " "
                      : `
`),
                  (m = false)),
              f && A !== "" && (f = false));
          }
        }
        return this.chomping === F.STRIP
          ? d
          : d +
              `
`;
      }
      parseBlockHeader(e) {
        let { src: t } = this.context,
          n = e + 1,
          r = "";
        for (;;) {
          let i = t[n];
          switch (i) {
            case "-":
              this.chomping = F.STRIP;
              break;
            case "+":
              this.chomping = F.KEEP;
              break;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              r += i;
              break;
            default:
              return ((this.blockIndent = Number(r) || null), (this.header = new u.Range(e, n)), n);
          }
          n += 1;
        }
      }
      parseBlockValue(e) {
        let { indent: t, src: n } = this.context,
          r = !!this.blockIndent,
          i = e,
          o = e,
          a = 1;
        for (
          let l = n[i];
          l ===
            `
` && ((i += 1), !u.Node.atDocumentBoundary(n, i));
          l = n[i]
        ) {
          let c = u.Node.endOfBlockIndent(n, t, i);
          if (c === null) break;
          let f = n[c],
            d = c - (i + t);
          if (this.blockIndent) {
            if (
              f &&
              f !==
                `
` &&
              d < this.blockIndent
            ) {
              if (n[c] === "#") break;
              if (!this.error) {
                let m = `Block scalars must not be less indented than their ${r ? "explicit indentation indicator" : "first line"}`;
                this.error = new u.YAMLSemanticError(this, m);
              }
            }
          } else if (
            n[c] !==
            `
`
          ) {
            if (d < a) {
              let g =
                "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
              this.error = new u.YAMLSemanticError(this, g);
            }
            this.blockIndent = d;
          } else d > a && (a = d);
          n[c] ===
          `
`
            ? (i = c)
            : (i = o = u.Node.endOfLine(n, c));
        }
        return (
          this.chomping !== F.KEEP && (i = n[o] ? o + 1 : o),
          (this.valueRange = new u.Range(e + 1, i)),
          i
        );
      }
      parse(e, t) {
        this.context = e;
        let { src: n } = e,
          r = this.parseBlockHeader(t);
        return (
          (r = u.Node.endOfWhiteSpace(n, r)),
          (r = this.parseComment(r)),
          (r = this.parseBlockValue(r)),
          r
        );
      }
      setOrigRanges(e, t) {
        return ((t = super.setOrigRanges(e, t)), this.header ? this.header.setOrigRange(e, t) : t);
      }
    },
    Ke = class extends u.Node {
      constructor(e, t) {
        (super(e, t), (this.items = null));
      }
      prevNodeIsJsonLike(e = this.items.length) {
        let t = this.items[e - 1];
        return !!t && (t.jsonLike || (t.type === u.Type.COMMENT && this.prevNodeIsJsonLike(e - 1)));
      }
      parse(e, t) {
        this.context = e;
        let { parseNode: n, src: r } = e,
          { indent: i, lineStart: o } = e,
          a = r[t];
        this.items = [{ char: a, offset: t }];
        let l = u.Node.endOfWhiteSpace(r, t + 1);
        for (a = r[l]; a && a !== "]" && a !== "}"; ) {
          switch (a) {
            case `
`:
              {
                o = l + 1;
                let c = u.Node.endOfWhiteSpace(r, o);
                if (
                  r[c] ===
                  `
`
                ) {
                  let f = new J();
                  ((o = f.parse({ src: r }, o)), this.items.push(f));
                }
                if (
                  ((l = u.Node.endOfIndent(r, o)),
                  l <= o + i && ((a = r[l]), l < o + i || (a !== "]" && a !== "}")))
                ) {
                  let f = "Insufficient indentation in flow collection";
                  this.error = new u.YAMLSemanticError(this, f);
                }
              }
              break;
            case ",":
              (this.items.push({ char: a, offset: l }), (l += 1));
              break;
            case "#":
              {
                let c = new V();
                ((l = c.parse({ src: r }, l)), this.items.push(c));
              }
              break;
            case "?":
            case ":": {
              let c = r[l + 1];
              if (
                c ===
                  `
` ||
                c === "	" ||
                c === " " ||
                c === "," ||
                (a === ":" && this.prevNodeIsJsonLike())
              ) {
                (this.items.push({ char: a, offset: l }), (l += 1));
                break;
              }
            }
            default: {
              let c = n(
                {
                  atLineStart: false,
                  inCollection: false,
                  inFlow: true,
                  indent: -1,
                  lineStart: o,
                  parent: this,
                },
                l
              );
              if (!c) return ((this.valueRange = new u.Range(t, l)), l);
              (this.items.push(c), (l = u.Node.normalizeOffset(r, c.range.end)));
            }
          }
          ((l = u.Node.endOfWhiteSpace(r, l)), (a = r[l]));
        }
        return (
          (this.valueRange = new u.Range(t, l + 1)),
          a &&
            (this.items.push({ char: a, offset: l }),
            (l = u.Node.endOfWhiteSpace(r, l + 1)),
            (l = this.parseComment(l))),
          l
        );
      }
      setOrigRanges(e, t) {
        return (
          (t = super.setOrigRanges(e, t)),
          this.items.forEach((n) => {
            if (n instanceof u.Node) t = n.setOrigRanges(e, t);
            else if (e.length === 0) n.origOffset = n.offset;
            else {
              let r = t;
              for (; r < e.length && !(e[r] > n.offset); ) ++r;
              ((n.origOffset = n.offset + r), (t = r));
            }
          }),
          t
        );
      }
      toString() {
        let {
          context: { src: e },
          items: t,
          range: n,
          value: r,
        } = this;
        if (r != null) return r;
        let i = t.filter((l) => l instanceof u.Node),
          o = "",
          a = n.start;
        return (
          i.forEach((l) => {
            let c = e.slice(a, l.range.start);
            ((a = l.range.end),
              (o += c + String(l)),
              o[o.length - 1] ===
                `
` &&
                e[a - 1] !==
                  `
` &&
                e[a] ===
                  `
` &&
                (a += 1));
          }),
          (o += e.slice(a, n.end)),
          u.Node.addStringTerminator(e, n.end, o)
        );
      }
    },
    Ve = class s extends u.Node {
      static endOfQuote(e, t) {
        let n = e[t];
        for (; n && n !== '"'; ) ((t += n === "\\" ? 2 : 1), (n = e[t]));
        return t + 1;
      }
      get strValue() {
        if (!this.valueRange || !this.context) return null;
        let e = [],
          { start: t, end: n } = this.valueRange,
          { indent: r, src: i } = this.context;
        i[n - 1] !== '"' && e.push(new u.YAMLSyntaxError(this, 'Missing closing "quote'));
        let o = "";
        for (let a = t + 1; a < n - 1; ++a) {
          let l = i[a];
          if (
            l ===
            `
`
          ) {
            u.Node.atDocumentBoundary(i, a + 1) &&
              e.push(
                new u.YAMLSemanticError(
                  this,
                  "Document boundary indicators are not allowed within string values"
                )
              );
            let { fold: c, offset: f, error: d } = u.Node.foldNewline(i, a, r);
            ((o += c),
              (a = f),
              d &&
                e.push(
                  new u.YAMLSemanticError(
                    this,
                    "Multi-line double-quoted string needs to be sufficiently indented"
                  )
                ));
          } else if (l === "\\")
            switch (((a += 1), i[a])) {
              case "0":
                o += "\0";
                break;
              case "a":
                o += "\x07";
                break;
              case "b":
                o += "\b";
                break;
              case "e":
                o += "\x1B";
                break;
              case "f":
                o += "\f";
                break;
              case "n":
                o += `
`;
                break;
              case "r":
                o += "\r";
                break;
              case "t":
                o += "	";
                break;
              case "v":
                o += "\v";
                break;
              case "N":
                o += "\x85";
                break;
              case "_":
                o += "\xA0";
                break;
              case "L":
                o += "\u2028";
                break;
              case "P":
                o += "\u2029";
                break;
              case " ":
                o += " ";
                break;
              case '"':
                o += '"';
                break;
              case "/":
                o += "/";
                break;
              case "\\":
                o += "\\";
                break;
              case "	":
                o += "	";
                break;
              case "x":
                ((o += this.parseCharCode(a + 1, 2, e)), (a += 2));
                break;
              case "u":
                ((o += this.parseCharCode(a + 1, 4, e)), (a += 4));
                break;
              case "U":
                ((o += this.parseCharCode(a + 1, 8, e)), (a += 8));
                break;
              case `
`:
                for (; i[a + 1] === " " || i[a + 1] === "	"; ) a += 1;
                break;
              default:
                (e.push(
                  new u.YAMLSyntaxError(this, `Invalid escape sequence ${i.substr(a - 1, 2)}`)
                ),
                  (o += "\\" + i[a]));
            }
          else if (l === " " || l === "	") {
            let c = a,
              f = i[a + 1];
            for (; f === " " || f === "	"; ) ((a += 1), (f = i[a + 1]));
            f !==
              `
` && (o += a > c ? i.slice(c, a + 1) : l);
          } else o += l;
        }
        return e.length > 0 ? { errors: e, str: o } : o;
      }
      parseCharCode(e, t, n) {
        let { src: r } = this.context,
          i = r.substr(e, t),
          a = i.length === t && /^[0-9a-fA-F]+$/.test(i) ? parseInt(i, 16) : NaN;
        return isNaN(a)
          ? (n.push(
              new u.YAMLSyntaxError(this, `Invalid escape sequence ${r.substr(e - 2, t + 2)}`)
            ),
            r.substr(e - 2, t + 2))
          : String.fromCodePoint(a);
      }
      parse(e, t) {
        this.context = e;
        let { src: n } = e,
          r = s.endOfQuote(n, t + 1);
        return (
          (this.valueRange = new u.Range(t, r)),
          (r = u.Node.endOfWhiteSpace(n, r)),
          (r = this.parseComment(r)),
          r
        );
      }
    },
    Je = class s extends u.Node {
      static endOfQuote(e, t) {
        let n = e[t];
        for (; n; )
          if (n === "'") {
            if (e[t + 1] !== "'") break;
            n = e[(t += 2)];
          } else n = e[(t += 1)];
        return t + 1;
      }
      get strValue() {
        if (!this.valueRange || !this.context) return null;
        let e = [],
          { start: t, end: n } = this.valueRange,
          { indent: r, src: i } = this.context;
        i[n - 1] !== "'" && e.push(new u.YAMLSyntaxError(this, "Missing closing 'quote"));
        let o = "";
        for (let a = t + 1; a < n - 1; ++a) {
          let l = i[a];
          if (
            l ===
            `
`
          ) {
            u.Node.atDocumentBoundary(i, a + 1) &&
              e.push(
                new u.YAMLSemanticError(
                  this,
                  "Document boundary indicators are not allowed within string values"
                )
              );
            let { fold: c, offset: f, error: d } = u.Node.foldNewline(i, a, r);
            ((o += c),
              (a = f),
              d &&
                e.push(
                  new u.YAMLSemanticError(
                    this,
                    "Multi-line single-quoted string needs to be sufficiently indented"
                  )
                ));
          } else if (l === "'")
            ((o += l),
              (a += 1),
              i[a] !== "'" &&
                e.push(
                  new u.YAMLSyntaxError(this, "Unescaped single quote? This should not happen.")
                ));
          else if (l === " " || l === "	") {
            let c = a,
              f = i[a + 1];
            for (; f === " " || f === "	"; ) ((a += 1), (f = i[a + 1]));
            f !==
              `
` && (o += a > c ? i.slice(c, a + 1) : l);
          } else o += l;
        }
        return e.length > 0 ? { errors: e, str: o } : o;
      }
      parse(e, t) {
        this.context = e;
        let { src: n } = e,
          r = s.endOfQuote(n, t + 1);
        return (
          (this.valueRange = new u.Range(t, r)),
          (r = u.Node.endOfWhiteSpace(n, r)),
          (r = this.parseComment(r)),
          r
        );
      }
    };
  function Ln(s, e) {
    switch (s) {
      case u.Type.ALIAS:
        return new We(s, e);
      case u.Type.BLOCK_FOLDED:
      case u.Type.BLOCK_LITERAL:
        return new Ue(s, e);
      case u.Type.FLOW_MAP:
      case u.Type.FLOW_SEQ:
        return new Ke(s, e);
      case u.Type.MAP_KEY:
      case u.Type.MAP_VALUE:
      case u.Type.SEQ_ITEM:
        return new oe(s, e);
      case u.Type.COMMENT:
      case u.Type.PLAIN:
        return new u.PlainValue(s, e);
      case u.Type.QUOTE_DOUBLE:
        return new Ve(s, e);
      case u.Type.QUOTE_SINGLE:
        return new Je(s, e);
      default:
        return null;
    }
  }
  var Qe = class s {
    static parseType(e, t, n) {
      switch (e[t]) {
        case "*":
          return u.Type.ALIAS;
        case ">":
          return u.Type.BLOCK_FOLDED;
        case "|":
          return u.Type.BLOCK_LITERAL;
        case "{":
          return u.Type.FLOW_MAP;
        case "[":
          return u.Type.FLOW_SEQ;
        case "?":
          return !n && u.Node.atBlank(e, t + 1, true) ? u.Type.MAP_KEY : u.Type.PLAIN;
        case ":":
          return !n && u.Node.atBlank(e, t + 1, true) ? u.Type.MAP_VALUE : u.Type.PLAIN;
        case "-":
          return !n && u.Node.atBlank(e, t + 1, true) ? u.Type.SEQ_ITEM : u.Type.PLAIN;
        case '"':
          return u.Type.QUOTE_DOUBLE;
        case "'":
          return u.Type.QUOTE_SINGLE;
        default:
          return u.Type.PLAIN;
      }
    }
    constructor(
      e = {},
      { atLineStart: t, inCollection: n, inFlow: r, indent: i, lineStart: o, parent: a } = {}
    ) {
      (u._defineProperty(this, "parseNode", (l, c) => {
        if (u.Node.atDocumentBoundary(this.src, c)) return null;
        let f = new s(this, l),
          { props: d, type: g, valueStart: m } = f.parseProps(c),
          h = Ln(g, d),
          y = h.parse(f, m);
        if (
          ((h.range = new u.Range(c, y)),
          y <= c &&
            ((h.error = new Error("Node#parse consumed no characters")),
            (h.error.parseEnd = y),
            (h.error.source = h),
            (h.range.end = c + 1)),
          f.nodeStartsCollection(h))
        ) {
          !h.error &&
            !f.atLineStart &&
            f.parent.type === u.Type.DOCUMENT &&
            (h.error = new u.YAMLSyntaxError(
              h,
              "Block collection must not have preceding content here (e.g. directives-end indicator)"
            ));
          let w = new me(h);
          return ((y = w.parse(new s(f), y)), (w.range = new u.Range(c, y)), w);
        }
        return h;
      }),
        (this.atLineStart = t ?? (e.atLineStart || false)),
        (this.inCollection = n ?? (e.inCollection || false)),
        (this.inFlow = r ?? (e.inFlow || false)),
        (this.indent = i ?? e.indent),
        (this.lineStart = o ?? e.lineStart),
        (this.parent = a ?? (e.parent || {})),
        (this.root = e.root),
        (this.src = e.src));
    }
    nodeStartsCollection(e) {
      let { inCollection: t, inFlow: n, src: r } = this;
      if (t || n) return false;
      if (e instanceof oe) return true;
      let i = e.range.end;
      return r[i] ===
        `
` ||
        r[i - 1] ===
          `
`
        ? false
        : ((i = u.Node.endOfWhiteSpace(r, i)), r[i] === ":");
    }
    parseProps(e) {
      let { inFlow: t, parent: n, src: r } = this,
        i = [],
        o = false;
      e = this.atLineStart ? u.Node.endOfIndent(r, e) : u.Node.endOfWhiteSpace(r, e);
      let a = r[e];
      for (
        ;
        a === u.Char.ANCHOR ||
        a === u.Char.COMMENT ||
        a === u.Char.TAG ||
        a ===
          `
`;
      ) {
        if (
          a ===
          `
`
        ) {
          let c = e,
            f;
          do ((f = c + 1), (c = u.Node.endOfIndent(r, f)));
          while (
            r[c] ===
            `
`
          );
          let d = c - (f + this.indent),
            g = n.type === u.Type.SEQ_ITEM && n.context.atLineStart;
          if (r[c] !== "#" && !u.Node.nextNodeIsIndented(r[c], d, !g)) break;
          ((this.atLineStart = true), (this.lineStart = f), (o = false), (e = c));
        } else if (a === u.Char.COMMENT) {
          let c = u.Node.endOfLine(r, e + 1);
          (i.push(new u.Range(e, c)), (e = c));
        } else {
          let c = u.Node.endOfIdentifier(r, e + 1);
          (a === u.Char.TAG &&
            r[c] === "," &&
            /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+,\d\d\d\d(-\d\d){0,2}\/\S/.test(r.slice(e + 1, c + 13)) &&
            (c = u.Node.endOfIdentifier(r, c + 5)),
            i.push(new u.Range(e, c)),
            (o = true),
            (e = u.Node.endOfWhiteSpace(r, c)));
        }
        a = r[e];
      }
      o && a === ":" && u.Node.atBlank(r, e + 1, true) && (e -= 1);
      let l = s.parseType(r, e, t);
      return { props: i, type: l, valueStart: e };
    }
  };
  function An(s) {
    let e = [];
    s.indexOf("\r") !== -1 &&
      (s = s.replace(
        /\r\n?/g,
        (r, i) => (
          r.length > 1 && e.push(i),
          `
`
        )
      ));
    let t = [],
      n = 0;
    do {
      let r = new qe(),
        i = new Qe({ src: s });
      ((n = r.parse(i, n)), t.push(r));
    } while (n < s.length);
    return (
      (t.setOrigRanges = () => {
        if (e.length === 0) return false;
        for (let i = 1; i < e.length; ++i) e[i] -= i;
        let r = 0;
        for (let i = 0; i < t.length; ++i) r = t[i].setOrigRanges(e, r);
        return (e.splice(0, e.length), true);
      }),
      (t.toString = () =>
        t.join(`...
`)),
      t
    );
  }
  bt.parse = An;
});
var ce = I((M) => {
  "use strict";
  var p = K();
  function Tn(s, e, t) {
    return t
      ? `#${t.replace(/[\s\S]^/gm, `$&${e}#`)}
${e}${s}`
      : s;
  }
  function Z(s, e, t) {
    return t
      ? t.indexOf(`
`) === -1
        ? `${s} #${t}`
        : `${s}
` + t.replace(/^/gm, `${e || ""}#`)
      : s;
  }
  var x = class {};
  function D(s, e, t) {
    if (Array.isArray(s)) return s.map((n, r) => D(n, String(r), t));
    if (s && typeof s.toJSON == "function") {
      let n = t && t.anchors && t.anchors.get(s);
      n &&
        (t.onCreate = (i) => {
          ((n.res = i), delete t.onCreate);
        });
      let r = s.toJSON(e, t);
      return (n && t.onCreate && t.onCreate(r), r);
    }
    return (!t || !t.keep) && typeof s == "bigint" ? Number(s) : s;
  }
  var v = class extends x {
    constructor(e) {
      (super(), (this.value = e));
    }
    toJSON(e, t) {
      return t && t.keep ? this.value : D(this.value, e, t);
    }
    toString() {
      return String(this.value);
    }
  };
  function St(s, e, t) {
    let n = t;
    for (let r = e.length - 1; r >= 0; --r) {
      let i = e[r];
      if (Number.isInteger(i) && i >= 0) {
        let o = [];
        ((o[i] = n), (n = o));
      } else {
        let o = {};
        (Object.defineProperty(o, i, {
          value: n,
          writable: true,
          enumerable: true,
          configurable: true,
        }),
          (n = o));
      }
    }
    return s.createNode(n, false);
  }
  var Nt = (s) => s == null || (typeof s == "object" && s[Symbol.iterator]().next().done),
    C = class s extends x {
      constructor(e) {
        (super(), p._defineProperty(this, "items", []), (this.schema = e));
      }
      addIn(e, t) {
        if (Nt(e)) this.add(t);
        else {
          let [n, ...r] = e,
            i = this.get(n, true);
          if (i instanceof s) i.addIn(r, t);
          else if (i === void 0 && this.schema) this.set(n, St(this.schema, r, t));
          else throw new Error(`Expected YAML collection at ${n}. Remaining path: ${r}`);
        }
      }
      deleteIn([e, ...t]) {
        if (t.length === 0) return this.delete(e);
        let n = this.get(e, true);
        if (n instanceof s) return n.deleteIn(t);
        throw new Error(`Expected YAML collection at ${e}. Remaining path: ${t}`);
      }
      getIn([e, ...t], n) {
        let r = this.get(e, true);
        return t.length === 0
          ? !n && r instanceof v
            ? r.value
            : r
          : r instanceof s
            ? r.getIn(t, n)
            : void 0;
      }
      hasAllNullValues() {
        return this.items.every((e) => {
          if (!e || e.type !== "PAIR") return false;
          let t = e.value;
          return (
            t == null ||
            (t instanceof v && t.value == null && !t.commentBefore && !t.comment && !t.tag)
          );
        });
      }
      hasIn([e, ...t]) {
        if (t.length === 0) return this.has(e);
        let n = this.get(e, true);
        return n instanceof s ? n.hasIn(t) : false;
      }
      setIn([e, ...t], n) {
        if (t.length === 0) this.set(e, n);
        else {
          let r = this.get(e, true);
          if (r instanceof s) r.setIn(t, n);
          else if (r === void 0 && this.schema) this.set(e, St(this.schema, t, n));
          else throw new Error(`Expected YAML collection at ${e}. Remaining path: ${t}`);
        }
      }
      toJSON() {
        return null;
      }
      toString(e, { blockItem: t, flowChars: n, isMap: r, itemIndent: i }, o, a) {
        let { indent: l, indentStep: c, stringify: f } = e,
          d = this.type === p.Type.FLOW_MAP || this.type === p.Type.FLOW_SEQ || e.inFlow;
        d && (i += c);
        let g = r && this.hasAllNullValues();
        e = Object.assign({}, e, { allNullValues: g, indent: i, inFlow: d, type: null });
        let m = false,
          h = false,
          y = this.items.reduce((A, E, N) => {
            let L;
            (E &&
              (!m && E.spaceBefore && A.push({ type: "comment", str: "" }),
              E.commentBefore &&
                E.commentBefore.match(/^.*$/gm).forEach((dn) => {
                  A.push({ type: "comment", str: `#${dn}` });
                }),
              E.comment && (L = E.comment),
              d &&
                ((!m && E.spaceBefore) ||
                  E.commentBefore ||
                  E.comment ||
                  (E.key && (E.key.commentBefore || E.key.comment)) ||
                  (E.value && (E.value.commentBefore || E.value.comment))) &&
                (h = true)),
              (m = false));
            let k = f(
              E,
              e,
              () => (L = null),
              () => (m = true)
            );
            return (
              d &&
                !h &&
                k.includes(`
`) &&
                (h = true),
              d && N < this.items.length - 1 && (k += ","),
              (k = Z(k, i, L)),
              m && (L || d) && (m = false),
              A.push({ type: "item", str: k }),
              A
            );
          }, []),
          w;
        if (y.length === 0) w = n.start + n.end;
        else if (d) {
          let { start: A, end: E } = n,
            N = y.map((L) => L.str);
          if (h || N.reduce((L, k) => L + k.length + 2, 2) > s.maxFlowStringSingleLineLength) {
            w = A;
            for (let L of N)
              w += L
                ? `
${c}${l}${L}`
                : `
`;
            w += `
${l}${E}`;
          } else w = `${A} ${N.join(" ")} ${E}`;
        } else {
          let A = y.map(t);
          w = A.shift();
          for (let E of A)
            w += E
              ? `
${l}${E}`
              : `
`;
        }
        return (
          this.comment
            ? ((w +=
                `
` + this.comment.replace(/^/gm, `${l}#`)),
              o && o())
            : m && a && a(),
          w
        );
      }
    };
  p._defineProperty(C, "maxFlowStringSingleLineLength", 60);
  function ye(s) {
    let e = s instanceof v ? s.value : s;
    return (e && typeof e == "string" && (e = Number(e)), Number.isInteger(e) && e >= 0 ? e : null);
  }
  var q = class extends C {
      add(e) {
        this.items.push(e);
      }
      delete(e) {
        let t = ye(e);
        return typeof t != "number" ? false : this.items.splice(t, 1).length > 0;
      }
      get(e, t) {
        let n = ye(e);
        if (typeof n != "number") return;
        let r = this.items[n];
        return !t && r instanceof v ? r.value : r;
      }
      has(e) {
        let t = ye(e);
        return typeof t == "number" && t < this.items.length;
      }
      set(e, t) {
        let n = ye(e);
        if (typeof n != "number") throw new Error(`Expected a valid index, not ${e}.`);
        this.items[n] = t;
      }
      toJSON(e, t) {
        let n = [];
        t && t.onCreate && t.onCreate(n);
        let r = 0;
        for (let i of this.items) n.push(D(i, String(r++), t));
        return n;
      }
      toString(e, t, n) {
        return e
          ? super.toString(
              e,
              {
                blockItem: (r) => (r.type === "comment" ? r.str : `- ${r.str}`),
                flowChars: { start: "[", end: "]" },
                isMap: false,
                itemIndent: (e.indent || "") + "  ",
              },
              t,
              n
            )
          : JSON.stringify(this);
      }
    },
    Mn = (s, e, t) =>
      e === null
        ? ""
        : typeof e != "object"
          ? String(e)
          : s instanceof x && t && t.doc
            ? s.toString({
                anchors: /* @__PURE__ */ Object.create(null),
                doc: t.doc,
                indent: "",
                indentStep: t.indentStep,
                inFlow: true,
                inStringifyKey: true,
                stringify: t.stringify,
              })
            : JSON.stringify(e),
    T = class s extends x {
      constructor(e, t = null) {
        (super(), (this.key = e), (this.value = t), (this.type = s.Type.PAIR));
      }
      get commentBefore() {
        return this.key instanceof x ? this.key.commentBefore : void 0;
      }
      set commentBefore(e) {
        if ((this.key == null && (this.key = new v(null)), this.key instanceof x))
          this.key.commentBefore = e;
        else {
          let t =
            "Pair.commentBefore is an alias for Pair.key.commentBefore. To set it, the key must be a Node.";
          throw new Error(t);
        }
      }
      addToJSMap(e, t) {
        let n = D(this.key, "", e);
        if (t instanceof Map) {
          let r = D(this.value, n, e);
          t.set(n, r);
        } else if (t instanceof Set) t.add(n);
        else {
          let r = Mn(this.key, n, e),
            i = D(this.value, r, e);
          r in t
            ? Object.defineProperty(t, r, {
                value: i,
                writable: true,
                enumerable: true,
                configurable: true,
              })
            : (t[r] = i);
        }
        return t;
      }
      toJSON(e, t) {
        let n = t && t.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return this.addToJSMap(t, n);
      }
      toString(e, t, n) {
        if (!e || !e.doc) return JSON.stringify(this);
        let { indent: r, indentSeq: i, simpleKeys: o } = e.doc.options,
          { key: a, value: l } = this,
          c = a instanceof x && a.comment;
        if (o) {
          if (c) throw new Error("With simple keys, key nodes cannot have comments");
          if (a instanceof C) {
            let k = "With simple keys, collection cannot be used as a key value";
            throw new Error(k);
          }
        }
        let f =
            !o &&
            (!a ||
              c ||
              (a instanceof x
                ? a instanceof C ||
                  a.type === p.Type.BLOCK_FOLDED ||
                  a.type === p.Type.BLOCK_LITERAL
                : typeof a == "object")),
          { doc: d, indent: g, indentStep: m, stringify: h } = e;
        e = Object.assign({}, e, { implicitKey: !f, indent: g + m });
        let y = false,
          w = h(
            a,
            e,
            () => (c = null),
            () => (y = true)
          );
        if (((w = Z(w, e.indent, c)), !f && w.length > 1024)) {
          if (o)
            throw new Error(
              "With simple keys, single line scalar must not span more than 1024 characters"
            );
          f = true;
        }
        if (e.allNullValues && !o)
          return (
            this.comment ? ((w = Z(w, e.indent, this.comment)), t && t()) : y && !c && n && n(),
            e.inFlow && !f ? w : `? ${w}`
          );
        ((w = f
          ? `? ${w}
${g}:`
          : `${w}:`),
          this.comment && ((w = Z(w, e.indent, this.comment)), t && t()));
        let A = "",
          E = null;
        if (l instanceof x) {
          if (
            (l.spaceBefore &&
              (A = `
`),
            l.commentBefore)
          ) {
            let k = l.commentBefore.replace(/^/gm, `${e.indent}#`);
            A += `
${k}`;
          }
          E = l.comment;
        } else l && typeof l == "object" && (l = d.schema.createNode(l, true));
        ((e.implicitKey = false),
          !f && !this.comment && l instanceof v && (e.indentAtStart = w.length + 1),
          (y = false),
          !i &&
            r >= 2 &&
            !e.inFlow &&
            !f &&
            l instanceof q &&
            l.type !== p.Type.FLOW_SEQ &&
            !l.tag &&
            !d.anchors.getName(l) &&
            (e.indent = e.indent.substr(2)));
        let N = h(
            l,
            e,
            () => (E = null),
            () => (y = true)
          ),
          L = " ";
        return (
          A || this.comment
            ? (L = `${A}
${e.indent}`)
            : !f && l instanceof C
              ? (!(N[0] === "[" || N[0] === "{") ||
                  N.includes(`
`)) &&
                (L = `
${e.indent}`)
              : N[0] ===
                  `
` && (L = ""),
          y && !E && n && n(),
          Z(w + L + N, e.indent, E)
        );
      }
    };
  p._defineProperty(T, "Type", { PAIR: "PAIR", MERGE_PAIR: "MERGE_PAIR" });
  var be = (s, e) => {
      if (s instanceof G) {
        let t = e.get(s.source);
        return t.count * t.aliasCount;
      } else if (s instanceof C) {
        let t = 0;
        for (let n of s.items) {
          let r = be(n, e);
          r > t && (t = r);
        }
        return t;
      } else if (s instanceof T) {
        let t = be(s.key, e),
          n = be(s.value, e);
        return Math.max(t, n);
      }
      return 1;
    },
    G = class s extends x {
      static stringify(
        { range: e, source: t },
        { anchors: n, doc: r, implicitKey: i, inStringifyKey: o }
      ) {
        let a = Object.keys(n).find((c) => n[c] === t);
        if ((!a && o && (a = r.anchors.getName(t) || r.anchors.newName()), a))
          return `*${a}${i ? " " : ""}`;
        let l = r.anchors.getName(t)
          ? "Alias node must be after source node"
          : "Source node not found for alias node";
        throw new Error(`${l} [${e}]`);
      }
      constructor(e) {
        (super(), (this.source = e), (this.type = p.Type.ALIAS));
      }
      set tag(e) {
        throw new Error("Alias nodes cannot have tags");
      }
      toJSON(e, t) {
        if (!t) return D(this.source, e, t);
        let { anchors: n, maxAliasCount: r } = t,
          i = n.get(this.source);
        if (!i || i.res === void 0) {
          let o = "This should not happen: Alias anchor was not resolved?";
          throw this.cstNode ? new p.YAMLReferenceError(this.cstNode, o) : new ReferenceError(o);
        }
        if (
          r >= 0 &&
          ((i.count += 1),
          i.aliasCount === 0 && (i.aliasCount = be(this.source, n)),
          i.count * i.aliasCount > r)
        ) {
          let o = "Excessive alias count indicates a resource exhaustion attack";
          throw this.cstNode ? new p.YAMLReferenceError(this.cstNode, o) : new ReferenceError(o);
        }
        return i.res;
      }
      toString(e) {
        return s.stringify(this, e);
      }
    };
  p._defineProperty(G, "default", true);
  function ae(s, e) {
    let t = e instanceof v ? e.value : e;
    for (let n of s)
      if (n instanceof T && (n.key === e || n.key === t || (n.key && n.key.value === t))) return n;
  }
  var le = class extends C {
      add(e, t) {
        e ? e instanceof T || (e = new T(e.key || e, e.value)) : (e = new T(e));
        let n = ae(this.items, e.key),
          r = this.schema && this.schema.sortMapEntries;
        if (n)
          if (t) n.value = e.value;
          else throw new Error(`Key ${e.key} already set`);
        else if (r) {
          let i = this.items.findIndex((o) => r(e, o) < 0);
          i === -1 ? this.items.push(e) : this.items.splice(i, 0, e);
        } else this.items.push(e);
      }
      delete(e) {
        let t = ae(this.items, e);
        return t ? this.items.splice(this.items.indexOf(t), 1).length > 0 : false;
      }
      get(e, t) {
        let n = ae(this.items, e),
          r = n && n.value;
        return !t && r instanceof v ? r.value : r;
      }
      has(e) {
        return !!ae(this.items, e);
      }
      set(e, t) {
        this.add(new T(e, t), true);
      }
      toJSON(e, t, n) {
        let r = n ? new n() : t && t.mapAsMap ? /* @__PURE__ */ new Map() : {};
        t && t.onCreate && t.onCreate(r);
        for (let i of this.items) i.addToJSMap(t, r);
        return r;
      }
      toString(e, t, n) {
        if (!e) return JSON.stringify(this);
        for (let r of this.items)
          if (!(r instanceof T))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(r)} instead`);
        return super.toString(
          e,
          {
            blockItem: (r) => r.str,
            flowChars: { start: "{", end: "}" },
            isMap: true,
            itemIndent: e.indent || "",
          },
          t,
          n
        );
      }
    },
    Lt = "<<",
    Ee = class extends T {
      constructor(e) {
        if (e instanceof T) {
          let t = e.value;
          (t instanceof q || ((t = new q()), t.items.push(e.value), (t.range = e.value.range)),
            super(e.key, t),
            (this.range = e.range));
        } else super(new v(Lt), new q());
        this.type = T.Type.MERGE_PAIR;
      }
      addToJSMap(e, t) {
        for (let { source: n } of this.value.items) {
          if (!(n instanceof le)) throw new Error("Merge sources must be maps");
          let r = n.toJSON(null, e, Map);
          for (let [i, o] of r)
            t instanceof Map
              ? t.has(i) || t.set(i, o)
              : t instanceof Set
                ? t.add(i)
                : Object.prototype.hasOwnProperty.call(t, i) ||
                  Object.defineProperty(t, i, {
                    value: o,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                  });
        }
        return t;
      }
      toString(e, t) {
        let n = this.value;
        if (n.items.length > 1) return super.toString(e, t);
        this.value = n.items[0];
        let r = super.toString(e, t);
        return ((this.value = n), r);
      }
    },
    vn = { defaultType: p.Type.BLOCK_LITERAL, lineWidth: 76 },
    kn = { trueStr: "true", falseStr: "false" },
    In = { asBigInt: false },
    _n = { nullStr: "null" },
    H = {
      defaultType: p.Type.PLAIN,
      doubleQuoted: { jsonEncoding: false, minMultiLineLength: 40 },
      fold: { lineWidth: 80, minContentWidth: 20 },
    };
  function He(s, e, t) {
    for (let { format: n, test: r, resolve: i } of e)
      if (r) {
        let o = s.match(r);
        if (o) {
          let a = i.apply(null, o);
          return (a instanceof v || (a = new v(a)), n && (a.format = n), a);
        }
      }
    return (t && (s = t(s)), new v(s));
  }
  var At = "flow",
    Ge = "block",
    we = "quoted",
    Et = (s, e) => {
      let t = s[e + 1];
      for (; t === " " || t === "	"; ) {
        do t = s[(e += 1)];
        while (
          t &&
          t !==
            `
`
        );
        t = s[e + 1];
      }
      return e;
    };
  function Oe(
    s,
    e,
    t,
    { indentAtStart: n, lineWidth: r = 80, minContentWidth: i = 20, onFold: o, onOverflow: a }
  ) {
    if (!r || r < 0) return s;
    let l = Math.max(1 + i, 1 + r - e.length);
    if (s.length <= l) return s;
    let c = [],
      f = {},
      d = r - e.length;
    typeof n == "number" && (n > r - Math.max(2, i) ? c.push(0) : (d = r - n));
    let g,
      m,
      h = false,
      y = -1,
      w = -1,
      A = -1;
    t === Ge && ((y = Et(s, y)), y !== -1 && (d = y + l));
    for (let N; (N = s[(y += 1)]); ) {
      if (t === we && N === "\\") {
        switch (((w = y), s[y + 1])) {
          case "x":
            y += 3;
            break;
          case "u":
            y += 5;
            break;
          case "U":
            y += 9;
            break;
          default:
            y += 1;
        }
        A = y;
      }
      if (
        N ===
        `
`
      )
        (t === Ge && (y = Et(s, y)), (d = y + l), (g = void 0));
      else {
        if (
          N === " " &&
          m &&
          m !== " " &&
          m !==
            `
` &&
          m !== "	"
        ) {
          let L = s[y + 1];
          L &&
            L !== " " &&
            L !==
              `
` &&
            L !== "	" &&
            (g = y);
        }
        if (y >= d)
          if (g) (c.push(g), (d = g + l), (g = void 0));
          else if (t === we) {
            for (; m === " " || m === "	"; ) ((m = N), (N = s[(y += 1)]), (h = true));
            let L = y > A + 1 ? y - 2 : w - 1;
            if (f[L]) return s;
            (c.push(L), (f[L] = true), (d = L + l), (g = void 0));
          } else h = true;
      }
      m = N;
    }
    if ((h && a && a(), c.length === 0)) return s;
    o && o();
    let E = s.slice(0, c[0]);
    for (let N = 0; N < c.length; ++N) {
      let L = c[N],
        k = c[N + 1] || s.length;
      L === 0
        ? (E = `
${e}${s.slice(0, k)}`)
        : (t === we && f[L] && (E += `${s[L]}\\`),
          (E += `
${e}${s.slice(L + 1, k)}`));
    }
    return E;
  }
  var ze = ({ indentAtStart: s }) => (s ? Object.assign({ indentAtStart: s }, H.fold) : H.fold),
    Ne = (s) => /^(%|---|\.\.\.)/m.test(s);
  function Pn(s, e, t) {
    if (!e || e < 0) return false;
    let n = e - t,
      r = s.length;
    if (r <= n) return false;
    for (let i = 0, o = 0; i < r; ++i)
      if (
        s[i] ===
        `
`
      ) {
        if (i - o > n) return true;
        if (((o = i + 1), r - o <= n)) return false;
      }
    return true;
  }
  function Q(s, e) {
    let { implicitKey: t } = e,
      { jsonEncoding: n, minMultiLineLength: r } = H.doubleQuoted,
      i = JSON.stringify(s);
    if (n) return i;
    let o = e.indent || (Ne(s) ? "  " : ""),
      a = "",
      l = 0;
    for (let c = 0, f = i[c]; f; f = i[++c])
      if (
        (f === " " &&
          i[c + 1] === "\\" &&
          i[c + 2] === "n" &&
          ((a += i.slice(l, c) + "\\ "), (c += 1), (l = c), (f = "\\")),
        f === "\\")
      )
        switch (i[c + 1]) {
          case "u":
            {
              a += i.slice(l, c);
              let d = i.substr(c + 2, 4);
              switch (d) {
                case "0000":
                  a += "\\0";
                  break;
                case "0007":
                  a += "\\a";
                  break;
                case "000b":
                  a += "\\v";
                  break;
                case "001b":
                  a += "\\e";
                  break;
                case "0085":
                  a += "\\N";
                  break;
                case "00a0":
                  a += "\\_";
                  break;
                case "2028":
                  a += "\\L";
                  break;
                case "2029":
                  a += "\\P";
                  break;
                default:
                  d.substr(0, 2) === "00" ? (a += "\\x" + d.substr(2)) : (a += i.substr(c, 6));
              }
              ((c += 5), (l = c + 1));
            }
            break;
          case "n":
            if (t || i[c + 2] === '"' || i.length < r) c += 1;
            else {
              for (
                a +=
                  i.slice(l, c) +
                  `

`;
                i[c + 2] === "\\" && i[c + 3] === "n" && i[c + 4] !== '"';
              )
                ((a += `
`),
                  (c += 2));
              ((a += o), i[c + 2] === " " && (a += "\\"), (c += 1), (l = c + 1));
            }
            break;
          default:
            c += 1;
        }
    return ((a = l ? a + i.slice(l) : i), t ? a : Oe(a, o, we, ze(e)));
  }
  function Tt(s, e) {
    if (e.implicitKey) {
      if (/\n/.test(s)) return Q(s, e);
    } else if (/[ \t]\n|\n[ \t]/.test(s)) return Q(s, e);
    let t = e.indent || (Ne(s) ? "  " : ""),
      n =
        "'" +
        s.replace(/'/g, "''").replace(
          /\n+/g,
          `$&
${t}`
        ) +
        "'";
    return e.implicitKey ? n : Oe(n, t, At, ze(e));
  }
  function Se({ comment: s, type: e, value: t }, n, r, i) {
    if (/\n[\t ]+$/.test(t) || /^\s*$/.test(t)) return Q(t, n);
    let o = n.indent || (n.forceBlockIndent || Ne(t) ? "  " : ""),
      a = o ? "2" : "1",
      l =
        e === p.Type.BLOCK_FOLDED
          ? false
          : e === p.Type.BLOCK_LITERAL
            ? true
            : !Pn(t, H.fold.lineWidth, o.length),
      c = l ? "|" : ">";
    if (!t)
      return (
        c +
        `
`
      );
    let f = "",
      d = "";
    if (
      ((t = t
        .replace(/[\n\t ]*$/, (m) => {
          let h = m.indexOf(`
`);
          return (
            h === -1 ? (c += "-") : (t === m || h !== m.length - 1) && ((c += "+"), i && i()),
            (d = m.replace(/\n$/, "")),
            ""
          );
        })
        .replace(/^[\n ]*/, (m) => {
          m.indexOf(" ") !== -1 && (c += a);
          let h = m.match(/ +$/);
          return h ? ((f = m.slice(0, -h[0].length)), h[0]) : ((f = m), "");
        })),
      d && (d = d.replace(/\n+(?!\n|$)/g, `$&${o}`)),
      f && (f = f.replace(/\n+/g, `$&${o}`)),
      s && ((c += " #" + s.replace(/ ?[\r\n]+/g, " ")), r && r()),
      !t)
    )
      return `${c}${a}
${o}${d}`;
    if (l)
      return (
        (t = t.replace(/\n+/g, `$&${o}`)),
        `${c}
${o}${f}${t}${d}`
      );
    t = t
      .replace(
        /\n+/g,
        `
$&`
      )
      .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2")
      .replace(/\n+/g, `$&${o}`);
    let g = Oe(`${f}${t}${d}`, o, Ge, H.fold);
    return `${c}
${o}${g}`;
  }
  function $n(s, e, t, n) {
    let { comment: r, type: i, value: o } = s,
      { actualString: a, implicitKey: l, indent: c, inFlow: f } = e;
    if ((l && /[\n[\]{},]/.test(o)) || (f && /[[\]{},]/.test(o))) return Q(o, e);
    if (
      !o ||
      /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(o)
    )
      return l ||
        f ||
        o.indexOf(`
`) === -1
        ? o.indexOf('"') !== -1 && o.indexOf("'") === -1
          ? Tt(o, e)
          : Q(o, e)
        : Se(s, e, t, n);
    if (
      !l &&
      !f &&
      i !== p.Type.PLAIN &&
      o.indexOf(`
`) !== -1
    )
      return Se(s, e, t, n);
    if (c === "" && Ne(o)) return ((e.forceBlockIndent = true), Se(s, e, t, n));
    let d = o.replace(
      /\n+/g,
      `$&
${c}`
    );
    if (a) {
      let { tags: m } = e.doc.schema;
      if (typeof He(d, m, m.scalarFallback).value != "string") return Q(o, e);
    }
    let g = l ? d : Oe(d, c, At, ze(e));
    return r &&
      !f &&
      (g.indexOf(`
`) !== -1 ||
        r.indexOf(`
`) !== -1)
      ? (t && t(), Tn(g, c, r))
      : g;
  }
  function xn(s, e, t, n) {
    let { defaultType: r } = H,
      { implicitKey: i, inFlow: o } = e,
      { type: a, value: l } = s;
    typeof l != "string" && ((l = String(l)), (s = Object.assign({}, s, { value: l })));
    let c = (d) => {
      switch (d) {
        case p.Type.BLOCK_FOLDED:
        case p.Type.BLOCK_LITERAL:
          return Se(s, e, t, n);
        case p.Type.QUOTE_DOUBLE:
          return Q(l, e);
        case p.Type.QUOTE_SINGLE:
          return Tt(l, e);
        case p.Type.PLAIN:
          return $n(s, e, t, n);
        default:
          return null;
      }
    };
    ((a !== p.Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(l)) ||
      ((i || o) && (a === p.Type.BLOCK_FOLDED || a === p.Type.BLOCK_LITERAL))) &&
      (a = p.Type.QUOTE_DOUBLE);
    let f = c(a);
    if (f === null && ((f = c(r)), f === null))
      throw new Error(`Unsupported default string type ${r}`);
    return f;
  }
  function Cn({ format: s, minFractionDigits: e, tag: t, value: n }) {
    if (typeof n == "bigint") return String(n);
    if (!isFinite(n)) return isNaN(n) ? ".nan" : n < 0 ? "-.inf" : ".inf";
    let r = JSON.stringify(n);
    if (!s && e && (!t || t === "tag:yaml.org,2002:float") && /^\d/.test(r)) {
      let i = r.indexOf(".");
      i < 0 && ((i = r.length), (r += "."));
      let o = e - (r.length - i - 1);
      for (; o-- > 0; ) r += "0";
    }
    return r;
  }
  function Mt(s, e) {
    let t, n;
    switch (e.type) {
      case p.Type.FLOW_MAP:
        ((t = "}"), (n = "flow map"));
        break;
      case p.Type.FLOW_SEQ:
        ((t = "]"), (n = "flow sequence"));
        break;
      default:
        s.push(new p.YAMLSemanticError(e, "Not a flow collection!?"));
        return;
    }
    let r;
    for (let i = e.items.length - 1; i >= 0; --i) {
      let o = e.items[i];
      if (!o || o.type !== p.Type.COMMENT) {
        r = o;
        break;
      }
    }
    if (r && r.char !== t) {
      let i = `Expected ${n} to end with ${t}`,
        o;
      (typeof r.offset == "number"
        ? ((o = new p.YAMLSemanticError(e, i)), (o.offset = r.offset + 1))
        : ((o = new p.YAMLSemanticError(r, i)),
          r.range && r.range.end && (o.offset = r.range.end - r.range.start)),
        s.push(o));
    }
  }
  function vt(s, e) {
    let t = e.context.src[e.range.start - 1];
    if (
      t !==
        `
` &&
      t !== "	" &&
      t !== " "
    ) {
      let n = "Comments must be separated from other tokens by white space characters";
      s.push(new p.YAMLSemanticError(e, n));
    }
  }
  function kt(s, e) {
    let t = String(e),
      n = t.substr(0, 8) + "..." + t.substr(-8);
    return new p.YAMLSemanticError(s, `The "${n}" key is too long`);
  }
  function It(s, e) {
    for (let { afterKey: t, before: n, comment: r } of e) {
      let i = s.items[n];
      i
        ? (t && i.value && (i = i.value),
          r === void 0
            ? (t || !i.commentBefore) && (i.spaceBefore = true)
            : i.commentBefore
              ? (i.commentBefore +=
                  `
` + r)
              : (i.commentBefore = r))
        : r !== void 0 &&
          (s.comment
            ? (s.comment +=
                `
` + r)
            : (s.comment = r));
    }
  }
  function Xe(s, e) {
    let t = e.strValue;
    return t
      ? typeof t == "string"
        ? t
        : (t.errors.forEach((n) => {
            (n.source || (n.source = e), s.errors.push(n));
          }),
          t.str)
      : "";
  }
  function Rn(s, e) {
    let { handle: t, suffix: n } = e.tag,
      r = s.tagPrefixes.find((i) => i.handle === t);
    if (!r) {
      let i = s.getDefaults().tagPrefixes;
      if ((i && (r = i.find((o) => o.handle === t)), !r))
        throw new p.YAMLSemanticError(
          e,
          `The ${t} tag handle is non-default and was not declared.`
        );
    }
    if (!n) throw new p.YAMLSemanticError(e, `The ${t} tag has no suffix.`);
    if (t === "!" && (s.version || s.options.version) === "1.0") {
      if (n[0] === "^")
        return (
          s.warnings.push(new p.YAMLWarning(e, "YAML 1.0 ^ tag expansion is not supported")),
          n
        );
      if (/[:/]/.test(n)) {
        let i = n.match(/^([a-z0-9-]+)\/(.*)/i);
        return i ? `tag:${i[1]}.yaml.org,2002:${i[2]}` : `tag:${n}`;
      }
    }
    return r.prefix + decodeURIComponent(n);
  }
  function Bn(s, e) {
    let { tag: t, type: n } = e,
      r = false;
    if (t) {
      let { handle: i, suffix: o, verbatim: a } = t;
      if (a) {
        if (a !== "!" && a !== "!!") return a;
        let l = `Verbatim tags aren't resolved, so ${a} is invalid.`;
        s.errors.push(new p.YAMLSemanticError(e, l));
      } else if (i === "!" && !o) r = true;
      else
        try {
          return Rn(s, e);
        } catch (l) {
          s.errors.push(l);
        }
    }
    switch (n) {
      case p.Type.BLOCK_FOLDED:
      case p.Type.BLOCK_LITERAL:
      case p.Type.QUOTE_DOUBLE:
      case p.Type.QUOTE_SINGLE:
        return p.defaultTags.STR;
      case p.Type.FLOW_MAP:
      case p.Type.MAP:
        return p.defaultTags.MAP;
      case p.Type.FLOW_SEQ:
      case p.Type.SEQ:
        return p.defaultTags.SEQ;
      case p.Type.PLAIN:
        return r ? p.defaultTags.STR : null;
      default:
        return null;
    }
  }
  function Ot(s, e, t) {
    let { tags: n } = s.schema,
      r = [];
    for (let o of n)
      if (o.tag === t)
        if (o.test) r.push(o);
        else {
          let a = o.resolve(s, e);
          return a instanceof C ? a : new v(a);
        }
    let i = Xe(s, e);
    return typeof i == "string" && r.length > 0 ? He(i, r, n.scalarFallback) : null;
  }
  function Yn({ type: s }) {
    switch (s) {
      case p.Type.FLOW_MAP:
      case p.Type.MAP:
        return p.defaultTags.MAP;
      case p.Type.FLOW_SEQ:
      case p.Type.SEQ:
        return p.defaultTags.SEQ;
      default:
        return p.defaultTags.STR;
    }
  }
  function jn(s, e, t) {
    try {
      let n = Ot(s, e, t);
      if (n) return (t && e.tag && (n.tag = t), n);
    } catch (n) {
      return (n.source || (n.source = e), s.errors.push(n), null);
    }
    try {
      let n = Yn(e);
      if (!n) throw new Error(`The tag ${t} is unavailable`);
      let r = `The tag ${t} is unavailable, falling back to ${n}`;
      s.warnings.push(new p.YAMLWarning(e, r));
      let i = Ot(s, e, n);
      return ((i.tag = t), i);
    } catch (n) {
      let r = new p.YAMLReferenceError(e, n.message);
      return ((r.stack = n.stack), s.errors.push(r), null);
    }
  }
  var Fn = (s) => {
    if (!s) return false;
    let { type: e } = s;
    return e === p.Type.MAP_KEY || e === p.Type.MAP_VALUE || e === p.Type.SEQ_ITEM;
  };
  function Dn(s, e) {
    let t = { before: [], after: [] },
      n = false,
      r = false,
      i = Fn(e.context.parent) ? e.context.parent.props.concat(e.props) : e.props;
    for (let { start: o, end: a } of i)
      switch (e.context.src[o]) {
        case p.Char.COMMENT: {
          if (!e.commentHasRequiredWhitespace(o)) {
            let d = "Comments must be separated from other tokens by white space characters";
            s.push(new p.YAMLSemanticError(e, d));
          }
          let { header: l, valueRange: c } = e;
          (c && (o > c.start || (l && o > l.start)) ? t.after : t.before).push(
            e.context.src.slice(o + 1, a)
          );
          break;
        }
        case p.Char.ANCHOR:
          if (n) {
            let l = "A node can have at most one anchor";
            s.push(new p.YAMLSemanticError(e, l));
          }
          n = true;
          break;
        case p.Char.TAG:
          if (r) {
            let l = "A node can have at most one tag";
            s.push(new p.YAMLSemanticError(e, l));
          }
          r = true;
          break;
      }
    return { comments: t, hasAnchor: n, hasTag: r };
  }
  function qn(s, e) {
    let { anchors: t, errors: n, schema: r } = s;
    if (e.type === p.Type.ALIAS) {
      let o = e.rawValue,
        a = t.getNode(o);
      if (!a) {
        let c = `Aliased anchor not found: ${o}`;
        return (n.push(new p.YAMLReferenceError(e, c)), null);
      }
      let l = new G(a);
      return (t._cstAliases.push(l), l);
    }
    let i = Bn(s, e);
    if (i) return jn(s, e, i);
    if (e.type !== p.Type.PLAIN) {
      let o = `Failed to resolve ${e.type} node here`;
      return (n.push(new p.YAMLSyntaxError(e, o)), null);
    }
    try {
      let o = Xe(s, e);
      return He(o, r.tags, r.tags.scalarFallback);
    } catch (o) {
      return (o.source || (o.source = e), n.push(o), null);
    }
  }
  function W(s, e) {
    if (!e) return null;
    e.error && s.errors.push(e.error);
    let { comments: t, hasAnchor: n, hasTag: r } = Dn(s.errors, e);
    if (n) {
      let { anchors: o } = s,
        a = e.anchor,
        l = o.getNode(a);
      (l && (o.map[o.newName(a)] = l), (o.map[a] = e));
    }
    if (e.type === p.Type.ALIAS && (n || r)) {
      let o = "An alias node must not specify any properties";
      s.errors.push(new p.YAMLSemanticError(e, o));
    }
    let i = qn(s, e);
    if (i) {
      ((i.range = [e.range.start, e.range.end]),
        s.options.keepCstNodes && (i.cstNode = e),
        s.options.keepNodeTypes && (i.type = e.type));
      let o = t.before.join(`
`);
      o &&
        (i.commentBefore = i.commentBefore
          ? `${i.commentBefore}
${o}`
          : o);
      let a = t.after.join(`
`);
      a &&
        (i.comment = i.comment
          ? `${i.comment}
${a}`
          : a);
    }
    return (e.resolved = i);
  }
  function Wn(s, e) {
    if (e.type !== p.Type.MAP && e.type !== p.Type.FLOW_MAP) {
      let o = `A ${e.type} node cannot be resolved as a mapping`;
      return (s.errors.push(new p.YAMLSyntaxError(e, o)), null);
    }
    let { comments: t, items: n } = e.type === p.Type.FLOW_MAP ? Jn(s, e) : Vn(s, e),
      r = new le();
    ((r.items = n), It(r, t));
    let i = false;
    for (let o = 0; o < n.length; ++o) {
      let { key: a } = n[o];
      if ((a instanceof C && (i = true), s.schema.merge && a && a.value === Lt)) {
        n[o] = new Ee(n[o]);
        let l = n[o].value.items,
          c = null;
        (l.some((f) => {
          if (f instanceof G) {
            let { type: d } = f.source;
            return d === p.Type.MAP || d === p.Type.FLOW_MAP
              ? false
              : (c = "Merge nodes aliases can only point to maps");
          }
          return (c = "Merge nodes can only have Alias nodes as values");
        }),
          c && s.errors.push(new p.YAMLSemanticError(e, c)));
      } else
        for (let l = o + 1; l < n.length; ++l) {
          let { key: c } = n[l];
          if (
            a === c ||
            (a && c && Object.prototype.hasOwnProperty.call(a, "value") && a.value === c.value)
          ) {
            let f = `Map keys must be unique; "${a}" is repeated`;
            s.errors.push(new p.YAMLSemanticError(e, f));
            break;
          }
        }
    }
    if (i && !s.options.mapAsMap) {
      let o =
        "Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";
      s.warnings.push(new p.YAMLWarning(e, o));
    }
    return ((e.resolved = r), r);
  }
  var Un = ({ context: { lineStart: s, node: e, src: t }, props: n }) => {
    if (n.length === 0) return false;
    let { start: r } = n[0];
    if ((e && r > e.valueRange.start) || t[r] !== p.Char.COMMENT) return false;
    for (let i = s; i < r; ++i)
      if (
        t[i] ===
        `
`
      )
        return false;
    return true;
  };
  function Kn(s, e) {
    if (!Un(s)) return;
    let t = s.getPropValue(0, p.Char.COMMENT, true),
      n = false,
      r = e.value.commentBefore;
    if (r && r.startsWith(t)) ((e.value.commentBefore = r.substr(t.length + 1)), (n = true));
    else {
      let i = e.value.comment;
      !s.node && i && i.startsWith(t) && ((e.value.comment = i.substr(t.length + 1)), (n = true));
    }
    n && (e.comment = t);
  }
  function Vn(s, e) {
    let t = [],
      n = [],
      r,
      i = null;
    for (let o = 0; o < e.items.length; ++o) {
      let a = e.items[o];
      switch (a.type) {
        case p.Type.BLANK_LINE:
          t.push({ afterKey: !!r, before: n.length });
          break;
        case p.Type.COMMENT:
          t.push({ afterKey: !!r, before: n.length, comment: a.comment });
          break;
        case p.Type.MAP_KEY:
          (r !== void 0 && n.push(new T(r)),
            a.error && s.errors.push(a.error),
            (r = W(s, a.node)),
            (i = null));
          break;
        case p.Type.MAP_VALUE:
          {
            if (
              (r === void 0 && (r = null),
              a.error && s.errors.push(a.error),
              !a.context.atLineStart &&
                a.node &&
                a.node.type === p.Type.MAP &&
                !a.node.context.atLineStart)
            ) {
              let f = "Nested mappings are not allowed in compact mappings";
              s.errors.push(new p.YAMLSemanticError(a.node, f));
            }
            let l = a.node;
            if (!l && a.props.length > 0) {
              ((l = new p.PlainValue(p.Type.PLAIN, [])),
                (l.context = { parent: a, src: a.context.src }));
              let f = a.range.start + 1;
              if (
                ((l.range = { start: f, end: f }),
                (l.valueRange = { start: f, end: f }),
                typeof a.range.origStart == "number")
              ) {
                let d = a.range.origStart + 1;
                ((l.range.origStart = l.range.origEnd = d),
                  (l.valueRange.origStart = l.valueRange.origEnd = d));
              }
            }
            let c = new T(r, W(s, l));
            (Kn(a, c),
              n.push(c),
              r && typeof i == "number" && a.range.start > i + 1024 && s.errors.push(kt(e, r)),
              (r = void 0),
              (i = null));
          }
          break;
        default:
          (r !== void 0 && n.push(new T(r)),
            (r = W(s, a)),
            (i = a.range.start),
            a.error && s.errors.push(a.error));
          e: for (let l = o + 1; ; ++l) {
            let c = e.items[l];
            switch (c && c.type) {
              case p.Type.BLANK_LINE:
              case p.Type.COMMENT:
                continue e;
              case p.Type.MAP_VALUE:
                break e;
              default: {
                let f = "Implicit map keys need to be followed by map values";
                s.errors.push(new p.YAMLSemanticError(a, f));
                break e;
              }
            }
          }
          if (a.valueRangeContainsNewline) {
            let l = "Implicit map keys need to be on a single line";
            s.errors.push(new p.YAMLSemanticError(a, l));
          }
      }
    }
    return (r !== void 0 && n.push(new T(r)), { comments: t, items: n });
  }
  function Jn(s, e) {
    let t = [],
      n = [],
      r,
      i = false,
      o = "{";
    for (let a = 0; a < e.items.length; ++a) {
      let l = e.items[a];
      if (typeof l.char == "string") {
        let { char: c, offset: f } = l;
        if (c === "?" && r === void 0 && !i) {
          ((i = true), (o = ":"));
          continue;
        }
        if (c === ":") {
          if ((r === void 0 && (r = null), o === ":")) {
            o = ",";
            continue;
          }
        } else if (
          (i && (r === void 0 && c !== "," && (r = null), (i = false)),
          r !== void 0 && (n.push(new T(r)), (r = void 0), c === ","))
        ) {
          o = ":";
          continue;
        }
        if (c === "}") {
          if (a === e.items.length - 1) continue;
        } else if (c === o) {
          o = ":";
          continue;
        }
        let d = `Flow map contains an unexpected ${c}`,
          g = new p.YAMLSyntaxError(e, d);
        ((g.offset = f), s.errors.push(g));
      } else
        l.type === p.Type.BLANK_LINE
          ? t.push({ afterKey: !!r, before: n.length })
          : l.type === p.Type.COMMENT
            ? (vt(s.errors, l), t.push({ afterKey: !!r, before: n.length, comment: l.comment }))
            : r === void 0
              ? (o === "," &&
                  s.errors.push(new p.YAMLSemanticError(l, "Separator , missing in flow map")),
                (r = W(s, l)))
              : (o !== "," &&
                  s.errors.push(
                    new p.YAMLSemanticError(l, "Indicator : missing in flow map entry")
                  ),
                n.push(new T(r, W(s, l))),
                (r = void 0),
                (i = false));
    }
    return (Mt(s.errors, e), r !== void 0 && n.push(new T(r)), { comments: t, items: n });
  }
  function Qn(s, e) {
    if (e.type !== p.Type.SEQ && e.type !== p.Type.FLOW_SEQ) {
      let i = `A ${e.type} node cannot be resolved as a sequence`;
      return (s.errors.push(new p.YAMLSyntaxError(e, i)), null);
    }
    let { comments: t, items: n } = e.type === p.Type.FLOW_SEQ ? Hn(s, e) : Gn(s, e),
      r = new q();
    if (
      ((r.items = n),
      It(r, t),
      !s.options.mapAsMap && n.some((i) => i instanceof T && i.key instanceof C))
    ) {
      let i =
        "Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";
      s.warnings.push(new p.YAMLWarning(e, i));
    }
    return ((e.resolved = r), r);
  }
  function Gn(s, e) {
    let t = [],
      n = [];
    for (let r = 0; r < e.items.length; ++r) {
      let i = e.items[r];
      switch (i.type) {
        case p.Type.BLANK_LINE:
          t.push({ before: n.length });
          break;
        case p.Type.COMMENT:
          t.push({ comment: i.comment, before: n.length });
          break;
        case p.Type.SEQ_ITEM:
          if ((i.error && s.errors.push(i.error), n.push(W(s, i.node)), i.hasProps)) {
            let o = "Sequence items cannot have tags or anchors before the - indicator";
            s.errors.push(new p.YAMLSemanticError(i, o));
          }
          break;
        default:
          (i.error && s.errors.push(i.error),
            s.errors.push(new p.YAMLSyntaxError(i, `Unexpected ${i.type} node in sequence`)));
      }
    }
    return { comments: t, items: n };
  }
  function Hn(s, e) {
    let t = [],
      n = [],
      r = false,
      i,
      o = null,
      a = "[",
      l = null;
    for (let c = 0; c < e.items.length; ++c) {
      let f = e.items[c];
      if (typeof f.char == "string") {
        let { char: d, offset: g } = f;
        if (
          (d !== ":" &&
            (r || i !== void 0) &&
            (r && i === void 0 && (i = a ? n.pop() : null),
            n.push(new T(i)),
            (r = false),
            (i = void 0),
            (o = null)),
          d === a)
        )
          a = null;
        else if (!a && d === "?") r = true;
        else if (a !== "[" && d === ":" && i === void 0) {
          if (a === ",") {
            if (((i = n.pop()), i instanceof T)) {
              let m = "Chaining flow sequence pairs is invalid",
                h = new p.YAMLSemanticError(e, m);
              ((h.offset = g), s.errors.push(h));
            }
            if (!r && typeof o == "number") {
              let m = f.range ? f.range.start : f.offset;
              m > o + 1024 && s.errors.push(kt(e, i));
              let { src: h } = l.context;
              for (let y = o; y < m; ++y)
                if (
                  h[y] ===
                  `
`
                ) {
                  let w = "Implicit keys of flow sequence pairs need to be on a single line";
                  s.errors.push(new p.YAMLSemanticError(l, w));
                  break;
                }
            }
          } else i = null;
          ((o = null), (r = false), (a = null));
        } else if (a === "[" || d !== "]" || c < e.items.length - 1) {
          let m = `Flow sequence contains an unexpected ${d}`,
            h = new p.YAMLSyntaxError(e, m);
          ((h.offset = g), s.errors.push(h));
        }
      } else if (f.type === p.Type.BLANK_LINE) t.push({ before: n.length });
      else if (f.type === p.Type.COMMENT)
        (vt(s.errors, f), t.push({ comment: f.comment, before: n.length }));
      else {
        if (a) {
          let g = `Expected a ${a} in flow sequence`;
          s.errors.push(new p.YAMLSemanticError(f, g));
        }
        let d = W(s, f);
        (i === void 0 ? (n.push(d), (l = f)) : (n.push(new T(i, d)), (i = void 0)),
          (o = f.range.start),
          (a = ","));
      }
    }
    return (Mt(s.errors, e), i !== void 0 && n.push(new T(i)), { comments: t, items: n });
  }
  M.Alias = G;
  M.Collection = C;
  M.Merge = Ee;
  M.Node = x;
  M.Pair = T;
  M.Scalar = v;
  M.YAMLMap = le;
  M.YAMLSeq = q;
  M.addComment = Z;
  M.binaryOptions = vn;
  M.boolOptions = kn;
  M.findPair = ae;
  M.intOptions = In;
  M.isEmptyPath = Nt;
  M.nullOptions = _n;
  M.resolveMap = Wn;
  M.resolveNode = W;
  M.resolveSeq = Qn;
  M.resolveString = Xe;
  M.strOptions = H;
  M.stringifyNumber = Cn;
  M.stringifyString = xn;
  M.toJSON = D;
});
var nt = I((B) => {
  "use strict";
  var R = K(),
    O = ce(),
    zn = {
      identify: (s) => s instanceof Uint8Array,
      default: false,
      tag: "tag:yaml.org,2002:binary",
      resolve: (s, e) => {
        let t = O.resolveString(s, e);
        if (typeof Buffer == "function") return Buffer.from(t, "base64");
        if (typeof atob == "function") {
          let n = atob(t.replace(/[\n\r]/g, "")),
            r = new Uint8Array(n.length);
          for (let i = 0; i < n.length; ++i) r[i] = n.charCodeAt(i);
          return r;
        } else {
          let n =
            "This environment does not support reading binary tags; either Buffer or atob is required";
          return (s.errors.push(new R.YAMLReferenceError(e, n)), null);
        }
      },
      options: O.binaryOptions,
      stringify: ({ comment: s, type: e, value: t }, n, r, i) => {
        let o;
        if (typeof Buffer == "function")
          o = t instanceof Buffer ? t.toString("base64") : Buffer.from(t.buffer).toString("base64");
        else if (typeof btoa == "function") {
          let a = "";
          for (let l = 0; l < t.length; ++l) a += String.fromCharCode(t[l]);
          o = btoa(a);
        } else
          throw new Error(
            "This environment does not support writing binary tags; either Buffer or btoa is required"
          );
        if ((e || (e = O.binaryOptions.defaultType), e === R.Type.QUOTE_DOUBLE)) t = o;
        else {
          let { lineWidth: a } = O.binaryOptions,
            l = Math.ceil(o.length / a),
            c = new Array(l);
          for (let f = 0, d = 0; f < l; ++f, d += a) c[f] = o.substr(d, a);
          t = c.join(
            e === R.Type.BLOCK_LITERAL
              ? `
`
              : " "
          );
        }
        return O.stringifyString({ comment: s, type: e, value: t }, n, r, i);
      },
    };
  function Pt(s, e) {
    let t = O.resolveSeq(s, e);
    for (let n = 0; n < t.items.length; ++n) {
      let r = t.items[n];
      if (!(r instanceof O.Pair)) {
        if (r instanceof O.YAMLMap) {
          if (r.items.length > 1) {
            let o = "Each pair must have its own sequence indicator";
            throw new R.YAMLSemanticError(e, o);
          }
          let i = r.items[0] || new O.Pair();
          (r.commentBefore &&
            (i.commentBefore = i.commentBefore
              ? `${r.commentBefore}
${i.commentBefore}`
              : r.commentBefore),
            r.comment &&
              (i.comment = i.comment
                ? `${r.comment}
${i.comment}`
                : r.comment),
            (r = i));
        }
        t.items[n] = r instanceof O.Pair ? r : new O.Pair(r);
      }
    }
    return t;
  }
  function $t(s, e, t) {
    let n = new O.YAMLSeq(s);
    n.tag = "tag:yaml.org,2002:pairs";
    for (let r of e) {
      let i, o;
      if (Array.isArray(r))
        if (r.length === 2) ((i = r[0]), (o = r[1]));
        else throw new TypeError(`Expected [key, value] tuple: ${r}`);
      else if (r && r instanceof Object) {
        let l = Object.keys(r);
        if (l.length === 1) ((i = l[0]), (o = r[i]));
        else throw new TypeError(`Expected { key: value } tuple: ${r}`);
      } else i = r;
      let a = s.createPair(i, o, t);
      n.items.push(a);
    }
    return n;
  }
  var Xn = { default: false, tag: "tag:yaml.org,2002:pairs", resolve: Pt, createNode: $t },
    ee = class s extends O.YAMLSeq {
      constructor() {
        (super(),
          R._defineProperty(this, "add", O.YAMLMap.prototype.add.bind(this)),
          R._defineProperty(this, "delete", O.YAMLMap.prototype.delete.bind(this)),
          R._defineProperty(this, "get", O.YAMLMap.prototype.get.bind(this)),
          R._defineProperty(this, "has", O.YAMLMap.prototype.has.bind(this)),
          R._defineProperty(this, "set", O.YAMLMap.prototype.set.bind(this)),
          (this.tag = s.tag));
      }
      toJSON(e, t) {
        let n = /* @__PURE__ */ new Map();
        t && t.onCreate && t.onCreate(n);
        for (let r of this.items) {
          let i, o;
          if (
            (r instanceof O.Pair
              ? ((i = O.toJSON(r.key, "", t)), (o = O.toJSON(r.value, i, t)))
              : (i = O.toJSON(r, "", t)),
            n.has(i))
          )
            throw new Error("Ordered maps must not include duplicate keys");
          n.set(i, o);
        }
        return n;
      }
    };
  R._defineProperty(ee, "tag", "tag:yaml.org,2002:omap");
  function Zn(s, e) {
    let t = Pt(s, e),
      n = [];
    for (let { key: r } of t.items)
      if (r instanceof O.Scalar)
        if (n.includes(r.value)) {
          let i = "Ordered maps must not include duplicate keys";
          throw new R.YAMLSemanticError(e, i);
        } else n.push(r.value);
    return Object.assign(new ee(), t);
  }
  function es(s, e, t) {
    let n = $t(s, e, t),
      r = new ee();
    return ((r.items = n.items), r);
  }
  var ts = {
      identify: (s) => s instanceof Map,
      nodeClass: ee,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve: Zn,
      createNode: es,
    },
    te = class s extends O.YAMLMap {
      constructor() {
        (super(), (this.tag = s.tag));
      }
      add(e) {
        let t = e instanceof O.Pair ? e : new O.Pair(e);
        O.findPair(this.items, t.key) || this.items.push(t);
      }
      get(e, t) {
        let n = O.findPair(this.items, e);
        return !t && n instanceof O.Pair ? (n.key instanceof O.Scalar ? n.key.value : n.key) : n;
      }
      set(e, t) {
        if (typeof t != "boolean")
          throw new Error(
            `Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`
          );
        let n = O.findPair(this.items, e);
        n && !t
          ? this.items.splice(this.items.indexOf(n), 1)
          : !n && t && this.items.push(new O.Pair(e));
      }
      toJSON(e, t) {
        return super.toJSON(e, t, Set);
      }
      toString(e, t, n) {
        if (!e) return JSON.stringify(this);
        if (this.hasAllNullValues()) return super.toString(e, t, n);
        throw new Error("Set items must all have null values");
      }
    };
  R._defineProperty(te, "tag", "tag:yaml.org,2002:set");
  function ns(s, e) {
    let t = O.resolveMap(s, e);
    if (!t.hasAllNullValues())
      throw new R.YAMLSemanticError(e, "Set items must all have null values");
    return Object.assign(new te(), t);
  }
  function ss(s, e, t) {
    let n = new te();
    for (let r of e) n.items.push(s.createPair(r, null, t));
    return n;
  }
  var rs = {
      identify: (s) => s instanceof Set,
      nodeClass: te,
      default: false,
      tag: "tag:yaml.org,2002:set",
      resolve: ns,
      createNode: ss,
    },
    Ze = (s, e) => {
      let t = e.split(":").reduce((n, r) => n * 60 + Number(r), 0);
      return s === "-" ? -t : t;
    },
    xt = ({ value: s }) => {
      if (isNaN(s) || !isFinite(s)) return O.stringifyNumber(s);
      let e = "";
      s < 0 && ((e = "-"), (s = Math.abs(s)));
      let t = [s % 60];
      return (
        s < 60
          ? t.unshift(0)
          : ((s = Math.round((s - t[0]) / 60)),
            t.unshift(s % 60),
            s >= 60 && ((s = Math.round((s - t[0]) / 60)), t.unshift(s))),
        e +
          t
            .map((n) => (n < 10 ? "0" + String(n) : String(n)))
            .join(":")
            .replace(/000000\d*$/, "")
      );
    },
    is = {
      identify: (s) => typeof s == "number",
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,
      resolve: (s, e, t) => Ze(e, t.replace(/_/g, "")),
      stringify: xt,
    },
    os = {
      identify: (s) => typeof s == "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,
      resolve: (s, e, t) => Ze(e, t.replace(/_/g, "")),
      stringify: xt,
    },
    as = {
      identify: (s) => s instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      test: RegExp(
        "^(?:([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?)$"
      ),
      resolve: (s, e, t, n, r, i, o, a, l) => {
        a && (a = (a + "00").substr(1, 3));
        let c = Date.UTC(e, t - 1, n, r || 0, i || 0, o || 0, a || 0);
        if (l && l !== "Z") {
          let f = Ze(l[0], l.slice(1));
          (Math.abs(f) < 30 && (f *= 60), (c -= 6e4 * f));
        }
        return new Date(c);
      },
      stringify: ({ value: s }) => s.toISOString().replace(/((T00:00)?:00)?\.000Z$/, ""),
    };
  function et(s) {
    let e = (typeof process < "u" && process.env) || {};
    return s
      ? typeof YAML_SILENCE_DEPRECATION_WARNINGS < "u"
        ? !YAML_SILENCE_DEPRECATION_WARNINGS
        : !e.YAML_SILENCE_DEPRECATION_WARNINGS
      : typeof YAML_SILENCE_WARNINGS < "u"
        ? !YAML_SILENCE_WARNINGS
        : !e.YAML_SILENCE_WARNINGS;
  }
  function tt(s, e) {
    if (et(false)) {
      let t = typeof process < "u" && process.emitWarning;
      t ? t(s, e) : console.warn(e ? `${e}: ${s}` : s);
    }
  }
  function ls(s) {
    if (et(true)) {
      let e = s
        .replace(/.*yaml[/\\]/i, "")
        .replace(/\.js$/, "")
        .replace(/\\/g, "/");
      tt(`The endpoint 'yaml/${e}' will be removed in a future release.`, "DeprecationWarning");
    }
  }
  var _t = {};
  function cs(s, e) {
    if (!_t[s] && et(true)) {
      _t[s] = true;
      let t = `The option '${s}' will be removed in a future release`;
      ((t += e ? `, use '${e}' instead.` : "."), tt(t, "DeprecationWarning"));
    }
  }
  B.binary = zn;
  B.floatTime = os;
  B.intTime = is;
  B.omap = ts;
  B.pairs = Xn;
  B.set = rs;
  B.timestamp = as;
  B.warn = tt;
  B.warnFileDeprecation = ls;
  B.warnOptionDeprecation = cs;
});
var ot = I((Jt) => {
  "use strict";
  var Te = K(),
    b = ce(),
    _ = nt();
  function fs(s, e, t) {
    let n = new b.YAMLMap(s);
    if (e instanceof Map) for (let [r, i] of e) n.items.push(s.createPair(r, i, t));
    else if (e && typeof e == "object")
      for (let r of Object.keys(e)) n.items.push(s.createPair(r, e[r], t));
    return (typeof s.sortMapEntries == "function" && n.items.sort(s.sortMapEntries), n);
  }
  var ue = {
    createNode: fs,
    default: true,
    nodeClass: b.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve: b.resolveMap,
  };
  function us(s, e, t) {
    let n = new b.YAMLSeq(s);
    if (e && e[Symbol.iterator])
      for (let r of e) {
        let i = s.createNode(r, t.wrapScalars, null, t);
        n.items.push(i);
      }
    return n;
  }
  var Me = {
      createNode: us,
      default: true,
      nodeClass: b.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve: b.resolveSeq,
    },
    hs = {
      identify: (s) => typeof s == "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: b.resolveString,
      stringify(s, e, t, n) {
        return ((e = Object.assign({ actualString: true }, e)), b.stringifyString(s, e, t, n));
      },
      options: b.strOptions,
    },
    rt = [ue, Me, hs],
    ve = (s) => typeof s == "bigint" || Number.isInteger(s),
    it = (s, e, t) => (b.intOptions.asBigInt ? BigInt(s) : parseInt(e, t));
  function Bt(s, e, t) {
    let { value: n } = s;
    return ve(n) && n >= 0 ? t + n.toString(e) : b.stringifyNumber(s);
  }
  var Yt = {
      identify: (s) => s == null,
      createNode: (s, e, t) => (t.wrapScalars ? new b.Scalar(null) : null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => null,
      options: b.nullOptions,
      stringify: () => b.nullOptions.nullStr,
    },
    jt = {
      identify: (s) => typeof s == "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (s) => s[0] === "t" || s[0] === "T",
      options: b.boolOptions,
      stringify: ({ value: s }) => (s ? b.boolOptions.trueStr : b.boolOptions.falseStr),
    },
    Ft = {
      identify: (s) => ve(s) && s >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o([0-7]+)$/,
      resolve: (s, e) => it(s, e, 8),
      options: b.intOptions,
      stringify: (s) => Bt(s, 8, "0o"),
    },
    Dt = {
      identify: ve,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (s) => it(s, s, 10),
      options: b.intOptions,
      stringify: b.stringifyNumber,
    },
    qt = {
      identify: (s) => ve(s) && s >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x([0-9a-fA-F]+)$/,
      resolve: (s, e) => it(s, e, 16),
      options: b.intOptions,
      stringify: (s) => Bt(s, 16, "0x"),
    },
    Wt = {
      identify: (s) => typeof s == "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.inf|(\.nan))$/i,
      resolve: (s, e) =>
        e ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: b.stringifyNumber,
    },
    Ut = {
      identify: (s) => typeof s == "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (s) => parseFloat(s),
      stringify: ({ value: s }) => Number(s).toExponential(),
    },
    Kt = {
      identify: (s) => typeof s == "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.([0-9]+)|[0-9]+\.([0-9]*))$/,
      resolve(s, e, t) {
        let n = e || t,
          r = new b.Scalar(parseFloat(s));
        return (n && n[n.length - 1] === "0" && (r.minFractionDigits = n.length), r);
      },
      stringify: b.stringifyNumber,
    },
    ps = rt.concat([Yt, jt, Ft, Dt, qt, Wt, Ut, Kt]),
    Ct = (s) => typeof s == "bigint" || Number.isInteger(s),
    Le = ({ value: s }) => JSON.stringify(s),
    Vt = [
      ue,
      Me,
      {
        identify: (s) => typeof s == "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: b.resolveString,
        stringify: Le,
      },
      {
        identify: (s) => s == null,
        createNode: (s, e, t) => (t.wrapScalars ? new b.Scalar(null) : null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: Le,
      },
      {
        identify: (s) => typeof s == "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true|false$/,
        resolve: (s) => s === "true",
        stringify: Le,
      },
      {
        identify: Ct,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (s) => (b.intOptions.asBigInt ? BigInt(s) : parseInt(s, 10)),
        stringify: ({ value: s }) => (Ct(s) ? s.toString() : JSON.stringify(s)),
      },
      {
        identify: (s) => typeof s == "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (s) => parseFloat(s),
        stringify: Le,
      },
    ];
  Vt.scalarFallback = (s) => {
    throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(s)}`);
  };
  var Rt = ({ value: s }) => (s ? b.boolOptions.trueStr : b.boolOptions.falseStr),
    fe = (s) => typeof s == "bigint" || Number.isInteger(s);
  function Ae(s, e, t) {
    let n = e.replace(/_/g, "");
    if (b.intOptions.asBigInt) {
      switch (t) {
        case 2:
          n = `0b${n}`;
          break;
        case 8:
          n = `0o${n}`;
          break;
        case 16:
          n = `0x${n}`;
          break;
      }
      let i = BigInt(n);
      return s === "-" ? BigInt(-1) * i : i;
    }
    let r = parseInt(n, t);
    return s === "-" ? -1 * r : r;
  }
  function st(s, e, t) {
    let { value: n } = s;
    if (fe(n)) {
      let r = n.toString(e);
      return n < 0 ? "-" + t + r.substr(1) : t + r;
    }
    return b.stringifyNumber(s);
  }
  var ds = rt.concat(
      [
        {
          identify: (s) => s == null,
          createNode: (s, e, t) => (t.wrapScalars ? new b.Scalar(null) : null),
          default: true,
          tag: "tag:yaml.org,2002:null",
          test: /^(?:~|[Nn]ull|NULL)?$/,
          resolve: () => null,
          options: b.nullOptions,
          stringify: () => b.nullOptions.nullStr,
        },
        {
          identify: (s) => typeof s == "boolean",
          default: true,
          tag: "tag:yaml.org,2002:bool",
          test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
          resolve: () => true,
          options: b.boolOptions,
          stringify: Rt,
        },
        {
          identify: (s) => typeof s == "boolean",
          default: true,
          tag: "tag:yaml.org,2002:bool",
          test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
          resolve: () => false,
          options: b.boolOptions,
          stringify: Rt,
        },
        {
          identify: fe,
          default: true,
          tag: "tag:yaml.org,2002:int",
          format: "BIN",
          test: /^([-+]?)0b([0-1_]+)$/,
          resolve: (s, e, t) => Ae(e, t, 2),
          stringify: (s) => st(s, 2, "0b"),
        },
        {
          identify: fe,
          default: true,
          tag: "tag:yaml.org,2002:int",
          format: "OCT",
          test: /^([-+]?)0([0-7_]+)$/,
          resolve: (s, e, t) => Ae(e, t, 8),
          stringify: (s) => st(s, 8, "0"),
        },
        {
          identify: fe,
          default: true,
          tag: "tag:yaml.org,2002:int",
          test: /^([-+]?)([0-9][0-9_]*)$/,
          resolve: (s, e, t) => Ae(e, t, 10),
          stringify: b.stringifyNumber,
        },
        {
          identify: fe,
          default: true,
          tag: "tag:yaml.org,2002:int",
          format: "HEX",
          test: /^([-+]?)0x([0-9a-fA-F_]+)$/,
          resolve: (s, e, t) => Ae(e, t, 16),
          stringify: (s) => st(s, 16, "0x"),
        },
        {
          identify: (s) => typeof s == "number",
          default: true,
          tag: "tag:yaml.org,2002:float",
          test: /^(?:[-+]?\.inf|(\.nan))$/i,
          resolve: (s, e) =>
            e ? NaN : s[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
          stringify: b.stringifyNumber,
        },
        {
          identify: (s) => typeof s == "number",
          default: true,
          tag: "tag:yaml.org,2002:float",
          format: "EXP",
          test: /^[-+]?([0-9][0-9_]*)?(\.[0-9_]*)?[eE][-+]?[0-9]+$/,
          resolve: (s) => parseFloat(s.replace(/_/g, "")),
          stringify: ({ value: s }) => Number(s).toExponential(),
        },
        {
          identify: (s) => typeof s == "number",
          default: true,
          tag: "tag:yaml.org,2002:float",
          test: /^[-+]?(?:[0-9][0-9_]*)?\.([0-9_]*)$/,
          resolve(s, e) {
            let t = new b.Scalar(parseFloat(s.replace(/_/g, "")));
            if (e) {
              let n = e.replace(/_/g, "");
              n[n.length - 1] === "0" && (t.minFractionDigits = n.length);
            }
            return t;
          },
          stringify: b.stringifyNumber,
        },
      ],
      _.binary,
      _.omap,
      _.pairs,
      _.set,
      _.intTime,
      _.floatTime,
      _.timestamp
    ),
    gs = { core: ps, failsafe: rt, json: Vt, yaml11: ds },
    ms = {
      binary: _.binary,
      bool: jt,
      float: Kt,
      floatExp: Ut,
      floatNaN: Wt,
      floatTime: _.floatTime,
      int: Dt,
      intHex: qt,
      intOct: Ft,
      intTime: _.intTime,
      map: ue,
      null: Yt,
      omap: _.omap,
      pairs: _.pairs,
      seq: Me,
      set: _.set,
      timestamp: _.timestamp,
    };
  function ys(s, e, t) {
    if (e) {
      let n = t.filter((i) => i.tag === e),
        r = n.find((i) => !i.format) || n[0];
      if (!r) throw new Error(`Tag ${e} not found`);
      return r;
    }
    return t.find(
      (n) => ((n.identify && n.identify(s)) || (n.class && s instanceof n.class)) && !n.format
    );
  }
  function bs(s, e, t) {
    if (s instanceof b.Node) return s;
    let { defaultPrefix: n, onTagObj: r, prevObjects: i, schema: o, wrapScalars: a } = t;
    e && e.startsWith("!!") && (e = n + e.slice(2));
    let l = ys(s, e, o.tags);
    if (!l) {
      if ((typeof s.toJSON == "function" && (s = s.toJSON()), !s || typeof s != "object"))
        return a ? new b.Scalar(s) : s;
      l = s instanceof Map ? ue : s[Symbol.iterator] ? Me : ue;
    }
    r && (r(l), delete t.onTagObj);
    let c = { value: void 0, node: void 0 };
    if (s && typeof s == "object" && i) {
      let f = i.get(s);
      if (f) {
        let d = new b.Alias(f);
        return (t.aliasNodes.push(d), d);
      }
      ((c.value = s), i.set(s, c));
    }
    return (
      (c.node = l.createNode ? l.createNode(t.schema, s, t) : a ? new b.Scalar(s) : s),
      e && c.node instanceof b.Node && (c.node.tag = e),
      c.node
    );
  }
  function ws(s, e, t, n) {
    let r = s[n.replace(/\W/g, "")];
    if (!r) {
      let i = Object.keys(s)
        .map((o) => JSON.stringify(o))
        .join(", ");
      throw new Error(`Unknown schema "${n}"; use one of ${i}`);
    }
    if (Array.isArray(t)) for (let i of t) r = r.concat(i);
    else typeof t == "function" && (r = t(r.slice()));
    for (let i = 0; i < r.length; ++i) {
      let o = r[i];
      if (typeof o == "string") {
        let a = e[o];
        if (!a) {
          let l = Object.keys(e)
            .map((c) => JSON.stringify(c))
            .join(", ");
          throw new Error(`Unknown custom tag "${o}"; use one of ${l}`);
        }
        r[i] = a;
      }
    }
    return r;
  }
  var Ss = (s, e) => (s.key < e.key ? -1 : s.key > e.key ? 1 : 0),
    he = class s {
      constructor({ customTags: e, merge: t, schema: n, sortMapEntries: r, tags: i }) {
        ((this.merge = !!t),
          (this.name = n),
          (this.sortMapEntries = r === true ? Ss : r || null),
          !e && i && _.warnOptionDeprecation("tags", "customTags"),
          (this.tags = ws(gs, ms, e || i, n)));
      }
      createNode(e, t, n, r) {
        let i = { defaultPrefix: s.defaultPrefix, schema: this, wrapScalars: t },
          o = r ? Object.assign(r, i) : i;
        return bs(e, n, o);
      }
      createPair(e, t, n) {
        n || (n = { wrapScalars: true });
        let r = this.createNode(e, n.wrapScalars, null, n),
          i = this.createNode(t, n.wrapScalars, null, n);
        return new b.Pair(r, i);
      }
    };
  Te._defineProperty(he, "defaultPrefix", Te.defaultTagPrefix);
  Te._defineProperty(he, "defaultTags", Te.defaultTags);
  Jt.Schema = he;
});
var zt = I((Pe) => {
  "use strict";
  var P = K(),
    S = ce(),
    Qt = ot(),
    Es = {
      anchorPrefix: "a",
      customTags: null,
      indent: 2,
      indentSeq: true,
      keepCstNodes: false,
      keepNodeTypes: true,
      keepBlobsInJSON: true,
      mapAsMap: false,
      maxAliasCount: 100,
      prettyErrors: false,
      simpleKeys: false,
      version: "1.2",
    },
    Os = {
      get binary() {
        return S.binaryOptions;
      },
      set binary(s) {
        Object.assign(S.binaryOptions, s);
      },
      get bool() {
        return S.boolOptions;
      },
      set bool(s) {
        Object.assign(S.boolOptions, s);
      },
      get int() {
        return S.intOptions;
      },
      set int(s) {
        Object.assign(S.intOptions, s);
      },
      get null() {
        return S.nullOptions;
      },
      set null(s) {
        Object.assign(S.nullOptions, s);
      },
      get str() {
        return S.strOptions;
      },
      set str(s) {
        Object.assign(S.strOptions, s);
      },
    },
    Ht = {
      "1.0": {
        schema: "yaml-1.1",
        merge: true,
        tagPrefixes: [
          { handle: "!", prefix: P.defaultTagPrefix },
          { handle: "!!", prefix: "tag:private.yaml.org,2002:" },
        ],
      },
      1.1: {
        schema: "yaml-1.1",
        merge: true,
        tagPrefixes: [
          { handle: "!", prefix: "!" },
          { handle: "!!", prefix: P.defaultTagPrefix },
        ],
      },
      1.2: {
        schema: "core",
        merge: false,
        tagPrefixes: [
          { handle: "!", prefix: "!" },
          { handle: "!!", prefix: P.defaultTagPrefix },
        ],
      },
    };
  function Gt(s, e) {
    if ((s.version || s.options.version) === "1.0") {
      let r = e.match(/^tag:private\.yaml\.org,2002:([^:/]+)$/);
      if (r) return "!" + r[1];
      let i = e.match(/^tag:([a-zA-Z0-9-]+)\.yaml\.org,2002:(.*)/);
      return i ? `!${i[1]}/${i[2]}` : `!${e.replace(/^tag:/, "")}`;
    }
    let t = s.tagPrefixes.find((r) => e.indexOf(r.prefix) === 0);
    if (!t) {
      let r = s.getDefaults().tagPrefixes;
      t = r && r.find((i) => e.indexOf(i.prefix) === 0);
    }
    if (!t) return e[0] === "!" ? e : `!<${e}>`;
    let n = e
      .substr(t.prefix.length)
      .replace(
        /[!,[\]{}]/g,
        (r) => ({ "!": "%21", ",": "%2C", "[": "%5B", "]": "%5D", "{": "%7B", "}": "%7D" })[r]
      );
    return t.handle + n;
  }
  function Ns(s, e) {
    if (e instanceof S.Alias) return S.Alias;
    if (e.tag) {
      let r = s.filter((i) => i.tag === e.tag);
      if (r.length > 0) return r.find((i) => i.format === e.format) || r[0];
    }
    let t, n;
    if (e instanceof S.Scalar) {
      n = e.value;
      let r = s.filter((i) => (i.identify && i.identify(n)) || (i.class && n instanceof i.class));
      t = r.find((i) => i.format === e.format) || r.find((i) => !i.format);
    } else ((n = e), (t = s.find((r) => r.nodeClass && n instanceof r.nodeClass)));
    if (!t) {
      let r = n && n.constructor ? n.constructor.name : typeof n;
      throw new Error(`Tag not resolved for ${r} value`);
    }
    return t;
  }
  function Ls(s, e, { anchors: t, doc: n }) {
    let r = [],
      i = n.anchors.getName(s);
    return (
      i && ((t[i] = s), r.push(`&${i}`)),
      s.tag ? r.push(Gt(n, s.tag)) : e.default || r.push(Gt(n, e.tag)),
      r.join(" ")
    );
  }
  function ke(s, e, t, n) {
    let { anchors: r, schema: i } = e.doc,
      o;
    if (!(s instanceof S.Node)) {
      let c = { aliasNodes: [], onTagObj: (f) => (o = f), prevObjects: /* @__PURE__ */ new Map() };
      s = i.createNode(s, true, null, c);
      for (let f of c.aliasNodes) {
        f.source = f.source.node;
        let d = r.getName(f.source);
        d || ((d = r.newName()), (r.map[d] = f.source));
      }
    }
    if (s instanceof S.Pair) return s.toString(e, t, n);
    o || (o = Ns(i.tags, s));
    let a = Ls(s, o, e);
    a.length > 0 && (e.indentAtStart = (e.indentAtStart || 0) + a.length + 1);
    let l =
      typeof o.stringify == "function"
        ? o.stringify(s, e, t, n)
        : s instanceof S.Scalar
          ? S.stringifyString(s, e, t, n)
          : s.toString(e, t, n);
    return a
      ? s instanceof S.Scalar || l[0] === "{" || l[0] === "["
        ? `${a} ${l}`
        : `${a}
${e.indent}${l}`
      : l;
  }
  var at = class s {
      static validAnchorNode(e) {
        return e instanceof S.Scalar || e instanceof S.YAMLSeq || e instanceof S.YAMLMap;
      }
      constructor(e) {
        (P._defineProperty(this, "map", /* @__PURE__ */ Object.create(null)), (this.prefix = e));
      }
      createAlias(e, t) {
        return (this.setAnchor(e, t), new S.Alias(e));
      }
      createMergePair(...e) {
        let t = new S.Merge();
        return (
          (t.value.items = e.map((n) => {
            if (n instanceof S.Alias) {
              if (n.source instanceof S.YAMLMap) return n;
            } else if (n instanceof S.YAMLMap) return this.createAlias(n);
            throw new Error("Merge sources must be Map nodes or their Aliases");
          })),
          t
        );
      }
      getName(e) {
        let { map: t } = this;
        return Object.keys(t).find((n) => t[n] === e);
      }
      getNames() {
        return Object.keys(this.map);
      }
      getNode(e) {
        return this.map[e];
      }
      newName(e) {
        e || (e = this.prefix);
        let t = Object.keys(this.map);
        for (let n = 1; ; ++n) {
          let r = `${e}${n}`;
          if (!t.includes(r)) return r;
        }
      }
      resolveNodes() {
        let { map: e, _cstAliases: t } = this;
        (Object.keys(e).forEach((n) => {
          e[n] = e[n].resolved;
        }),
          t.forEach((n) => {
            n.source = n.source.resolved;
          }),
          delete this._cstAliases);
      }
      setAnchor(e, t) {
        if (e != null && !s.validAnchorNode(e))
          throw new Error("Anchors may only be set for Scalar, Seq and Map nodes");
        if (t && /[\x00-\x19\s,[\]{}]/.test(t))
          throw new Error("Anchor names must not contain whitespace or control characters");
        let { map: n } = this,
          r = e && Object.keys(n).find((i) => n[i] === e);
        if (r)
          if (t) r !== t && (delete n[r], (n[t] = e));
          else return r;
        else {
          if (!t) {
            if (!e) return null;
            t = this.newName();
          }
          n[t] = e;
        }
        return t;
      }
    },
    Ie = (s, e) => {
      if (s && typeof s == "object") {
        let { tag: t } = s;
        s instanceof S.Collection
          ? (t && (e[t] = true), s.items.forEach((n) => Ie(n, e)))
          : s instanceof S.Pair
            ? (Ie(s.key, e), Ie(s.value, e))
            : s instanceof S.Scalar && t && (e[t] = true);
      }
      return e;
    },
    As = (s) => Object.keys(Ie(s, {}));
  function Ts(s, e) {
    let t = { before: [], after: [] },
      n,
      r = false;
    for (let i of e)
      if (i.valueRange) {
        if (n !== void 0) {
          let a = "Document contains trailing content not separated by a ... or --- line";
          s.errors.push(new P.YAMLSyntaxError(i, a));
          break;
        }
        let o = S.resolveNode(s, i);
        (r && ((o.spaceBefore = true), (r = false)), (n = o));
      } else
        i.comment !== null
          ? (n === void 0 ? t.before : t.after).push(i.comment)
          : i.type === P.Type.BLANK_LINE &&
            ((r = true),
            n === void 0 &&
              t.before.length > 0 &&
              !s.commentBefore &&
              ((s.commentBefore = t.before.join(`
`)),
              (t.before = [])));
    if (((s.contents = n || null), !n))
      s.comment =
        t.before.concat(t.after).join(`
`) || null;
    else {
      let i = t.before.join(`
`);
      if (i) {
        let o = n instanceof S.Collection && n.items[0] ? n.items[0] : n;
        o.commentBefore = o.commentBefore
          ? `${i}
${o.commentBefore}`
          : i;
      }
      s.comment =
        t.after.join(`
`) || null;
    }
  }
  function Ms({ tagPrefixes: s }, e) {
    let [t, n] = e.parameters;
    if (!t || !n) {
      let r = "Insufficient parameters given for %TAG directive";
      throw new P.YAMLSemanticError(e, r);
    }
    if (s.some((r) => r.handle === t)) {
      let r = "The %TAG directive must only be given at most once per handle in the same document.";
      throw new P.YAMLSemanticError(e, r);
    }
    return { handle: t, prefix: n };
  }
  function vs(s, e) {
    let [t] = e.parameters;
    if ((e.name === "YAML:1.0" && (t = "1.0"), !t)) {
      let n = "Insufficient parameters given for %YAML directive";
      throw new P.YAMLSemanticError(e, n);
    }
    if (!Ht[t]) {
      let r = `Document will be parsed as YAML ${s.version || s.options.version} rather than YAML ${t}`;
      s.warnings.push(new P.YAMLWarning(e, r));
    }
    return t;
  }
  function ks(s, e, t) {
    let n = [],
      r = false;
    for (let i of e) {
      let { comment: o, name: a } = i;
      switch (a) {
        case "TAG":
          try {
            s.tagPrefixes.push(Ms(s, i));
          } catch (l) {
            s.errors.push(l);
          }
          r = true;
          break;
        case "YAML":
        case "YAML:1.0":
          if (s.version) {
            let l = "The %YAML directive must only be given at most once per document.";
            s.errors.push(new P.YAMLSemanticError(i, l));
          }
          try {
            s.version = vs(s, i);
          } catch (l) {
            s.errors.push(l);
          }
          r = true;
          break;
        default:
          if (a) {
            let l = `YAML only supports %TAG and %YAML directives, and not %${a}`;
            s.warnings.push(new P.YAMLWarning(i, l));
          }
      }
      o && n.push(o);
    }
    if (t && !r && (s.version || t.version || s.options.version) === "1.1") {
      let i = ({ handle: o, prefix: a }) => ({ handle: o, prefix: a });
      ((s.tagPrefixes = t.tagPrefixes.map(i)), (s.version = t.version));
    }
    s.commentBefore =
      n.join(`
`) || null;
  }
  function ne(s) {
    if (s instanceof S.Collection) return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  var _e = class s {
    constructor(e) {
      ((this.anchors = new at(e.anchorPrefix)),
        (this.commentBefore = null),
        (this.comment = null),
        (this.contents = null),
        (this.directivesEndMarker = null),
        (this.errors = []),
        (this.options = e),
        (this.schema = null),
        (this.tagPrefixes = []),
        (this.version = null),
        (this.warnings = []));
    }
    add(e) {
      return (ne(this.contents), this.contents.add(e));
    }
    addIn(e, t) {
      (ne(this.contents), this.contents.addIn(e, t));
    }
    delete(e) {
      return (ne(this.contents), this.contents.delete(e));
    }
    deleteIn(e) {
      return S.isEmptyPath(e)
        ? this.contents == null
          ? false
          : ((this.contents = null), true)
        : (ne(this.contents), this.contents.deleteIn(e));
    }
    getDefaults() {
      return s.defaults[this.version] || s.defaults[this.options.version] || {};
    }
    get(e, t) {
      return this.contents instanceof S.Collection ? this.contents.get(e, t) : void 0;
    }
    getIn(e, t) {
      return S.isEmptyPath(e)
        ? !t && this.contents instanceof S.Scalar
          ? this.contents.value
          : this.contents
        : this.contents instanceof S.Collection
          ? this.contents.getIn(e, t)
          : void 0;
    }
    has(e) {
      return this.contents instanceof S.Collection ? this.contents.has(e) : false;
    }
    hasIn(e) {
      return S.isEmptyPath(e)
        ? this.contents !== void 0
        : this.contents instanceof S.Collection
          ? this.contents.hasIn(e)
          : false;
    }
    set(e, t) {
      (ne(this.contents), this.contents.set(e, t));
    }
    setIn(e, t) {
      S.isEmptyPath(e) ? (this.contents = t) : (ne(this.contents), this.contents.setIn(e, t));
    }
    setSchema(e, t) {
      if (!e && !t && this.schema) return;
      (typeof e == "number" && (e = e.toFixed(1)),
        e === "1.0" || e === "1.1" || e === "1.2"
          ? (this.version ? (this.version = e) : (this.options.version = e),
            delete this.options.schema)
          : e && typeof e == "string" && (this.options.schema = e),
        Array.isArray(t) && (this.options.customTags = t));
      let n = Object.assign({}, this.getDefaults(), this.options);
      this.schema = new Qt.Schema(n);
    }
    parse(e, t) {
      (this.options.keepCstNodes && (this.cstNode = e),
        this.options.keepNodeTypes && (this.type = "DOCUMENT"));
      let {
        directives: n = [],
        contents: r = [],
        directivesEndMarker: i,
        error: o,
        valueRange: a,
      } = e;
      if (
        (o && (o.source || (o.source = this), this.errors.push(o)),
        ks(this, n, t),
        i && (this.directivesEndMarker = true),
        (this.range = a ? [a.start, a.end] : null),
        this.setSchema(),
        (this.anchors._cstAliases = []),
        Ts(this, r),
        this.anchors.resolveNodes(),
        this.options.prettyErrors)
      ) {
        for (let l of this.errors) l instanceof P.YAMLError && l.makePretty();
        for (let l of this.warnings) l instanceof P.YAMLError && l.makePretty();
      }
      return this;
    }
    listNonDefaultTags() {
      return As(this.contents).filter((e) => e.indexOf(Qt.Schema.defaultPrefix) !== 0);
    }
    setTagPrefix(e, t) {
      if (e[0] !== "!" || e[e.length - 1] !== "!")
        throw new Error("Handle must start and end with !");
      if (t) {
        let n = this.tagPrefixes.find((r) => r.handle === e);
        n ? (n.prefix = t) : this.tagPrefixes.push({ handle: e, prefix: t });
      } else this.tagPrefixes = this.tagPrefixes.filter((n) => n.handle !== e);
    }
    toJSON(e, t) {
      let { keepBlobsInJSON: n, mapAsMap: r, maxAliasCount: i } = this.options,
        o = n && (typeof e != "string" || !(this.contents instanceof S.Scalar)),
        a = {
          doc: this,
          indentStep: "  ",
          keep: o,
          mapAsMap: o && !!r,
          maxAliasCount: i,
          stringify: ke,
        },
        l = Object.keys(this.anchors.map);
      l.length > 0 &&
        (a.anchors = new Map(
          l.map((f) => [this.anchors.map[f], { alias: [], aliasCount: 0, count: 1 }])
        ));
      let c = S.toJSON(this.contents, e, a);
      if (typeof t == "function" && a.anchors)
        for (let { count: f, res: d } of a.anchors.values()) t(d, f);
      return c;
    }
    toString() {
      if (this.errors.length > 0) throw new Error("Document with errors cannot be stringified");
      let e = this.options.indent;
      if (!Number.isInteger(e) || e <= 0) {
        let l = JSON.stringify(e);
        throw new Error(`"indent" option must be a positive integer, not ${l}`);
      }
      this.setSchema();
      let t = [],
        n = false;
      if (this.version) {
        let l = "%YAML 1.2";
        (this.schema.name === "yaml-1.1" &&
          (this.version === "1.0"
            ? (l = "%YAML:1.0")
            : this.version === "1.1" && (l = "%YAML 1.1")),
          t.push(l),
          (n = true));
      }
      let r = this.listNonDefaultTags();
      (this.tagPrefixes.forEach(({ handle: l, prefix: c }) => {
        r.some((f) => f.indexOf(c) === 0) && (t.push(`%TAG ${l} ${c}`), (n = true));
      }),
        (n || this.directivesEndMarker) && t.push("---"),
        this.commentBefore &&
          ((n || !this.directivesEndMarker) && t.unshift(""),
          t.unshift(this.commentBefore.replace(/^/gm, "#"))));
      let i = {
          anchors: /* @__PURE__ */ Object.create(null),
          doc: this,
          indent: "",
          indentStep: " ".repeat(e),
          stringify: ke,
        },
        o = false,
        a = null;
      if (this.contents) {
        this.contents instanceof S.Node &&
          (this.contents.spaceBefore && (n || this.directivesEndMarker) && t.push(""),
          this.contents.commentBefore && t.push(this.contents.commentBefore.replace(/^/gm, "#")),
          (i.forceBlockIndent = !!this.comment),
          (a = this.contents.comment));
        let l = a ? null : () => (o = true),
          c = ke(this.contents, i, () => (a = null), l);
        t.push(S.addComment(c, "", a));
      } else this.contents !== void 0 && t.push(ke(this.contents, i));
      return (
        this.comment &&
          ((!o || a) && t[t.length - 1] !== "" && t.push(""),
          t.push(this.comment.replace(/^/gm, "#"))),
        t.join(`
`) +
          `
`
      );
    }
  };
  P._defineProperty(_e, "defaults", Ht);
  Pe.Document = _e;
  Pe.defaultOptions = Es;
  Pe.scalarOptions = Os;
});
var en = I((Zt) => {
  "use strict";
  var lt = wt(),
    z = zt(),
    Is = ot(),
    _s = K(),
    Ps = nt();
  ce();
  function $s(s, e = true, t) {
    t === void 0 && typeof e == "string" && ((t = e), (e = true));
    let n = Object.assign({}, z.Document.defaults[z.defaultOptions.version], z.defaultOptions);
    return new Is.Schema(n).createNode(s, e, t);
  }
  var se = class extends z.Document {
    constructor(e) {
      super(Object.assign({}, z.defaultOptions, e));
    }
  };
  function xs(s, e) {
    let t = [],
      n;
    for (let r of lt.parse(s)) {
      let i = new se(e);
      (i.parse(r, n), t.push(i), (n = i));
    }
    return t;
  }
  function Xt(s, e) {
    let t = lt.parse(s),
      n = new se(e).parse(t[0]);
    if (t.length > 1) {
      let r = "Source contains multiple documents; please use YAML.parseAllDocuments()";
      n.errors.unshift(new _s.YAMLSemanticError(t[1], r));
    }
    return n;
  }
  function Cs(s, e) {
    let t = Xt(s, e);
    if ((t.warnings.forEach((n) => Ps.warn(n)), t.errors.length > 0)) throw t.errors[0];
    return t.toJSON();
  }
  function Rs(s, e) {
    let t = new se(e);
    return ((t.contents = s), String(t));
  }
  var Bs = {
    createNode: $s,
    defaultOptions: z.defaultOptions,
    Document: se,
    parse: Cs,
    parseAllDocuments: xs,
    parseCST: lt.parse,
    parseDocument: Xt,
    scalarOptions: z.scalarOptions,
    stringify: Rs,
  };
  Zt.YAML = Bs;
});
var nn = I((lr, tn) => {
  tn.exports = en().YAML;
});
var an = I((cr, on) => {
  var rn = nn(),
    Ys = /* @__PURE__ */ new Set([
      "YAMLReferenceError",
      "YAMLSemanticError",
      "YAMLSyntaxError",
      "YAMLWarning",
    ]);
  function sn(s) {
    if (typeof s != "string") return { ok: false, result: void 0 };
    let e = window.YAML_SILENCE_WARNINGS;
    try {
      return ((window.YAML_SILENCE_WARNINGS = true), { ok: true, result: rn.parse(s) });
    } catch (t) {
      if (t && Ys.has(t.name)) return { ok: false, result: void 0 };
      throw t;
    } finally {
      window.YAML_SILENCE_WARNINGS = e;
    }
  }
  on.exports = {
    "yaml.is_valid": (s) => (typeof s == "string" ? sn(s).ok : void 0),
    "yaml.marshal": (s) => rn.stringify(s),
    "yaml.unmarshal": (s) => sn(s).result,
  };
});
var cn = I((fr, ln) => {
  var js = ft(),
    Fs = pt(),
    Ds = gt(),
    qs = an();
  ln.exports = { ...js, ...Fs, ...Ds, ...qs };
});
var Gs = I((ur, pn) => {
  var Ws = cn();
  function Us(s) {
    return function (e) {
      let t = new Int8Array(s.buffer),
        n = "";
      for (; t[e] !== 0; ) n += String.fromCharCode(t[e++]);
      return n;
    };
  }
  function $e(s, e, t) {
    if (t === void 0) return 0;
    let n;
    if (t instanceof ArrayBuffer) n = new Uint8Array(t);
    else {
      let l = JSON.stringify(t);
      n = new TextEncoder().encode(l);
    }
    let r = n.byteLength,
      i = s.exports.opa_malloc(r);
    new Uint8Array(e.buffer).set(n, i);
    let a = s.exports.opa_json_parse(i, r);
    if (a === 0) throw "failed to parse json value";
    return a;
  }
  function xe(s, e, t) {
    let n = s.exports.opa_json_dump(t);
    return fn(e, n);
  }
  function fn(s, e) {
    let t = new Uint8Array(s.buffer),
      n = e;
    for (; t[n] !== 0; ) n++;
    let r = new Uint8Array(s.buffer, e, n - e),
      i = new TextDecoder().decode(r);
    return JSON.parse(i);
  }
  var Ks = Ws;
  function pe(s, e, t, n, r) {
    let i = t[r],
      o = Ks[i] || n[i];
    if (o === void 0) throw { message: "not implemented: built-in function " + r + ": " + t[r] };
    let a = Array.prototype.slice.apply(arguments),
      l = [];
    for (let f = 5; f < a.length; f++) {
      let d = xe(s, e, a[f]);
      l.push(d);
    }
    let c = o(...l);
    return $e(s, e, c);
  }
  function un(s, e, t) {
    let n = Us(e);
    return {
      env: {
        memory: e,
        opa_abort: function (r) {
          throw n(r);
        },
        opa_println: function (r) {
          console.log(n(r));
        },
        opa_builtin0: function (r, i) {
          return pe(s.instance, e, s.builtins, t, r);
        },
        opa_builtin1: function (r, i, o) {
          return pe(s.instance, e, s.builtins, t, r, o);
        },
        opa_builtin2: function (r, i, o, a) {
          return pe(s.instance, e, s.builtins, t, r, o, a);
        },
        opa_builtin3: function (r, i, o, a, l) {
          return pe(s.instance, e, s.builtins, t, r, o, a, l);
        },
        opa_builtin4: function (r, i, o, a, l, c) {
          return pe(s.instance, e, s.builtins, t, r, o, a, l, c);
        },
      },
    };
  }
  function hn(s, e, t) {
    s.instance = e.instance ? e.instance : e;
    let n = s.instance.exports.opa_wasm_abi_version;
    if (n !== void 0) {
      let a = typeof n == "number" ? n : n.value;
      if (a !== 1) throw `unsupported ABI version ${a}`;
    } else console.error("opa_wasm_abi_version undefined");
    let r = s.instance.exports.opa_wasm_abi_minor_version,
      i;
    r !== void 0
      ? (i = typeof r == "number" ? r : r.value)
      : console.error("opa_wasm_abi_minor_version undefined");
    let o = xe(s.instance, t, s.instance.exports.builtins());
    s.builtins = {};
    for (let a of Object.keys(o)) s.builtins[o[a]] = a;
    return { policy: e, minorVersion: i };
  }
  async function Vs(s, e, t) {
    let n = {},
      r = s instanceof Response || s instanceof Promise,
      i = un(n, e, t),
      o = await (r ? WebAssembly.instantiateStreaming(s, i) : WebAssembly.instantiate(s, i));
    return hn(n, o, e);
  }
  function Js(s, e, t) {
    let n = {};
    (s instanceof ArrayBuffer || s.buffer instanceof ArrayBuffer) &&
      (s = new WebAssembly.Module(s));
    let r = new WebAssembly.Instance(s, un(n, e, t));
    return hn(n, r, e);
  }
  var de = class {
    constructor(e, t, n) {
      ((this.minorVersion = n),
        (this.mem = t),
        (this.wasmInstance = e.instance ? e.instance : e),
        (this.dataAddr = $e(this.wasmInstance, this.mem, {})),
        (this.baseHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get()),
        (this.dataHeapPtr = this.baseHeapPtr),
        (this.entrypoints = xe(
          this.wasmInstance,
          this.mem,
          this.wasmInstance.exports.entrypoints()
        )));
    }
    evaluate(e, t = 0) {
      if (typeof t != "number")
        if (typeof t == "string")
          if (Object.prototype.hasOwnProperty.call(this.entrypoints, t)) t = this.entrypoints[t];
          else throw `entrypoint ${t} is not valid in this instance`;
        else throw "entrypoint value is an invalid type, must be either string or number";
      if (this.minorVersion >= 2) {
        let o = null,
          a = 0,
          l = 0;
        if (e) {
          if (e instanceof ArrayBuffer) o = new Uint8Array(e);
          else {
            let m = JSON.stringify(e);
            o = new TextEncoder().encode(m);
          }
          ((l = this.dataHeapPtr), (a = o.byteLength));
          let d = l + a - this.mem.buffer.byteLength;
          if (d > 0) {
            let m = Qs(d);
            this.mem.grow(m);
          }
          new Uint8Array(this.mem.buffer).set(o, this.dataHeapPtr);
        }
        let c = this.dataHeapPtr + a,
          f = this.wasmInstance.exports.opa_eval(0, t, this.dataAddr, l, a, c, 0);
        return fn(this.mem, f);
      }
      this.wasmInstance.exports.opa_heap_ptr_set(this.dataHeapPtr);
      let n = $e(this.wasmInstance, this.mem, e),
        r = this.wasmInstance.exports.opa_eval_ctx_new();
      (this.wasmInstance.exports.opa_eval_ctx_set_input(r, n),
        this.wasmInstance.exports.opa_eval_ctx_set_data(r, this.dataAddr),
        this.wasmInstance.exports.opa_eval_ctx_set_entrypoint(r, t),
        this.wasmInstance.exports.eval(r));
      let i = this.wasmInstance.exports.opa_eval_ctx_get_result(r);
      return xe(this.wasmInstance, this.mem, i);
    }
    evalBool(e) {
      let t = this.evaluate(e);
      return t && t.length === 1 && t[0] === true;
    }
    setData(e) {
      (this.wasmInstance.exports.opa_heap_ptr_set(this.baseHeapPtr),
        (this.dataAddr = $e(this.wasmInstance, this.mem, e)),
        (this.dataHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get()));
    }
  };
  function Qs(s) {
    return Math.ceil(s / 65536);
  }
  pn.exports = {
    async loadPolicy(s, e = {}, t = {}) {
      (typeof e == "number" && (e = { initial: e }), (e.initial = e.initial || 5));
      let n = new WebAssembly.Memory(e),
        { policy: r, minorVersion: i } = await Vs(s, n, t);
      return new de(r, n, i);
    },
    loadPolicySync(s, e = {}, t = {}) {
      (typeof e == "number" && (e = { initial: e }), (e.initial = e.initial || 5));
      let n = new WebAssembly.Memory(e),
        { policy: r, minorVersion: i } = Js(s, n, t);
      return new de(r, n, i);
    },
    LoadedPolicy: de,
  };
});
var opa_wasm_browser_esm_default = Gs();
export { opa_wasm_browser_esm_default as default };
