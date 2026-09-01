/**
 * dsh-done-pill — host half smoke test.
 *
 * Loads `lib/index.js` with plain node (the host bundle is self-contained)
 * and asserts:
 *   1. name / inject[] / apply() contract
 *   2. apply() registers a global `session/event` listener and the
 *      /api/dsh-done-pill route
 *   3. the listener turns a realistic event sequence into exactly one
 *      completion entry (title cache, question, joined answer text)
 *   4. route handler: GET ?since=N filter, aborted/subagent skipped,
 *      non-GET → 405
 *
 * Usage: node scripts/smoke-host.mjs
 */

import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const fail = (msg) => { console.error(`FAIL  ${msg}`); process.exitCode = 1 }
const pass = (msg) => console.log(`ok    ${msg}`)

const mod = await import(pathToFileURL(resolve(ROOT, 'lib/index.js')).href)

if (typeof mod.name !== 'string' || mod.name !== 'dsh-done-pill') fail(`expected name "dsh-done-pill", got ${JSON.stringify(mod.name)}`)
else pass('host exports name = "dsh-done-pill"')

if (!Array.isArray(mod.inject)) fail('host did not export inject[]')
else pass(`host exports inject[] = [${mod.inject.join(', ')}]`)

if (typeof mod.apply !== 'function') fail('host did not export apply()')
else pass('host exports apply()')

// ── stub ctx: what done-pill touches ──────────────────────────────────────
const routes = []
const listeners = new Map()
const warns = []

const webServer = {
  register: (spec) => { routes.push(spec); return () => {} },
}

const ctx = {
  logger: { warn: (m) => warns.push(String(m)), info: () => {} },
  get: (name) => (name === 'webServer' ? webServer : undefined),
  on: (type, handler, options) => {
    listeners.set(type, { handler, options })
    return () => {}
  },
  effect: (fn) => { const stop = typeof fn === 'function' ? fn() : undefined; return stop ?? (() => {}) },
}

try {
  mod.apply(ctx)
  pass('apply(ctx) ran without throwing')
} catch (error) {
  fail(`apply(ctx) threw: ${error?.stack ?? error}`)
}

// 1) global session/event listener
const ev = listeners.get('session/event')
if (ev === undefined) fail('no session/event listener registered')
else pass('registered session/event listener')
if (ev?.options?.global !== true) fail('session/event listener not global (options.global !== true)')
else pass('session/event listener is global:true')

// 2) route registered
const route = routes.find((r) => r.path === '/api/dsh-done-pill')
if (route === undefined) fail(`route /api/dsh-done-pill not registered (got ${routes.map((r) => r.path).join(', ')})`)
else pass('registered GET /api/dsh-done-pill (exact)')

if (route !== undefined && route.kind !== 'exact') fail(`route kind expected "exact", got ${route.kind}`)

// ── drive the listener + route handler ────────────────────────────────────
// 主场景用 DSH 0.1.2+ 的 Session 形态：事件日志私有化，只暴露 snapshotEvents()。
const session = {
  id: 's1',
  header: { cwd: 'C:\\work\\proj' },
  _log: [],
  snapshotEvents () { return this._log },
}

function emit(sessionLike, event) {
  if (Array.isArray(sessionLike.events)) sessionLike.events.push(event)
  else if (Array.isArray(sessionLike._log)) sessionLike._log.push(event)
  ev.handler(sessionLike, event)
}

function callHandler(url, method = 'GET') {
  let status = 0
  let headers = null
  let body = null
  const res = {
    writeHead: (code, h) => { status = code; headers = h },
    end: (text) => { body = JSON.parse(text) },
  }
  route.handler({ method, url }, res)
  return { status, headers, body }
}

