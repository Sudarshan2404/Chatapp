#!/usr/bin/env node
/**
 * Stress test for the Chatapp WebSocket server (Backdend/src/app.ts).
 *
 * Protocol it speaks (taken from the server code):
 *   -> {type:"createroom"}                         <- plain numeric string (room code)
 *   -> {type:"join", payload:{roomId, username}}   <- {sender:"joinsystem"} | "false"
 *   -> {type:"chat", payload:{message}}            <- {sender:"server", payload:{message, username}} to the others in the room
 *
 * MODES
 *   ramp   (default) Adds users in steps (e.g. 50 -> 100 -> 500 ...), groups them into rooms of --perRoom,
 *                    every user chats at --msgRate msg/s, and checks each step against pass/fail thresholds.
 *                    The last step that passes = your capacity at that traffic profile.
 *   rooms            Creates rooms in bulk (no users) to see how room creation / memory behave as the room list grows.
 *
 * USAGE
 *   node stress-test.mjs                                    # default ramp against ws://localhost:8080
 *   node stress-test.mjs --steps 100,500,1000,2000 --perRoom 10 --msgRate 1 --hold 20
 *   node stress-test.mjs --perRoom 2                        # many tiny rooms
 *   node stress-test.mjs --perRoom 500 --steps 500,1000     # few huge rooms (heavy fan-out)
 *   node stress-test.mjs --mode rooms --roomTargets 1000,10000,100000
 *   node stress-test.mjs --url wss://your-backend.example.com --pid 12345   (pid = local server process, Linux only for CPU)
 *
 * OPTIONS (defaults)
 *   --url ws://localhost:8080   --steps 50,100,250,500,1000,2000,4000   --perRoom 10   --msgRate 0.5 (msgs/sec/user)
 *   --msgSize 100 (bytes)       --hold 15 (sec per step)                --connRate 200 (new conns/sec)
 *   --maxP95 500 (ms)           --minDelivery 99.5 (%)                  --keepGoing (don't stop at first failing step)
 *   --pid <server pid>          --out stress-results.json
 *
 * Needs the `ws` package (already a dependency of Backdend). Run it from the Backdend folder.
 * Before going past ~1000 users on Linux/macOS:  ulimit -n 65535   (in BOTH the server and the test terminals)
 */
import WebSocket from "ws";
import http from "node:http";
import fs from "node:fs";
import { performance, monitorEventLoopDelay } from "node:perf_hooks";
import { execFileSync } from "node:child_process";

// ───────────────────────────── config ─────────────────────────────
const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const k = argv[i].slice(2);
    opt[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
  }
}
if (opt.help) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0]);
  process.exit(0);
}
const cfg = {
  url: opt.url ?? "ws://localhost:8080",
  mode: opt.mode ?? "ramp",
  steps: (opt.steps ?? "50,100,250,500,1000,2000,4000").split(",").map(Number),
  roomTargets: (opt.roomTargets ?? "1000,5000,10000,50000,100000,250000")
    .split(",")
    .map(Number),
  perRoom: Math.max(1, Number(opt.perRoom ?? 10)),
  msgRate: Number(opt.msgRate ?? 0.5),
  msgSize: Math.max(20, Number(opt.msgSize ?? 100)),
  hold: Number(opt.hold ?? 15),
  connRate: Math.max(10, Number(opt.connRate ?? 200)),
  maxP95: Number(opt.maxP95 ?? 500),
  minDelivery: Number(opt.minDelivery ?? 99.5),
  pid: opt.pid ? Number(opt.pid) : null,
  keepGoing: opt.keepGoing === "true",
  out: opt.out ?? "stress-results.json",
};
const httpBase = cfg.url.replace(/^ws/, "http");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => performance.now();
const f = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "n/a");

// ───────────────────────────── helpers ─────────────────────────────
/** Reservoir sampler so millions of latency samples don't eat the generator's RAM. */
class Sampler {
  constructor(cap = 400_000) {
    this.cap = cap;
    this.a = [];
    this.n = 0;
  }
  add(v) {
    this.n++;
    if (this.a.length < this.cap) this.a.push(v);
    else {
      const j = Math.floor(Math.random() * this.n);
      if (j < this.cap) this.a[j] = v;
    }
  }
  pct(p) {
    if (!this.a.length) return NaN;
    const s = Float64Array.from(this.a).sort();
    return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
  }
}

