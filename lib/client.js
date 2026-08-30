window.__ModuleLoader__.load({ id: "dsh-done-pill", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/pill.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
var MOBILE_BREAKPOINT = 768;
function isMobileViewport() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 0.02}px)`).matches;
}
var POLL_MS = 3e3;
var MORPH_DUR = ".65s";
var MAX_ENTRIES = 100;
var MAX_READ_IDS = 300;
var READ_KEY = "dsh.donePill.read";
var POS_KEY = "dsh.donePill.pos";
var ENABLED_KEY = "dsh.donePill.enabled";
var sessionsRuntime;
function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.filter((v) => typeof v === "string"));
    }
  } catch {
  }
  return /* @__PURE__ */ new Set();
}
function saveReadIds(ids) {
  try {
    const arr = [...ids];
    localStorage.setItem(READ_KEY, JSON.stringify(arr.length > MAX_READ_IDS ? arr.slice(-MAX_READ_IDS) : arr));
  } catch {
  }
}
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}
function defaultShellTop() {
  return isMobileViewport() ? 60 : 40;
}
function clampPos(x, y, w = 160, h = 30) {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - w - margin);
  const maxY = Math.max(margin, window.innerHeight - h - margin);
  return {
    x: Math.round(Math.min(Math.max(x, margin), maxX)),
    y: Math.round(Math.min(Math.max(y, margin), maxY))
  };
}
function loadAnchor() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.xc === "number" && Number.isFinite(parsed.xc) && typeof parsed?.yc === "number" && Number.isFinite(parsed.yc)) {
        return { xc: clamp01(parsed.xc), yc: clamp01(parsed.yc) };
      }
      if (typeof parsed?.xr === "number" && typeof parsed?.yr === "number" && Number.isFinite(parsed.xr) && Number.isFinite(parsed.yr)) {
        return { xc: clamp01((parsed.xr * window.innerWidth + 80) / window.innerWidth), yc: clamp01(parsed.yr) };
      }
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number" && Number.isFinite(parsed.x) && Number.isFinite(parsed.y) && window.innerWidth > 0 && window.innerHeight > 0) {
        return {
          xc: clamp01((parsed.x + 80) / window.innerWidth),
          yc: clamp01((parsed.y + 15) / window.innerHeight)
        };
      }
    }
  } catch {
  }
  return null;
}
function saveAnchor(anchor) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(anchor));
  } catch {
  }
}
function pillHeight(scale) {
  return Math.max(1, Math.round(30 * scale));
}
function anchorToPos(anchor, shellWidth, shellHeight = 30) {
  return clampPos(
    Math.round(anchor.xc * window.innerWidth - shellWidth / 2),
    Math.round(anchor.yc * window.innerHeight - shellHeight / 2),
    shellWidth,
    shellHeight
  );
}
var REST_KEY = "dsh.donePill.rest";
var LATE_KEY = "dsh.donePill.late";
function createReminderStore(key, defaults) {
  let value = { ...defaults };
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      value = {
        enabled: parsed?.enabled === true,
        start: typeof parsed?.start === "string" && /^\d{2}:\d{2}$/.test(parsed.start) ? parsed.start : defaults.start,
        end: typeof parsed?.end === "string" && /^\d{2}:\d{2}$/.test(parsed.end) ? parsed.end : defaults.end
      };
    }
  } catch {
  }
  const listeners = /* @__PURE__ */ new Set();
  return {
    get: () => value,
    set(next) {
      value = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
      }
      for (const fn of [...listeners]) fn(next);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }
  };
}
var restStore = createReminderStore(REST_KEY, { enabled: false, start: "13:00", end: "14:00" });
var lateStore = createReminderStore(LATE_KEY, { enabled: true, start: "00:00", end: "07:00" });
function parseHM(hm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (match === null) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}
function inTimeRange(nowMinutes, config) {
  const s = parseHM(config.start);
  const e = parseHM(config.end);
  if (s === null || e === null || s === e) return false;
  return s < e ? nowMinutes >= s && nowMinutes < e : nowMinutes >= s || nowMinutes < e;
}
var FUN_LINES = [
  // 开心话术（13 条）
  { icon: "sparkle", text: "\u4ECA\u5929\u4E5F\u662F\u5145\u6EE1\u53EF\u80FD\u7684\u4E00\u5929\uFF01" },
  { icon: "sparkle", text: "\u4F60\u89E3\u51B3\u95EE\u9898\u7684\u6837\u5B50\u771F\u7684\u5F88\u9177" },
  { icon: "sparkle", text: "\u6BCF\u4E00\u884C\u4EE3\u7801\u90FD\u5728\u9760\u8FD1\u76EE\u6807" },
  { icon: "sparkle", text: "\u4F11\u606F\u4E00\u4E0B\uFF0C\u7075\u611F\u5F80\u5F80\u5728\u653E\u677E\u65F6\u51FA\u73B0" },
  { icon: "sparkle", text: "\u5DF2\u5B8C\u6210\u7684\u6BCF\u4E00\u4E2A\u4EFB\u52A1\u90FD\u7B97\u6570" },
  { icon: "sparkle", text: "\u4FDD\u6301\u597D\u5947\uFF0C\u4E16\u754C\u4F1A\u7ED9\u4F60\u7B54\u6848" },
  { icon: "sparkle", text: "\u8FDB\u6B65\u4E0D\u5FC5\u5DE8\u5927\uFF0C\u6301\u7EED\u5C31\u5F88\u4E86\u4E0D\u8D77" },
  { icon: "sparkle", text: "\u6DF1\u547C\u5438\uFF0C\u4E00\u5207\u90FD\u4F1A\u987A\u5229\u7684" },
  { icon: "sparkle", text: "\u8BB0\u5F97\u559D\u6C34\uFF0C\u8EAB\u4F53\u662F\u9769\u547D\u7684\u672C\u94B1" },
  { icon: "sparkle", text: "\u661F\u5149\u4E0D\u95EE\u8D76\u8DEF\u4EBA\uFF0C\u65F6\u5149\u4E0D\u8D1F\u6709\u5FC3\u4EBA" },
  { icon: "sparkle", text: "\u5C0F\u6B65\u524D\u8FDB\u4E5F\u662F\u4E00\u79CD\u62B5\u8FBE" },
  { icon: "sparkle", text: "\u4F60\u7684\u52AA\u529B\uFF0C\u65F6\u95F4\u770B\u5F97\u89C1" },
  { icon: "sparkle", text: "\u7B11\u4E00\u7B11\uFF0Cbug \u90FD\u4F1A\u5C11\u4E00\u70B9" },
  // AI 名词小知识（100+ 条）
  { icon: "bulb", text: "LLM \u5927\u8BED\u8A00\u6A21\u578B\uFF1A\u901A\u8FC7\u6D77\u91CF\u6587\u672C\u8BAD\u7EC3\u3001\u80FD\u7406\u89E3\u5E76\u751F\u6210\u81EA\u7136\u8BED\u8A00\u7684 AI \u6A21\u578B" },
  { icon: "bulb", text: "Token \u8BCD\u5143\uFF1A\u6A21\u578B\u5904\u7406\u6587\u672C\u7684\u6700\u5C0F\u5355\u4F4D\uFF0C\u4E00\u4E2A\u6C49\u5B57\u901A\u5E38\u662F 1~2 \u4E2A" },
  { icon: "bulb", text: "Transformer\uFF1A2017 \u5E74\u63D0\u51FA\u7684\u6CE8\u610F\u529B\u67B6\u6784\uFF0C\u73B0\u4EE3\u5927\u6A21\u578B\u7684\u57FA\u77F3" },
  { icon: "bulb", text: "Prompt \u63D0\u793A\u8BCD\uFF1A\u4F60\u53D1\u7ED9 AI \u7684\u6307\u4EE4\uFF0C\u5199\u5F97\u8D8A\u6E05\u6670\u56DE\u7B54\u8D8A\u9760\u8C31" },
  { icon: "bulb", text: "\u5FAE\u8C03 Fine-tuning\uFF1A\u7528\u7279\u5B9A\u6570\u636E\u7EE7\u7EED\u8BAD\u7EC3\uFF0C\u8BA9\u5B83\u66F4\u64C5\u957F\u67D0\u4E2A\u9886\u57DF" },
  { icon: "bulb", text: "RAG \u68C0\u7D22\u589E\u5F3A\u751F\u6210\uFF1A\u5148\u67E5\u8D44\u6599\u518D\u56DE\u7B54\uFF0C\u8BA9\u7B54\u6848\u6709\u636E\u53EF\u4F9D" },
  { icon: "bulb", text: "\u5E7B\u89C9 Hallucination\uFF1AAI \u4E00\u672C\u6B63\u7ECF\u7F16\u9020\u4E0D\u5B58\u5728\u7684\u4E8B\u5B9E\uFF0C\u8BB0\u5F97\u6838\u5B9E" },
  { icon: "bulb", text: "\u591A\u6A21\u6001 Multimodal\uFF1A\u80FD\u540C\u65F6\u7406\u89E3\u6587\u5B57\u3001\u56FE\u7247\u3001\u97F3\u9891\u7B49\u4FE1\u606F\u7684\u6A21\u578B" },
  { icon: "bulb", text: "Agent \u667A\u80FD\u4F53\uFF1A\u80FD\u81EA\u4E3B\u89C4\u5212\u6B65\u9AA4\u3001\u8C03\u7528\u5DE5\u5177\u3001\u5B8C\u6210\u4EFB\u52A1\u7684 AI" },
  { icon: "bulb", text: "\u4E0A\u4E0B\u6587\u7A97\u53E3 Context Window\uFF1A\u6A21\u578B\u4E00\u6B21\u80FD\u300C\u770B\u5230\u300D\u7684\u6700\u5927\u6587\u672C\u957F\u5EA6" },
  { icon: "bulb", text: "\u6E29\u5EA6 Temperature\uFF1A\u63A7\u5236\u56DE\u7B54\u968F\u673A\u6027\u7684\u53C2\u6570\uFF0C\u8D8A\u4F4E\u8D8A\u4E25\u8C28" },
  { icon: "bulb", text: "Embedding \u5411\u91CF\u5D4C\u5165\uFF1A\u628A\u6587\u5B57\u53D8\u6210\u6570\u5B57\u5411\u91CF\uFF0C\u53EF\u8BA1\u7B97\u8BED\u4E49\u76F8\u4F3C\u5EA6" },
  { icon: "bulb", text: "\u601D\u7EF4\u94FE Chain-of-Thought\uFF1A\u8BA9 AI \u4E00\u6B65\u6B65\u63A8\u7406\uFF0C\u590D\u6742\u9898\u6B63\u786E\u7387\u5927\u589E" },
  { icon: "bulb", text: "\u84B8\u998F Distillation\uFF1A\u7528\u5927\u6A21\u578B\u6559\u5C0F\u6A21\u578B\uFF0C\u66F4\u5FEB\u66F4\u4FBF\u5B9C" },
  { icon: "bulb", text: "\u5BF9\u9F50 Alignment\uFF1A\u8BA9 AI \u884C\u4E3A\u7B26\u5408\u4EBA\u7C7B\u610F\u56FE\u4E0E\u4EF7\u503C\u89C2" },
  { icon: "bulb", text: "RLHF \u4EBA\u7C7B\u53CD\u9988\u5F3A\u5316\u5B66\u4E60\uFF1A\u7528\u4EBA\u7C7B\u504F\u597D\u8BAD\u7EC3\uFF0C\u56DE\u7B54\u66F4\u5408\u610F" },
  { icon: "bulb", text: "\u673A\u5668\u5B66\u4E60 ML\uFF1A\u8BA9\u8BA1\u7B97\u673A\u4ECE\u6570\u636E\u4E2D\u81EA\u52A8\u5B66\u89C4\u5F8B\uFF0C\u65E0\u9700\u663E\u5F0F\u7F16\u7A0B" },
  { icon: "bulb", text: "\u6DF1\u5EA6\u5B66\u4E60 DL\uFF1A\u7528\u591A\u5C42\u795E\u7ECF\u7F51\u7EDC\u81EA\u52A8\u62BD\u53D6\u7279\u5F81\u7684\u5206\u652F" },
  { icon: "bulb", text: "\u795E\u7ECF\u7F51\u7EDC\uFF1A\u6A21\u62DF\u4EBA\u8111\u795E\u7ECF\u5143\u8FDE\u63A5\u7684\u8BA1\u7B97\u6A21\u578B\uFF0C\u6DF1\u5EA6\u5B66\u4E60\u7684\u57FA\u77F3" },
  { icon: "bulb", text: "\u53C2\u6570 Parameter\uFF1A\u6A21\u578B\u5185\u90E8\u53EF\u5B66\u4E60\u7684\u6570\u503C\uFF0C\u51B3\u5B9A\u300C\u8BB0\u5FC6\u300D\u4E0E\u80FD\u529B" },
  { icon: "bulb", text: "\u6743\u91CD Weight\uFF1A\u795E\u7ECF\u7F51\u7EDC\u8FDE\u63A5\u7684\u5F3A\u5EA6\u6570\u503C\uFF0C\u8BAD\u7EC3\u65F6\u4E0D\u65AD\u88AB\u8C03\u6574" },
  { icon: "bulb", text: "\u8BAD\u7EC3 Training\uFF1A\u7528\u6D77\u91CF\u6570\u636E\u53CD\u590D\u8C03\u6574\u53C2\u6570\u3001\u8BA9\u6A21\u578B\u5B66\u4F1A\u4EFB\u52A1" },
  { icon: "bulb", text: "\u63A8\u7406 Inference\uFF1A\u8BAD\u7EC3\u597D\u7684\u6A21\u578B\u5BF9\u8F93\u5165\u8BA1\u7B97\u5E76\u8F93\u51FA\u7ED3\u679C" },
  { icon: "bulb", text: "\u6570\u636E\u96C6 Dataset\uFF1A\u7528\u4E8E\u8BAD\u7EC3\u4E0E\u8BC4\u4F30\u6A21\u578B\u7684\u6837\u672C\u96C6\u5408" },
  { icon: "bulb", text: "\u8BED\u6599\u5E93 Corpus\uFF1A\u5927\u89C4\u6A21\u6587\u672C\u96C6\u5408\uFF0C\u5927\u6A21\u578B\u8BAD\u7EC3\u7684\u4E3B\u8981\u539F\u6599" },
  { icon: "bulb", text: "\u6CE8\u610F\u529B\u673A\u5236 Attention\uFF1A\u8BA9\u6A21\u578B\u805A\u7126\u8F93\u5165\u4E2D\u5173\u952E\u90E8\u5206\u7684\u6280\u672F" },
  { icon: "bulb", text: "\u81EA\u6CE8\u610F\u529B Self-Attention\uFF1A\u8BA9\u6BCF\u4E2A\u8BCD\u5173\u8054\u4E0A\u4E0B\u6587\u4E2D\u7684\u6240\u6709\u8BCD" },
  { icon: "bulb", text: "\u591A\u5934\u6CE8\u610F\u529B Multi-Head\uFF1A\u5E76\u884C\u591A\u7EC4\u6CE8\u610F\u529B\uFF0C\u6355\u6349\u4E0D\u540C\u5173\u7CFB" },
  { icon: "bulb", text: "\u7F16\u7801\u5668 Encoder\uFF1A\u628A\u8F93\u5165\u7F16\u7801\u6210\u5411\u91CF\u8868\u793A\u7684\u6A21\u5757" },
  { icon: "bulb", text: "\u89E3\u7801\u5668 Decoder\uFF1A\u6839\u636E\u7F16\u7801\u4FE1\u606F\u9010\u5B57\u751F\u6210\u7684\u6A21\u5757" },
  { icon: "bulb", text: "\u4F4D\u7F6E\u7F16\u7801 Positional Encoding\uFF1A\u8BA9\u6A21\u578B\u611F\u77E5\u8BCD\u5E8F\u7684\u65B9\u6CD5" },
  { icon: "bulb", text: "\u6B8B\u5DEE\u8FDE\u63A5 Residual\uFF1A\u8DE8\u5C42\u76F4\u8FDE\u901A\u9053\uFF0C\u7F13\u89E3\u6DF1\u5C42\u7F51\u7EDC\u9000\u5316" },
  { icon: "bulb", text: "\u5F52\u4E00\u5316 Normalization\uFF1A\u7A33\u5B9A\u6570\u503C\u5206\u5E03\u3001\u52A0\u901F\u8BAD\u7EC3\u7684\u6280\u5DE7" },
  { icon: "bulb", text: "\u6FC0\u6D3B\u51FD\u6570 Activation\uFF1A\u5F15\u5165\u975E\u7EBF\u6027\uFF0C\u8BA9\u7F51\u7EDC\u80FD\u5B66\u590D\u6742\u5173\u7CFB" },
  { icon: "bulb", text: "\u9884\u8BAD\u7EC3 Pre-training\uFF1A\u5728\u5927\u89C4\u6A21\u8BED\u6599\u4E0A\u65E0\u76D1\u7763\u5B66\u4E60\u901A\u7528\u77E5\u8BC6" },
  { icon: "bulb", text: "\u76D1\u7763\u5FAE\u8C03 SFT\uFF1A\u7528\u95EE\u7B54\u8303\u4F8B\u6559\u6A21\u578B\u6309\u6307\u4EE4\u4F5C\u7B54" },
  { icon: "bulb", text: "\u635F\u5931\u51FD\u6570 Loss\uFF1A\u8861\u91CF\u9884\u6D4B\u4E0E\u76EE\u6807\u7684\u5DEE\u8DDD\uFF0C\u6307\u5BFC\u53C2\u6570\u66F4\u65B0" },
  { icon: "bulb", text: "\u68AF\u5EA6\u4E0B\u964D Gradient Descent\uFF1A\u6CBF\u68AF\u5EA6\u65B9\u5411\u8FED\u4EE3\u51CF\u5C0F\u8BEF\u5DEE" },
  { icon: "bulb", text: "\u5B66\u4E60\u7387 Learning Rate\uFF1A\u6BCF\u6B65\u53C2\u6570\u66F4\u65B0\u7684\u6B65\u5E45" },
  { icon: "bulb", text: "\u6279\u5927\u5C0F Batch Size\uFF1A\u4E00\u6B21\u8BAD\u7EC3\u5582\u7ED9\u6A21\u578B\u7684\u6837\u672C\u6570" },
  { icon: "bulb", text: "\u8F6E\u6B21 Epoch\uFF1A\u5B8C\u6574\u8FC7\u4E00\u904D\u8BAD\u7EC3\u6570\u636E\u7684\u6B21\u6570" },
  { icon: "bulb", text: "\u8FC7\u62DF\u5408 Overfitting\uFF1A\u6A21\u578B\u6B7B\u8BB0\u8BAD\u7EC3\u6570\u636E\u3001\u6CDB\u5316\u80FD\u529B\u5DEE" },
  { icon: "bulb", text: "\u6B20\u62DF\u5408 Underfitting\uFF1A\u6A21\u578B\u6CA1\u5B66\u5230\u8DB3\u591F\u89C4\u5F8B\uFF0C\u8BAD\u7EC3\u96C6\u90FD\u505A\u4E0D\u597D" },
  { icon: "bulb", text: "\u6B63\u5219\u5316 Regularization\uFF1A\u6291\u5236\u8FC7\u62DF\u5408\u7684\u4E00\u7CFB\u5217\u624B\u6BB5" },
  { icon: "bulb", text: "\u65E9\u505C Early Stopping\uFF1A\u9A8C\u8BC1\u96C6\u4E0D\u518D\u63D0\u5347\u5C31\u63D0\u524D\u7ED3\u675F\u8BAD\u7EC3" },
  { icon: "bulb", text: "\u91CF\u5316 Quantization\uFF1A\u538B\u7F29\u6570\u503C\u7CBE\u5EA6\uFF0C\u51CF\u5C0F\u4F53\u79EF\u52A0\u901F\u63A8\u7406" },
  { icon: "bulb", text: "\u526A\u679D Pruning\uFF1A\u79FB\u9664\u5197\u4F59\u53C2\u6570\uFF0C\u7ED9\u6A21\u578B\u7626\u8EAB" },
  { icon: "bulb", text: "\u8FC1\u79FB\u5B66\u4E60 Transfer Learning\uFF1A\u628A\u5DF2\u5B66\u77E5\u8BC6\u8FC1\u79FB\u5230\u65B0\u4EFB\u52A1" },
  { icon: "bulb", text: "\u5206\u8BCD\u5668 Tokenizer\uFF1A\u628A\u6587\u672C\u5207\u5206\u6210\u8BCD\u5143\u5E8F\u5217\u7684\u5DE5\u5177" },
  { icon: "bulb", text: "\u751F\u6210 Generation\uFF1A\u6A21\u578B\u9010\u5B57\u9884\u6D4B\u4E0B\u4E00\u4E2A\u8BCD\u5143\u7684\u8FC7\u7A0B" },
  { icon: "bulb", text: "\u81EA\u56DE\u5F52 Autoregressive\uFF1A\u7528\u5DF2\u751F\u6210\u7684\u8BCD\u9884\u6D4B\u4E0B\u4E00\u4E2A\u8BCD" },
  { icon: "bulb", text: "\u91C7\u6837 Sampling\uFF1A\u6309\u6982\u7387\u5206\u5E03\u968F\u673A\u9009\u62E9\u4E0B\u4E00\u4E2A\u8BCD" },
  { icon: "bulb", text: "Top-p \u6838\u91C7\u6837\uFF1A\u53EA\u5728\u7D2F\u8BA1\u6982\u7387\u8FBE p \u7684\u5019\u9009\u8BCD\u4E2D\u91C7\u6837" },
  { icon: "bulb", text: "Top-k \u91C7\u6837\uFF1A\u53EA\u5728\u6982\u7387\u6700\u9AD8\u7684 k \u4E2A\u8BCD\u4E2D\u91C7\u6837" },
  { icon: "bulb", text: "\u8D2A\u5FC3\u89E3\u7801 Greedy\uFF1A\u6BCF\u6B65\u90FD\u9009\u6982\u7387\u6700\u9AD8\u7684\u8BCD\uFF0C\u7A33\u5B9A\u4F46\u6613\u91CD\u590D" },
  { icon: "bulb", text: "\u675F\u641C\u7D22 Beam Search\uFF1A\u4FDD\u7559\u591A\u6761\u5019\u9009\u8DEF\u5F84\uFF0C\u517C\u987E\u8D28\u91CF\u4E0E\u591A\u6837" },
  { icon: "bulb", text: "\u505C\u6B62\u8BCD Stop Token\uFF1A\u6807\u8BB0\u751F\u6210\u7ED3\u675F\u7684\u7279\u6B8A\u8BCD\u5143" },
  { icon: "bulb", text: "\u957F\u5EA6\u60E9\u7F5A Length Penalty\uFF1A\u8C03\u8282\u8F93\u51FA\u957F\u77ED\u503E\u5411\u7684\u53C2\u6570" },
  { icon: "bulb", text: "\u63A8\u7406 Reasoning\uFF1A\u6A21\u578B\u63A8\u5BFC\u3001\u8BA1\u7B97\u3001\u591A\u6B65\u601D\u8003\u7684\u80FD\u529B" },
  { icon: "bulb", text: "\u63D0\u793A\u5DE5\u7A0B Prompt Engineering\uFF1A\u8BBE\u8BA1\u8F93\u5165\u8BA9\u6A21\u578B\u8868\u73B0\u66F4\u597D" },
  { icon: "bulb", text: "\u5C11\u6837\u672C\u63D0\u793A Few-shot\uFF1A\u7ED9\u51E0\u4E2A\u8303\u4F8B\uFF0C\u6A21\u578B\u7167\u7740\u683C\u5F0F\u505A" },
  { icon: "bulb", text: "\u96F6\u6837\u672C Zero-shot\uFF1A\u4E0D\u7ED9\u8303\u4F8B\uFF0C\u76F4\u63A5\u63D0\u95EE" },
  { icon: "bulb", text: "\u4E0A\u4E0B\u6587\u5B66\u4E60 In-Context Learning\uFF1A\u9760\u63D0\u793A\u8BCD\u4E34\u65F6\u5B66\u4F1A\u4EFB\u52A1" },
  { icon: "bulb", text: "\u81EA\u4E00\u81F4\u6027 Self-Consistency\uFF1A\u591A\u6B21\u91C7\u6837\u6295\u7968\uFF0C\u53D6\u591A\u6570\u7B54\u6848" },
  { icon: "bulb", text: "\u601D\u7EF4\u6811 Tree-of-Thoughts\uFF1A\u591A\u5206\u652F\u63A2\u7D22\u63A8\u7406\u8DEF\u5F84\u5E76\u56DE\u6EAF" },
  { icon: "bulb", text: "\u89C4\u5212 Planning\uFF1A\u628A\u590D\u6742\u4EFB\u52A1\u62C6\u89E3\u6210\u53EF\u6267\u884C\u6B65\u9AA4" },
  { icon: "bulb", text: "\u5411\u91CF\u6570\u636E\u5E93 Vector DB\uFF1A\u5B58\u50A8\u5E76\u68C0\u7D22\u9AD8\u7EF4\u5411\u91CF\u7684\u6570\u636E\u5E93" },
  { icon: "bulb", text: "\u76F8\u4F3C\u5EA6\u68C0\u7D22 Similarity Search\uFF1A\u6309\u5411\u91CF\u8DDD\u79BB\u627E\u6700\u76F8\u5173\u5185\u5BB9" },
  { icon: "bulb", text: "\u4F59\u5F26\u76F8\u4F3C\u5EA6 Cosine\uFF1A\u8861\u91CF\u4E24\u5411\u91CF\u65B9\u5411\u63A5\u8FD1\u7A0B\u5EA6\u7684\u6307\u6807" },
  { icon: "bulb", text: "\u77E5\u8BC6\u5E93 Knowledge Base\uFF1A\u4F9B\u68C0\u7D22\u5F15\u7528\u7684\u7ED3\u6784\u5316\u8D44\u6599\u96C6\u5408" },
  { icon: "bulb", text: "\u5206\u5757 Chunking\uFF1A\u628A\u957F\u6587\u6863\u5207\u6210\u4FBF\u4E8E\u68C0\u7D22\u7684\u5C0F\u6BB5" },
  { icon: "bulb", text: "\u91CD\u6392\u5E8F Rerank\uFF1A\u5BF9\u53EC\u56DE\u7ED3\u679C\u4E8C\u6B21\u6392\u5E8F\uFF0C\u63D0\u5347\u76F8\u5173\u6027" },
  { icon: "bulb", text: "\u8BED\u4E49\u641C\u7D22 Semantic Search\uFF1A\u6309\u542B\u4E49\u800C\u975E\u5173\u952E\u8BCD\u5339\u914D" },
  { icon: "bulb", text: "\u6DF7\u5408\u68C0\u7D22 Hybrid\uFF1A\u5173\u952E\u8BCD + \u5411\u91CF\u4E24\u79CD\u65B9\u5F0F\u7ED3\u5408" },
  { icon: "bulb", text: "\u5DE5\u5177\u8C03\u7528 Function Calling\uFF1A\u6A21\u578B\u6309\u9700\u8C03\u7528\u5916\u90E8\u51FD\u6570\u6216 API" },
  { icon: "bulb", text: "\u591A\u667A\u80FD\u4F53 Multi-Agent\uFF1A\u591A\u4E2A\u667A\u80FD\u4F53\u5206\u5DE5\u534F\u4F5C\u5B8C\u6210\u76EE\u6807" },
  { icon: "bulb", text: "\u8BB0\u5FC6 Memory\uFF1A\u667A\u80FD\u4F53\u8DE8\u8F6E\u6B21\u4FDD\u7559\u4E0A\u4E0B\u6587\u4E0E\u4E8B\u5B9E" },
  { icon: "bulb", text: "\u53CD\u601D Reflection\uFF1A\u8BA9\u667A\u80FD\u4F53\u81EA\u6211\u5BA1\u67E5\u5E76\u6539\u8FDB\u8F93\u51FA" },
  { icon: "bulb", text: "\u81EA\u4E3B\u6027 Autonomy\uFF1A\u667A\u80FD\u4F53\u4E0D\u4F9D\u8D56\u4EBA\u9010\u6B65\u6307\u6325\u7684\u80FD\u529B" },
  { icon: "bulb", text: "\u89C6\u89C9\u8BED\u8A00\u6A21\u578B VLM\uFF1A\u80FD\u770B\u56FE\u8BC6\u56FE\u3001\u56FE\u6587\u63A8\u7406\u7684\u6A21\u578B" },
  { icon: "bulb", text: "\u6587\u751F\u56FE Text-to-Image\uFF1A\u6839\u636E\u6587\u5B57\u63CF\u8FF0\u751F\u6210\u56FE\u7247" },
  { icon: "bulb", text: "\u6269\u6563\u6A21\u578B Diffusion\uFF1A\u9010\u6B65\u53BB\u566A\u751F\u6210\u56FE\u50CF\u7684\u4E3B\u6D41\u65B9\u6CD5" },
  { icon: "bulb", text: "\u6587\u751F\u89C6\u9891 Text-to-Video\uFF1A\u6839\u636E\u6587\u5B57\u751F\u6210\u89C6\u9891" },
  { icon: "bulb", text: "\u8BED\u97F3\u8BC6\u522B ASR\uFF1A\u628A\u8BED\u97F3\u8F6C\u6210\u6587\u5B57" },
  { icon: "bulb", text: "\u8BED\u97F3\u5408\u6210 TTS\uFF1A\u628A\u6587\u5B57\u8F6C\u6210\u8BED\u97F3" },
  { icon: "bulb", text: "OCR \u6587\u5B57\u8BC6\u522B\uFF1A\u4ECE\u56FE\u7247\u4E2D\u63D0\u53D6\u6587\u5B57" },
  { icon: "bulb", text: "\u57FA\u51C6 Benchmark\uFF1A\u6807\u51C6\u5316\u6D4B\u8BD5\u96C6\uFF0C\u7528\u6765\u8861\u91CF\u6A21\u578B\u80FD\u529B" },
  { icon: "bulb", text: "\u56F0\u60D1\u5EA6 Perplexity\uFF1A\u8861\u91CF\u8BED\u8A00\u6A21\u578B\u9884\u6D4B\u80FD\u529B\u7684\u6307\u6807" },
  { icon: "bulb", text: "BLEU\uFF1A\u673A\u5668\u7FFB\u8BD1\u8D28\u91CF\u7684\u81EA\u52A8\u8BC4\u5206\u6307\u6807" },
  { icon: "bulb", text: "ROUGE\uFF1A\u6458\u8981\u8D28\u91CF\u7684\u81EA\u52A8\u8BC4\u5206\u6307\u6807" },
  { icon: "bulb", text: "\u5B89\u5168\u6027 Safety\uFF1A\u9632\u6B62\u6A21\u578B\u8F93\u51FA\u6709\u5BB3\u3001\u8FDD\u89C4\u5185\u5BB9" },
  { icon: "bulb", text: "\u8D8A\u72F1 Jailbreak\uFF1A\u7528\u8BF1\u5BFC\u8BDD\u672F\u7A81\u7834\u6A21\u578B\u5B89\u5168\u9650\u5236" },
  { icon: "bulb", text: "\u7EA2\u961F\u6D4B\u8BD5 Red Teaming\uFF1A\u4E3B\u52A8\u653B\u51FB\u6A21\u578B\u627E\u6F0F\u6D1E" },
  { icon: "bulb", text: "\u504F\u89C1 Bias\uFF1A\u6A21\u578B\u653E\u5927\u8BAD\u7EC3\u6570\u636E\u4E2D\u7684\u523B\u677F\u5370\u8C61" },
  { icon: "bulb", text: "\u53EF\u89E3\u91CA\u6027 Interpretability\uFF1A\u7406\u89E3\u6A21\u578B\u4E3A\u4F55\u5982\u6B64\u51B3\u7B56" },
  { icon: "bulb", text: "\u6570\u636E\u6C61\u67D3 Data Contamination\uFF1A\u6D4B\u8BD5\u9898\u6DF7\u8FDB\u8BAD\u7EC3\u6570\u636E\u3001\u5206\u6570\u865A\u9AD8" },
  { icon: "bulb", text: "\u5C0F\u6A21\u578B SLM\uFF1A\u53C2\u6570\u5C11\u3001\u53EF\u672C\u5730\u8FD0\u884C\u7684\u9AD8\u6548\u6A21\u578B" },
  { icon: "bulb", text: "\u5F00\u6E90\u6A21\u578B Open-source\uFF1A\u6743\u91CD\u516C\u5F00\uFF0C\u53EF\u81EA\u7531\u4F7F\u7528\u4E0E\u5FAE\u8C03" },
  { icon: "bulb", text: "\u6D41\u5F0F\u8F93\u51FA Streaming\uFF1A\u8FB9\u751F\u6210\u8FB9\u8FD4\u56DE\uFF0C\u4F53\u9A8C\u66F4\u987A\u6ED1" },
  { icon: "bulb", text: "\u7CFB\u7EDF\u63D0\u793A\u8BCD System Prompt\uFF1A\u8BBE\u5B9A\u89D2\u8272\u4E0E\u89C4\u5219\u7684\u9876\u5C42\u6307\u4EE4" },
  { icon: "bulb", text: "\u591A\u8F6E\u5BF9\u8BDD Multi-turn\uFF1A\u5E26\u5386\u53F2\u4E0A\u4E0B\u6587\u7684\u8FDE\u7EED\u95EE\u7B54" },
  { icon: "bulb", text: "\u7F13\u5B58 Cache\uFF1A\u7F13\u5B58\u91CD\u590D\u8BF7\u6C42\uFF0C\u7701\u94B1\u53C8\u63D0\u901F" }
];
var FUN_INTERVAL_MS = 3e4;
var APPEARANCE_KEY = "dsh.donePill.appearance";
var FONT_OPTIONS = [
  { id: "system", label: "\u8DDF\u968F\u7CFB\u7EDF", stack: "" },
  { id: "yahei", label: "\u96C5\u9ED1", stack: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
  { id: "songti", label: "\u5B8B\u4F53 \xB7 \u886C\u7EBF", stack: "SimSun, 'Songti SC', serif" },
  { id: "kaiti", label: "\u6977\u4F53 \xB7 \u624B\u5199\u611F", stack: "KaiTi, 'Kaiti SC', cursive" },
  { id: "simhei", label: "\u9ED1\u4F53 \xB7 \u539A\u91CD", stack: "SimHei, sans-serif" },
  { id: "mono", label: "\u7B49\u5BBD \xB7 \u4EE3\u7801", stack: "Consolas, 'Courier New', monospace" },
  { id: "cute", label: "\u53EF\u7231 \xB7 \u5706\u6DA6", stack: "'Yuanti SC', 'YouYuan', '\u5E7C\u5706', 'HYWenHei-85W', 'Microsoft YaHei', sans-serif" },
  { id: "comic", label: "\u53EF\u7231 \xB7 \u6F2B\u753B", stack: "'Comic Sans MS', 'Comic Neue', 'Segoe UI', cursive" }
];
function fontStackOf(id) {
  return FONT_OPTIONS.find((option) => option.id === id)?.stack ?? "";
}
function createAppearanceStore(key) {
  let value = { scale: 1, font: "system" };
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      value = {
        scale: typeof parsed?.scale === "number" && Number.isFinite(parsed.scale) ? Math.min(1.6, Math.max(0.8, parsed.scale)) : 1,
        font: typeof parsed?.font === "string" ? parsed.font : "system"
      };
    }
  } catch {
  }
  const listeners = /* @__PURE__ */ new Set();
  return {
    get: () => value,
    set(next) {
      value = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
      }
      for (const fn of [...listeners]) fn(next);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }
  };
}
var appearanceStore = createAppearanceStore(APPEARANCE_KEY);
function createEnabledStore() {
  let value = true;
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (raw === "0" || raw === "false") value = false;
  } catch {
  }
  const listeners = /* @__PURE__ */ new Set();
  return {
    get: () => value,
    set(next) {
      value = next;
      try {
        localStorage.setItem(ENABLED_KEY, next ? "1" : "0");
      } catch {
      }
      for (const fn of [...listeners]) fn(next);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    }
  };
}
var enabledStore = createEnabledStore();
function formatTime(ts) {
  if (ts <= 0) return "";
  const d = new Date(ts);
  const now = /* @__PURE__ */ new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (d.toDateString() === now.toDateString()) return `${hh}:${mm}`;
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${mo}-${day} ${hh}:${mm}`;
}
function truncate(text, max) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}\u2026`;
}
function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1e3));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor(total % 3600 / 60);
  const ss = total % 60;
  if (hh > 0) return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
function ensurePillKeyframes() {
  if (document.getElementById(PILL_STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = PILL_STYLE_ID;
  style.dataset.plugin = "dsh-done-pill";
  style.dataset.pluginCss = "webui/done-pill";
  style.textContent = PILL_CSS;
  document.head.appendChild(style);
}
var PILL_STYLE_ID = "dsh-done-pill-css";
var PILL_CSS = `
@keyframes dpLineIn{from{opacity:0}to{opacity:1}}
/* \u2500\u2500 \u7EBF\u6761\u79D1\u6280\u611F\uFF08tech-line\uFF09\uFF1A\u7EC6 1px \u63CF\u8FB9 + \u9752\u8272\u5F3A\u8C03 + \u5149\u6591\u52A8\u6548 \u2500\u2500
   \u6D45\u8272\u4E3B\u9898\uFF08\u9ED8\u8BA4\uFF09\uFF1A\u5168\u900F\u660E\u5E95\uFF0C\u53EA\u6709\u6587\u5B57\u4E0E\u72B6\u6001\u4EF6\uFF08\u65E0\u6846\u65E0\u7EBF\uFF0C\u6D6E\u5728\u9875\u9762\u4E0A\uFF09\u3002 */
