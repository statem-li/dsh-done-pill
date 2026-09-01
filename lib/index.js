import { createRequire as __pillCreateRequire } from 'node:module';
const require = __pillCreateRequire(import.meta.url);

// src/host.ts
var ROUTE = "/api/dsh-done-pill";
var MAX_ITEMS = 50;
var MAX_TEXT_CHARS = 2e4;
function eventsOf(session) {
  const candidate = session;
  if (typeof candidate.snapshotEvents === "function") {
    try {
      const snapshot = candidate.snapshotEvents();
      if (Array.isArray(snapshot)) return snapshot;
    } catch {
    }
    return [];
  }
  return session.events ?? [];
}
function blocksToText(content) {
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const block of content) {
    if (block === null || typeof block !== "object") continue;
    const type = block.type;
    if (type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    } else if (type === "image") {
      parts.push("[\u56FE\u7247]");
    }
  }
  return parts.join("\n").trim();
}
function clampText(text) {
  return text.length <= MAX_TEXT_CHARS ? text : `${text.slice(0, MAX_TEXT_CHARS)}\u2026`;
}
function workspaceTitleOf(cwd) {
  return cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop() ?? "";
}
function applyDonePill(ctx) {
  const titles = /* @__PURE__ */ new Map();
  const items = [];
  const runningTurns = /* @__PURE__ */ new Map();
  const lastQuestions = /* @__PURE__ */ new Map();
  const seqBase = Date.now();
  let counter = 0;
  function titleOf(session) {
    const cached = titles.get(session.id);
    if (cached !== void 0 && cached !== "") return cached;
    const events = eventsOf(session);
    for (let i = events.length - 1; i >= 0; i--) {
      const data = events[i]?.data;
      if (events[i]?.type === "session/title" && typeof data?.title === "string" && data.title !== "") {
        titles.set(session.id, data.title);
        return data.title;
      }
    }
    const cwd = session.header?.cwd;
    if (typeof cwd === "string" && cwd !== "") {
      const base = workspaceTitleOf(cwd);
      if (base !== "") return base;
    }
    return session.id;
  }
  function extractTurnTexts(events, turn) {
    const answerParts = [];
    let question = "";
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      if (event === void 0) continue;
      if (event.type === "assistant/message") {
        if (event.data?.turn === turn) {
          const text = blocksToText(event.data.message?.content);
          if (text !== "") answerParts.push(text);
        }
        continue;
      }
      if (event.type === "user/message" && event.data?.source?.kind === "user") {
        question = clampText(blocksToText(event.data.content));
        break;
      }
    }
    return { question, answer: clampText(answerParts.reverse().join("\n\n")) };
  }
  ctx.on("session/event", ((session, event) => {
    try {
      if (event.type === "session/title") {
        if (typeof event.data?.title === "string" && event.data.title !== "") {
          titles.set(session.id, event.data.title);
        }
        return;
      }
      if (event.type === "user/message") {
        if (event.data?.source?.kind === "user") {
          const text = clampText(blocksToText(event.data.content));
          if (text !== "") {
            lastQuestions.set(session.id, text);
            const running = runningTurns.get(session.id);
            if (running !== void 0) runningTurns.set(session.id, { ...running, question: text });
          }
        }
        return;
      }
      if (event.type === "turn/start") {
        if (session.header?.origin === "subagent") return;
        runningTurns.set(session.id, { since: Date.now(), question: lastQuestions.get(session.id) ?? "", title: titleOf(session) });
        return;
      }
      if (event.type !== "turn/end") return;
      runningTurns.delete(session.id);
      lastQuestions.delete(session.id);
      if (session.header?.origin === "subagent") return;
      const reasonKind = typeof event.data?.reason?.kind === "string" ? event.data.reason.kind : "";
      if (reasonKind === "aborted") return;
      const turn = typeof event.data?.turn === "number" ? event.data.turn : -1;
      const events = eventsOf(session);
      const { question, answer } = extractTurnTexts(events, turn);
      if (question === "" && answer === "") return;
      counter += 1;
      const seq = seqBase + counter;
      items.push({
        seq,
        id: String(seq),
        sessionId: session.id,
        title: titleOf(session),
        question,
        answer,
        endedAt: Date.now(),
        turn,
        reasonKind
      });
      if (items.length > MAX_ITEMS) items.splice(0, items.length - MAX_ITEMS);
    } catch (error) {
      ctx.logger?.warn?.(`[dsh-done-pill] turn/end handling failed for ${session.id}: ${String(error)}`);
    }
  }), { global: true });
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return;
  ctx.effect(() => {
    try {
      return webServer.register({
        kind: "exact",
        path: ROUTE,
        handler: (req, res) => {
          if (req.method !== "GET") {
            res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: false, message: "method not allowed" }));
            return;
          }
          let since = 0;
          try {
            const url = new URL(req.url ?? "/", "http://localhost");
            const raw = url.searchParams.get("since");
            if (raw !== null && /^\d+$/.test(raw)) since = Number(raw);
          } catch {
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
          res.end(JSON.stringify({
            ok: true,
            version: seqBase + counter,
            items: items.filter((item) => item.seq > since),
            running: [...runningTurns.entries()].map(([sessionId, info]) => ({
              sessionId,
              since: info.since,
              question: info.question,
              title: info.title
            }))
          }));
        }
      });
    } catch (error) {
      ctx.logger?.warn?.(`[dsh-done-pill] route ${ROUTE} already registered (webui done-pill \u6A21\u5757\u5171\u5B58\uFF1F): ${String(error)}`);
      return void 0;
    }
  }, "dsh-done-pill: done-pill route");
  console.log(`[dsh-done-pill] done-pill mounted: ${ROUTE} (global session/event listener active)`);
}
var name = "dsh-done-pill";
var inject = ["webServer"];
function apply(ctx) {
  applyDonePill(ctx);
}
export {
  apply,
  applyDonePill,
  inject,
  name
};
//# sourceMappingURL=index.js.map