/** HTTP /ping prober: shows whether the server's event loop is still responsive from the outside. */
const pingAgent = new http.Agent({ keepAlive: true, maxSockets: 1 });
function pingOnce(sampler) {
  return new Promise((resolve) => {
    const t = now();
    let done = false;
    const fin = (v) => {
      if (!done) {
        done = true;
        sampler.add(v);
        resolve();
      }
    };
    const req = http.get(
      httpBase + "/ping",
      { agent: pingAgent, timeout: 5000 },
      (res) => {
        res.resume();
        res.on("end", () => fin(now() - t));
      },
    );
    req.on("timeout", () => {
      fin(5000);
      req.destroy();
    });
    req.on("error", () => fin(5000));
  });
}

/** Optional server-process sampler (Linux: /proc; elsewhere RSS via ps; Windows: skipped). */
function readProc(pid) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
    const p = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    const ticks = Number(p[11]) + Number(p[12]);
    const m = fs
      .readFileSync(`/proc/${pid}/status`, "utf8")
      .match(/VmRSS:\s+(\d+)/);
    let fds = NaN;
    try {
      fds = fs.readdirSync(`/proc/${pid}/fd`).length;
    } catch {}
    return { ticks, rssMB: m ? Number(m[1]) / 1024 : NaN, fds };
  } catch {
    try {
      const out = execFileSync("ps", ["-o", "rss=", "-p", String(pid)], {
        encoding: "utf8",
      }).trim();
      return out ? { ticks: NaN, rssMB: Number(out) / 1024, fds: NaN } : null;
    } catch {
      return null;
    }
  }
}
function startServerMonitor(pid) {
  if (!pid) return { stop: () => null };
  const samples = [];
  let last = readProc(pid),
    lastT = now();
  const iv = setInterval(() => {
    const cur = readProc(pid),
      t = now();
    if (cur && last) {
      const cpu =
        Number.isFinite(cur.ticks) && Number.isFinite(last.ticks)
          ? ((cur.ticks - last.ticks) / 100 / ((t - lastT) / 1000)) * 100
          : NaN;
      samples.push({ cpu, rssMB: cur.rssMB, fds: cur.fds });
    }
    last = cur;
    lastT = t;
  }, 1000);
  return {
    stop() {
      clearInterval(iv);
      if (!samples.length) return null;
      const cpus = samples.map((s) => s.cpu).filter(Number.isFinite);
      return {
        cpuAvg: cpus.length
          ? cpus.reduce((a, b) => a + b, 0) / cpus.length
          : NaN,
        cpuPeak: cpus.length ? Math.max(...cpus) : NaN,
        rssMB: Math.max(...samples.map((s) => s.rssMB)),
        fds: Math.max(...samples.map((s) => s.fds)),
      };
    },
  };
}

function startPinger(sampler) {
  let on = true;
  (async () => {
    while (on) {
      await pingOnce(sampler);
      await sleep(500);
    }
  })();
  return () => {
    on = false;
  };
}

// ───────────────────────────── RAMP MODE ─────────────────────────────
const clients = [];
const groups = [];
const failures = {};
let cur = null;
let sending = false;
let shuttingDown = false;
const TICK = 100;
const pad = "x".repeat(Math.max(0, cfg.msgSize - 30));

function getGroup(idx) {
  if (!groups[idx]) {
    let resolveCode;
    const codeP = new Promise((r) => (resolveCode = r));
    groups[idx] = { idx, code: null, codeP, resolveCode, ready: 0 };
  }
  return groups[idx];
}

function onChat(message) {
  if (typeof message !== "string") return;
  const [stg, t] = message.split("|");
  if (Number(stg) !== cur.id) return;
  cur.received++;
  cur.lat.add(now() - parseFloat(t));
}