emit(session, { type: 'session/title', seq: 1, data: { title: '测试项目' } })
emit(session, { type: 'user/message', seq: 2, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '第一个问题' }] } })
emit(session, { type: 'turn/start', seq: 3, data: { turn: 0 } })
// 同一事件内多个 text 块以 \n 连接；不同 assistant/message 事件以 \n\n 连接
// （与 webui done-pill 的 blocksToText / extractTurnTexts 语义一致）。
emit(session, { type: 'assistant/message', seq: 4, data: { turn: 0, message: { content: [{ type: 'text', text: '回答A' }, { type: 'text', text: '回答B' }] } } })
emit(session, { type: 'assistant/message', seq: 5, data: { turn: 0, message: { content: [{ type: 'text', text: '回答C' }] } } })
emit(session, { type: 'turn/end', seq: 6, data: { turn: 0, reason: { kind: 'finished' } } })

const r1 = callHandler('/api/dsh-done-pill?since=0')
if (r1.status !== 200) fail(`GET return status ${r1.status}, want 200`)
if (r1.body?.ok !== true) fail('GET body.ok !== true')
if (!Array.isArray(r1.body?.items) || r1.body.items.length !== 1) fail(`expected 1 item, got ${JSON.stringify(r1.body?.items)}`)
else {
  const item = r1.body.items[0]
  if (item.sessionId !== 's1') fail(`item.sessionId ${JSON.stringify(item.sessionId)}, want "s1"`)
  if (item.title !== '测试项目') fail(`item.title ${JSON.stringify(item.title)}, want "测试项目"`)
  if (item.question !== '第一个问题') fail(`item.question ${JSON.stringify(item.question)}, want "第一个问题"`)
  if (item.answer !== '回答A\n回答B\n\n回答C') fail(`item.answer ${JSON.stringify(item.answer)}, want "回答A\\n回答B\\n\\n回答C"`)
  if (item.reasonKind !== 'finished') fail(`item.reasonKind ${JSON.stringify(item.reasonKind)}, want "finished"`)
  if (item.turn !== 0) fail(`item.turn ${JSON.stringify(item.turn)}, want 0`)
}
if (r1.body?.running?.some((x) => x.sessionId === 's1')) fail('finished turn still reported as running')
else pass('turn/end removed the running entry')

// incremental since filter: latest seq must be excluded
const r2 = callHandler(`/api/dsh-done-pill?since=${r1.body.version}`)
if (r2.body?.items?.length !== 0) fail(`since=version should return 0 items, got ${r2.body?.items?.length}`)
else pass('since=version incremental filter returns 0 items')

// aborted turn must not create a completion entry
const s2 = { id: 's2', header: { cwd: 'C:\\work\\aborted' }, events: [] }
emit(s2, { type: 'user/message', seq: 1, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '被取消的问题' }] } })
emit(s2, { type: 'turn/start', seq: 2, data: { turn: 0 } })
emit(s2, { type: 'turn/end', seq: 3, data: { turn: 0, reason: { kind: 'aborted' } } })
const r3 = callHandler('/api/dsh-done-pill?since=0')
if (r3.body?.items?.length !== 1) fail(`aborted turn created an item (items=${r3.body?.items?.length}), want 1`)
else pass('aborted turn does not create a completion entry')

// subagent turns must be skipped entirely (no item, no running)
const s3 = { id: 's3', header: { cwd: 'C:\\work\\sa', origin: 'subagent' }, events: [] }
emit(s3, { type: 'user/message', seq: 1, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '子代理问题' }] } })
emit(s3, { type: 'turn/start', seq: 2, data: { turn: 0 } })
emit(s3, { type: 'turn/end', seq: 3, data: { turn: 0, reason: { kind: 'finished' } } })
const r4 = callHandler('/api/dsh-done-pill?since=0')
if (r4.body?.items?.length !== 1) fail(`subagent turn created an item (items=${r4.body?.items?.length}), want 1`)
else pass('subagent turn does not create a completion entry')

// non-GET → 405
const r5 = callHandler('/api/dsh-done-pill', 'POST')
if (r5.status !== 405) fail(`POST return status ${r5.status}, want 405`)
else pass('non-GET returns 405')

console.log(`\n${process.exitCode ? 'SMOKE FAILED' : 'SMOKE PASSED'} — host half`)
process.exit(process.exitCode ?? 0)