.dsh-done-pill{
  --dpl-fg:#101a24;
  --dpl-fg-dim:#38485c;
  --dpl-fg-weak:#7286a0;
  --dpl-accent:#0e7490;
  --dpl-warn:#b45309;
  --dpl-ok:#15803d;
  --dpl-corner:color-mix(in srgb,var(--dpl-accent) 62%,#ffffff);
  --dpl-border:rgba(6,86,108,.34);
  --dpl-divider:rgba(6,86,108,.20);
  --dpl-hover:rgba(14,116,144,.08);
  --dpl-scan:color-mix(in srgb,var(--dpl-accent) 45%,#ffffff);
  --dpl-panel-bg:#ffffff;
  --dpl-panel-border:rgba(6,86,108,.24);
  --dpl-panel-shadow:0 12px 40px rgba(16,26,36,.16),0 2px 8px rgba(16,26,36,.06);
}
/* \u6DF1\u8272\u4E3B\u9898\uFF1A\u5168\u900F\u660E\u5E95 + \u9752\u8272\u5F3A\u8C03\uFF0C\u53EA\u7559\u6587\u5B57\u4E0E\u72B6\u6001\u4EF6\uFF08\u65E0\u6846\u65E0\u7EBF\uFF0C
   \u76F4\u63A5\u6D6E\u5728\u9875\u9762\u80CC\u666F\u4E0A\uFF09\u3002 */
body[data-ds-dark-theme] .dsh-done-pill{
  --dpl-fg:#dbe7ee;
  --dpl-fg-dim:#93a8b5;
  --dpl-fg-weak:#5d7382;
  --dpl-accent:#22d3ee;
  --dpl-warn:#f5b942;
  --dpl-ok:#31d07c;
  --dpl-border:rgba(103,232,249,.20);
  --dpl-divider:rgba(103,232,249,.16);
  --dpl-hover:rgba(34,211,238,.10);
  --dpl-scan:color-mix(in srgb,var(--dpl-accent) 32%,transparent);
  --dpl-panel-bg:rgba(10,14,19,.97);
  --dpl-panel-border:rgba(103,232,249,.16);
  --dpl-panel-shadow:0 16px 44px rgba(0,0,0,.6),0 0 24px color-mix(in srgb,var(--dpl-accent) 10%,transparent);
}
/* \u5916\u58F3\uFF1A\u56DB\u89D2\u865A\u7EBF\u89D2\u6807\uFF08\u7528\u6237\u6307\u5B9A\uFF1A\u865A\u7EBF + \u4E0D\u89C4\u5219\uFF09\u2014\u2014\u56DB\u89D2\u957F\u77ED\u5404\u4E0D\u540C\uFF0C\u6BCF\u6BB5
   \u7531\u300C3px \u5B9E + 3px \u7A7A\u300D\u7684\u865A\u7EBF cycle \u7EC4\u6210\uFF1B\u65E0\u586B\u5145\u9762\u3001\u65E0\u56DB\u8FB9\u63CF\u8FB9\u3002 */
.dsh-done-pill-shell{
  background:
    repeating-linear-gradient(90deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 0 0,
    repeating-linear-gradient(0deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 0 0,
    repeating-linear-gradient(90deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 100% 0,
    repeating-linear-gradient(0deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 100% 0,
    repeating-linear-gradient(90deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 0 100%,
    repeating-linear-gradient(0deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 0 100%,
    repeating-linear-gradient(90deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 100% 100%,
    repeating-linear-gradient(0deg,var(--dpl-corner) 0 calc(3px * var(--dps)),transparent calc(3px * var(--dps)) calc(6px * var(--dps))) 100% 100%;
  background-size:
    calc(14px * var(--dps)) calc(2px * var(--dps)),
    calc(2px * var(--dps)) calc(12px * var(--dps)),
    calc(10px * var(--dps)) calc(2px * var(--dps)),
    calc(2px * var(--dps)) calc(16px * var(--dps)),
    calc(12px * var(--dps)) calc(2px * var(--dps)),
    calc(2px * var(--dps)) calc(10px * var(--dps)),
    calc(16px * var(--dps)) calc(2px * var(--dps)),
    calc(2px * var(--dps)) calc(8px * var(--dps));
  background-repeat:no-repeat;
  color:var(--dpl-fg-dim);
}
.dsh-done-pill-shell:hover{
  color:var(--dpl-fg);
}
/* \u672A\u8BFB\u6001\uFF1A\u6587\u5B57\u8F6C\u4E3B\u8272\u53F7 + \u52A0\u91CD\u3002 */
.dsh-done-pill-shell[data-unread="1"]{
  color:var(--dpl-fg);
  font-weight:500;
}
/* \u62D6\u62FD\u4E2D\uFF1A\u626B\u63CF\u5E26\u5173\u95ED\u3002 */
.dsh-done-pill-shell[data-dragging="1"]::after{animation:none;opacity:0;transform:none}
/* \u626B\u63CF\u5149\u5E26\uFF1A\u672A\u8BFB\u65F6\u5E38\u9A7B\u5FAA\u73AF\u3001\u60AC\u505C\u65F6\u8865\u626B\u4E00\u904D\uFF1B\u62D6\u62FD\u65F6\u5173\u95ED\uFF08\u89C1\u4E0A\uFF09\u3002
   ::after \u4E0D\u53C2\u4E0E flex \u5E03\u5C40\u4E0E\u5BBD\u5EA6\u6D4B\u91CF\uFF08\u5EA6\u91CF\u8D70 el.children\uFF09\u3002 */
.dsh-done-pill-shell::after{
  content:'';position:absolute;top:0;bottom:0;left:0;width:38%;
  pointer-events:none;opacity:0;
  background:linear-gradient(90deg,transparent,var(--dpl-scan) 50%,transparent);
  transform:translateX(-140%);will-change:transform,opacity;
}
.dsh-done-pill-shell[data-unread="1"]::after{opacity:1;animation:dpScan 3.4s cubic-bezier(.4,0,.2,1) infinite}
.dsh-done-pill-shell:hover::after{opacity:1}
@keyframes dpScan{0%{transform:translateX(-140%)}62%{transform:translateX(140%)}100%{transform:translateX(140%)}}
/* \u8FD0\u884C\u70B9\u8109\u51B2\uFF1A\u7425\u73C0\u5149\u70B9\u5411\u5916\u6269\u6563\u4E00\u73AF\uFF08\u79D1\u6280\u4EEA\u8868\u5F0F\u7684\u6D3B\u8DC3\u6307\u793A\uFF09\u3002 */
.dp-run-dot{animation:dpPulse 1.5s cubic-bezier(.4,0,.6,1) infinite}
@keyframes dpPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--dpl-warn) 45%,transparent)}100%{box-shadow:0 0 0 6px transparent}}
/* \u9762\u677F\u6807\u9898\u4E0B\u6CBF\u523B\u5EA6\u8F68\uFF1A\u9752\u70B9\u865A\u7EBF\uFF08HUD \u5206\u6BB5\u7EBF\u8BED\u8A00\uFF09\u3002 */
.dsh-done-pill .dp-panel-head{position:relative}
.dsh-done-pill .dp-panel-head::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:1px;
  background:repeating-linear-gradient(90deg,var(--dpl-accent) 0 6px,transparent 6px 12px);
  opacity:.45;pointer-events:none;
}
/* \u9762\u677F\u5185\u53EF\u70B9\u884C\uFF08\u4EFB\u52A1\u884C / \u5B8C\u6210\u8BB0\u5F55\u5361\uFF09\uFF1Ahover \u5DE6\u4FA7\u63CF\u51FA\u9752\u8272\u523B\u5EA6\u7EBF\u3002 */
.dsh-done-pill-row{transition:background .12s ease,box-shadow .12s ease}
.dsh-done-pill-row:hover{background:var(--dpl-hover);box-shadow:inset 2px 0 0 var(--dpl-accent)}
.dsh-done-pill-row:focus-visible{outline:2px solid var(--dpl-accent);outline-offset:-2px}
.dsh-done-pill-close{transition:background .12s ease,color .12s ease}
.dsh-done-pill-close:hover{background:var(--dpl-hover);color:var(--dpl-fg)}
/* \u9762\u677F\u6EDA\u52A8\u6761\uFF1A\u7EC6\u7EBF + \u9752\u67D3\u6ED1\u5757\u3002 */
.dsh-done-pill [role="dialog"]{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--dpl-accent) 55%,var(--dpl-border)) transparent}
.dsh-done-pill [role="dialog"]::-webkit-scrollbar{width:8px}
.dsh-done-pill [role="dialog"]::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--dpl-accent) 55%,var(--dpl-border));border-radius:4px}
.dsh-done-pill [role="dialog"]::-webkit-scrollbar-track{background:transparent}
`;
var wrapStyle = (dragging, pos, scale, fontStack) => ({
  position: "fixed",
  // pos 恒为整数像素（挂载后由 useLayoutEffect 把居中模式换算成整数坐标）：
  // translateX(-50%) 居中会落在半像素上，文字亚像素渲染发糊。
  // null 仅存在于首帧（绘制前即被 useLayoutEffect 修正）。
  ...pos === null ? { top: defaultShellTop(), left: "50%", transform: "translateX(-50%)" } : { top: pos.y, left: pos.x },
  zIndex: 9400,
  cursor: dragging ? "grabbing" : "grab",
  userSelect: "none",
  touchAction: "none",
  ...fontStack !== "" ? { fontFamily: fontStack } : {},
  "--dps": String(scale),
  // 上下内衬各 8px：面板贴着 padding box 定位（下方 top:100% / 上方
  // bottom:100%），胶囊与面板之间的视觉缝隙落在容器内，鼠标滑过去不会触发
  // mouseleave。marginTop 抵消上内衬——外壳本体仍精确落在 pos.y，拖拽与
  // 锚点换算都以**外壳**矩形为基准（见 onPointerDown 用 shellRef 取 rect）。
  paddingTop: "calc(8px * var(--dps))",
  paddingBottom: "calc(8px * var(--dps))",
  marginTop: "calc(-8px * var(--dps))",
  // 核心动画：left 与外壳 width 同节奏（MORPH_DUR）过渡。位置按目标宽
  // 一步算准（见 syncPosition），Δw 的过渡期里左缘滑动的量恒为
  // ∓Δw/2，与右缘对称——胶囊呈「两侧拉伸 / 两侧收窄」，而不是先单边
  // 伸缩、再瞬移回中。拖拽中必须关闭，否则位置被过渡拖着走、毫无跟手性。
  ...dragging ? {} : { transition: `left ${MORPH_DUR} ease` }
});
var SHELL_MAX_W = 720;
function effectiveShellWidth(target, el) {
  const maxW = Math.min(SHELL_MAX_W, window.innerWidth - 48);
  if (target !== null && target > 0) return Math.min(target, maxW);
  return el !== null ? el.getBoundingClientRect().width : 160;
}
var pillShellStyle = (width) => ({
  boxSizing: "border-box",
  position: "relative",
  // 扫描光带（::after）的定位上下文
  display: "flex",
  alignItems: "stretch",
  height: "calc(30px * var(--dps))",
  maxWidth: `min(${SHELL_MAX_W}px, calc(100vw - 48px))`,
  ...width !== null ? { width } : {},
  borderRadius: "calc(4px * var(--dps))",
  fontSize: "calc(12px * var(--dps))",
  lineHeight: "calc(18px * var(--dps))",
  whiteSpace: "nowrap",
  overflow: "hidden",
  // 宽度伸缩与位置滑动/文字淡入同节奏（MORPH_DUR）；颜色类过渡也写在内联，
  // 否则内联 transition 会整条覆盖样式表里的 transition。
  transition: `width ${MORPH_DUR} ease, background-color .14s ease, box-shadow .14s ease, border-color .14s ease, color .14s ease`
});
var pillMainStyle = {
  display: "flex",
  alignItems: "center",
  gap: "calc(7px * var(--dps))",
  minWidth: 0,
  padding: "0 calc(10px * var(--dps)) 0 calc(14px * var(--dps))",
  border: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  fontWeight: "inherit",
  cursor: "inherit",
  overflow: "hidden"
};
var checkIconStyle = (unread) => ({
  flex: "none",
  width: "calc(15px * var(--dps))",
  height: "calc(15px * var(--dps))",
  borderRadius: "calc(4px * var(--dps))",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "calc(10px * var(--dps))",
  lineHeight: 1,
  border: `calc(1.5px * var(--dps)) solid ${unread > 0 ? "var(--dpl-accent)" : "var(--dpl-border)"}`,
  background: unread > 0 ? "color-mix(in srgb, var(--dpl-accent) 14%, transparent)" : "transparent",
  color: unread > 0 ? "var(--dpl-accent)" : "var(--dpl-ok)",
  transition: "border-color .15s ease, background-color .15s ease, color .15s ease"
});
var reminderIconStyle = {
  flex: "none",
  width: "calc(15px * var(--dps))",
  height: "calc(15px * var(--dps))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
};
var reminderBadgeStyle = {
  flex: "none",
  display: "flex",
  alignItems: "center",
  gap: "calc(5px * var(--dps))",
  padding: "0 calc(10px * var(--dps)) 0 calc(14px * var(--dps))",
  // 琥珀色走官方 warn-label 令牌：浅色主题下 #f5c542 对白底几乎不可读。
  color: "var(--dpl-warn)",
  fontSize: "calc(12px * var(--dps))",
  lineHeight: "calc(18px * var(--dps))",
  fontWeight: 500
};
function LineIcon(props) {
  const size = props.size ?? 13;
  if (props.kind === "sparkle") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, style: { flex: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" }) });
  }
  if (props.kind === "bulb") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
        style: { flex: "none" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "9", y1: "18", x2: "15", y2: "18" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "10", y1: "21", x2: "14", y2: "21" })
        ]
      }
    );
  }
  if (props.kind === "moon") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
        style: { flex: "none" },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      style: { flex: "none" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17 8h1a4 4 0 1 1 0 8h-1" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "7", y1: "2", x2: "7", y2: "5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "12", y1: "2", x2: "12", y2: "5" })
      ]
    }
  );
}
var pillDividerStyle = {
  flex: "none",
  width: 1,
  margin: "calc(7px * var(--dps)) 0",
  background: "var(--dpl-divider)"
};
var shellChildStyle = { flex: "none" };
var DONE_PANEL_W = 600;
var RUN_PANEL_W = 320;
var floatPanelStyle = (open, shiftX, up, width, maxHeight, gap, padding) => ({
  position: "absolute",
  ...up ? { bottom: "100%" } : { top: "100%" },
  left: shiftX,
  width: `min(${width}px, calc(100vw - 24px))`,
  maxHeight,
  overflowY: "auto",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap,
  padding,
  borderRadius: 8,
  border: "1px solid var(--dpl-panel-border)",
  background: "var(--dpl-panel-bg)",
  color: "var(--dpl-fg)",
  boxShadow: "var(--dpl-panel-shadow)",
  opacity: open ? 1 : 0,
  transform: `translateY(${open ? 0 : up ? 8 : -8}px)`,
  visibility: open ? "visible" : "hidden",
  pointerEvents: open ? "auto" : "none",
  // 收起时 visibility 延迟到过渡结束再隐藏，滑出动画才完整可见。
  transition: open ? "opacity .18s ease, transform .18s ease, visibility 0s" : "opacity .18s ease, transform .18s ease, visibility 0s linear .18s"
});
var panelStyle = (open, shiftX, up) => floatPanelStyle(open, shiftX, up, DONE_PANEL_W, "min(66vh, 600px)", 8, 12);
var runPanelStyle = (open, shiftX, up) => floatPanelStyle(open, shiftX, up, RUN_PANEL_W, "min(60vh, 480px)", 4, 10);
var runningBlockStyle = (hasRunning) => ({
  flex: "none",
  display: "flex",
  alignItems: "center",
  gap: "calc(6px * var(--dps))",
  padding: "0 calc(10px * var(--dps)) 0 calc(14px * var(--dps))",
  border: "none",
  background: "transparent",
  color: hasRunning ? "var(--dpl-fg)" : "var(--dpl-fg-weak)",
  font: "inherit",
  fontWeight: hasRunning ? 500 : 400,
  cursor: "pointer"
});
var runDotStyle = {
  flex: "none",
  width: "calc(7px * var(--dps))",
  height: "calc(7px * var(--dps))",
  borderRadius: "calc(1.5px * var(--dps))",
  background: "var(--dpl-warn)"
};
var panelDotStyle = {
  flex: "none",
  width: 7,
  height: 7,
  borderRadius: 1.5,
  background: "var(--dpl-warn)"
};
var runRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "7px 8px",
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "var(--dpl-fg)",
  fontSize: 12,
  lineHeight: "18px",
  textAlign: "left",
  cursor: "pointer"
};
var runRowTitleStyle = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
var runRowTimeStyle = {
  flex: "none",
  fontSize: 11,
  color: "var(--dpl-fg-weak)",
  fontVariantNumeric: "tabular-nums"
};
var headStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "2px 2px 6px"
  // 下沿刻度轨改由 .dp-panel-head::after（青色点虚线）提供，不再画实线。
};
var headTitleStyle = {
  flex: "none",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: ".06em",
  color: "var(--dpl-fg)"
};
var headMetaStyle = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "right",
  fontSize: 11,
  color: "var(--dpl-fg-weak)"
};
var cardStyle = {
  border: "none",
  borderRadius: 8,
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  cursor: "pointer",
  background: "transparent"
};
var cardHeadStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0
};
var unreadDotStyle = {
  flex: "none",
  width: 7,
  height: 7,
  boxSizing: "border-box",
  borderRadius: 2,
  border: "1.5px solid var(--dpl-accent)",
  background: "transparent"
};
var sessionTitleStyle = {
  flex: "none",
  maxWidth: 200,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--dpl-fg)"
};
var metaStyle = {
  flex: 1,
  minWidth: 0,
  textAlign: "right",
  fontSize: 11,
  color: "var(--dpl-fg-weak)",
  whiteSpace: "nowrap"
};
var closeStyle = {
  flex: "none",
  width: 20,
  height: 20,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "var(--dpl-fg-weak)",
  fontSize: 13,
  lineHeight: "20px",
  cursor: "pointer"
};
var answerStyle = {
  margin: 0,
  maxHeight: 240,
  overflowY: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 12,
  lineHeight: "19px",
  color: "var(--dpl-fg-dim)",
  borderTop: "1px dashed var(--dpl-panel-border)",
  paddingTop: 6,
  // 字体族显式跟随容器：<pre> 默认 monospace，会无视胶囊字体设置。
  fontFamily: "inherit"
};
var errorTagStyle = {
  flex: "none",
  fontSize: 11,
  color: "var(--dpl-warn)"
};
var emptyStyle = {
  padding: "18px 8px",
  textAlign: "center",
  fontSize: 12,
  color: "var(--dpl-fg-weak)"
};
var rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "16px 0",
  borderBottom: "1px solid var(--dsw-alias-border-l2)"
};
var rowTextStyle = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  paddingRight: 48
};
var rowTitleStyle = { fontSize: 14, fontWeight: 400, lineHeight: "22px", color: "var(--dsw-alias-label-primary)" };
var rowDescStyle = { fontSize: 12, fontWeight: 400, lineHeight: "18px", color: "var(--dsw-alias-label-tertiary)" };
function switchStyle(on) {
  return {
    position: "relative",
    flex: "none",
    width: 40,
    height: 22,
    padding: 0,
    border: "none",
    borderRadius: 11,
    cursor: "pointer",
    // 开启态用品牌蓝（不能用反色的 brand-primary）；关闭态描边底 + 灰钮。
    background: on ? "var(--dsw-alias-state-business-primary)" : "var(--dsw-alias-bg-module-platform)",
    transition: "background .15s"
  };
}
function knobStyle(on) {
  return {
    position: "absolute",
    top: 2,
    left: on ? 20 : 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: on ? "#ffffff" : "var(--dsw-alias-label-tertiary)",
    transition: "left .15s, background .15s"
  };
}
function DonePillRow() {
  const [on, setOn] = (0, import_react.useState)(enabledStore.get());
  (0, import_react.useEffect)(() => enabledStore.subscribe(setOn), []);
  function toggle() {
    enabledStore.set(!enabledStore.get());
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowTextStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowTitleStyle, children: "\u5BF9\u8BDD\u5B8C\u6210\u80F6\u56CA" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowDescStyle, children: "\u9876\u90E8\u60AC\u6D6E\u80F6\u56CA\uFF1A\u5BF9\u8BDD\u5B8C\u6210\u63D0\u9192\u3001\u5FEB\u901F\u8DF3\u8F6C\u4E0E\u6587\u4EF6\u5165\u53E3\uFF1B\u5173\u95ED\u540E\u5B8C\u5168\u9690\u85CF" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": on,
        "aria-label": "\u5BF9\u8BDD\u5B8C\u6210\u80F6\u56CA",
        onClick: toggle,
        style: switchStyle(on),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: knobStyle(on) })
      }
    )
  ] });
}
var timeInputStyle = {
  flex: "none",
  width: 96,
  height: 32,
  padding: "0 8px",
  fontSize: 13,
  lineHeight: "22px",
  borderRadius: 8,
  border: "1px solid var(--dsw-alias-border-l2)",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)"
};
var timeDashStyle = {
  flex: "none",
  color: "var(--dsw-alias-label-tertiary)",
  fontSize: 13
};
function ReminderRow(props) {
  const { titleText, descText, store } = props;
  const [config, setConfig] = (0, import_react.useState)(() => store.get());
  (0, import_react.useEffect)(() => store.subscribe(setConfig), []);
  function update(patch) {
    store.set({ ...store.get(), ...patch });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowTextStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowTitleStyle, children: titleText }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowDescStyle, children: descText })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "time",
        value: config.start,
        disabled: !config.enabled,
        "aria-label": `${titleText}\u5F00\u59CB\u65F6\u95F4`,
        onChange: (event) => {
          if (event.target.value !== "") update({ start: event.target.value });
        },
        style: { ...timeInputStyle, opacity: config.enabled ? 1 : 0.45 }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: timeDashStyle, children: "\u2014" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "time",
        value: config.end,
        disabled: !config.enabled,
        "aria-label": `${titleText}\u7ED3\u675F\u65F6\u95F4`,
        onChange: (event) => {
          if (event.target.value !== "") update({ end: event.target.value });
        },
        style: { ...timeInputStyle, opacity: config.enabled ? 1 : 0.45 }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": config.enabled,
        "aria-label": titleText,
        onClick: () => {
          update({ enabled: !config.enabled });
        },
        style: { ...switchStyle(config.enabled), marginLeft: 8 },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: knobStyle(config.enabled) })
      }
    )
  ] });
}
var selectInputStyle = {
  flex: "none",
  width: 132,
  height: 32,
  padding: "0 8px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid var(--dsw-alias-border-l2)",
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  appearance: "none",
  cursor: "pointer"
};
var sizeSliderStyle = {
  flex: "none",
  width: 160,
  accentColor: "var(--dsw-alias-state-business-primary)",
  cursor: "pointer"
};
var sliderValueStyle = {
  flex: "none",
  width: 44,
  textAlign: "right",
  fontSize: 13,
  color: "var(--dsw-alias-label-secondary)",
  fontVariantNumeric: "tabular-nums"
};
function PillScaleRow() {
  const [config, setConfig] = (0, import_react.useState)(() => appearanceStore.get());
  (0, import_react.useEffect)(() => appearanceStore.subscribe(setConfig), []);
  const percent = Math.round(config.scale * 100);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowTextStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowTitleStyle, children: "\u80F6\u56CA\u5927\u5C0F" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowDescStyle, children: "\u6574\u4F53\u7F29\u653E\u80F6\u56CA\uFF0C\u5B57\u4F53\u4E0E\u56FE\u6807\u7B49\u6BD4\u8DDF\u968F\uFF0880% \u2013 160%\uFF09" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "range",
        min: 80,
        max: 160,
        step: 5,
        value: percent,
        "aria-label": "\u80F6\u56CA\u5927\u5C0F",
        onChange: (event) => {
          appearanceStore.set({ ...appearanceStore.get(), scale: Number(event.target.value) / 100 });
        },
        style: sizeSliderStyle
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: sliderValueStyle, children: `${percent}%` })
  ] });
}
function PillFontRow() {
  const [config, setConfig] = (0, import_react.useState)(() => appearanceStore.get());
  (0, import_react.useEffect)(() => appearanceStore.subscribe(setConfig), []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowTextStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowTitleStyle, children: "\u80F6\u56CA\u5B57\u4F53" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: rowDescStyle, children: "\u80F6\u56CA\u4E0E\u9762\u677F\u6587\u5B57\u7684\u5B57\u4F53\u98CE\u683C" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "select",
      {
        value: config.font,
        "aria-label": "\u80F6\u56CA\u5B57\u4F53",
        onChange: (event) => {
          appearanceStore.set({ ...appearanceStore.get(), font: event.target.value });
        },
        style: selectInputStyle,
        children: FONT_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.id, children: option.label }, option.id))
      }
    )
  ] });
}
function DonePill(props) {
  const [entries, setEntries] = (0, import_react.useState)([]);
  const [readIds, setReadIds] = (0, import_react.useState)(() => loadReadIds());
  const [hovered, setHovered] = (0, import_react.useState)(false);
  const [hoveredRunning, setHoveredRunning] = (0, import_react.useState)(false);
  const [enabled, setEnabled] = (0, import_react.useState)(enabledStore.get());
  const [pos, setPos] = (0, import_react.useState)(() => {
    const anchor = loadAnchor();
    return anchor === null ? null : anchorToPos(anchor, 160, pillHeight(appearanceStore.get().scale));
  });
  const [dragging, setDragging] = (0, import_react.useState)(false);
  const [runInfo, setRunInfo] = (0, import_react.useState)({});
  const [nowTick, setNowTick] = (0, import_react.useState)(() => Date.now());
  const [reminderTick, setReminderTick] = (0, import_react.useState)(0);
  const [restConfig, setRestConfig] = (0, import_react.useState)(() => restStore.get());
  const [lateConfig, setLateConfig] = (0, import_react.useState)(() => lateStore.get());
  const [appearance, setAppearance] = (0, import_react.useState)(() => appearanceStore.get());
  const scale = appearance.scale;
  const scaleRef = (0, import_react.useRef)(scale);
  scaleRef.current = scale;
  const [funIdx, setFunIdx] = (0, import_react.useState)(() => Math.floor(Math.random() * FUN_LINES.length));
  const [shellWidth, setShellWidth] = (0, import_react.useState)(null);
  const shellRef = (0, import_react.useRef)(null);
  const shellWidthRef = (0, import_react.useRef)(null);
  const [decoWidth, setDecoWidth] = (0, import_react.useState)(80);
  const labelRef = (0, import_react.useRef)(null);
  const sinceRef = (0, import_react.useRef)(0);
  const wrapRef = (0, import_react.useRef)(null);
  const dragRef = (0, import_react.useRef)(null);
  const [runBlockLeft, setRunBlockLeft] = (0, import_react.useState)(0);
  const runBlockRef = (0, import_react.useRef)(null);
  const [viewportH, setViewportH] = (0, import_react.useState)(() => window.innerHeight || 900);
  (0, import_react.useEffect)(() => enabledStore.subscribe(setEnabled), []);
  (0, import_react.useEffect)(() => restStore.subscribe(setRestConfig), []);
  (0, import_react.useEffect)(() => lateStore.subscribe(setLateConfig), []);
  (0, import_react.useEffect)(() => appearanceStore.subscribe(setAppearance), []);
  (0, import_react.useLayoutEffect)(() => {
    ensurePillKeyframes();
  }, []);
  (0, import_react.useEffect)(() => {
    setReminderTick((t) => t + 1);
    const timer = window.setInterval(() => {
      setReminderTick((t) => t + 1);
    }, 3e4);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
  const nowMinutes = (() => {
    const d = /* @__PURE__ */ new Date();
    void reminderTick;
    return d.getHours() * 60 + d.getMinutes();
  })();
  const lateActive = lateConfig.enabled && inTimeRange(nowMinutes, lateConfig);
  const restActive = !lateActive && restConfig.enabled && inTimeRange(nowMinutes, restConfig);
  const anchorRef = (0, import_react.useRef)(loadAnchor());
  const autoCenterRef = (0, import_react.useRef)(anchorRef.current === null);
  const syncPosition = (0, import_react.useCallback)(() => {
    const w = effectiveShellWidth(shellWidthRef.current, shellRef.current);
    if (w <= 0) return;
    const h = pillHeight(scaleRef.current);
    if (autoCenterRef.current) {
      const x = Math.max(8, Math.round((window.innerWidth - w) / 2));
      setPos((prev) => {
        const next2 = { x, y: prev?.y ?? defaultShellTop() };
        return prev !== null && prev.x === next2.x && prev.y === next2.y ? prev : next2;
      });
      return;
    }
    const anchor = anchorRef.current;
    if (anchor === null) return;
    const next = anchorToPos(anchor, w, h);
    setPos((prev) => prev !== null && prev.x === next.x && prev.y === next.y ? prev : next);
  }, []);
  (0, import_react.useEffect)(() => {
    const onResize = () => {
      if (window.innerHeight > 0) setViewportH(window.innerHeight);
      syncPosition();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [syncPosition]);
  const mergeEntries = (0, import_react.useCallback)((incoming) => {
    if (incoming.length === 0) return;
    setEntries((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const merged = [...prev];
      for (const item of incoming) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
      merged.sort((a, b) => b.seq - a.seq);
      return merged.length > MAX_ENTRIES ? merged.slice(0, MAX_ENTRIES) : merged;
    });
  }, []);
  (0, import_react.useEffect)(() => {
    let stopped = false;
    const tick = () => {
      if (document.hidden) return;
      fetch(`/api/dsh-done-pill?since=${sinceRef.current}`, { cache: "no-store" }).then(async (res) => {
        if (!res.ok) throw new Error(`http ${res.status}`);
        return res.json();
      }).then((data) => {
        if (stopped || data?.ok !== true || !Array.isArray(data.items)) return;
        sinceRef.current = Math.max(sinceRef.current, typeof data.version === "number" ? data.version : 0);
        mergeEntries(data.items.filter((item) => item !== null && typeof item === "object" && typeof item.id === "string"));
        if (Array.isArray(data.running)) {
          const next = {};
          for (const entry of data.running) {
            if (entry !== null && typeof entry === "object" && typeof entry.sessionId === "string" && typeof entry.since === "number") {
              next[entry.sessionId] = {
                since: entry.since,
                question: typeof entry.question === "string" ? entry.question : "",
                title: typeof entry.title === "string" ? entry.title : ""
              };
            }
          }
          setRunInfo(next);
        }
      }).catch(() => {
      });
    };
    tick();
    const timer = window.setInterval(tick, POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mergeEntries]);
  const unreadCount = (0, import_react.useMemo)(() => entries.filter((item) => !readIds.has(item.id)).length, [entries, readIds]);
  const latest = entries[0];
  const funIdle = unreadCount === 0;
  (0, import_react.useEffect)(() => {
    if (!funIdle) return;
    const timer = window.setInterval(() => {
      setFunIdx((prev) => {
        let next = Math.floor(Math.random() * FUN_LINES.length);
        if (next === prev) next = (next + 1) % FUN_LINES.length;
        return next;
      });
    }, FUN_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [funIdle]);
  const runningSessions = (0, import_react.useMemo)(() => Object.entries(runInfo).map(([sessionId, info]) => ({ id: sessionId, displayTitle: info.title, since: info.since })).sort((a, b) => b.since - a.since), [runInfo]);
  const runningSessionsRef = (0, import_react.useRef)(runningSessions);
  runningSessionsRef.current = runningSessions;
  const markAllRead = (0, import_react.useCallback)(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const item of entries) next.add(item.id);
      saveReadIds(next);
      return next.size === prev.size ? prev : next;
    });
  }, [entries]);
  const wasHoveredRef = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (hovered) {
      wasHoveredRef.current = true;
      return;
    }
    if (wasHoveredRef.current) {
      wasHoveredRef.current = false;
      markAllRead();
    }
  }, [hovered, markAllRead]);
  (0, import_react.useEffect)(() => {
    if (!hoveredRunning || runningSessions.length === 0) return;
    setNowTick(Date.now());
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1e3);
    return () => {
      window.clearInterval(timer);
    };
  }, [hoveredRunning, runningSessions.length]);
  const dismiss = (0, import_react.useCallback)((id) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);
  const openSession = (0, import_react.useCallback)((sessionId, markReadId) => {
    try {
      sessionsRuntime?.open(sessionId);
    } catch {
    }
    if (markReadId !== void 0) {
      setReadIds((prev) => {
        if (prev.has(markReadId)) return prev;
        const next = new Set(prev);
        next.add(markReadId);
        saveReadIds(next);
        return next;
      });
    }
    setHovered(false);
  }, []);
  const onPointerDown = (0, import_react.useCallback)((event) => {
    if (event.button !== 0) return;
    const el = wrapRef.current;
    if (el === null) return;
    const rect = (shellRef.current ?? el).getBoundingClientRect();
    const zone = event.target instanceof Element ? event.target.closest("[data-dp-zone]")?.getAttribute("data-dp-zone") ?? "" : "";
    dragRef.current = { px: event.clientX, py: event.clientY, ox: rect.left, oy: rect.top, moved: false, zone };
    try {
      el.setPointerCapture(event.pointerId);
    } catch {
    }
  }, []);
  const onPointerMove = (0, import_react.useCallback)((event) => {
    const drag = dragRef.current;
    if (drag === null) return;
    const dx = event.clientX - drag.px;
    const dy = event.clientY - drag.py;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      setDragging(true);
      setHovered(false);
      setHoveredRunning(false);
    }
    const w = effectiveShellWidth(shellWidthRef.current, shellRef.current);
    setPos(clampPos(drag.ox + dx, drag.oy + dy, w, pillHeight(scaleRef.current)));
  }, []);
  const onPointerCancel = (0, import_react.useCallback)(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);
  const onPointerUp = (0, import_react.useCallback)(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag === null) return;
    if (drag.moved) {
      autoCenterRef.current = false;
      setDragging(false);
      setPos((current) => {
        if (current !== null) {
          const el = shellRef.current;
          const w = el !== null ? el.getBoundingClientRect().width : 160;
          const h = pillHeight(scaleRef.current);
          const anchor = {
            xc: clamp01((current.x + w / 2) / Math.max(1, window.innerWidth)),
            yc: clamp01((current.y + h / 2) / Math.max(1, window.innerHeight))
          };
          anchorRef.current = anchor;
          saveAnchor(anchor);
        }
        return current;
      });
      return;
    }
    if (drag.zone === "run") {
      const first = runningSessionsRef.current[0];
      if (first !== void 0) openSession(first.id);
      return;
    }
    if (latest !== void 0) openSession(latest.sessionId, unreadCount > 0 ? latest.id : void 0);
  }, [latest, openSession, unreadCount]);
  const latestTitle = latest !== void 0 ? latest.title : "";
  const latestLabel = latest !== void 0 ? latest.question !== "" ? latest.question : latestTitle : "";
  const nowDate = /* @__PURE__ */ new Date();
  let reminderLabel = null;
  let reminderIcon = "moon";
  if (lateActive) {
    reminderIcon = "moon";
    const hour = nowDate.getHours();
    reminderLabel = hour <= 4 ? `\u51CC\u6668 ${hour} \u70B9\u4E86 \xB7 \u6CE8\u610F\u4F11\u606F` : `${hour >= 22 ? "\u591C\u6DF1\u4E86" : `\u5DF2 ${hour} \u70B9`} \xB7 \u6CE8\u610F\u4F11\u606F`;
  } else if (restActive) {
    reminderIcon = "coffee";
    reminderLabel = `\u4F11\u606F\u65F6\u95F4\uFF08${restConfig.start}-${restConfig.end}\uFF09\xB7 \u8BE5\u4F11\u606F\u4E00\u4E0B\u4E86`;
  }
  const funLine = FUN_LINES[funIdx % FUN_LINES.length] ?? FUN_LINES[0];
  const pillLabel = unreadCount > 0 && latest !== void 0 ? `${unreadCount} \u4E2A\u5BF9\u8BDD\u5B8C\u6210 \xB7 ${truncate(latestLabel, 56)}` : funLine.text;
  const clampPanelLeft = (panelW, left) => {
    if (pos === null) return left;
    const minLeft = Math.round(8 - pos.x);
    const maxLeft = Math.max(minLeft, Math.round(window.innerWidth - 12 - pos.x - panelW));
    return Math.min(Math.max(left, minLeft), maxLeft);
  };
  const doneShift = clampPanelLeft(DONE_PANEL_W, Math.round(((shellWidth ?? 0) - DONE_PANEL_W) / 2));
  const runShift = clampPanelLeft(RUN_PANEL_W, runBlockLeft);
  const panelUp = pos !== null && pos.y + pillHeight(scale) > viewportH * 0.55;
  const displayText = pillLabel;
  (0, import_react.useLayoutEffect)(() => {
    const el = shellRef.current;
    if (el === null) return;
    let total = 0;
    for (const child of el.children) total += child.getBoundingClientRect().width;
    if (total > 0 && Math.round(total) !== shellWidthRef.current) {
      shellWidthRef.current = Math.round(total);
      setShellWidth(Math.round(total));
    }
    const labelEl = labelRef.current;
    if (labelEl !== null) {
      const deco = Math.round(total - labelEl.getBoundingClientRect().width);
      if (deco > 0 && Math.abs(deco - decoWidth) >= 1) setDecoWidth(deco);
    }
    const runEl = runBlockRef.current;
    if (runEl !== null) {
      const runLeft = runEl.offsetLeft;
      setRunBlockLeft((prev) => Math.abs(runLeft - prev) >= 1 ? runLeft : prev);
    }
    if (dragRef.current !== null) return;
    syncPosition();
  });
  if (!enabled) return null;
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: wrapRef,
        className: "dsh-done-pill",
        style: wrapStyle(dragging, pos, appearance.scale, fontStackOf(appearance.font)),
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onLostPointerCapture: onPointerCancel,
        onMouseEnter: () => {
          if (dragRef.current === null) setHovered(true);
        },
        onMouseLeave: () => {
          setHovered(false);
          setHoveredRunning(false);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              ref: shellRef,
              className: "dsh-done-pill-shell",
              "data-unread": unreadCount > 0 ? "1" : "0",
              "data-dragging": dragging ? "1" : "0",
              style: pillShellStyle(shellWidth),
              children: [
                reminderLabel !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: reminderBadgeStyle, title: reminderLabel, "data-dp-zone": "badge", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineIcon, { kind: reminderIcon, size: Math.max(10, Math.round(13 * appearance.scale)) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: reminderLabel })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: pillDividerStyle, "aria-hidden": true })
                ] }),
                runningSessions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      ref: runBlockRef,
                      type: "button",
                      "data-dp-zone": "run",
                      style: { ...runningBlockStyle(true), ...shellChildStyle, cursor: "inherit" },
                      "aria-label": `\u6B63\u5728\u6267\u884C\u4E2D\u7684\u4EFB\u52A1 ${runningSessions.length} \u4E2A\uFF1B\u60AC\u505C\u6216\u805A\u7126\u67E5\u770B\u5217\u8868`,
                      title: "\u6B63\u5728\u6267\u884C\u4E2D\u7684\u4EFB\u52A1",
                      onMouseEnter: () => {
                        setHoveredRunning(true);
                        setHovered(false);
                      },
                      onFocus: () => {
                        setHoveredRunning(true);
                        setHovered(false);
                      },
                      onBlur: () => {
                        setHoveredRunning(false);
                      },
                      onKeyDown: (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        const first = runningSessions[0];
                        if (first !== void 0) openSession(first.id);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dp-run-dot", style: runDotStyle, "aria-hidden": true }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: runningSessions.length })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: pillDividerStyle, "aria-hidden": true })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    "data-dp-zone": "main",
                    onKeyDown: (event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      if (latest !== void 0) openSession(latest.sessionId, unreadCount > 0 ? latest.id : void 0);
                    },
                    onFocus: () => {
                      setHovered(true);
                      setHoveredRunning(false);
                    },
                    onBlur: () => {
                      setHovered(false);
                    },
                    style: { ...pillMainStyle, ...shellChildStyle, cursor: "inherit" },
                    "aria-label": latest !== void 0 ? `\u6253\u5F00\u4F1A\u8BDD\u300C${latestTitle}\u300D\uFF08${unreadCount} \u6761\u5BF9\u8BDD\u5B8C\u6210\u672A\u8BFB\uFF09\uFF1B\u62D6\u52A8\u53EF\u79FB\u52A8\u4F4D\u7F6E` : reminderLabel !== null ? `${reminderLabel}\uFF1B\u62D6\u52A8\u53EF\u79FB\u52A8\u4F4D\u7F6E` : "\u5BF9\u8BDD\u5B8C\u6210\u80F6\u56CA\uFF08\u6682\u65E0\u8BB0\u5F55\uFF09\uFF1B\u62D6\u52A8\u53EF\u79FB\u52A8\u4F4D\u7F6E",
                    onMouseEnter: () => {
                      setHovered(true);
                      setHoveredRunning(false);
                    },
                    children: [
                      unreadCount > 0 && latest !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: checkIconStyle(unreadCount), "aria-hidden": true, children: "\u2713" }) : (
                        // 图标跟随**当前主文案**：提醒态的月亮/咖啡图标已在左侧徽章上展示，
                        // 主文案此时是知识轮播，再放一个月亮会出现「月亮 + Encoder 名词解释」
                        // 这种图文不符的组合（旧实现的判断依据是提醒是否激活）。
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: reminderIconStyle, "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineIcon, { kind: funLine.icon, size: Math.max(10, Math.round(13 * appearance.scale)) }) })
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          ref: labelRef,
                          style: {
                            // maxWidth 让超长文案以省略号收尾：外壳只有 overflow:hidden 时
                            // 文字是被**硬切**的（末字截一半，没有「…」）。装饰宽实测得来，
                            // 带提醒徽章/运行中计数时也算得准。
                            maxWidth: `calc(min(${SHELL_MAX_W}px, 100vw - 48px) - ${decoWidth}px)`,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            opacity: 0,
                            animation: `dpLineIn ${MORPH_DUR} ease forwards`
                          },
                          children: displayText
                        },
                        displayText
                      )
                    ]
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: runPanelStyle(hoveredRunning, runShift, panelUp),
              role: "dialog",
              "aria-label": "\u6B63\u5728\u6267\u884C\u4E2D\u7684\u4EFB\u52A1",
              "aria-hidden": !hoveredRunning,
              onPointerDown: (event) => {
                event.stopPropagation();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dp-panel-head", style: headStyle, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: headTitleStyle, children: "\u6B63\u5728\u6267\u884C\u4E2D" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: headMetaStyle, children: `${runningSessions.length} \u4E2A\u4EFB\u52A1 \xB7 \u70B9\u51FB\u8FDB\u5165\u4F1A\u8BDD` })
                ] }),
                runningSessions.map((session) => {
                  const info = runInfo[session.id];
                  const label = info !== void 0 && info.question !== "" ? info.question : session.displayTitle;
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: "dsh-done-pill-row",
                      style: runRowStyle,
                      title: info !== void 0 && info.question !== "" ? `\u300C${session.displayTitle}\u300D\u6B63\u5728\u6267\u884C\uFF1A${info.question}` : `\u70B9\u51FB\u6253\u5F00\u4F1A\u8BDD\uFF1A${session.displayTitle}`,
                      onPointerDown: (event) => {
                        event.stopPropagation();
                      },
                      onClick: () => {
                        openSession(session.id);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: panelDotStyle, "aria-hidden": true }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: runRowTitleStyle, children: label }),
                        info !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: runRowTimeStyle, children: formatElapsed(nowTick - info.since) })
                      ]
                    },
                    session.id
                  );
                }),
                runningSessions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: emptyStyle, children: "\u6CA1\u6709\u6B63\u5728\u8FD0\u884C\u7684\u4EFB\u52A1" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: panelStyle(hovered, doneShift, panelUp),
              role: "dialog",
              "aria-label": "\u5BF9\u8BDD\u5B8C\u6210\u8BB0\u5F55",
              "aria-hidden": !hovered,
              onPointerDown: (event) => {
                event.stopPropagation();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dp-panel-head", style: headStyle, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: headTitleStyle, children: "\u5BF9\u8BDD\u5B8C\u6210\u8BB0\u5F55" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: headMetaStyle, children: `${entries.length} \u6761 \xB7 \u70B9\u51FB\u5361\u7247\u8FDB\u5165\u4F1A\u8BDD` })
                ] }),
                entries.map((item) => {
                  const title = item.title;
                  const unread = !readIds.has(item.id);
                  const headLabel = item.question !== "" ? item.question : item.title;
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      className: "dsh-done-pill-row",
                      style: cardStyle,
                      role: "button",
                      tabIndex: 0,
                      title: `\u300C${title}\u300D${item.question !== "" ? `\u95EE\uFF1A${item.question}` : ""} \u2014 \u70B9\u51FB\u6253\u5F00\u4F1A\u8BDD`,
                      onPointerDown: (event) => {
                        event.stopPropagation();
                      },
                      onClick: () => {
                        openSession(item.sessionId, item.id);
                      },
                      onKeyDown: (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openSession(item.sessionId, item.id);
                        }
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: cardHeadStyle, children: [
                          unread && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: unreadDotStyle, "aria-hidden": true }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: sessionTitleStyle, children: headLabel }),
                          item.reasonKind === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: errorTagStyle, children: "\u51FA\u9519\u7ED3\u675F" }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: metaStyle, children: `\u56DE\u5408 ${item.turn >= 0 ? item.turn + 1 : "?"} \xB7 ${formatTime(item.endedAt)}` }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "dsh-done-pill-close",
                              style: closeStyle,
                              "aria-label": "\u79FB\u9664\u8FD9\u6761\u8BB0\u5F55\uFF08\u4E0D\u8DF3\u8F6C\u4F1A\u8BDD\uFF09",
                              onPointerDown: (event) => {
                                event.stopPropagation();
                              },
                              onClick: (event) => {
                                event.stopPropagation();
                                dismiss(item.id);
                              },
                              children: "\u2715"
                            }
                          )
                        ] }),
                        item.answer !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { style: answerStyle, children: item.answer })
                      ]
                    },
                    item.id
                  );
                }),
                entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: emptyStyle, children: "\u6682\u65E0\u8BB0\u5F55 \u2014 \u4EFB\u4E00\u4F1A\u8BDD\u7684\u5BF9\u8BDD\u5B8C\u6210\u540E\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC" })
              ]
            }
          )
        ]
      }
    ),
    document.body
  );
}
function applyDonePill(ctx) {
  ensurePillKeyframes();
  try {
    sessionsRuntime = ctx.get("sessions");
  } catch {
    sessionsRuntime = void 0;
  }
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "dsh-done-pill",
    order: 90
  }, DonePill));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-done-pill",
    order: 31,
    label: "\u5BF9\u8BDD\u5B8C\u6210\u80F6\u56CA"
  }, DonePillRow));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-done-pill-rest",
    order: 32,
    label: "\u4F11\u606F\u65F6\u95F4\u63D0\u9192"
  }, () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ReminderRow,
    {
      titleText: "\u4F11\u606F\u65F6\u95F4\u63D0\u9192",
      descText: "\u8BBE\u5B9A\u65F6\u95F4\u6BB5\u5185\u80F6\u56CA\u6301\u7EED\u63D0\u793A\u4F11\u606F\uFF1B\u7ED3\u675F\u65F6\u95F4\u65E9\u4E8E\u5F00\u59CB\u65F6\u95F4\u8868\u793A\u8DE8\u5348\u591C",
      store: restStore
    }
  )));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-done-pill-late",
    order: 33,
    label: "\u51CC\u6668\u6CE8\u610F\u4F11\u606F"
  }, () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    ReminderRow,
    {
      titleText: "\u51CC\u6668\u6CE8\u610F\u4F11\u606F",
      descText: "\u51CC\u6668\u65F6\u6BB5\u5185\u80F6\u56CA\u6301\u7EED\u63D0\u793A\u6CE8\u610F\u4F11\u606F\uFF08\u9ED8\u8BA4 00:00-07:00\uFF09",
      store: lateStore
    }
  )));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-done-pill-scale",
    order: 34,
    label: "\u80F6\u56CA\u5927\u5C0F"
  }, PillScaleRow));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-done-pill-font",
    order: 35,
    label: "\u80F6\u56CA\u5B57\u4F53"
  }, PillFontRow));
}

// src/client/index.ts
var inject = ["slots"];
function guarded(ctx, label, mount) {
  try {
    mount();
  } catch (error) {
    console.warn(`[dsh-done-pill] ${label} \u6302\u8F7D\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
  }
}
function apply(ctx) {
  guarded(ctx, "done pill", () => applyDonePill(ctx));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