function spawn(i) {
  return new Promise((resolve) => {
    const g = getGroup(Math.floor(i / cfg.perRoom));
    const isCreator = i % cfg.perRoom === 0;
    const ws = new WebSocket(cfg.url, {
      perMessageDeflate: false,
      handshakeTimeout: 15000,
    });
    const c = { i, g, ws, ready: false };
    clients.push(c);
    let settled = false;
    const timer = setTimeout(() => done(false, "join_timeout"), 30000);
    const done = (ok, why) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!ok) failures[why] = (failures[why] || 0) + 1;
      resolve(ok);
    };

    ws.on("open", async () => {
      if (isCreator) ws.send(JSON.stringify({ type: "createroom" }));
      const code = await g.codeP;
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { roomId: code, username: `u${i}` },
        }),
      );
    });
    ws.on("message", (data) => {
      const s = data.toString();
      if (s.charCodeAt(0) !== 123 /* '{' */) {
        if (/^\d+$/.test(s)) {
          if (isCreator && !g.code) {
            g.code = s;
            g.resolveCode(s);
          }
        } else if (s === "false") done(false, "join_rejected");
        return;
      }
      let m;
      try {
        m = JSON.parse(s);
      } catch {
        return;
      }
      if (m.sender === "joinsystem") {
        c.ready = true;
        g.ready++;
        done(true);
      } else if (m.sender === "server") onChat(m.payload?.message);
    });
    ws.on("error", (e) => done(false, e.code || e.message));
    ws.on("close", () => {
      if (c.ready) {
        c.ready = false;
        g.ready--;
        if (!shuttingDown && cur) cur.dropped++;
      }
      done(false, "closed_before_ready");
    });
  });
}

function startSender() {
  return setInterval(() => {
    if (!sending) return;
    const p = (cfg.msgRate * TICK) / 1000;
    for (const c of clients) {
      if (!c.ready || c.ws.readyState !== WebSocket.OPEN) continue;
      let n = Math.floor(p);
      if (Math.random() < p - n) n++;
      while (n-- > 0) {
        c.ws.send(
          JSON.stringify({
            type: "chat",
            payload: { message: `${cur.id}|${now().toFixed(3)}|${pad}` },
          }),
        );
        cur.sent++;
        cur.expected += c.g.ready - 1;
      }
    }
  }, TICK);
}

async function runStep(target, id) {
  const st = (cur = {
    id,
    target,
    sent: 0,
    expected: 0,
    received: 0,
    dropped: 0,
    lat: new Sampler(),
  });
  const failsBefore = { ...failures };

  // 1) ramp connections + join rooms
  const start = clients.length;
  const t0 = now();
  const pending = [];
  const perBatch = Math.max(1, Math.round(cfg.connRate / 10));
  for (let i = start; i < target; i++) {
    pending.push(spawn(i));
    if ((i - start + 1) % perBatch === 0) await sleep(100);
  }
  await Promise.all(pending);
  const connectSecs = (now() - t0) / 1000;
  const ready = clients.filter((c) => c.ready).length;

  // 2) hold & measure
  const loop = monitorEventLoopDelay({ resolution: 10 });
  loop.enable();
  const pingS = new Sampler();
  const stopPing = startPinger(pingS);
  const mon = startServerMonitor(cfg.pid);
  sending = true;
  await sleep(cfg.hold * 1000);
  sending = false;
  await sleep(3000); // drain in-flight messages
  stopPing();
  loop.disable();
  const srv = mon.stop();

  // 3) evaluate
  const roomsReady = groups.filter((g) => g && g.ready > 0).length;
  const delivery = st.expected ? (st.received / st.expected) * 100 : NaN;
  const genLag = Math.max(0, loop.percentile(99) / 1e6 - 10);
  const res = {
    users: target,
    connected: ready,
    rooms: roomsReady,
    connectPct: (ready / target) * 100,
    connectSecs,
    dropped: st.dropped,
    sent: st.sent,
    expected: st.expected,
    received: st.received,
    deliveryPct: delivery,
    msgsPerSecIn: st.sent / cfg.hold,
    deliveriesPerSec: st.received / cfg.hold,
    p50: st.lat.pct(50),
    p95: st.lat.pct(95),
    p99: st.lat.pct(99),
    pingP50: pingS.pct(50),
    pingP99: pingS.pct(99),
    generatorLagP99: genLag,
    server: srv,
    newFailures: Object.fromEntries(
      Object.entries(failures)
        .filter(([k, v]) => v !== (failsBefore[k] || 0))
        .map(([k, v]) => [k, v - (failsBefore[k] || 0)]),
    ),
  };
  const why = [];
  if (res.connectPct < 99)
    why.push(`only ${f(res.connectPct)}% of users connected+joined`);
  if (res.dropped > 0) why.push(`${res.dropped} connections dropped`);
  if (Number.isFinite(delivery) && delivery < cfg.minDelivery)
    why.push(`delivery ${f(delivery, 2)}% < ${cfg.minDelivery}%`);
  if (Number.isFinite(res.p95) && res.p95 > cfg.maxP95)
    why.push(`p95 latency ${f(res.p95, 0)}ms > ${cfg.maxP95}ms`);
  if (res.pingP99 > 1000)
    why.push(`/ping p99 ${f(res.pingP99, 0)}ms (server loop stalling)`);
  res.pass = why.length === 0;
  res.reasons = why;
  res.generatorSaturated = genLag > 100;
  return res;
}

function printStep(r) {
  console.log(
    `\n── ${r.users} users / ${r.rooms} rooms (${cfg.perRoom}/room)  ${r.pass ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log(
    `   connected      ${r.connected}/${r.users} (${f(r.connectPct)}%) in ${f(r.connectSecs)}s, dropped during hold: ${r.dropped}`,
  );
  console.log(
    `   traffic        ${f(r.msgsPerSecIn, 0)} msgs/s in → ${f(r.deliveriesPerSec, 0)} deliveries/s out`,
  );
  console.log(
    `   delivery       ${f(r.deliveryPct, 2)}%  (${r.received}/${r.expected})`,
  );
  console.log(
    `   msg latency    p50 ${f(r.p50, 1)}ms | p95 ${f(r.p95, 1)}ms | p99 ${f(r.p99, 1)}ms`,
  );
  console.log(
    `   /ping latency  p50 ${f(r.pingP50, 1)}ms | p99 ${f(r.pingP99, 1)}ms`,
  );
  if (r.server)
    console.log(
      `   server         CPU avg ${f(r.server.cpuAvg, 0)}% peak ${f(r.server.cpuPeak, 0)}% | RSS ${f(r.server.rssMB, 0)}MB | fds ${r.server.fds}`,
    );
  if (Object.keys(r.newFailures).length)
    console.log(`   errors         ${JSON.stringify(r.newFailures)}`);
  if (r.generatorSaturated)
    console.log(
      `   ⚠ load generator loop lag p99 ${f(r.generatorLagP99, 0)}ms — THIS machine is the bottleneck, numbers are pessimistic. Run on a stronger box / split across processes.`,
    );
  for (const w of r.reasons) console.log(`   ✗ ${w}`);
}

async function rampMode() {
  console.log(
    `Ramp test → ${cfg.url}\n  steps=${cfg.steps} perRoom=${cfg.perRoom} msgRate=${cfg.msgRate}/s/user msgSize=${cfg.msgSize}B hold=${cfg.hold}s`,
  );
  const sender = startSender();
  const results = [];
  let id = 0;
  for (const target of cfg.steps) {
    const r = await runStep(target, ++id);
    printStep(r);
    results.push(r);
    if (!r.pass && !cfg.keepGoing) {
      console.log(
        "\nStopping at first failing step (use --keepGoing to continue).",
      );
      break;
    }
  }
  clearInterval(sender);
  shuttingDown = true;
  for (const c of clients)
    try {
      c.ws.terminate();
    } catch {}

  const passed = results.filter((r) => r.pass);
  const best = passed.length ? passed[passed.length - 1] : null;
  console.log("\n════════ SUMMARY ════════");
  if (best) {
    console.log(
      `Max passing load: ${best.users} concurrent users in ${best.rooms} rooms (${cfg.perRoom}/room, ${cfg.msgRate} msg/s/user)`,
    );
    console.log(
      `  → ${f(best.msgsPerSecIn, 0)} msgs/s in, ${f(best.deliveriesPerSec, 0)} deliveries/s out, p95 ${f(best.p95, 1)}ms`,
    );
  } else
    console.log("No step passed — try smaller --steps or looser --maxP95.");
  const firstFail = results.find((r) => !r.pass);
  if (firstFail)
    console.log(
      `First failure at ${firstFail.users} users: ${firstFail.reasons.join("; ")}`,
    );
  fs.writeFileSync(cfg.out, JSON.stringify({ config: cfg, results }, null, 2));
  console.log(`Raw results → ${cfg.out}`);
}

// ───────────────────────────── ROOMS MODE ─────────────────────────────
async function roomsMode() {
  console.log(
    `Room-creation test → ${cfg.url}\n  targets=${cfg.roomTargets}  (rooms are never freed by the server; restart it afterwards)`,
  );
  const ws = new WebSocket(cfg.url, { perMessageDeflate: false });
  await new Promise((res, rej) => {
    ws.once("open", res);
    ws.once("error", rej);
  });
  const WINDOW = 50;
  const q = [];
  let created = 0,
    sent = 0,
    wake = null,
    phaseLat = new Sampler();
  ws.on("message", (d) => {
    if (!/^\d+$/.test(d.toString())) return;
    const t = q.shift();
    if (t !== undefined) phaseLat.add(now() - t);
    created++;
    wake?.();
  });
  const results = [];
  const base = cfg.pid ? readProc(cfg.pid) : null;
  for (const target of cfg.roomTargets) {
    phaseLat = new Sampler();
    const startCount = created,
      t0 = now();
    const pingS = new Sampler();
    const stopPing = startPinger(pingS);
    let stalled = false;
    while (created < target) {
      while (q.length < WINDOW && sent < target) {
        q.push(now());
        ws.send(JSON.stringify({ type: "createroom" }));
        sent++;
      }
      const before = created;
      await Promise.race([new Promise((r) => (wake = r)), sleep(10000)]);
      if (created === before) {
        stalled = true;
        break;
      }
    }
    stopPing();
    const secs = (now() - t0) / 1000;
    const srv = cfg.pid ? readProc(cfg.pid) : null;
    const r = {
      totalRooms: created,
      phaseRooms: created - startCount,
      roomsPerSec: (created - startCount) / secs,
      p50: phaseLat.pct(50),
      p99: phaseLat.pct(99),
      pingP99: pingS.pct(99),
      rssMB: srv?.rssMB,
      stalled,
    };
    results.push(r);
    console.log(
      `${String(r.totalRooms).padStart(8)} rooms | ${f(r.roomsPerSec, 0).padStart(7)} creates/s | latency p50 ${f(r.p50, 1)}ms p99 ${f(r.p99, 1)}ms | /ping p99 ${f(r.pingP99, 0)}ms${srv ? ` | server RSS ${f(srv.rssMB, 0)}MB` : ""}${stalled ? "  ❌ server stopped responding" : ""}`,
    );
    if (stalled) break;
  }
  if (base && results.length) {
    const last = results[results.length - 1];
    console.log(
      `\nServer memory: ~${f(((last.rssMB - base.rssMB) * 1024) / last.totalRooms, 2)} KB per idle room (they are never deleted).`,
    );
  }
  const first = results[0],
    last = results[results.length - 1];
  if (first && last && last.roomsPerSec < first.roomsPerSec * 0.7)
    console.log(
      `Creation rate fell ${f((1 - last.roomsPerSec / first.roomsPerSec) * 100, 0)}% as rooms grew → room lookup is O(n) (array.includes).`,
    );
  ws.terminate();
  fs.writeFileSync(cfg.out, JSON.stringify({ config: cfg, results }, null, 2));
  console.log(`Raw results → ${cfg.out}`);
}

// ───────────────────────────── main ─────────────────────────────
process.on("SIGINT", () => {
  shuttingDown = true;
  for (const c of clients)
    try {
      c.ws.terminate();
    } catch {}
  process.exit(130);
});
try {
  await (cfg.mode === "rooms" ? roomsMode() : rampMode());
} catch (e) {
  console.error(
    "Test aborted:",
    e.code || e.message,
    "\nIs the server running at",
    cfg.url,
    "?",
  );
  process.exitCode = 1;
}
process.exit();
