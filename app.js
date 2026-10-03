"use strict";

const WEIGHT = {
  1: [["learn", 15], ["explore", 25], ["quiz", 40], ["challenge", 20]],
  2: [["learn", 10], ["explore", 20], ["practice", 25], ["challenge", 15], ["checkpoint", 30]],
  3: [["learn", 10], ["explore", 20], ["match", 30], ["error", 15], ["quiz", 25]],
  4: [["learn", 20], ["build", 50], ["practice", 30]],
  5: [["read", 10], ["identify", 15], ["construct", 25], ["analyze", 15], ["apply", 20], ["check", 15]]
};

const FLOW = {
  1: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["check", "3 · Check", "quiz"],
    ["challenge", "4 · Challenge", "challenge"]
  ],
  2: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["practice", "3 · Practice", "practice"],
    ["challenge", "4 · Challenge", "challenge"],
    ["checkpoint", "5 · Checkpoint", "checkpoint"]
  ],
  3: [
    ["learn", "1 · Learn", "learn"],
    ["explore", "2 · Explore", "explore"],
    ["match", "3 · Pair-match", "match"],
    ["error", "4 · Error check", "error"],
    ["check", "5 · Check", "quiz"]
  ],
  4: [
    ["learn", "1 · Learn", "learn"],
    ["build", "2 · FBD Builder", "build"],
    ["practice", "3 · Practice", "practice"]
  ],
  5: [
    ["read", "1 · Read", "read"],
    ["identify", "2 · Identify", "identify"],
    ["construct", "3 · Construct", "construct"],
    ["analyze", "4 · Analyze", "analyze"],
    ["apply", "5 · Apply", "apply"],
    ["check", "6 · Final check", "check"]
  ]
};

const SESSIONS = [
  { id: 1, title: "Newton's First Law", short: "Newton's First Law", blurb: "Motion stays the same until a net force changes it." },
  { id: 2, title: "Newton's Second Law", short: "Newton's Second Law", blurb: "Net force, mass, and acceleration stay tied together." },
  { id: 3, title: "Newton's Third Law", short: "Newton's Third Law", blurb: "Forces arrive in equal pairs on different objects." },
  { id: 4, title: "Free-Body Diagrams", short: "Free-Body Diagrams", blurb: "Isolate one object and draw every force on it." },
  { id: 5, title: "Applying FBDs to Newton's Laws", short: "FBD Application", blurb: "Diagram the problem, then find force and acceleration." }
];

const FORCE = {
  gravity: { label: "Gravity", symbol: "Fg", color: "#6e4b3a", dir: "down" },
  normal: { label: "Normal force", symbol: "FN", color: "#0f6e6a", dir: "up" },
  applied: { label: "Applied force", symbol: "Fa", color: "#c05622", dir: "right" },
  friction: { label: "Friction", symbol: "Ff", color: "#9d4034", dir: "left" },
  tension: { label: "Tension", symbol: "FT", color: "#31457a", dir: "up" },
  motion: { label: "Force of motion", symbol: "?", color: "#6c7570", dir: "right" }
};

const DIRS = [
  ["up", "↑", "Up"],
  ["down", "↓", "Down"],
  ["left", "←", "Left"],
  ["right", "→", "Right"]
];

const KEY = "physics-airea-progress-v1";

function blank() {
  return { v: 1, task: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, best: {}, flag: {}, final: {} };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw || raw.v !== 1) return blank();
    raw.task = Object.assign({ 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }, raw.task);
    raw.best = raw.best || {};
    raw.flag = raw.flag || {};
    raw.final = raw.final || {};
    return raw;
  } catch (err) {
    return blank();
  }
}

const store = {
  data: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (err) { /* private mode */ }
    if (this.painting) return;
    this.painting = true;
    try { refreshProgressUI(); } finally { this.painting = false; }
  },
  task(session, key) {
    return this.data.task[session][key] || 0;
  },
  setTask(session, key, value) {
    const cur = this.task(session, key);
    const next = Math.max(cur, value);
    if (next === cur) return;
    this.data.task[session][key] = next;
    this.save();
  },
  putTask(session, key, value) {
    if (this.task(session, key) === value) return;
    this.data.task[session][key] = value;
    this.save();
  },
  flag(key) { return !!this.data.flag[key]; },
  setFlag(key) {
    if (this.data.flag[key]) return;
    this.data.flag[key] = 1;
    this.save();
  },
  reset() {
    this.data = blank();
    this.save();
    route();
  }
};

function sessionPercent(id) {
  let total = 0;
  WEIGHT[id].forEach(([key, weight]) => { total += store.task(id, key) * weight; });
  return Math.round(total);
}

function isComplete(id) {
  return WEIGHT[id].every(([key]) => store.task(id, key) >= 1);
}

function isUnlocked(id) {
  return id === 1 || isComplete(id - 1);
}

function finalDoneCount() {
  let n = 0;
  for (let i = 1; i <= 5; i++) if ((store.data.final[i] || 0) >= 1) n++;
  return n;
}

function isFinalUnlocked() { return isComplete(5); }
function isFinalComplete() { return finalDoneCount() === 5; }

function completedSessions() {
  return SESSIONS.filter((s) => isComplete(s.id)).length;
}

function continueHash() {
  for (let i = 1; i <= 5; i++) {
    if (!isUnlocked(i)) break;
    if (!isComplete(i)) return "#/session/" + i;
  }
  if (isFinalUnlocked() && !isFinalComplete()) return "#/final";
  if (completedSessions() === 0) return "#/session/1";
  return "#/progress";
}

function el(tag, attrs) {
  const node = document.createElement(tag);
  const children = Array.prototype.slice.call(arguments, 2);
  if (attrs) {
    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
  }
  children.flat().forEach((child) => {
    if (child == null || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return node;
}

function svgMarkup(viewBox, inner) {
  const holder = document.createElement("div");
  holder.innerHTML = '<svg viewBox="' + viewBox + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + inner + "</svg>";
  return holder.firstChild;
}

function segments(pct) {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  const row = el("div", { class: "segs", role: "img", "aria-label": pct + " percent" });
  for (let i = 0; i < 10; i++) row.append(el("i", { class: i < filled ? "on" : "" }));
  return row;
}

function meterLine(pct, locked) {
  const line = el("div", { class: "meter-line" });
  line.append(segments(locked ? 0 : pct));
  line.append(el("strong", {}, locked ? "Locked" : pct + "%"));
  return line;
}

function letter(index) {
  return el("span", { class: "letter" }, String.fromCharCode(65 + index));
}

function announce(text) {
  const live = document.getElementById("live");
  if (live) live.textContent = text;
}

function cardShell() {
  return el("section", { class: "card" });
}

function statusName(id) {
  if (!isUnlocked(id)) return "Locked";
  if (isComplete(id)) return "Complete";
  if (sessionPercent(id) === 0) return "Not started";
  return "In progress";
}

function pathCard(session) {
  const locked = !isUnlocked(session.id);
  const pct = sessionPercent(session.id);
  const node = el(locked ? "div" : "a", {
    class: "path-card tone-" + session.id + (locked ? " is-locked" : ""),
    href: locked ? null : "#/session/" + session.id,
    "data-session": session.id
  });
  node.append(el("div", { class: "medal" },
    el("span", { class: "medal__number" }, String(session.id).padStart(2, "0")),
    el("span", { class: "medal__icon", "aria-hidden": "true" }, ["↗", "Σ", "⇄", "✦", "∆"][session.id - 1])
  ));
  const body = el("div");
  body.append(el("div", { class: "status" }, statusName(session.id)));
  body.append(el("h3", {}, "Session " + session.id + ": " + session.title));
  body.append(el("p", {}, locked ? "Finish Session " + (session.id - 1) + " to unlock this one." : session.blurb));
  body.append(meterLine(pct, locked));
  if (!locked) body.append(el("span", { class: "card-action" }, pct > 0 ? "Resume mission" : "Start mission", el("b", { "aria-hidden": "true" }, "↗")));
  node.append(body);
  return node;
}

function pathList() {
  return el("div", { class: "path" }, SESSIONS.map(pathCard));
}

const ILLU = {
  book: '<rect x="30" y="168" width="300" height="16" rx="2" fill="#cbb89a"/><rect x="120" y="110" width="120" height="58" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="180" y1="125" x2="180" y2="78" stroke="#0f6e6a" stroke-width="5"/><polygon points="180,64 172,80 188,80" fill="#0f6e6a"/><line x1="180" y1="150" x2="180" y2="200" stroke="#6e4b3a" stroke-width="5"/><polygon points="180,214 172,198 188,198" fill="#6e4b3a"/><text x="196" y="86" fill="#0f6e6a" font-size="16" font-weight="700">FN</text><text x="196" y="208" fill="#6e4b3a" font-size="16" font-weight="700">Fg</text>',
  bus: '<rect x="40" y="80" width="250" height="80" rx="12" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><circle cx="90" cy="170" r="16" fill="none" stroke="#1c2a24" stroke-width="3"/><circle cx="230" cy="170" r="16" fill="none" stroke="#1c2a24" stroke-width="3"/><circle cx="150" cy="112" r="10" fill="#31457a"/><path d="M168 112h36" stroke="#c05622" stroke-width="4" stroke-linecap="round"/><polygon points="214,112 198,104 198,120" fill="#c05622"/><text x="40" y="50" fill="#5c6b62" font-size="16">bus slows</text>',
  lamp: '<line x1="180" y1="20" x2="180" y2="78" stroke="#31457a" stroke-width="4"/><rect x="150" y="78" width="60" height="36" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="180" y1="96" x2="180" y2="150" stroke="#6e4b3a" stroke-width="5"/><polygon points="180,162 172,146 188,146" fill="#6e4b3a"/><line x1="180" y1="78" x2="180" y2="36" stroke="#31457a" stroke-width="5"/><polygon points="180,24 172,40 188,40" fill="#31457a"/><text x="196" y="48" fill="#31457a" font-size="16" font-weight="700">FT</text><text x="196" y="156" fill="#6e4b3a" font-size="16" font-weight="700">Fg</text>',
  pair: '<circle cx="90" cy="110" r="28" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><rect x="200" y="78" width="70" height="64" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/><line x1="118" y1="110" x2="176" y2="110" stroke="#c05622" stroke-width="5"/><polygon points="188,110 172,102 172,118" fill="#c05622"/><line x1="200" y1="110" x2="150" y2="110" stroke="#31457a" stroke-width="5"/><polygon points="138,110 154,102 154,118" fill="#31457a"/><text x="70" y="160" fill="#5c6b62" font-size="14">object A</text><text x="200" y="160" fill="#5c6b62" font-size="14">object B</text>'
};

function figure(name, caption) {
  const box = el("figure", { class: "illu" });
  box.append(svgMarkup("0 0 360 210", ILLU[name]));
  if (caption) box.append(el("figcaption", { class: "hero__cap" }, caption));
  return box;
}

function heroToy() {
  const root = el("div", { class: "toy" });
  const field = el("div", { class: "toy__field" });
  const read = el("p", { class: "hero__cap" }, "Grab a block. Flick it.");
  const spark = el("div", { class: "toy__spark", "aria-hidden": "true" }, el("i", { class: "toy__arrow toy__arrow--a" }), el("i", { class: "toy__arrow toy__arrow--b" }));
  const bodies = [
    { node: el("button", { class: "toy__body", type: "button", "aria-label": "Crate, 3 kilograms. Drag to move, let go to flick." }, "crate", el("small", {}, "3 kg")), x: 28, y: 80, vx: 0, vy: 0, w: 84, h: 60, mass: 3 },
    { node: el("button", { class: "toy__body toy__body--dot", type: "button", "aria-label": "Ball, 1 kilogram. Drag to move, let go to flick." }, "ball", el("small", {}, "1 kg")), x: 180, y: 28, vx: 0, vy: 0, w: 54, h: 54, mass: 1 }
  ];
  let hold = null;
  let laidOut = false;
  let hitUntil = 0;
  field.append(spark);

  function inverseMass(body) {
    return hold && hold.body === body ? 0 : 1 / body.mass;
  }

  function flash(node) {
    node.classList.remove("is-hit");
    void node.offsetWidth;
    node.classList.add("is-hit");
  }

  function collide(rect) {
    const crate = bodies[0];
    const ball = bodies[1];
    const r = ball.w / 2;
    const cx = ball.x + r;
    const cy = ball.y + r;
    const px = clamp(cx, crate.x, crate.x + crate.w);
    const py = clamp(cy, crate.y, crate.y + crate.h);
    let nx = cx - px;
    let ny = cy - py;
    let dist = Math.hypot(nx, ny);
    if (dist >= r) return;
    if (dist < 0.001) {
      nx = cx - (crate.x + crate.w / 2);
      ny = cy - (crate.y + crate.h / 2);
      dist = Math.hypot(nx, ny) || 1;
    }
    nx /= dist;
    ny /= dist;
    const ia = inverseMass(crate);
    const ib = inverseMass(ball);
    const total = ia + ib;
    if (total === 0) return;
    const overlap = r - Math.min(dist, r);
    crate.x = clamp(crate.x - nx * overlap * ia / total, 0, rect.width - crate.w);
    crate.y = clamp(crate.y - ny * overlap * ia / total, 0, rect.height - crate.h);
    ball.x = clamp(ball.x + nx * overlap * ib / total, 0, rect.width - ball.w);
    ball.y = clamp(ball.y + ny * overlap * ib / total, 0, rect.height - ball.h);
    const closing = (ball.vx - crate.vx) * nx + (ball.vy - crate.vy) * ny;
    if (closing >= 0) return;
    const impulse = -(1 + 0.8) * closing / total;
    crate.vx -= impulse * nx * ia;
    crate.vy -= impulse * ny * ia;
    ball.vx += impulse * nx * ib;
    ball.vy += impulse * ny * ib;
    if (impulse > 0.6) {
      spark.style.transform = "translate3d(" + px + "px," + py + "px,0) rotate(" + Math.atan2(ny, nx) + "rad)";
      flash(spark);
      flash(crate.node);
      flash(ball.node);
      hitUntil = performance.now() + 1400;
    }
  }

  function place(body) {
    body.node.style.transform = "translate3d(" + body.x + "px," + body.y + "px,0)";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function layoutStart() {
    const rect = field.getBoundingClientRect();
    if (rect.width < 40) return;
    bodies[0].x = rect.width * 0.1;
    bodies[0].y = rect.height * 0.48;
    bodies[1].x = rect.width * 0.62;
    bodies[1].y = rect.height * 0.16;
    bodies.forEach(place);
    laidOut = true;
  }

  bodies.forEach((body) => {
    body.node.addEventListener("pointerdown", (event) => {
      if (!laidOut) layoutStart();
      body.node.setPointerCapture(event.pointerId);
      hold = { body: body, id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() };
      body.vx = 0;
      body.vy = 0;
      body.node.classList.add("is-held");
    });
    body.node.addEventListener("pointermove", (event) => {
      if (!hold || hold.id !== event.pointerId || hold.body !== body) return;
      const rect = field.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(8, now - hold.t);
      const dx = event.clientX - hold.x;
      const dy = event.clientY - hold.y;
      hold.x = event.clientX;
      hold.y = event.clientY;
      hold.t = now;
      body.x = clamp(body.x + dx, 0, rect.width - body.w);
      body.y = clamp(body.y + dy, 0, rect.height - body.h);
      body.vx = dx / dt * 16;
      body.vy = dy / dt * 16;
      place(body);
    });
    function release(event) {
      if (!hold || hold.id !== event.pointerId || hold.body !== body) return;
      body.node.classList.remove("is-held");
      hold = null;
    }
    body.node.addEventListener("pointerup", release);
    body.node.addEventListener("pointercancel", release);
    field.append(body.node);
  });

  function tick() {
    if (!root.isConnected) return;
    const rect = field.getBoundingClientRect();
    if (!laidOut) layoutStart();
    if (rect.width > 40) {
      bodies.forEach((body) => {
        if (hold && hold.body === body) {
          if (performance.now() - hold.t > 60) { body.vx = 0; body.vy = 0; }
          return;
        }
        body.x += body.vx;
        body.y += body.vy;
        body.vx *= 0.985;
        body.vy *= 0.985;
        if (Math.abs(body.vx) < 0.04) body.vx = 0;
        if (Math.abs(body.vy) < 0.04) body.vy = 0;
        const maxX = Math.max(0, rect.width - body.w);
        const maxY = Math.max(0, rect.height - body.h);
        if (body.x <= 0) { body.x = 0; body.vx = Math.abs(body.vx) * 0.7; }
        if (body.y <= 0) { body.y = 0; body.vy = Math.abs(body.vy) * 0.7; }
        if (body.x >= maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * 0.7; }
        if (body.y >= maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * 0.7; }
      });
      collide(rect);
      bodies.forEach(place);
      const speed = Math.max(...bodies.map((body) => Math.hypot(body.vx, body.vy)));
      let label;
      if (performance.now() < hitUntil) label = "Equal push, opposite way. The 1 kg ball flies more.";
      else if (hold) label = "You are the force. Ram the other one.";
      else if (speed > 0.35) label = "Coasting. No new force, still moving.";
      else label = "At rest. Net force is zero.";
      if (read.textContent !== label) read.textContent = label;
    }
    requestAnimationFrame(tick);
  }

  const controls = el("div", { class: "toy__controls" });
  [["← Push", -1], ["Stop", 0], ["Push →", 1]].forEach(([label, dir]) => {
    const button = el("button", { type: "button" }, label);
    button.addEventListener("click", () => {
      if (dir === 0) {
        bodies.forEach((body) => { body.vx = 0; body.vy = 0; });
        return;
      }
      bodies[0].vx += dir * 8;
      bodies[0].vy += (Math.random() - 0.5) * 1.4;
    });
    controls.append(button);
  });
  root.append(field, controls, read);
  requestAnimationFrame(tick);
  return root;
}

function heroArt() {
  return svgMarkup("0 0 360 250",
    '<g class="floaty"><rect x="145" y="92" width="70" height="56" rx="8" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/>' +
    '<line class="draw" x1="180" y1="120" x2="180" y2="48" stroke="#0f6e6a" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.15s" x1="180" y1="120" x2="180" y2="198" stroke="#6e4b3a" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.3s" x1="180" y1="120" x2="292" y2="120" stroke="#c05622" stroke-width="6" stroke-linecap="round"/>' +
    '<line class="draw" style="animation-delay:.45s" x1="180" y1="120" x2="68" y2="120" stroke="#9d4034" stroke-width="6" stroke-linecap="round"/>' +
    '<polygon points="180,36 170,54 190,54" fill="#0f6e6a"/>' +
    '<polygon points="180,210 170,192 190,192" fill="#6e4b3a"/>' +
    '<polygon points="304,120 286,110 286,130" fill="#c05622"/>' +
    '<polygon points="56,120 74,110 74,130" fill="#9d4034"/>' +
    "</g>"
  );
}

function near(value, target) {
  return Number.isFinite(value) && Math.abs(value - target) <= Math.max(0.05, Math.abs(target) * 0.02);
}

function parseNum(text) {
  return parseFloat(String(text).trim().replace(",", "."));
}

function mountFormative(host, item, onSolved) {
  if (store.flag(item.key)) {
    host.append(el("p", { class: "feedback is-right" }, "Already settled. " + item.why));
    onSolved();
    return;
  }
  const buttons = [];
  let tries = 0;
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  host.append(el("h3", { class: "prompt" }, item.q));
  item.choices.forEach((text, index) => {
    const button = el("button", { class: "choice", type: "button" }, letter(index), el("span", {}, text));
    button.addEventListener("click", () => {
      if (store.flag(item.key)) return;
      const ok = index === item.answer;
      buttons.forEach((btn) => btn.classList.remove("is-wrong", "is-right"));
      if (ok) {
        button.classList.add("is-right");
        buttons.forEach((btn) => { btn.disabled = true; });
        fb.className = "feedback is-right";
        fb.textContent = "Correct. " + item.why;
        store.setFlag(item.key);
        announce(fb.textContent);
        onSolved();
        return;
      }
      tries += 1;
      button.classList.add("is-wrong");
      fb.className = "feedback is-wrong";
      fb.textContent = tries >= 2 ? item.why : item.hint;
      if (tries >= 3) {
        buttons[item.answer].classList.add("is-right");
      }
      announce(fb.textContent);
    });
    buttons.push(button);
    host.append(button);
  });
  host.append(fb);
}

function mountQuiz(host, items, need, onRecord) {
  const box = el("div");
  const top = el("div", { class: "q-top" });
  host.append(el("p", { class: "quiet" }, "Pass mark: " + need + " of " + items.length + ". One try on each question. You can replay the set."), top, box);
  let index = 0;
  let score = 0;

  function show() {
    top.textContent = index < items.length ? "Question " + (index + 1) + " of " + items.length : "Result";
    box.replaceChildren();
    if (index >= items.length) {
      const passed = score >= need;
      onRecord(score, items.length, passed);
      box.append(el("h3", {}, score + " of " + items.length));
      box.append(el("p", {}, passed ? "Pass mark reached. This check is complete." : "Not at the pass mark yet. Read the notes, then replay."));
      const again = el("button", { class: "btn btn--ghost", type: "button" }, "Replay quiz");
      again.addEventListener("click", () => { index = 0; score = 0; show(); });
      box.append(again);
      return;
    }
    const item = items[index];
    let locked = false;
    const fb = el("p", { class: "feedback", "aria-live": "polite" });
    box.append(el("h3", { class: "prompt" }, item.q));
    const buttons = item.choices.map((text, choice) => {
      const button = el("button", { class: "choice", type: "button" }, letter(choice), el("span", {}, text));
      button.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const ok = choice === item.answer;
        if (ok) score += 1;
        buttons.forEach((btn, j) => {
          btn.disabled = true;
          if (j === item.answer) btn.classList.add("is-right");
          else if (j === choice) btn.classList.add("is-wrong");
        });
        fb.className = "feedback " + (ok ? "is-right" : "is-wrong");
        fb.textContent = (ok ? "Correct. " : "Not quite. ") + item.why;
        const next = el("button", { class: "btn", type: "button" }, index === items.length - 1 ? "See score" : "Next question");
        next.addEventListener("click", () => { index += 1; show(); });
        box.append(next);
        announce(fb.textContent);
      });
      return button;
    });
    buttons.forEach((button) => box.append(button));
    box.append(fb);
  }
  show();
}

function numberFeedback(problem, value, tries) {
  if (!Number.isFinite(value)) return "Type a number first, then press Check.";
  const shown = value + (problem.unit ? " " + problem.unit : "");
  const mistake = (problem.mistakes || []).find((item) => near(value, item.value));
  let why;
  if (mistake) why = mistake.msg;
  else if (value < 0) why = "A negative number means the opposite direction. Use the sizes of the quantities here.";
  else why = shown + " is too " + (value > problem.answer ? "high" : "low") + ". " + (problem.hint || "Check the relation, then try again.");
  if (tries < 3) return "Not quite: " + why;
  return "Not quite: " + why + " Here is the full working: " + (problem.explain || problem.why);
}

function mountNumber(host, problem, onSolved) {
  if (store.flag(problem.key)) {
    host.append(el("p", { class: "feedback is-right" }, "Solved: " + problem.answer + " " + problem.unit + ". " + problem.why));
    onSolved();
    return;
  }
  let tries = 0;
  const input = el("input", { type: "number", step: "any", inputmode: "decimal", "aria-label": problem.unit || "answer" });
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  const form = el("form", { class: "answer-form" });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parseNum(input.value);
    if (!near(value, problem.answer)) {
      if (Number.isFinite(value)) tries += 1;
      fb.className = "feedback is-wrong";
      fb.textContent = numberFeedback(problem, value, tries);
      announce(fb.textContent);
      return;
    }
    let dirOk = true;
    if (problem.dir) dirOk = form.querySelector("input[name='dir']:checked")?.value === problem.dir;
    if (!dirOk) {
      fb.className = "feedback is-wrong";
      fb.textContent = "Magnitude is right. Choose the direction of that result.";
      return;
    }
    fb.className = "feedback is-right";
    fb.textContent = "Correct. " + problem.why;
    input.disabled = true;
    store.setFlag(problem.key);
    announce(fb.textContent);
    onSolved();
  });
  form.append(el("h3", { class: "prompt" }, problem.q));
  if (problem.dir) {
    const dirs = el("div", { class: "dir-row" });
    DIRS.forEach(([id, glyph, name]) => {
      const label = el("label", { class: "dir-btn" });
      const radio = el("input", { type: "radio", name: "dir", value: id });
      radio.addEventListener("change", () => {
        dirs.querySelectorAll(".dir-btn").forEach((node) => node.classList.remove("is-on"));
        label.classList.add("is-on");
      });
      label.append(radio, el("b", { "aria-hidden": "true" }, glyph), el("span", {}, name));
      dirs.append(label);
    });
    form.append(el("p", { class: "quiet" }, "Direction"), dirs);
  }
  form.append(el("div", { class: "field" }, input, el("span", { class: "unit" }, problem.unit)), el("button", { class: "btn", type: "submit" }, "Check"), fb);
  host.append(form);
}

function mountProblemSet(host, problems, onProgress) {
  function report() {
    const solved = problems.filter((problem) => store.flag(problem.key)).length;
    onProgress(solved === problems.length ? 1 : solved / problems.length);
  }
  problems.forEach((problem) => {
    const box = cardShell();
    mountNumber(box, problem, report);
    host.append(box);
  });
  report();
}

const SVG_NS = "http://www.w3.org/2000/svg";
const DIR_VEC = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
const FBD_VIEW = { w: 600, h: 340 };
const FBD_LEN = { min: 50, max: 150, start: 90 };

const FORCE_NEED = {
  gravity: "Earth pulls on every object that has mass, so gravity is always on the diagram.",
  normal: "The surface it rests on pushes back on it.",
  applied: "Something is pushing it, so that push belongs on the diagram.",
  friction: "A rough surface resists the sliding.",
  tension: "A rope or cord is pulling on it.",
  motion: ""
};
const FORCE_AIM = {
  gravity: "Gravity always points straight down, toward Earth.",
  normal: "The normal force points away from the surface, here straight up.",
  applied: "The applied force points the way the push goes.",
  friction: "Friction points opposite the motion, against the push.",
  tension: "Tension pulls along the rope, away from the object.",
  motion: ""
};
const FORCE_NOT = {
  gravity: "",
  normal: "Nothing solid is under it to push back.",
  applied: "Nothing is pushing or pulling it.",
  friction: "Nothing is sliding or trying to slide, so there is no friction.",
  tension: "No rope or cord is attached to it.",
  motion: "“Force of motion” is not a real force. A moving object keeps moving without one."
};

function svgNode(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
  if (text != null) node.textContent = text;
  return node;
}

function gradeFbd(model, draft) {
  const messages = [];
  const off = new Set();
  const name = model.object.toLowerCase();
  if (draft.object !== model.object) messages.push("A free-body diagram isolates one object. Tap the " + name + " in the scene first.");
  model.forces.forEach((force) => {
    if (!draft.forces.has(force.id)) messages.push("Missing " + FORCE[force.id].label.toLowerCase() + ". " + FORCE_NEED[force.id]);
  });
  draft.forces.forEach((id) => {
    if (model.forces.some((force) => force.id === id)) return;
    off.add(id);
    messages.push(FORCE[id].label + " does not act on the " + name + " here. " + FORCE_NOT[id]);
  });
  model.forces.forEach((force) => {
    if (!draft.forces.has(force.id) || draft.dirs[force.id] === force.dir) return;
    off.add(force.id);
    messages.push("Your " + FORCE[force.id].label.toLowerCase() + " arrow points " + draft.dirs[force.id] + ". " + FORCE_AIM[force.id]);
  });
  const aimed = (id) => draft.forces.has(id) && !off.has(id);
  const len = (id) => draft.lens[id] || 0;
  (model.eq || []).forEach(([a, b]) => {
    if (!aimed(a) || !aimed(b)) return;
    const ratio = len(a) / len(b);
    if (ratio > 0.82 && ratio < 1.22) return;
    off.add(a);
    off.add(b);
    messages.push(FORCE[a].label + " and " + FORCE[b].label.toLowerCase() + " balance here: the " + name + " neither sinks into the surface nor lifts off it. Make those two arrows the same length.");
  });
  (model.gt || []).forEach(([a, b, why]) => {
    if (!aimed(a) || !aimed(b) || len(a) > len(b) * 1.15) return;
    off.add(a);
    messages.push(FORCE[a].label + " is bigger than " + FORCE[b].label.toLowerCase() + (why ? " (" + why + ")" : "") + ", so its arrow should be clearly longer.");
  });
  return { ok: messages.length === 0, messages: messages, off: off };
}

function fbdFraction(model, draft) {
  if (gradeFbd(model, draft).ok) return 1;
  let score = 0;
  if (draft.object === model.object) score += 0.2;
  const ids = model.forces.map((force) => force.id);
  const exact = ids.every((id) => draft.forces.has(id)) && draft.forces.size === ids.length;
  if (exact) score += 0.3;
  if (exact && model.forces.every((force) => draft.dirs[force.id] === force.dir)) score += 0.3;
  return Math.min(score, 0.95);
}

function buildFbdScene(layer, model) {
  const parts = {};
  const has = (name) => model.objects.includes(name);
  const ground = has("Table") ? 300 : 190;

  function part(name) {
    const g = svgNode("g", { class: "fbd-part", tabindex: "0", role: "button", "aria-label": name, "data-part": name });
    parts[name] = g;
    layer.append(g);
    return g;
  }
  function tag(g, x, y, text, anchor) {
    g.append(svgNode("text", { class: "fbd-tag", x: x, y: y, "text-anchor": anchor || "start" }, text));
  }

  if (has("Earth")) {
    const g = part("Earth");
    g.append(
      svgNode("circle", { class: "fbd-shape", cx: 546, cy: 64, r: 34, fill: "#cfe3dc", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("ellipse", { cx: 546, cy: 64, rx: 14, ry: 34, fill: "none", stroke: "#0f6e6a", "stroke-width": 1.5, opacity: 0.6 }),
      svgNode("line", { x1: 512, y1: 64, x2: 580, y2: 64, stroke: "#0f6e6a", "stroke-width": 1.5, opacity: 0.6 })
    );
    tag(g, 546, 116, "Earth", "middle");
  }
  if (has("Floor")) {
    const g = part("Floor");
    g.append(svgNode("rect", { class: "fbd-shape", x: 0, y: ground, width: FBD_VIEW.w, height: FBD_VIEW.h - ground, fill: "#e7ddcc" }));
    g.append(svgNode("line", { x1: 0, y1: ground, x2: FBD_VIEW.w, y2: ground, stroke: "#1c2a24", "stroke-width": 3 }));
    for (let x = 14; x < FBD_VIEW.w + 14; x += 18) {
      g.append(svgNode("line", { x1: x, y1: ground, x2: x - 12, y2: ground + 12, stroke: "#1c2a24", "stroke-width": 1.5, opacity: 0.45 }));
    }
    tag(g, 20, ground + 34, "Floor");
  }
  if (has("Table")) {
    const g = part("Table");
    g.append(
      svgNode("rect", { class: "fbd-shape", x: 150, y: 190, width: 300, height: 13, rx: 3, fill: "#c9a77c", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("rect", { x: 172, y: 203, width: 12, height: 97, fill: "#b38f63", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("rect", { x: 416, y: 203, width: 12, height: 97, fill: "#b38f63", stroke: "#1c2a24", "stroke-width": 2 })
    );
    tag(g, 462, 222, "Table");
  }
  if (has("Person")) {
    const g = part("Person");
    const limb = { stroke: "#1c2a24", "stroke-width": 5, "stroke-linecap": "round", fill: "none" };
    g.append(
      svgNode("circle", { class: "fbd-shape", cx: 172, cy: 74, r: 14, fill: "#e7b991", stroke: "#1c2a24", "stroke-width": 2.5 }),
      svgNode("line", Object.assign({ x1: 178, y1: 89, x2: 196, y2: 142 }, limb)),
      svgNode("line", Object.assign({ x1: 196, y1: 142, x2: 176, y2: 190 }, limb)),
      svgNode("line", Object.assign({ x1: 196, y1: 142, x2: 220, y2: 190 }, limb)),
      svgNode("line", Object.assign({ x1: 184, y1: 104, x2: 256, y2: 156 }, limb)),
      svgNode("line", Object.assign({ x1: 186, y1: 110, x2: 256, y2: 170 }, limb))
    );
    tag(g, 118, 52, "Person");
  }
  if (has("Hand")) {
    const g = part("Hand");
    g.append(
      svgNode("rect", { class: "fbd-shape", x: 96, y: 155, width: 136, height: 20, rx: 10, fill: "#31457a", stroke: "#1c2a24", "stroke-width": 2 }),
      svgNode("ellipse", { cx: 242, cy: 165, rx: 18, ry: 14, fill: "#e7b991", stroke: "#1c2a24", "stroke-width": 2 })
    );
    tag(g, 100, 144, "Hand");
  }

  const g = part(model.object);
  if (model.object === "Book") {
    g.append(
      svgNode("rect", { class: "fbd-cut", x: 241, y: 147, width: 118, height: 56, rx: 10 }),
      svgNode("rect", { class: "fbd-shape", x: 255, y: 160, width: 90, height: 30, rx: 4, fill: "#9d4034", stroke: "#1c2a24", "stroke-width": 3 }),
      svgNode("rect", { x: 262, y: 166, width: 76, height: 7, rx: 2, fill: "#fffaf3", opacity: 0.85 })
    );
    tag(g, 300, 186, "BOOK", "middle");
  } else {
    g.append(
      svgNode("rect", { class: "fbd-cut", x: 246, y: 127, width: 108, height: 76, rx: 12 }),
      svgNode("rect", { class: "fbd-shape", x: 260, y: 140, width: 80, height: 50, rx: 6, fill: "#fffaf3", stroke: "#1c2a24", "stroke-width": 3 }),
      svgNode("line", { x1: 260, y1: 157, x2: 340, y2: 157, stroke: "#1c2a24", opacity: 0.25 }),
      svgNode("line", { x1: 260, y1: 173, x2: 340, y2: 173, stroke: "#1c2a24", opacity: 0.25 })
    );
    tag(g, 300, 186, model.object.toUpperCase(), "middle");
  }
  g.classList.add("is-target");
  return { parts: parts, center: { x: 300, y: model.object === "Book" ? 175 : 165 } };
}

function mountFbd(host, model, onProgress) {
  const draft = { object: null, forces: new Set(), dirs: {}, lens: {} };
  const objectName = model.object.toLowerCase();
  let solved = false;
  let drag = null;
  let dragMoved = false;
  let lastTap = { id: null, at: 0 };
  let touched = false;
  let fresh = null;
  let refocus = null;
  let activeForce = null;
  let flagged = new Set();

  const compactCanvas = window.matchMedia("(max-width: 560px)").matches;
  const canvasView = compactCanvas ? { x: 70, y: 0, w: 460, h: 340 } : { x: 0, y: 0, w: FBD_VIEW.w, h: FBD_VIEW.h };
  const svg = svgNode("svg", {
    viewBox: canvasView.x + " " + canvasView.y + " " + canvasView.w + " " + canvasView.h,
    class: "fbd-svg",
    role: "group",
    "aria-label": "Free-body diagram canvas"
  });
  const sceneLayer = svgNode("g", { class: "fbd-scene" });
  const guide = svgNode("g", { class: "fbd-guide", "aria-hidden": "true" });
  const arrowLayer = svgNode("g", { class: "fbd-arrows" });
  const stamp = svgNode("g", { class: "fbd-stamp", "aria-hidden": "true" });
  svg.append(sceneLayer, guide, arrowLayer, stamp);
  const scene = buildFbdScene(sceneLayer, model);
  const C = scene.center;

  guide.append(
    svgNode("circle", { cx: C.x, cy: C.y, r: FBD_LEN.max, fill: "none" }),
    svgNode("circle", { cx: C.x, cy: C.y, r: FBD_LEN.min, fill: "none" }),
    svgNode("line", { x1: C.x - FBD_LEN.max - 10, y1: C.y, x2: C.x + FBD_LEN.max + 10, y2: C.y }),
    svgNode("line", { x1: C.x, y1: C.y - FBD_LEN.max - 10, x2: C.x, y2: C.y + FBD_LEN.max + 10 })
  );
  stamp.append(
    svgNode("rect", { x: -78, y: -20, width: 156, height: 40, rx: 8 }),
    svgNode("text", { x: 0, y: 7, "text-anchor": "middle" }, "FREE BODY ✓")
  );
  stamp.setAttribute("transform", "translate(492 44) rotate(-7)");

  const tip = el("p", { class: "fbd-tip", "aria-live": "polite" });
  const coachStep = el("strong", { class: "fbd-coach__step" });
  const coach = el("div", { class: "fbd-coach", role: "status" }, coachStep, tip);
  const stage = el("div", { class: "stage fbd-stage" }, svg);

  const stepNames = ["Isolate", "Add forces", "Aim & size", "Check"];
  const steps = el("ol", { class: "fbd-steps" }, stepNames.map((name) => el("li", {}, el("span", {}, name))));

  const tray = el("div", { class: "fbd-tray" });
  const chips = {};
  model.catalog.forEach((id) => {
    const chip = el("button", { class: "fbd-chip", type: "button", "aria-pressed": "false" },
      el("i", { class: "fbd-chip__glyph", "aria-hidden": "true" }),
      el("span", {}, FORCE[id].label),
      el("small", {}, FORCE[id].symbol)
    );
    chip.style.setProperty("--c", FORCE[id].color);
    wireChip(chip, id);
    chips[id] = chip;
    tray.append(chip);
  });

  const editorName = el("strong", { class: "fbd-editor__name" }, "No arrow selected");
  const editorHint = el("span", { class: "fbd-editor__hint" }, "Tap a force chip to add an arrow.");
  const directionButtons = {};
  const directionRow = el("div", { class: "fbd-editor__directions" });
  DIRS.forEach(([dir, glyph, name]) => {
    const button = el("button", { type: "button", "aria-label": "Point selected arrow " + name }, glyph);
    button.addEventListener("click", () => adjustDirection(dir));
    directionButtons[dir] = button;
    directionRow.append(button);
  });
  const shorter = el("button", { type: "button" }, "− Shorter");
  const longer = el("button", { type: "button" }, "+ Longer");
  const remove = el("button", { class: "fbd-editor__remove", type: "button" }, "Remove");
  shorter.addEventListener("click", () => resizeActive(-15));
  longer.addEventListener("click", () => resizeActive(15));
  remove.addEventListener("click", () => { if (activeForce) removeForce(activeForce); });
  const editor = el("div", { class: "fbd-editor" },
    el("div", { class: "fbd-editor__title" }, editorName, editorHint),
    directionRow,
    el("div", { class: "fbd-editor__sizes" }, shorter, longer, remove)
  );

  const compass = svgNode("svg", { viewBox: "-70 -70 140 140", class: "fbd-compass", "aria-hidden": "true" });
  const netRows = el("div", { class: "fbd-net__rows" });
  const netVerdict = el("p", { class: "fbd-net__verdict" });
  const net = el("div", { class: "fbd-net" }, el("p", { class: "kicker" }, "Net force"), el("div", { class: "fbd-net__body" }, compass, netRows), netVerdict);

  const feedback = el("div", { class: "feedback fbd-feedback", "aria-live": "polite" });
  const check = el("button", { class: "btn", type: "button" }, "Check FBD");
  const clear = el("button", { class: "btn btn--ghost", type: "button" }, "Clear arrows");

  host.append(
    el("p", { class: "fbd-situation" }, model.situation),
    steps,
    coach,
    el("div", { class: "fbd" },
      el("div", { class: "fbd-workbench" }, stage, editor),
      el("div", { class: "fbd-side" },
        el("p", { class: "kicker" }, "Force tray"),
        el("p", { class: "fbd-tray__help" }, compactCanvas
          ? "Tap a force to add or remove it."
          : "Tap a force to add or remove it. You can also drag it onto the diagram."),
        tray,
        net
      )
    ),
    el("div", { class: "btn-row" }, check, clear),
    feedback
  );

  function isolated() { return draft.object === model.object; }

  function adjustDirection(dir) {
    if (!activeForce || solved) return;
    draft.dirs[activeForce] = dir;
    touched = true;
    edited();
  }

  function resizeActive(amount) {
    if (!activeForce || solved) return;
    draft.lens[activeForce] = Math.max(FBD_LEN.min, Math.min(FBD_LEN.max, draft.lens[activeForce] + amount));
    touched = true;
    edited();
  }

  function toSvg(event) {
    const box = svg.getBoundingClientRect();
    return {
      x: canvasView.x + (event.clientX - box.left) * canvasView.w / box.width,
      y: canvasView.y + (event.clientY - box.top) * canvasView.h / box.height
    };
  }

  function aimFrom(point) {
    const dx = point.x - C.x;
    const dy = point.y - C.y;
    const dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : (dy >= 0 ? "down" : "up");
    const len = Math.max(FBD_LEN.min, Math.min(FBD_LEN.max, Math.hypot(dx, dy)));
    return { dir: dir, len: len, near: Math.hypot(dx, dy) };
  }

  function freeDir() {
    const used = [...draft.forces].map((id) => draft.dirs[id]);
    return ["right", "up", "left", "down"].find((dir) => !used.includes(dir)) || "right";
  }

  function nudge(text) {
    tip.textContent = text;
    stage.classList.remove("is-nudge");
    void stage.offsetWidth;
    stage.classList.add("is-nudge");
  }

  function choose(name) {
    if (solved || isolated()) return;
    draft.object = name;
    if (name === model.object) {
      svg.classList.add("is-isolated");
      scene.parts[name].classList.add("is-object");
      feedback.className = "feedback fbd-feedback";
      feedback.textContent = "";
      announce("The " + objectName + " is cut free from its surroundings. Now add the forces on it.");
    } else {
      const g = scene.parts[name];
      g.classList.remove("is-wrongpick");
      void g.getBoundingClientRect();
      g.classList.add("is-wrongpick");
      feedback.className = "feedback fbd-feedback is-wrong";
      feedback.textContent = "The " + name.toLowerCase() + " is part of the surroundings. It pushes or pulls on the object, but it is not the object this question is about. Read the situation again.";
      announce(feedback.textContent);
    }
    edited(true);
  }

  Object.keys(scene.parts).forEach((name) => {
    const g = scene.parts[name];
    g.addEventListener("click", () => choose(name));
    g.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(name);
      }
    });
  });

  function addForce(id, aim) {
    if (solved) return;
    if (!isolated()) {
      nudge("Isolate first: tap the " + objectName + " in the scene.");
      return;
    }
    draft.forces.add(id);
    draft.dirs[id] = aim ? aim.dir : freeDir();
    draft.lens[id] = aim ? aim.len : FBD_LEN.start;
    activeForce = id;
    fresh = id;
    edited();
  }

  function removeForce(id) {
    if (solved) return;
    draft.forces.delete(id);
    delete draft.dirs[id];
    delete draft.lens[id];
    if (activeForce === id) activeForce = null;
    edited();
  }

  function wireChip(chip, id) {
    chip.style.touchAction = "none";
    let ghost = null;
    let moved = false;
    let start = null;
    chip.addEventListener("pointerdown", (event) => {
      if (solved) return;
      moved = false;
      start = { x: event.clientX, y: event.clientY };
      chip.setPointerCapture(event.pointerId);
    });
    chip.addEventListener("pointermove", (event) => {
      if (!start) return;
      if (!moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
        moved = true;
        ghost = el("div", { class: "fbd-ghost" }, FORCE[id].symbol);
        ghost.style.setProperty("--c", FORCE[id].color);
        document.body.append(ghost);
        stage.classList.add("is-drop");
      }
      if (ghost) {
        ghost.style.left = event.clientX + "px";
        ghost.style.top = event.clientY + "px";
      }
    });
    function finish(event, cancelled) {
      if (!start) return;
      start = null;
      stage.classList.remove("is-drop");
      if (ghost) ghost.remove();
      ghost = null;
      if (cancelled) return;
      if (!moved) {
        if (draft.forces.has(id)) removeForce(id);
        else addForce(id);
        return;
      }
      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (!under || !stage.contains(under)) return;
      const aim = aimFrom(toSvg(event));
      if (aim.near < 30) aim.dir = draft.dirs[id] || freeDir();
      touched = touched || aim.near >= 30;
      addForce(id, aim);
    }
    chip.addEventListener("pointerup", (event) => finish(event, false));
    chip.addEventListener("pointercancel", (event) => finish(event, true));
  }

  svg.addEventListener("pointermove", (event) => {
    if (!drag || solved) return;
    const aim = aimFrom(toSvg(event));
    if (aim.dir === draft.dirs[drag] && Math.abs(aim.len - draft.lens[drag]) < 2) return;
    dragMoved = true;
    draft.dirs[drag] = aim.dir;
    draft.lens[drag] = aim.len;
    renderArrows();
    paintNet();
  });
  function endHandleDrag() {
    if (!drag) return;
    drag = null;
    svg.classList.remove("is-dragging");
    if (!dragMoved) return;
    lastTap = { id: null, at: 0 };
    touched = true;
    edited();
  }
  svg.addEventListener("pointerup", endHandleDrag);
  svg.addEventListener("pointercancel", endHandleDrag);

  function renderArrows() {
    while (arrowLayer.firstChild) arrowLayer.removeChild(arrowLayer.firstChild);
    draft.forces.forEach((id) => {
      const [vx, vy] = DIR_VEC[draft.dirs[id]];
      const len = draft.lens[id];
      const ex = C.x + vx * len;
      const ey = C.y + vy * len;
      const px = -vy;
      const py = vx;
      const color = FORCE[id].color;
      const g = svgNode("g", { class: "fbd-arrow" + (flagged.has(id) ? " is-off" : "") + (fresh === id ? " is-new" : "") });
      g.style.color = color;
      g.addEventListener("click", () => {
        if (solved) return;
        activeForce = id;
        paintEditor();
        paintChips();
      });
      g.append(
        svgNode("line", { class: "fbd-arrow__hit", x1: C.x, y1: C.y, x2: ex, y2: ey, stroke: "transparent", "stroke-width": 28, "stroke-linecap": "round" }),
        svgNode("line", { class: "fbd-arrow__shaft", x1: C.x, y1: C.y, x2: ex - vx * 14, y2: ey - vy * 14, stroke: color, "stroke-width": 6, "stroke-linecap": "round" }),
        svgNode("polygon", { points: ex + "," + ey + " " + (ex - vx * 20 + px * 10) + "," + (ey - vy * 20 + py * 10) + " " + (ex - vx * 20 - px * 10) + "," + (ey - vy * 20 - py * 10), fill: color }),
        svgNode("text", { class: "fbd-arrow__label", x: ex + vx * 30, y: ey + vy * 30 + 6, "text-anchor": "middle", fill: color }, FORCE[id].symbol)
      );
      const handle = svgNode("circle", {
        class: "fbd-handle", cx: ex, cy: ey, r: 23, fill: color, stroke: color,
        tabindex: "0", role: "slider", "data-id": id,
        "aria-label": FORCE[id].label + " arrow, pointing " + draft.dirs[id] + ". Arrow keys aim, plus and minus resize, Delete removes."
      });
      handle.addEventListener("pointerdown", (event) => {
        if (solved) return;
        event.preventDefault();
        activeForce = id;
        paintEditor();
        paintChips();
        const now = Date.now();
        if (lastTap.id === id && now - lastTap.at < 350) {
          lastTap = { id: null, at: 0 };
          removeForce(id);
          return;
        }
        lastTap = { id: id, at: now };
        drag = id;
        dragMoved = false;
        fresh = null;
        svg.classList.add("is-dragging");
        svg.setPointerCapture(event.pointerId);
      });
      handle.addEventListener("keydown", (event) => {
        if (solved) return;
        const turn = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
        if (turn) draft.dirs[id] = turn;
        else if (event.key === "+" || event.key === "=") draft.lens[id] = Math.min(FBD_LEN.max, draft.lens[id] + 10);
        else if (event.key === "-" || event.key === "_") draft.lens[id] = Math.max(FBD_LEN.min, draft.lens[id] - 10);
        else if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          removeForce(id);
          return;
        } else return;
        event.preventDefault();
        touched = true;
        refocus = id;
        edited();
      });
      g.append(handle);
      arrowLayer.append(g);
    });
    if (isolated()) arrowLayer.append(svgNode("circle", { class: "fbd-dot", cx: C.x, cy: C.y, r: 5 }));
    if (refocus) {
      const target = arrowLayer.querySelector('[data-id="' + refocus + '"]');
      if (target) target.focus();
      refocus = null;
    }
  }

  function paintNet() {
    let sx = 0;
    let sy = 0;
    let hx = 0;
    let hy = 0;
    draft.forces.forEach((id) => {
      const [vx, vy] = DIR_VEC[draft.dirs[id]];
      sx += vx * draft.lens[id];
      sy += vy * draft.lens[id];
      hx = Math.max(hx, Math.abs(vx) * draft.lens[id]);
      hy = Math.max(hy, Math.abs(vy) * draft.lens[id]);
    });
    const flatX = Math.abs(sx) <= Math.max(6, hx * 0.15);
    const flatY = Math.abs(sy) <= Math.max(6, hy * 0.15);
    function row(glyph, size, flat, plus, minus, value) {
      const text = !size ? "none" : (flat ? "balanced" : "net " + (value > 0 ? plus : minus));
      return el("p", { class: "fbd-net__row" + (size && !flat ? " is-net" : "") }, el("b", {}, glyph), " " + text);
    }
    netRows.replaceChildren(
      row("↔", hx, flatX, "right", "left", sx),
      row("↕", hy, flatY, "down", "up", sy)
    );
    while (compass.firstChild) compass.removeChild(compass.firstChild);
    compass.append(
      svgNode("circle", { cx: 0, cy: 0, r: 56, class: "fbd-compass__ring" }),
      svgNode("circle", { cx: 0, cy: 0, r: 28, class: "fbd-compass__ring" }),
      svgNode("line", { x1: -60, y1: 0, x2: 60, y2: 0, class: "fbd-compass__ring" }),
      svgNode("line", { x1: 0, y1: -60, x2: 0, y2: 60, class: "fbd-compass__ring" })
    );
    const nx = flatX ? 0 : sx;
    const ny = flatY ? 0 : sy;
    const mag = Math.hypot(nx, ny);
    if (!draft.forces.size) {
      netVerdict.textContent = "Add forces to see where they push the " + objectName + " overall.";
    } else if (!mag) {
      compass.append(svgNode("circle", { cx: 0, cy: 0, r: 7, class: "fbd-compass__zero" }));
      netVerdict.textContent = "Net force ≈ 0. The forces cancel, so the velocity stays the same (first law).";
    } else {
      const k = Math.min(52, 14 + mag * 0.35) / mag;
      const tx = nx * k;
      const ty = ny * k;
      const ux = nx / mag;
      const uy = ny / mag;
      compass.append(
        svgNode("line", { x1: 0, y1: 0, x2: tx - ux * 10, y2: ty - uy * 10, class: "fbd-compass__arrow" }),
        svgNode("polygon", { points: tx + "," + ty + " " + (tx - ux * 14 - uy * 7) + "," + (ty - uy * 14 + ux * 7) + " " + (tx - ux * 14 + uy * 7) + "," + (ty - uy * 14 - ux * 7), class: "fbd-compass__head" })
      );
      const way = [flatX ? "" : (sx > 0 ? "right" : "left"), flatY ? "" : (sy > 0 ? "down" : "up")].filter(Boolean).join(" and ");
      netVerdict.textContent = "Unbalanced: the net force points " + way + ", so the " + objectName + " accelerates " + way + " (second law).";
    }
  }

  function paintSteps() {
    const done = [isolated(), draft.forces.size > 0, touched || draft.forces.size >= model.forces.length, solved];
    const current = done.indexOf(false);
    [...steps.children].forEach((li, index) => {
      li.classList.toggle("is-done", done[index]);
      li.classList.toggle("is-on", index === current);
    });
    coachStep.textContent = solved ? "Complete" : "Step " + ((current < 0 ? 3 : current) + 1) + " of 4";
    if (solved) tip.textContent = "Diagram locked in. Every force on the " + objectName + " is drawn, aimed, and sized.";
    else if (!isolated()) tip.textContent = "Tap the object the question is about to cut it free from its surroundings.";
    else if (!draft.forces.size) tip.textContent = "Tap each force acting on the " + objectName + ". An arrow appears automatically.";
    else tip.textContent = compactCanvas
      ? "Tap an arrow, then use the large direction and size buttons below the diagram."
      : "Drag the round handle, or tap an arrow and use the direction and size buttons below.";
  }

  function paintEditor() {
    const ready = activeForce && draft.forces.has(activeForce);
    editor.classList.toggle("is-ready", !!ready);
    editorName.textContent = ready ? "Adjust " + FORCE[activeForce].label : "Adjust an arrow";
    editorName.style.color = ready ? FORCE[activeForce].color : "";
    editorHint.textContent = ready
      ? "Points " + draft.dirs[activeForce] + " · " + Math.round(draft.lens[activeForce]) + " strength"
      : "Tap a force chip or arrow first.";
    Object.keys(directionButtons).forEach((dir) => {
      directionButtons[dir].disabled = !ready || solved;
      directionButtons[dir].classList.toggle("is-on", !!ready && draft.dirs[activeForce] === dir);
    });
    shorter.disabled = !ready || solved || draft.lens[activeForce] <= FBD_LEN.min;
    longer.disabled = !ready || solved || draft.lens[activeForce] >= FBD_LEN.max;
    remove.disabled = !ready || solved;
  }

  function paintChips() {
    tray.classList.toggle("is-locked", !isolated() || solved);
    Object.keys(chips).forEach((id) => {
      const on = draft.forces.has(id);
      chips[id].classList.toggle("is-on", on);
      chips[id].classList.toggle("is-editing", on && activeForce === id);
      chips[id].setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function paint() {
    renderArrows();
    paintNet();
    paintSteps();
    paintEditor();
    paintChips();
    fresh = null;
  }

  function edited(keepFeedback) {
    flagged = new Set();
    if (!keepFeedback && !solved) {
      feedback.className = "feedback fbd-feedback";
      feedback.textContent = "";
    }
    if (!solved) onProgress(Math.min(0.95, fbdFraction(model, draft)));
    paint();
  }

  check.addEventListener("click", () => {
    if (solved) return;
    const result = gradeFbd(model, draft);
    flagged = result.off;
    feedback.replaceChildren();
    if (result.ok) {
      solved = true;
      svg.classList.add("is-solved");
      feedback.className = "feedback fbd-feedback is-right";
      feedback.append(el("strong", {}, "Correct! "), "Every force on the " + objectName + " is there, each arrow points the right way, and the sizes match the situation.");
      onProgress(1);
    } else {
      feedback.className = "feedback fbd-feedback is-wrong";
      const count = result.messages.length;
      feedback.append(el("strong", {}, count === 1 ? "One thing to fix. " : count + " things to fix. "), result.messages[0]);
      if (count > 1) feedback.append(el("ul", {}, result.messages.slice(1).map((message) => el("li", {}, message))));
      if (flagged.size) feedback.append(el("p", { class: "quiet" }, "Arrows that need work are ringed in red."));
      stage.classList.remove("is-nudge");
      void stage.offsetWidth;
      stage.classList.add("is-nudge");
      onProgress(fbdFraction(model, draft));
    }
    announce(feedback.textContent);
    paint();
  });

  clear.addEventListener("click", () => {
    if (solved) return;
    draft.forces.clear();
    draft.dirs = {};
    draft.lens = {};
    activeForce = null;
    touched = false;
    edited();
  });

  paint();
}

function simArt(force, mass) {
  const width = 46 + mass * 3;
  const accel = force / mass;
  const arrow = Math.min(160, force * 3);
  const run = Math.min(200, accel * 18);
  return svgMarkup("0 0 360 180",
    '<line x1="20" y1="120" x2="340" y2="120" stroke="#1c2a24" stroke-width="3"/>' +
    '<rect x="70" y="' + (120 - width) + '" width="' + width + '" height="' + width + '" rx="6" fill="#fffaf3" stroke="#1c2a24" stroke-width="3"/>' +
    '<text x="' + (70 + width / 2) + '" y="' + (120 - width / 2) + '" text-anchor="middle" font-size="14" font-weight="700">' + mass + " kg</text>" +
    '<line x1="' + (70 + width) + '" y1="' + (120 - width / 2) + '" x2="' + (70 + width + arrow) + '" y2="' + (120 - width / 2) + '" stroke="#c05622" stroke-width="6" stroke-linecap="round"/>' +
    '<text x="' + (78 + width) + '" y="' + (108 - width / 2) + '" fill="#c05622" font-size="14" font-weight="700">F = ' + force + " N</text>" +
    '<line x1="70" y1="146" x2="' + (70 + run) + '" y2="146" stroke="#31457a" stroke-width="6" stroke-linecap="round"/>' +
    '<text x="70" y="168" fill="#31457a" font-size="14" font-weight="700">a = ' + accel.toFixed(2) + " m/s²</text>"
  );
}

function mountSim(host, onProgress) {
  const force = el("input", { class: "slider", type: "range", min: "0", max: "40", value: "10" });
  const mass = el("input", { class: "slider", type: "range", min: "1", max: "20", value: "5" });
  const stage = el("div", { class: "sim" });
  const readout = el("div", { class: "readout" });
  let moved = store.flag("s2moved");
  function paint() {
    const f = Number(force.value);
    const m = Number(mass.value);
    stage.replaceChildren(simArt(f, m));
    readout.textContent = "";
    readout.append(el("span", {}, "F = " + f + " N"));
    readout.append(el("span", {}, "m = " + m + " kg"));
    readout.append(el("span", {}, "a = " + (f / m).toFixed(2)));
  }
  function markMoved() {
    moved = true;
    if (!store.flag("s2moved")) store.setFlag("s2moved");
    paint();
    if (store.flag("s2e1") && store.flag("s2e2")) onProgress(1);
  }
  force.addEventListener("input", markMoved);
  mass.addEventListener("input", markMoved);
  host.append(
    el("label", {}, "Force (N)", force),
    el("label", {}, "Mass (kg)", mass),
    readout,
    stage,
    el("p", { class: "quiet" }, "Doubling the force doubles the acceleration. Doubling the mass cuts the acceleration in half. A zero net force means zero acceleration.")
  );
  const checks = el("div");
  mountProblemSet(checks, [
    { key: "s2e1", q: "Set the sliders, or just calculate: mass is 5 kg and the net force is 20 N. What is the acceleration?", answer: 4, unit: "m/s²", hint: "Acceleration is force shared out over mass, so divide the force by the mass.", why: "a = 20 / 5 = 4 m/s².",
      explain: "Newton's second law says F = ma. To find a, divide both sides by m: a = F / m = 20 N ÷ 5 kg = 4 m/s². Every kilogram gets 4 N of the push.",
      mistakes: [
        { value: 100, msg: "You multiplied 20 × 5. Multiplying gives force (F = ma), but here the force is already known. To get acceleration, divide the force by the mass." },
        { value: 0.25, msg: "You divided mass by force (5 ÷ 20). It is the other way round: a = F / m, so the force goes on top." },
        { value: 15, msg: "You subtracted 20 − 5. Force and mass are different kinds of quantity, so they can't be subtracted. Use a = F / m." },
        { value: 25, msg: "You added 20 + 5. Force and mass are different kinds of quantity, so they can't be added. Use a = F / m." }
      ] },
    { key: "s2e2", q: "Keep the force at 20 N and double only the mass to 10 kg. What is the new acceleration?", answer: 2, unit: "m/s²", hint: "A heavier object is harder to speed up. With the same force, more mass means less acceleration.", why: "a = 20 / 10 = 2 m/s².",
      explain: "a = F / m = 20 N ÷ 10 kg = 2 m/s². The mass doubled from 5 kg to 10 kg, so the acceleration halved from 4 to 2 m/s².",
      mistakes: [
        { value: 8, msg: "You doubled the acceleration. Doubling the mass makes the object harder to accelerate, so the acceleration gets smaller, not bigger." },
        { value: 4, msg: "That is the old answer for 5 kg. The mass is now 10 kg, so the same 20 N is spread over twice the mass." },
        { value: 200, msg: "You multiplied 20 × 10. That would be a force, not an acceleration. Divide the force by the mass." },
        { value: 0.5, msg: "You divided mass by force (10 ÷ 20). Put the force on top: a = F / m." }
      ] }
  ], (value) => {
    if (store.task(2, "explore") >= 1) return;
    const slid = moved || store.flag("s2moved");
    if (value >= 1 && slid) onProgress(1);
    else if (value >= 1) onProgress(0.85);
    else onProgress(value * 0.8);
    if (value >= 1 && !slid) {
      const note = checks.querySelector(".need-move") || el("p", { class: "quiet need-move" });
      note.textContent = "Move both sliders once so the diagram is part of the explore, then this part locks in.";
      checks.append(note);
    }
  });
  host.append(checks);
  paint();
}

function mountPairs(host, onDone) {
  const pairs = [
    ["Person pushes wall", "Wall pushes person"],
    ["Foot pushes ground backward", "Ground pushes foot forward"],
    ["Swimmer pushes water backward", "Water pushes swimmer forward"],
    ["Legs push Earth down in a jump", "Earth pushes the person up"],
    ["Foot pushes the ball", "Ball pushes the foot back"]
  ];
  const order = pairs.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  let pick = null;
  let matched = 0;
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  const left = el("div");
  const right = el("div");
  if (store.flag("s3match")) {
    host.append(el("p", { class: "feedback is-right" }, "All five pairs are matched. Each force acts on a different object."));
    onDone();
    return;
  }
  pairs.forEach((pair, index) => {
    const button = el("button", { class: "choice", type: "button" }, pair[0]);
    button.addEventListener("click", () => {
      if (button.disabled) return;
      left.querySelectorAll(".choice").forEach((node) => node.classList.remove("is-pick"));
      pick = button;
      button.classList.add("is-pick");
      button.dataset.index = String(index);
    });
    left.append(button);
  });
  order.forEach((index) => {
    const button = el("button", { class: "choice", type: "button" }, pairs[index][1]);
    button.addEventListener("click", () => {
      if (!pick || button.disabled) {
        fb.className = "feedback is-wrong";
        fb.textContent = "Choose the action on the left first.";
        return;
      }
      if (pick.dataset.index === String(index)) {
        pick.disabled = true;
        button.disabled = true;
        pick.classList.remove("is-pick");
        pick.classList.add("is-right");
        button.classList.add("is-right");
        pick = null;
        matched += 1;
        fb.className = "feedback is-right";
        fb.textContent = matched === pairs.length ? "All pairs matched. The two forces are equal and act on different objects." : "Matched.";
        if (matched === pairs.length) {
          store.setFlag("s3match");
          onDone();
        }
      } else {
        fb.className = "feedback is-wrong";
        fb.textContent = "Those two are not a pair. Look for the force on the other object.";
      }
      announce(fb.textContent);
    });
    right.append(button);
  });
  host.append(el("p", {}, "Pick an action on the left, then its reaction on the right."), el("div", { class: "pair" }, left, right), fb);
}

function mountScenarios(host, items, onProgress, sceneNav) {
  function situationDone(item) {
    return store.flag(item.key) && (!item.follow || store.flag(item.follow.key));
  }
  let cursor = items.findIndex((item) => !situationDone(item));
  if (cursor < 0) cursor = 0;
  const box = el("div");
  const dots = el("div", { class: "q-top" });
  host.append(dots, box);

  function report() {
    if (sceneNav) {
      sceneNav.active = true;
      sceneNav.index = cursor;
      sceneNav.total = items.length;
      sceneNav.stepReady = situationDone(items[cursor]);
      sceneNav.allDone = items.every(situationDone);
    }
    const solved = items.filter(situationDone).length;
    onProgress(solved === items.length ? 1 : solved / items.length);
  }

  function show() {
    dots.textContent = "Situation " + (cursor + 1) + " of " + items.length;
    box.replaceChildren();
    const item = items[cursor];
    if (item.scene) box.append(figure(item.scene));
    box.append(el("p", { class: "kicker" }, item.title));
    const beat = el("div");
    box.append(beat);
    const second = item.follow;
    mountFormative(beat, item, () => {
      if (!second) {
        report();
        return;
      }
      const nextBeat = el("div");
      box.append(nextBeat);
      mountFormative(nextBeat, second, () => report());
    });
    report();
  }

  if (sceneNav) {
    sceneNav.goNext = () => {
      if (cursor >= items.length - 1 || !situationDone(items[cursor])) return;
      cursor += 1;
      show();
      window.scrollTo(0, 0);
    };
    sceneNav.goPrev = () => {
      if (cursor <= 0) return;
      cursor -= 1;
      show();
      window.scrollTo(0, 0);
    };
  }
  show();
}

function recordQuiz(session, key, score, total, passed) {
  const ratio = score / total;
  const bestKey = session + "." + key;
  const prev = store.data.best[bestKey] || 0;
  store.data.best[bestKey] = Math.max(prev, ratio);
  store.setTask(session, key, passed ? 1 : ratio);
  if ((store.data.best[bestKey] || 0) !== prev) store.save();
}

const QUIZ_1 = [
  { q: "What happens to an object when the net force acting on it is zero?", choices: ["It must accelerate", "It remains at rest or moves at constant velocity", "It changes direction", "It stops immediately"], answer: 1, why: "Zero net force means the velocity does not change. Rest is just constant velocity of zero." },
  { q: "Inertia is best described as…", choices: ["A force that keeps objects moving", "The tendency to resist changes in motion", "Another name for weight", "The push from friction"], answer: 1, why: "Inertia is a property of matter, not a force you draw on a diagram." },
  { q: "A book rests on a table. Which description of the forces on the book is right?", choices: ["Only gravity acts, because the book is still", "Gravity pulls down and the table pushes up harder", "Gravity down and the normal force up balance", "No forces act on a resting object"], answer: 2, why: "Both forces act on the book. They are equal and opposite, so the net force is zero." },
  { q: "A passenger moves forward when a bus suddenly stops. Why?", choices: ["The brakes push the passenger forward", "Inertia keeps the passenger moving at the old velocity", "Gravity pulls the passenger toward the front", "The seat pulls the passenger forward"], answer: 1, why: "The bus slows because of a force on the bus. The passenger keeps going until a force, such as a seatbelt, acts on the passenger." },
  { q: "A puck glides in a straight line at constant speed on very smooth ice. The net force on the puck is…", choices: ["Forward, to keep it moving", "Backward, because ice is cold", "Zero", "Equal to its weight"], answer: 2, why: "Constant velocity is the first-law clue: the net force is zero." },
  { q: "Which situation has an unbalanced force?", choices: ["A parked bicycle", "A book resting on a desk", "A hockey puck slowing as it slides on rough ice", "A spacecraft coasting with engines off in deep space"], answer: 2, why: "The puck’s speed changes, so the net force is not zero. Rough ice supplies friction." },
  { q: "A moving cart has all forces balanced. What does it do next?", choices: ["It stops at once", "It keeps the same velocity", "It must speed up", "It must turn"], answer: 1, why: "Balanced forces mean zero net force, so the velocity stays as it is." },
  { q: "A seatbelt is useful in a sudden stop because…", choices: ["It removes the passenger’s inertia", "It supplies the force that changes the passenger’s motion", "It cancels gravity", "It makes the car’s net force zero"], answer: 1, why: "Without a force on the passenger, the passenger continues forward while the car slows." }
];

const QUIZ_2 = [
  { q: "Newton’s second law is written…", choices: ["F = m / a", "F = ma", "a = mF", "m = a / F"], answer: 1, why: "Net force equals mass times acceleration." },
  { q: "The same net force is applied to a heavier object. Its acceleration…", choices: ["Increases", "Decreases", "Stays the same", "Becomes the mass"], answer: 1, why: "a = F / m, so a larger mass gives a smaller acceleration." },
  { q: "If the net force on an object triples and the mass stays the same, the acceleration…", choices: ["Triples", "Drops to one third", "Stays the same", "Becomes zero"], answer: 0, why: "Acceleration is proportional to net force." },
  { q: "A 4 kg box feels a net force of 8 N. Its acceleration is…", choices: ["0.5 m/s²", "2 m/s²", "12 m/s²", "32 m/s²"], answer: 1, why: "a = 8 / 4 = 2 m/s²." },
  { q: "When the net force is zero, the acceleration is…", choices: ["Zero", "Equal to the mass", "9.8 m/s² upward", "Impossible to know"], answer: 0, why: "a = F / m = 0. This is how the second law agrees with the first." },
  { q: "The direction of the acceleration matches…", choices: ["The heaviest single force, always", "The direction of the net force", "The direction of friction, always", "The direction the object used to move"], answer: 1, why: "Acceleration points the same way as the net force, even if the object is still moving the other way while it slows down." },
  { q: "One newton is the same as…", choices: ["1 kg", "1 m/s", "1 kg·m/s²", "1 kg/m"], answer: 2, why: "From F = ma, the unit of force is the kilogram meter per second squared." }
];

const QUIZ_3 = [
  { q: "You push a wall. Which force is the reaction?", choices: ["The wall pushes you", "Gravity pulls you down", "The floor’s normal force", "Friction on your shoes only"], answer: 0, why: "The reaction to “you push the wall” is “the wall pushes you,” equal in size and opposite in direction." },
  { q: "Action and reaction forces…", choices: ["Act on the same object and cancel", "Act on different objects", "Are equal only when the objects have the same mass", "Happen one after the other, with the action first"], answer: 1, why: "They are partners, but they are never both drawn on the same free-body diagram." },
  { q: "A book rests on a table. Are the book’s weight and the normal force a third-law pair?", choices: ["Yes, because they are equal and opposite", "No. Both forces act on the book"], answer: 1, why: "A third-law pair acts on two different objects. The partner to the book’s weight is the book’s pull on Earth." },
  { q: "A rocket pushes exhaust gas downward. The reaction is…", choices: ["Gravity pulling the gas", "The gas pushing the rocket upward", "Air pushing the rocket", "The rocket’s inertia"], answer: 1, why: "The gas pushes back on the rocket. That upward force on the rocket is what lifts it." },
  { q: "A child pushes a heavy adult on ice. The forces between them…", choices: ["Are larger on the adult", "Are equal in size, even though the adult barely moves", "Exist only on the child", "Cancel because both people are touching"], answer: 1, why: "The pair is always equal. The lighter person has the larger acceleration." }
];

function learnCopy(id) {
  if (id === 1) {
    return el("div", {},
      el("p", {}, "Newton’s first law is the law of inertia. An object does not change its motion by itself."),
      el("div", { class: "callout" }, el("p", { class: "kicker" }, "Key idea"), el("strong", {}, "An object remains at rest or continues moving at constant velocity unless acted upon by an unbalanced external force.")),
      figure("book", "A resting book: gravity down, normal force up, same size. Net force zero."),
      el("h3", {}, "Important terms"),
      el("ul", { class: "terms" },
        el("li", {}, el("b", {}, "Force"), "A push or a pull. The unit is the newton (N)."),
        el("li", {}, el("b", {}, "Net force"), "The sum of every force on one object, taking direction into account."),
        el("li", {}, el("b", {}, "Balanced forces"), "Forces that add to zero net force. Motion does not change."),
        el("li", {}, el("b", {}, "Unbalanced force"), "A nonzero net force. Velocity changes."),
        el("li", {}, el("b", {}, "Inertia"), "The tendency to keep the same motion. Not a force."),
        el("li", {}, el("b", {}, "Constant velocity"), "Same speed and same direction. Rest is the special case of zero velocity.")
      ),
      el("h3", {}, "Real-life examples"),
      el("div", { class: "examples" },
        el("article", { class: "mini" }, el("strong", {}, "Book on a table"), el("p", {}, "It stays put. Gravity and the normal force balance.")),
        el("article", { class: "mini" }, el("strong", {}, "Puck on ice"), el("p", {}, "It keeps gliding nearly straight. Almost no horizontal force acts.")),
        el("article", { class: "mini" }, figure("bus"), el("strong", {}, "Braking bus"), el("p", {}, "The bus slows. A passenger who is not held keeps the old forward motion."))
      )
    );
  }
  if (id === 2) {
    return el("div", {},
      el("p", {}, "Newton’s second law connects the cause of a change in motion to how large that change is."),
      el("div", { class: "flow" }, el("span", {}, "Force"), el("i", {}, "to"), el("span", {}, "Mass"), el("i", {}, "to"), el("span", {}, "Acceleration")),
      el("p", { class: "equation", "aria-label": "F equals m a" }, el("span", {}, "F"), el("span", {}, "="), el("span", {}, "m"), el("span", {}, "a")),
      el("p", {}, "The net force on an object equals its mass times its acceleration. Rearranged, a = F / m. A larger net force means a larger acceleration. A larger mass means a smaller acceleration for the same force."),
      el("div", { class: "callout" }, el("strong", {}, "1 N = 1 kg·m/s²"), el("p", {}, "Acceleration points in the direction of the net force, not always in the direction the object is already moving."))
    );
  }
  if (id === 3) {
    return el("div", {},
      el("p", { class: "equation" }, "Action", el("span", {}, "  ↔  "), "Reaction"),
      el("p", {}, "Forces occur in pairs. If object A pushes on object B, object B pushes on object A with a force of equal size in the opposite direction. The two forces act on different objects, so they never cancel on one free-body diagram."),
      figure("pair", "Two objects, two arrows. Equal length, opposite direction, different bodies."),
      el("div", { class: "callout" }, el("strong", {}, "Same size. Opposite direction. Different objects."), el("p", {}, "The pair is equal even when the objects have very different masses. The lighter object simply accelerates more."))
    );
  }
  if (id === 4) {
    return el("div", {},
      el("p", {}, "A free-body diagram (FBD) shows one object by itself and every force on that object as a labeled arrow. The surroundings disappear. Only forces remain."),
      figure("lamp", "Teaching example: a lamp at rest. Gravity down, tension up, equal lengths."),
      el("h3", {}, "Build every diagram in this order"),
      el("ol", { class: "terms" },
        el("li", {}, el("b", {}, "1. Object"), "Name the single body you are studying."),
        el("li", {}, el("b", {}, "2. Forces"), "List only the forces on that body."),
        el("li", {}, el("b", {}, "3. Direction"), "Each force gets one direction."),
        el("li", {}, el("b", {}, "4. Force arrows"), "Draw them from the object. Longer can mean stronger."),
        el("li", {}, el("b", {}, "5. Labels"), "Use Fg, FN, Fa, Ff, or FT.")
      ),
      el("div", { class: "callout" }, el("strong", {}, "Leave out “force of motion.”"), el("p", {}, "Motion is not a force. Also leave out forces that this object exerts on something else. Those belong on the other object’s diagram."))
    );
  }
  return el("div", {},
    el("p", {}, "This session does not add a new law. You use the first three laws and a free-body diagram on one problem."),
    el("ol", { class: "terms" },
      el("li", {}, el("b", {}, "Read"), "Pull the numbers and directions out of the words."),
      el("li", {}, el("b", {}, "Identify"), "One object, then the forces on it."),
      el("li", {}, el("b", {}, "Construct"), "Draw the diagram."),
      el("li", {}, el("b", {}, "Analyze"), "Add the forces along each line to get the net force."),
      el("li", {}, el("b", {}, "Apply"), "Use F = ma when the net force is not zero."),
      el("li", {}, el("b", {}, "Check"), "Object, forces, directions, diagram, equation, and answer.")
    )
  );
}

const EXPLORE_3 = [
  { title: "Pushing a wall", text: "Your hand pushes the wall. The wall pushes your hand the other way, equally hard. You feel that push. The wall feels yours." },
  { title: "Walking", text: "Your foot pushes the ground backward. The ground pushes your foot forward. That forward force on you is why you start moving." },
  { title: "Jumping", text: "Your legs push Earth downward a little. Earth pushes you upward. You leave the floor; Earth barely moves." },
  { title: "Swimming", text: "You push water backward. The water pushes you forward. The pair explains the swim, not a forward force from “motion.”" },
  { title: "Kicking a ball", text: "Your foot pushes the ball. The ball pushes your foot backward during the kick. The forces match; the ball accelerates more because its mass is smaller." }
];

function explorePanel(id, onProgress, sceneNav) {
  const host = el("div");
  if (id === 1) {
    mountScenarios(host, [
      {
        key: "s1a",
        scene: "book",
        title: "A book is resting on a table.",
        q: "What happens to the book?",
        choices: ["It stays at rest", "It accelerates down through the table", "It starts sliding sideways by itself"],
        answer: 0,
        hint: "Look at whether the velocity is changing.",
        why: "The book remains at rest. Its velocity is already zero and stays zero.",
        follow: {
          key: "s1b",
          q: "Why does that happen?",
          choices: ["Gravity and the normal force balance, so the net force is zero", "No forces act on a resting object", "Inertia is an upward force that cancels gravity"],
          answer: 0,
          hint: "Name the downward force and the upward force.",
          why: "Gravity pulls the book down. The table pushes up with the normal force. They balance."
        }
      },
      {
        key: "s1c",
        scene: "bus",
        title: "A moving bus brakes suddenly.",
        q: "What happens to a standing passenger who is not holding on?",
        choices: ["The passenger continues forward relative to the bus", "The passenger is thrown toward the back of the bus", "The passenger instantly matches the slower speed with no force"],
        answer: 0,
        hint: "Think about the motion the passenger already had.",
        why: "The passenger keeps moving forward while the bus slows, so the passenger lurches toward the front.",
        follow: {
          key: "s1d",
          q: "Why?",
          choices: ["Inertia: the passenger keeps the earlier velocity until a force acts on them", "The brakes push the passenger forward", "Gravity pulls the passenger toward the front of the bus"],
          answer: 0,
          hint: "The brake force acts on the bus, not automatically on the passenger.",
          why: "No forward force is required. The passenger’s inertia keeps the old velocity."
        }
      }
    ], onProgress, sceneNav);
    return host;
  }
  if (id === 2) {
    mountSim(host, onProgress);
    return host;
  }
  if (id === 3) {
    const opened = new Set(EXPLORE_3.map((item, index) => store.flag("s3see" + index) ? index : -1).filter((index) => index >= 0));
    host.append(el("p", {}, "Open each everyday case. Name the two objects before you move on."));
    EXPLORE_3.forEach((item, index) => {
      const button = el("button", { class: "choice" + (opened.has(index) ? " is-right" : ""), type: "button" }, item.title);
      const note = el("p", { class: "quiet" });
      if (opened.has(index)) note.textContent = item.text;
      button.addEventListener("click", () => {
        opened.add(index);
        store.setFlag("s3see" + index);
        button.classList.add("is-right");
        note.textContent = item.text;
        onProgress(opened.size === EXPLORE_3.length ? 1 : opened.size / EXPLORE_3.length);
      });
      host.append(button, note);
    });
    if (opened.size === EXPLORE_3.length) onProgress(1);
    return host;
  }
  return host;
}

function quizBank(id) {
  if (id === 1) return QUIZ_1;
  if (id === 2) return QUIZ_2;
  return QUIZ_3;
}

function passNeed(total) {
  return Math.ceil(total * 0.7);
}

let pageController = null;

function refreshProgressUI() {
  paintChrome(currentRoute());
  if (pageController) pageController.refresh();
}

function viewHome() {
  const started = SESSIONS.some((session) => sessionPercent(session.id) > 0 || isComplete(session.id));
  const label = completedSessions() === 5 && isFinalComplete() ? "See your progress" : (started ? "Continue learning" : "Start learning");
  const overall = Math.round(SESSIONS.reduce((sum, session) => sum + sessionPercent(session.id), 0) / 5);
  const xp = SESSIONS.reduce((sum, session) => sum + sessionPercent(session.id), 0);
  return el("div", { class: "wrap" },
    el("section", { class: "hero" },
      el("div", { class: "hero__copy" },
        el("h1", {}, "Feel the force.", el("span", { class: "hero-zap" }, " Know the law.")),
        el("p", { class: "lede" }, "Push, drag, and crash things to learn Newton's three laws and free-body diagrams. Then use them to solve real problems."),
        el("a", { class: "btn btn--hero", href: continueHash() }, label, el("span", { "aria-hidden": "true" }, "→")),
        el("p", { class: "offline-note" }, el("span", { "aria-hidden": "true" }, "●"), " Fully offline · progress saved locally")
      ),
      el("div", { class: "hero__stage" },
        el("div", { class: "stage-sticker stage-sticker--top" }, "PUSH!"),
        el("div", { class: "stage-sticker stage-sticker--bottom" }, "F = ma"),
        heroToy()
      )
    ),
    el("section", { class: "dash", "aria-label": "Learning progress" },
      el("div", { class: "dash__main" },
        el("p", { class: "kicker" }, "Level"),
        el("strong", { class: "dash__score" }, overall + "%"),
        el("div", { class: "dash__bar" }, el("i", { style: "width:" + overall + "%" })),
        el("p", {}, overall ? "Momentum building. Keep it moving." : "Fresh start. First experiment ready.")
      ),
      el("div", { class: "dash__stat" }, el("strong", {}, completedSessions()), el("span", {}, "Labs cleared")),
      el("div", { class: "dash__stat" }, el("strong", {}, xp), el("span", {}, "Points"))
    ),
    el("div", { class: "section-title" },
      el("div", {}, el("p", { class: "kicker" }, "Learning path"), el("h2", {}, "Five missions")),
      el("a", { href: "#/sessions" }, "View all →")
    ),
    pathList()
  );
}

const SESSION_ICON = ["↗", "Σ", "⇄", "✦", "∆"];
const SESSION_TAG = ["Inertia", "F = ma", "Action · reaction", "Diagram studio", "Solve it"];

function trailStop(session, isHere) {
  const id = session.id;
  const locked = !isUnlocked(id);
  const done = isComplete(id);
  const pct = sessionPercent(id);
  const state = locked ? "is-locked" : (done ? "is-done" : (isHere ? "is-here" : "is-open"));
  const stop = el("li", { class: "stop tone-" + id + " " + state });
  stop.append(el("span", { class: "stop__node", "aria-hidden": "true" }, locked ? "🔒" : (done ? "✓" : SESSION_ICON[id - 1])));
  const card = el(locked ? "div" : "a", { class: "stop__card", href: locked ? null : "#/session/" + id });
  const band = el("div", { class: "stop__band" },
    el("span", { class: "stop__no" }, "Session " + String(id).padStart(2, "0")),
    el("span", { class: "stop__tag" }, SESSION_TAG[id - 1])
  );
  if (isHere) band.append(el("span", { class: "stop__here" }, "You are here"));
  card.append(band);
  card.append(el("h3", {}, session.title));
  card.append(el("p", { class: "stop__blurb" }, locked ? "Finish Session " + (id - 1) + " to unlock." : session.blurb));
  const steps = el("ol", { class: "stop__steps", "aria-label": "Parts" });
  FLOW[id].forEach((item) => {
    const ok = store.task(id, item[2]) >= 1;
    steps.append(el("li", { class: ok ? "is-ok" : "" }, item[1].replace(/^\d+\s·\s/, "")));
  });
  card.append(steps);
  const foot = el("div", { class: "stop__foot" });
  const bar = el("div", { class: "stop__bar" });
  const fill = el("i");
  fill.style.width = (locked ? 0 : pct) + "%";
  bar.append(fill);
  foot.append(bar, el("strong", {}, locked ? "Locked" : pct + "%"));
  if (!locked) foot.append(el("span", { class: "stop__go" }, done ? "Replay" : (pct ? "Resume" : "Start"), el("b", { "aria-hidden": "true" }, "→")));
  card.append(foot);
  stop.append(card);
  return stop;
}

function viewSessions() {
  const here = SESSIONS.find((session) => isUnlocked(session.id) && !isComplete(session.id));
  const done = completedSessions();
  const trail = el("ol", { class: "trail" }, SESSIONS.map((session) => trailStop(session, here && here.id === session.id)));
  const finalOpen = isFinalUnlocked();
  const finalDone = isFinalComplete();
  const boss = el("li", { class: "stop stop--boss " + (finalDone ? "is-done" : (finalOpen ? "is-here" : "is-locked")) });
  boss.append(el("span", { class: "stop__node", "aria-hidden": "true" }, finalDone ? "✓" : "★"));
  const bossCard = el(finalOpen ? "a" : "div", { class: "stop__card", href: finalOpen ? "#/final" : null });
  bossCard.append(
    el("div", { class: "stop__band" }, el("span", { class: "stop__no" }, "Boss level"), el("span", { class: "stop__tag" }, "5 challenges")),
    el("h3", {}, "FBDify Final Challenge"),
    el("p", { class: "stop__blurb" }, finalOpen ? "Five problems that use every session." : "Clear all five sessions to open it."),
    el("div", { class: "stop__foot" },
      el("div", { class: "stop__bar" }, el("i", { style: "width:" + finalDoneCount() * 20 + "%" })),
      el("strong", {}, finalOpen ? finalDoneCount() * 20 + "%" : "Locked")
    )
  );
  boss.append(bossCard);
  trail.append(boss);
  return el("div", { class: "wrap sessions-page" },
    el("header", { class: "trail-head" },
      el("p", { class: "kicker" }, "Learning path"),
      el("h1", {}, "Sessions"),
      el("p", { class: "lede" }, "Five stops. Each one: learn it, play with it, prove it."),
      el("div", { class: "trail-meter", "aria-label": done + " of 5 sessions complete" },
        SESSIONS.map((session) => el("i", { class: "tone-" + session.id + (isComplete(session.id) ? " is-on" : (here && here.id === session.id ? " is-now" : "")) })),
        el("strong", {}, done + " / 5 cleared")
      )
    ),
    trail
  );
}

function rankFor(pct) {
  if (isFinalComplete()) return ["Physicist", "Every law and every diagram, solved. The lab is yours."];
  if (pct >= 100) return ["Cleared", "All five sessions done. The final challenge is open."];
  if (pct >= 80) return ["Unstoppable", "Almost there. One more push and the path is clear."];
  if (pct >= 50) return ["In motion", "Halfway charged. Net force is on your side."];
  if (pct >= 20) return ["Accelerating", "The score is climbing. Keep the same direction."];
  if (pct > 0) return ["First push", "You started it. A body in motion stays in motion."];
  return ["At rest", "Start Session 1. Nothing changes until a net force acts."];
}

function viewProgress() {
  const percents = SESSIONS.map((session) => sessionPercent(session.id));
  const overall = Math.round(percents.reduce((sum, pct) => sum + pct, 0) / 5);
  const xp = percents.reduce((sum, pct) => sum + pct, 0);
  const done = completedSessions();
  const rank = rankFor(overall);
  const next = SESSIONS.find((session) => isUnlocked(session.id) && !isComplete(session.id));
  const rows = SESSIONS.map((session, index) => {
    const locked = !isUnlocked(session.id);
    const pct = percents[index];
    const best = store.data.best[session.id + ".quiz"] || store.data.best[session.id + ".checkpoint"];
    const card = el(locked ? "div" : "a", {
      class: "charge tone-" + session.id + (locked ? " is-locked" : "") + (pct >= 100 ? " is-full" : ""),
      href: locked ? null : "#/session/" + session.id
    });
    const head = el("div", { class: "charge__head" });
    head.append(el("span", { class: "charge__no" }, String(session.id).padStart(2, "0")));
    head.append(el("div", {},
      el("h3", {}, session.short),
      el("p", {}, locked ? "Finish session " + (session.id - 1) + " to unlock" : (best ? "Best check " + Math.round(best * 100) + "%" : statusName(session.id)))
    ));
    head.append(el("strong", { class: "charge__pct" }, locked ? "—" : pct + "%"));
    const track = el("div", { class: "charge__track", role: "img", "aria-label": (locked ? "Locked" : pct + " percent") });
    const fill = el("i");
    fill.style.width = (locked ? 0 : pct) + "%";
    track.append(fill);
    card.append(head, track);
    return card;
  });
  const finalPct = finalDoneCount() * 20;
  const finalCard = el(isFinalUnlocked() ? "a" : "div", {
    class: "boss" + (isFinalComplete() ? " is-full" : "") + (isFinalUnlocked() ? "" : " is-locked"),
    href: isFinalUnlocked() ? "#/final" : null
  });
  finalCard.append(
    el("p", { class: "kicker" }, "Boss level"),
    el("h3", {}, "FBDify Final Challenge"),
    el("strong", {}, isFinalUnlocked() ? finalPct + "%" : "Locked"),
    el("p", {}, isFinalComplete() ? "All five challenges cleared." : (isFinalUnlocked() ? finalDoneCount() + " of 5 challenges done." : "Opens when Session 5 hits 100%."))
  );
  const reset = el("button", { class: "btn btn--ghost", type: "button" }, "Reset progress");
  reset.addEventListener("click", openReset);
  const ring = el("div", { class: "score__ring", style: "--pct:" + overall });
  ring.append(el("div", { class: "score__core" }, el("strong", {}, String(overall)), el("span", {}, "percent")));
  return el("div", { class: "wrap progress-page" },
    el("section", { class: "score", "aria-label": "Overall progress " + overall + " percent" },
      ring,
      el("div", { class: "score__copy" },
        el("p", { class: "kicker" }, "Current rank"),
        el("h1", {}, rank[0]),
        el("p", { class: "lede" }, rank[1]),
        next ? el("a", { class: "btn btn--hero", href: "#/session/" + next.id }, "Continue " + next.short, el("span", { "aria-hidden": "true" }, "→")) : (isFinalUnlocked() && !isFinalComplete() ? el("a", { class: "btn btn--hero", href: "#/final" }, "Take the final", el("span", { "aria-hidden": "true" }, "→")) : null)
      )
    ),
    el("div", { class: "score-stats" },
      el("div", {}, el("strong", {}, done + "/5"), el("span", {}, "Labs cleared")),
      el("div", {}, el("strong", {}, String(xp)), el("span", {}, "Points")),
      el("div", {}, el("strong", {}, isFinalUnlocked() ? finalPct + "%" : "—"), el("span", {}, "Final"))
    ),
    el("div", { class: "section-title" },
      el("div", {}, el("p", { class: "kicker" }, "Your sessions"), el("h2", {}, "Session by session"))
    ),
    el("div", { class: "charges" }, rows),
    finalCard,
    el("div", { class: "btn-row" }, reset)
  );
}

function openReset() {
  const back = el("div", { class: "modal-back" });
  const dialog = el("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "reset-title" });
  const cancel = el("button", { class: "btn btn--ghost", type: "button" }, "Cancel");
  const erase = el("button", { class: "btn", type: "button" }, "Erase progress");
  cancel.addEventListener("click", () => back.remove());
  erase.addEventListener("click", () => { back.remove(); store.reset(); });
  dialog.append(
    el("h2", { id: "reset-title" }, "Erase saved progress?"),
    el("p", {}, "This will permanently delete every session score on this device. It cannot be undone."),
    el("div", { class: "btn-row" }, cancel, erase)
  );
  back.append(dialog);
  document.body.append(back);
  cancel.focus();
}

function donePanel(id) {
  const host = el("div", { class: "card done-copy" });
  const burst = el("div", { class: "confetti", "aria-hidden": "true" });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const colors = ["#0f6e6a", "#c05622", "#31457a", "#2a6b45", "#a67c2d"];
    for (let i = 0; i < 16; i++) {
      const bit = el("i");
      bit.style.left = (6 + i * 6) + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = (i * 0.04) + "s";
      burst.append(bit);
    }
  }
  const next = id < 5 ? "#/session/" + (id + 1) : "#/final";
  const label = id < 5 ? "Continue to Session " + (id + 1) + " →" : "Start the final challenge →";
  host.append(
    burst,
    el("div", { class: "stamp-wrap" }, el("div", { class: "stamp" }, "Complete")),
    el("h2", {}, "Session " + id + " Complete!"),
    el("p", {}, id === 5 ? "The diagram and the laws now work as one tool." : "That session is saved on this device."),
    el("a", { class: "btn", href: next }, label)
  );
  return host;
}

function viewSession(id) {
  const session = SESSIONS[id - 1];
  if (!session || !isUnlocked(id)) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Locked"),
      el("p", {}, "Finish the previous session to open this one."),
      el("a", { class: "btn", href: "#/sessions" }, "Back to sessions")
    );
  }

  const flow = FLOW[id];
  const sceneNav = { active: false, index: 0, total: 0, stepReady: false, allDone: false, goNext() {}, goPrev() {} };
  const panels = {};
  let current = flow[0][0];
  const chipRow = el("div", { class: "chips" });
  const stack = el("div");
  const footer = el("div", { class: "btn-row" });

  function taskOf(sectionId) {
    const found = flow.find((item) => item[0] === sectionId);
    return found ? found[2] : sectionId;
  }

  function canOpen(index) {
    if (index === 0) return true;
    const previous = flow[index - 1];
    return store.task(id, previous[2]) >= 1;
  }

  function paintChips() {
    chipRow.replaceChildren();
    flow.forEach((item, index) => {
      const open = canOpen(index);
      const button = el("button", { class: "chip-nav" + (item[0] === current ? " is-on" : ""), type: "button" });
      button.disabled = !open;
      const dot = el("span", { class: "dot" + (store.task(id, item[2]) >= 1 ? " is-done" : ""), "data-task-dot": item[2] });
      button.append(dot, item[1]);
      button.addEventListener("click", () => setSection(item[0]));
      chipRow.append(button);
    });
    if (isComplete(id)) {
      const done = el("button", { class: "chip-nav" + (current === "done" ? " is-on" : ""), type: "button" }, "Finish");
      done.addEventListener("click", () => setSection("done"));
      chipRow.append(done);
    }
    requestAnimationFrame(slideChip);
  }

  function slideChip() {
    const on = chipRow.querySelector(".chip-nav.is-on");
    if (!on || !chipRow.isConnected) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = on.offsetLeft - (chipRow.clientWidth - on.offsetWidth) / 2;
    chipRow.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }

  function paintFooter() {
    footer.replaceChildren();
    if (current === "done") return;
    const index = flow.findIndex((item) => item[0] === current);
    if (current === "explore" && sceneNav.active) {
      const back = el("button", { class: "btn btn--ghost", type: "button" }, "Back");
      if (sceneNav.index > 0) back.addEventListener("click", () => sceneNav.goPrev());
      else back.addEventListener("click", () => setSection(flow[index - 1][0]));
      footer.append(back);
      const onLast = sceneNav.index >= sceneNav.total - 1;
      const next = el("button", { class: "btn", type: "button" }, "Continue");
      const leave = onLast && sceneNav.allDone;
      next.disabled = !(leave || (sceneNav.stepReady && !onLast));
      if (next.disabled) next.title = "Answer this situation to continue";
      next.addEventListener("click", () => {
        if (leave) {
          if (flow[index + 1]) setSection(flow[index + 1][0]);
          return;
        }
        sceneNav.goNext();
      });
      footer.append(next);
      if (next.disabled) footer.append(el("p", { class: "quiet foot-note" }, "Answer this situation, then press Continue."));
      return;
    }
    if (index > 0) {
      const back = el("button", { class: "btn btn--ghost", type: "button" }, "Back");
      back.addEventListener("click", () => setSection(flow[index - 1][0]));
      footer.append(back);
    }
    const task = taskOf(current);
    const ready = store.task(id, task) >= 1;
    if (current === "learn" || current === "read") {
      const next = el("button", { class: "btn", type: "button" }, "Continue");
      next.addEventListener("click", () => {
        store.setTask(id, task, 1);
        const following = flow[index + 1];
        setSection(isComplete(id) ? "done" : (following ? following[0] : current));
      });
      footer.append(next);
      return;
    }
    const next = el("button", { class: "btn", type: "button" }, index === flow.length - 1 ? "Finish session" : "Continue");
    next.disabled = !ready;
    if (!ready) next.title = "Finish this part to continue";
    next.addEventListener("click", () => {
      if (store.task(id, task) < 1) return;
      if (isComplete(id)) setSection("done");
      else if (flow[index + 1]) setSection(flow[index + 1][0]);
    });
    footer.append(next);
  }

  function setSection(name) {
    current = name;
    if (id === 5 && name === "check" && panels.check) {
      const fresh = finalChecklist();
      panels.check.replaceChildren(...fresh.childNodes);
      syncFiveCheck();
    }
    Object.keys(panels).forEach((key) => { panels[key].hidden = key !== name; });
    const done = stack.querySelector("[data-done]");
    if (done) done.hidden = name !== "done";
    paintChips();
    paintFooter();
    window.scrollTo(0, 0);
  }

  function watch(task, value) {
    if (value >= 1) store.setTask(id, task, 1);
    else store.putTask(id, task, value);
    if (isComplete(id) && current === flow[flow.length - 1][0]) setSection("done");
    else {
      paintChips();
      paintFooter();
    }
  }

  flow.forEach((item) => {
    const panel = el("section", { class: "card" });
    panel.hidden = true;
    const task = item[2];
    if (item[0] === "learn") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, session.title), learnCopy(id));
    } else if (item[0] === "explore") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Explore"));
      panel.append(explorePanel(id, (value) => watch(task, value), sceneNav));
    } else if (item[0] === "check" || item[0] === "checkpoint") {
      const bank = quizBank(item[0] === "checkpoint" ? 2 : id);
      const need = passNeed(bank.length);
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, item[0] === "checkpoint" ? "Checkpoint" : "Check your understanding"));
      if (item[0] === "checkpoint") panel.append(el("p", {}, "Short quiz before the next session. The pass mark keeps the second law usable, not just familiar."));
      mountQuiz(panel, bank, need, (score, total, passed) => recordQuiz(id, task, score, total, passed));
    } else if (item[0] === "challenge") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Quick challenge"));
      if (id === 1) {
        panel.append(el("p", {}, "A soccer ball is rolling across the grass. It slows down and stops."));
        mountFormative(panel, {
          key: "s1ch",
          q: "What force is causing the change in motion?",
          choices: ["Inertia", "Friction", "A forward force that runs out", "Gravity pulling the ball backward"],
          answer: 1,
          hint: "Something must act against the motion. Inertia is not a force.",
          why: "Friction from the grass acts opposite the motion, so the net force is no longer zero and the ball slows."
        }, () => watch("challenge", 1));
      } else {
        mountFormative(panel, {
          key: "s2ch",
          q: "What happens to acceleration if the force increases while mass stays the same?",
          choices: ["It increases", "It decreases", "It stays the same", "It becomes zero"],
          answer: 0,
          hint: "Look at a = F / m and change only F.",
          why: "Acceleration increases. In a = F / m, a larger force gives a larger acceleration when mass is constant."
        }, () => watch("challenge", 1));
      }
    } else if (item[0] === "practice" && id === 2) {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Practice"), el("p", {}, "Use F = ma. Give the magnitude. Units are shown beside the box."));
      mountProblemSet(panel, [
        { key: "s2p1", q: "A 5-kg box is pushed with a net force of 20 N. What is its acceleration?", answer: 4, unit: "m/s²", hint: "You know the force and the mass, and want acceleration. Rearrange F = ma to a = F / m.", why: "a = 20 / 5 = 4 m/s².",
          explain: "Start from F = ma. Divide both sides by m to get a = F / m. Then a = 20 N ÷ 5 kg = 4 m/s².",
          mistakes: [
            { value: 100, msg: "You multiplied 20 × 5. That is F = ma used backwards: multiplying mass by acceleration gives force. Here you need acceleration, so divide the force by the mass." },
            { value: 0.25, msg: "You divided 5 ÷ 20, mass by force. Flip it: the force goes on top, a = F / m." }
          ] },
        { key: "s2p2", q: "A 10-kg wagon is pulled with a net force of 50 N. What is its acceleration?", answer: 5, unit: "m/s²", hint: "Acceleration = net force ÷ mass. Ask: how many newtons does each kilogram get?", why: "a = 50 / 10 = 5 m/s².",
          explain: "a = F / m = 50 N ÷ 10 kg = 5 m/s². Each kilogram of the wagon gets 5 N of the pull.",
          mistakes: [
            { value: 500, msg: "You multiplied 50 × 10. Multiplying mass by acceleration gives force, but the force is already given. Divide the force by the mass instead." },
            { value: 0.2, msg: "You divided 10 ÷ 50, mass by force. Put the force on top: a = F / m." },
            { value: 40, msg: "You subtracted 50 − 10. Newtons and kilograms are different units, so they can't be subtracted. Use a = F / m." }
          ] },
        { key: "s2p3", q: "A 2-kg cart accelerates at 6 m/s². What is the net force?", answer: 12, unit: "N", hint: "This time you want the force. F = ma means multiply the mass by the acceleration.", why: "F = 2 × 6 = 12 N.",
          explain: "Force is the unknown, so use F = ma directly: F = 2 kg × 6 m/s² = 12 N.",
          mistakes: [
            { value: 3, msg: "You divided 6 ÷ 2. Dividing is for finding acceleration or mass. When force is the unknown, F = ma tells you to multiply." },
            { value: 0.333, msg: "You divided 2 ÷ 6. When force is the unknown, multiply mass by acceleration: F = ma." },
            { value: 8, msg: "You added 2 + 6. Mass and acceleration combine by multiplying, not adding: F = m × a." }
          ] },
        { key: "s2p4", q: "A net force of 36 N produces an acceleration of 4 m/s². What is the mass?", answer: 9, unit: "kg", hint: "Mass is the unknown. Rearrange F = ma by dividing both sides by a.", why: "m = 36 / 4 = 9 kg.",
          explain: "Start from F = ma. Divide both sides by a to get m = F / a. Then m = 36 N ÷ 4 m/s² = 9 kg.",
          mistakes: [
            { value: 144, msg: "You multiplied 36 × 4. Multiplying mass by acceleration gives force, but the force is already 36 N. To find mass, divide the force by the acceleration." },
            { value: 0.111, msg: "You divided 4 ÷ 36, acceleration by force. The force goes on top: m = F / a." },
            { value: 32, msg: "You subtracted 36 − 4. Newtons and m/s² are different units, so they can't be subtracted. Use m = F / a." }
          ] }
      ], (value) => watch("practice", value));
    } else if (item[0] === "match") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Pair-match activity"));
      panel.append(el("p", {}, "Match the force on object A with the force on object B."));
      mountPairs(panel, () => watch("match", 1));
    } else if (item[0] === "error") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Error check"));
      panel.append(el("blockquote", { class: "quote" }, "“The action force is bigger than the reaction force.”"));
      mountFormative(panel, {
        key: "s3err",
        q: "Is that statement correct or incorrect?",
        choices: ["Correct", "Incorrect"],
        answer: 1,
        hint: "Compare the sizes in a third-law pair.",
        why: "The statement is incorrect. The forces are equal in size."
      }, () => {
        if (store.flag("s3why")) {
          watch("error", 1);
          return;
        }
        const extra = el("div");
        panel.append(extra);
        mountFormative(extra, {
          key: "s3why",
          q: "Why is that statement wrong?",
          choices: ["The action happens first, so it is stronger", "The forces are equal in size and opposite in direction, and they act on different objects", "The reaction is bigger whenever the second object is heavier"],
          answer: 1,
          hint: "Check both the sizes and which object each force acts on.",
          why: "Action and reaction are equal, opposite, and on different objects. Neither one is the “bigger” force."
        }, () => watch("error", 1));
      });
    } else if (item[0] === "build") {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "FBD Builder"));
      mountFbd(panel, {
        situation: "A box is pushed to the right on a rough surface.",
        object: "Box",
        objects: ["Box", "Table", "Hand", "Floor"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" },
          { id: "applied", dir: "right" },
          { id: "friction", dir: "left" }
        ],
        eq: [["gravity", "normal"]]
      }, (value) => watch("build", value));
    } else if (item[0] === "practice" && id === 4) {
      panel.append(el("p", { class: "kicker" }, item[1]), el("h2", {}, "Practice build"), el("p", {}, "New situation, same moves: isolate the object, add its forces, aim and size each arrow, then check."));
      mountFbd(panel, {
        situation: "A book rests on a table.",
        object: "Book",
        objects: ["Book", "Table", "Floor", "Earth"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" }
        ],
        eq: [["gravity", "normal"]]
      }, (value) => watch("practice", value));
    } else if (item[0] === "read") {
      panel.append(sessionFiveRead(() => watch("read", 1)));
    } else if (item[0] === "identify") {
      panel.append(sessionFiveIdentify(() => watch("identify", 1), () => {
        if (store.task(5, "identify") >= 1) watch("identify", 0);
      }));
    } else if (item[0] === "construct") {
      panel.append(el("p", { class: "kicker" }, "Step 3 — Construct"), el("h2", {}, "Draw the diagram"));
      mountFbd(panel, {
        situation: "A 10-kg box is pushed to the right with a force of 30 N. Friction acts against the motion with a force of 10 N. The floor is flat and rough.",
        object: "Box",
        objects: ["Box", "Floor", "Person"],
        catalog: ["gravity", "normal", "applied", "friction", "tension", "motion"],
        forces: [
          { id: "gravity", dir: "down" },
          { id: "normal", dir: "up" },
          { id: "applied", dir: "right" },
          { id: "friction", dir: "left" }
        ],
        eq: [["gravity", "normal"]],
        gt: [["applied", "friction", "30 N against 10 N"]]
      }, (value) => watch("construct", value));
    } else if (item[0] === "analyze") {
      panel.append(el("p", { class: "kicker" }, "Step 4 — Analyze"), el("h2", {}, "What is the net force?"));
      panel.append(el("p", {}, "Vertical forces balance on the flat floor. Use the horizontal forces only: 30 N to the right and 10 N to the left."));
      mountNumber(panel, {
        key: "s5net",
        q: "What is the net force on the box?",
        answer: 20,
        unit: "N",
        dir: "right",
        hint: "Subtract the force that opposes the push.",
        why: "Fnet = 30 N − 10 N = 20 N to the right."
      }, () => watch("analyze", 1));
    } else if (item[0] === "apply") {
      panel.append(el("p", { class: "kicker" }, "Step 5 — Apply Newton's law"), el("h2", {}, "Solve"));
      const eq = el("div");
      panel.append(eq);
      mountFormative(eq, {
        key: "s5eq",
        q: "Which equation matches this problem?",
        choices: ["a = Fnet / m", "a = m / Fnet", "a = Fnet × m", "a = m − Fnet"],
        answer: 0,
        hint: "Start from F = ma and solve for a.",
        why: "a = Fnet / m. The net force is 20 N and the mass is 10 kg."
      }, () => {
        const num = el("div");
        panel.append(num);
        mountNumber(num, {
          key: "s5a",
          q: "What is the acceleration of the box?",
          answer: 2,
          unit: "m/s²",
          dir: "right",
          hint: "Divide the 20 N net force by 10 kg.",
          why: "a = 20 / 10 = 2 m/s² to the right."
        }, () => watch("apply", 1));
      });
    } else if (item[0] === "check") {
      panel.append(finalChecklist(id));
    }
    panels[item[0]] = panel;
    stack.append(panel);
  });

  const done = el("div", { "data-done": "1" });
  done.hidden = true;
  done.append(donePanel(id));
  stack.append(done);
  panels.done = done;

  pageController = {
    refresh() {
      paintChips();
      paintFooter();
      if (current === "check" && id === 5) {
        const fresh = finalChecklist(id);
        panels.check.replaceChildren(...fresh.childNodes);
      }
    }
  };

  const pending = flow.find((item, index) => canOpen(index) && store.task(id, item[2]) < 1);
  const start = isComplete(id) ? "done" : (pending ? pending[0] : flow[0][0]);

  const page = el("div", { class: "wrap session-page" },
    el("p", { class: "kicker" }, "Session " + id + " of 5"),
    el("h1", {}, session.title),
    id === 5 ? problemStrip() : null,
    chipRow,
    stack,
    footer
  );
  setSection(start);
  return page;
}

function problemStrip() {
  return el("aside", { class: "recap" },
    el("p", {}, el("strong", {}, "Problem. "), "A 10-kg box is pushed to the right with a force of 30 N. Friction acts against the motion with a force of 10 N. The floor is flat and rough.")
  );
}

function sessionFiveRead(onReady) {
  const box = el("div");
  const facts = [
    ["mass", "Mass is 10 kg"],
    ["push", "The push is 30 N to the right"],
    ["drag", "Friction is 10 N to the left"]
  ];
  const seen = new Set(facts.filter((fact) => store.flag("s5read-" + fact[0])).map((fact) => fact[0]));
  box.append(el("p", { class: "kicker" }, "Step 1 — Read"), el("h2", {}, "Mark the facts"), el("p", {}, "Tap each fact hidden in the problem. All three must be marked."));
  facts.forEach((fact) => {
    const button = el("button", { class: "fact" + (seen.has(fact[0]) ? " is-on" : ""), type: "button" }, fact[1]);
    button.addEventListener("click", () => {
      seen.add(fact[0]);
      store.setFlag("s5read-" + fact[0]);
      button.classList.add("is-on");
      if (seen.size === facts.length) onReady();
    });
    box.append(button);
  });
  if (seen.size === facts.length) onReady();
  return box;
}

function sessionFiveIdentify(onPass, onEdit) {
  const box = el("div");
  box.append(el("p", { class: "kicker" }, "Step 2 — Identify"), el("h2", {}, "Object and forces"));
  let object = null;
  const forces = new Set();
  const needed = ["gravity", "normal", "applied", "friction"];
  const fb = el("p", { class: "feedback", "aria-live": "polite" });
  box.append(el("h3", {}, "Object"));
  ["Box", "Floor", "Person"].forEach((name) => {
    const button = el("button", { class: "choice", type: "button" }, name);
    button.addEventListener("click", () => {
      object = name;
      box.querySelectorAll(".choice").forEach((node) => node.classList.toggle("is-right", node === button));
      onEdit();
    });
    box.append(button);
  });
  box.append(el("h3", {}, "Forces on that object"));
  const tray = el("div", { class: "force-tray" });
  ["gravity", "normal", "applied", "friction", "tension", "motion"].forEach((id) => {
    const button = el("button", { class: "force-chip", type: "button" }, FORCE[id].label);
    button.addEventListener("click", () => {
      if (forces.has(id)) forces.delete(id);
      else forces.add(id);
      button.classList.toggle("is-on");
      onEdit();
    });
    tray.append(button);
  });
  const check = el("button", { class: "btn", type: "button" }, "Check identification");
  check.addEventListener("click", () => {
    const missing = needed.filter((id) => !forces.has(id));
    const extra = [...forces].filter((id) => !needed.includes(id));
    if (object !== "Box") {
      fb.className = "feedback is-wrong";
      fb.textContent = "The object is the box.";
      onEdit();
      return;
    }
    if (missing.length || extra.length) {
      fb.className = "feedback is-wrong";
      fb.textContent = missing.length ? "Missing " + FORCE[missing[0]].label.toLowerCase() + "." : FORCE[extra[0]].label + " does not act on the box here.";
      onEdit();
      return;
    }
    fb.className = "feedback is-right";
    fb.textContent = "Correct. Gravity, normal force, applied force, and friction.";
    onPass();
  });
  box.append(tray, check, fb);
  return box;
}

function requirementState() {
  return [
    ["Correct object", store.task(5, "identify") >= 1],
    ["Correct forces", store.task(5, "identify") >= 1],
    ["Correct directions", store.task(5, "construct") >= 1],
    ["Correct FBD", store.task(5, "construct") >= 1],
    ["Correct equation", store.flag("s5eq")],
    ["Correct answer", store.flag("s5net") && store.flag("s5a")]
  ];
}

function finalChecklist() {
  const box = el("div");
  box.append(el("p", { class: "kicker" }, "Step 6 — Final check"), el("h2", {}, "Does the solution hold?"));
  const items = requirementState();
  const list = el("ul", { class: "check-list" });
  items.forEach(([label, ok]) => {
    list.append(el("li", { class: ok ? "pass" : "fail" }, el("span", {}, label), el("strong", {}, ok ? "Pass" : "Not yet")));
  });
  const all = items.every((item) => item[1]);
  box.append(list);
  box.append(all
    ? el("p", { class: "feedback is-right" }, "Correct. Fnet = 30 N − 10 N = 20 N to the right. a = 20 N / 10 kg = 2 m/s² to the right. Vertical forces balance, so they do not change the horizontal acceleration.")
    : el("p", {}, "Go back to any open step, fix the miss, and return. This list updates from the saved steps."));
  return box;
}

function syncFiveCheck() {
  const all = requirementState().every((item) => item[1]);
  const next = all ? 1 : 0;
  if ((store.data.task[5].check || 0) === next) return;
  store.data.task[5].check = next;
  store.save();
}

function viewFinal() {
  if (!isFinalUnlocked()) {
    return el("div", { class: "wrap card" },
      el("h1", {}, "Locked"),
      el("p", {}, "Finish Session 5 to open the FBDify Final Challenge."),
      el("a", { class: "btn", href: "#/session/5" }, "Back to Session 5")
    );
  }
  if (isFinalComplete()) return finalCelebration();

  const wrap = el("div", { class: "wrap" });
  let current = 1;
  while (current <= 5 && (store.data.final[current] || 0) >= 1) current += 1;
  if (current > 5) current = 5;
  const host = el("div");

  function paint() {
    host.replaceChildren();
    host.append(el("p", { class: "kicker" }, "Challenge " + current + " of 5"));
    if (current === 1) paintForcePick();
    else if (current === 2) paintBuild();
    else if (current === 3) paintLaws();
    else if (current === 4) paintNet();
    else paintAccel();
  }

  function pass(id) {
    store.data.final[id] = 1;
    store.save();
    if (isFinalComplete()) {
      main.replaceChildren(finalCelebration());
      return;
    }
    current = id + 1;
    paint();
    window.scrollTo(0, 0);
  }

  function paintForcePick() {
    host.append(el("h1", {}, "FBDify Final Challenge"), el("h2", {}, "Identify the forces"));
    host.append(el("p", {}, "A lamp hangs at rest from a cord. Select every force on the lamp, and only those."));
    const chosen = new Set();
    const tray = el("div", { class: "force-tray" });
    ["gravity", "tension", "normal", "friction", "applied", "motion"].forEach((id) => {
      const button = el("button", { class: "force-chip", type: "button" }, FORCE[id].label);
      button.addEventListener("click", () => {
        if (chosen.has(id)) chosen.delete(id);
        else chosen.add(id);
        button.classList.toggle("is-on");
      });
      tray.append(button);
    });
    const fb = el("p", { class: "feedback" });
    const check = el("button", { class: "btn", type: "button" }, "Check");
    check.addEventListener("click", () => {
      const needed = ["gravity", "tension"];
      const ok = needed.every((id) => chosen.has(id)) && chosen.size === 2;
      fb.className = "feedback " + (ok ? "is-right" : "is-wrong");
      fb.textContent = ok ? "Correct. Gravity down, tension up. No table, so no normal force." : "A hanging lamp at rest feels gravity and tension only.";
      if (ok) pass(1);
    });
    host.append(tray, check, fb);
  }

  function paintBuild() {
    host.append(el("h2", {}, "Construct the FBD"));
    mountFbd(host, {
      situation: "A book rests on a table.",
      object: "Book",
      objects: ["Book", "Table", "Floor"],
      catalog: ["gravity", "normal", "friction", "applied", "tension", "motion"],
      forces: [{ id: "gravity", dir: "down" }, { id: "normal", dir: "up" }],
      eq: [["gravity", "normal"]]
    }, (value) => { if (value >= 1) pass(2); });
  }

  function paintLaws() {
    host.append(el("h2", {}, "Identify the applicable Newton's law"));
    const items = [
      { key: "f3a", q: "A skater glides straight at steady speed on very smooth ice.", choices: ["Newton's first law", "Newton's second law", "Newton's third law"], answer: 0, hint: "The velocity is not changing.", why: "Constant velocity means zero net force: the first law." },
      { key: "f3b", q: "The same push accelerates a light cart more than a heavy cart.", choices: ["Newton's first law", "Newton's second law", "Newton's third law"], answer: 1, hint: "Compare a = F / m.", why: "Same force, different mass, different acceleration: the second law." },
      { key: "f3c", q: "A swimmer moves forward because the water pushes back on them.", choices: ["Newton's first law", "Newton's second law", "Newton's third law"], answer: 2, hint: "Two objects share one interaction.", why: "The swimmer pushes water; water pushes the swimmer. That is a third-law pair." }
    ];
    let cursor = items.findIndex((item) => !store.flag(item.key));
    if (cursor < 0) cursor = items.length;
    const box = el("div");
    host.append(box);
    function show() {
      box.replaceChildren();
      if (cursor >= items.length) {
        pass(3);
        return;
      }
      box.append(el("p", { class: "q-top" }, (cursor + 1) + " of 3"));
      mountFormative(box, items[cursor], () => { cursor += 1; show(); });
    }
    show();
  }

  function paintNet() {
    host.append(el("h2", {}, "Calculate the net force"));
    host.append(el("p", {}, "A 6 kg crate is pulled to the right with 40 N. Friction acts to the left with 10 N. Vertical forces balance."));
    mountNumber(host, {
      key: "f4",
      q: "What is the net force?",
      answer: 30,
      unit: "N",
      dir: "right",
      hint: "40 N right minus 10 N left.",
      why: "Fnet = 40 − 10 = 30 N to the right."
    }, () => pass(4));
  }

  function paintAccel() {
    host.append(el("h2", {}, "Calculate acceleration"));
    host.append(el("p", {}, "The crate has a mass of 6 kg and a net force of 30 N to the right."));
    mountNumber(host, {
      key: "f5",
      q: "What is the acceleration?",
      answer: 5,
      unit: "m/s²",
      dir: "right",
      hint: "a = Fnet / m.",
      why: "a = 30 / 6 = 5 m/s² to the right."
    }, () => pass(5));
  }

  wrap.append(host);
  paint();
  return wrap;
}

function finalCelebration() {
  const burst = el("div", { class: "finale__burst", "aria-hidden": "true" });
  const colors = ["#ffda3a", "#ff6534", "#47d2b5", "#7aa2ff", "#e23b4a"];
  const shapes = ["strip", "dot", "square"];
  for (let i = 0; i < 36; i++) {
    const bit = el("i", { class: "bit bit--" + shapes[i % shapes.length] });
    const seed = (i * 47) % 100;
    bit.style.setProperty("--x", (2 + (i * 29) % 96) + "%");
    bit.style.setProperty("--delay", ((seed % 18) * 0.08).toFixed(2) + "s");
    bit.style.setProperty("--dur", (2.6 + (seed % 7) * 0.25).toFixed(2) + "s");
    bit.style.setProperty("--drift", ((seed % 2 ? 1 : -1) * (20 + seed % 40)) + "px");
    bit.style.setProperty("--spin", (seed % 2 ? 540 : -540) + "deg");
    bit.style.background = colors[i % colors.length];
    burst.append(bit);
  }
  const earned = [
    ["01", "First law", "Motion stays until a net force acts."],
    ["02", "Second law", "F = ma, and you can use it."],
    ["03", "Third law", "Every force has an equal partner."],
    ["04", "Diagrams", "You can isolate one object and draw it."],
    ["05", "Application", "You solve from the diagram, not a guess."],
    ["06", "Final", "Five challenges, all cleared."]
  ];
  const badges = el("ul", { class: "finale__badges" });
  earned.forEach((item, index) => {
    const row = el("li", { style: "animation-delay:" + (0.7 + index * 0.12) + "s" });
    row.append(el("b", {}, item[0]), el("div", {}, el("strong", {}, item[1]), el("span", {}, item[2])));
    badges.append(row);
  });
  return el("div", { class: "wrap finale" },
    burst,
    el("div", { class: "finale__stage", "aria-hidden": "true" },
      el("div", { class: "tree" },
        el("div", { class: "tree__crown" }),
        el("div", { class: "tree__crown tree__crown--side" }),
        el("i", { class: "tree__trunk" }),
        el("i", { class: "tree__apple" })
      ),
      el("i", { class: "tree__ground" })
    ),
    el("p", { class: "kicker" }, "Achievement unlocked"),
    el("h1", {}, "You finished."),
    el("blockquote", { class: "newton" },
      el("p", {}, "If I have seen further, it is by standing on the shoulders of giants."),
      el("cite", {}, "Isaac Newton, letter to Robert Hooke, 1675")
    ),
    el("p", { class: "finale__note" }, "Five sessions and the final challenge, saved on this device."),
    badges,
    el("a", { class: "btn btn--hero", href: "#/progress" }, "See my progress", el("span", { "aria-hidden": "true" }, "→"))
  );
}

const main = document.getElementById("main");
let routing = false;
let pendingLock = "";

function lockMessage(info) {
  if (info.name === "final" && !isFinalUnlocked()) return "The final challenge opens after Session 5 is finished.";
  if (info.name !== "session") return "";
  if (info.session < 1 || info.session > 5) return "That session is not on the path.";
  if (!isUnlocked(info.session)) return "Session " + info.session + " is still locked. Finish Session " + (info.session - 1) + " first.";
  return "";
}

function showLockPopup(message) {
  const old = document.getElementById("lock-popup");
  if (old) old.remove();
  const back = el("div", { id: "lock-popup", class: "modal-back" });
  const dialog = el("div", { class: "modal", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "lock-title" });
  const ok = el("button", { class: "btn", type: "button" }, "Back to sessions");
  ok.addEventListener("click", () => back.remove());
  back.addEventListener("click", (event) => { if (event.target === back) back.remove(); });
  dialog.append(
    el("h2", { id: "lock-title" }, "Not open yet"),
    el("p", {}, message),
    el("div", { class: "btn-row" }, ok)
  );
  back.append(dialog);
  document.body.append(back);
  ok.focus();
}

function currentRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "session") return { name: "session", session: Number(parts[1]) || 1 };
  if (parts[0] === "sessions") return { name: "sessions" };
  if (parts[0] === "progress") return { name: "progress" };
  if (parts[0] === "final") return { name: "final" };
  return { name: "home" };
}

function paintChrome(route) {
  const name = route.name;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const on = link.dataset.nav === name || (name === "session" && link.dataset.nav === "sessions") || (name === "final" && link.dataset.nav === "sessions");
    link.classList.toggle("is-on", on);
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.body.classList.remove("tone-1", "tone-2", "tone-3", "tone-4", "tone-5");
  if (name === "session") document.body.classList.add("tone-" + route.session);
  if (name === "final") document.body.classList.add("tone-5");
  const titles = { home: "Physics AIREA · Newton's laws, hands-on", sessions: "Sessions · Physics AIREA", progress: "My Progress · Physics AIREA", final: "Final Challenge · Physics AIREA" };
  document.title = name === "session" ? "Session " + route.session + " · Physics AIREA" : titles[name];
  const crumb = document.getElementById("crumb");
  const crumbs = { home: "Offline studio", sessions: "Five sessions", progress: "My progress", final: "Final challenge" };
  crumb.textContent = name === "session" ? "Session " + route.session : crumbs[name];
  paintSidebar(name);
  paintRail(route);
}

function paintRail(route) {
  const old = document.getElementById("rail");
  if (old) old.remove();
  if (route.name !== "session" && route.name !== "final") return;

  let title;
  let note;
  let pct;
  let steps;
  if (route.name === "session") {
    const id = route.session;
    pct = sessionPercent(id);
    steps = FLOW[id].map((item) => ({
      label: item[1].replace(/^\d+\s·\s/, ""),
      done: store.task(id, item[2]) >= 1
    }));
    const done = steps.filter((step) => step.done).length;
    title = "Session " + id;
    note = isComplete(id) ? "Complete · saved on this device" : done + " of " + steps.length + " parts · saved on this device";
  } else {
    const names = ["Forces", "Diagram", "Laws", "Net force", "Accel"];
    steps = names.map((label, index) => ({ label: label, done: (store.data.final[index + 1] || 0) >= 1 }));
    const done = steps.filter((step) => step.done).length;
    pct = done * 20;
    title = "Final challenge";
    note = done === 5 ? "Complete · saved on this device" : done + " of 5 challenges · saved on this device";
  }

  const current = steps.findIndex((step) => !step.done);
  const track = el("div", {
    class: "rail__track",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": String(pct),
    "aria-label": title + " progress, saved on this device"
  });
  const fill = el("span", { class: "rail__fill" });
  fill.style.width = pct + "%";
  track.append(fill);
  const ticks = el("ol", { class: "rail__ticks" });
  steps.forEach((step, index) => {
    const state = step.done ? "is-done" : (index === current ? "is-now" : "");
    ticks.append(el("li", { class: state }, el("i", { "aria-hidden": "true" }), el("span", {}, step.label)));
  });
  const rail = el("div", { id: "rail", class: "rail" },
    el("div", { class: "rail__top" },
      el("p", { class: "rail__title" }, title),
      el("p", { class: "rail__note" }, note),
      el("strong", { class: "rail__pct" }, pct + "%")
    ),
    track,
    ticks
  );
  document.querySelector(".topbar").append(rail);
}

function paintSidebar(name) {
  const side = document.getElementById("sidebar");
  const brand = el("a", { class: "brand", href: "#/" },
    el("span", { class: "brand__text" }, el("small", {}, "Physics"), el("strong", {}, "AIREA"))
  );
  const nav = el("nav", { class: "side-nav", "aria-label": "Primary" });
  [["home", "#/", "Home"], ["sessions", "#/sessions", "Sessions"], ["progress", "#/progress", "Progress"]].forEach(([id, href, label]) => {
    const link = el("a", { href: href, "data-side": id }, label);
    const on = id === name || (name === "session" && id === "sessions") || (name === "final" && id === "sessions");
    if (on) link.classList.add("is-on");
    nav.append(link);
  });
  const meters = el("div", { class: "stack" });
  SESSIONS.forEach((session) => {
    const row = el("a", { href: isUnlocked(session.id) ? "#/session/" + session.id : "#/sessions", class: "tone-" + session.id, style: "text-decoration:none;color:inherit" });
    row.append(el("div", { class: "status" }, "0" + session.id + "  " + (isUnlocked(session.id) ? sessionPercent(session.id) + "%" : "Locked")));
    row.append(segments(isUnlocked(session.id) ? sessionPercent(session.id) : 0));
    meters.append(row);
  });
  side.replaceChildren(brand, nav, meters, el("p", { class: "side-note" }, "Offline on this device. " + completedSessions() + " of 5 sessions complete."));
}

function route() {
  if (routing) return;
  const info = currentRoute();
  const blocked = lockMessage(info);
  if (blocked) {
    pendingLock = blocked;
    if ((location.hash || "#/") !== "#/sessions") {
      location.replace("#/sessions");
      return;
    }
  }
  routing = true;
  pageController = null;
  paintChrome(info);
  const view = { home: viewHome, sessions: viewSessions, progress: viewProgress, final: viewFinal, session: () => viewSession(info.session) }[info.name] || viewHome;
  main.replaceChildren(view());
  main.focus({ preventScroll: true });
  routing = false;
  if (pendingLock) {
    const message = pendingLock;
    pendingLock = "";
    showLockPopup(message);
  }
}

const SKIP_STEPS = {
  1: ["learn", "explore", "quiz", "challenge"],
  2: ["learn", "explore", "practice", "challenge", "checkpoint"],
  3: ["learn", "explore", "match", "error", "quiz"],
  4: ["learn", "build", "practice"],
  5: ["read", "identify", "construct", "analyze", "apply", "check"]
};
const SKIP_FLAGS = {
  "1.explore": ["s1a", "s1b", "s1c", "s1d"],
  "1.challenge": ["s1ch"],
  "2.explore": ["s2moved", "s2e1", "s2e2"],
  "2.practice": ["s2p1", "s2p2", "s2p3", "s2p4"],
  "2.challenge": ["s2ch"],
  "3.explore": ["s3see0", "s3see1", "s3see2", "s3see3", "s3see4"],
  "3.match": ["s3match"],
  "3.error": ["s3err", "s3why"],
  "5.read": ["s5read-mass", "s5read-push", "s5read-drag"],
  "5.analyze": ["s5net"],
  "5.apply": ["s5eq", "s5a"]
};

function skipMark(session, task) {
  (SKIP_FLAGS[session + "." + task] || []).forEach((key) => store.setFlag(key));
  if (task === "quiz" || task === "checkpoint") store.data.best[session + "." + task] = 1;
  store.setTask(session, task, 1);
  store.save();
}

window.skip = function skip() {
  const session = currentRoute().session;
  if (!session) {
    console.warn("Open a session first, then run skip().");
    return;
  }
  const task = SKIP_STEPS[session].find((name) => store.task(session, name) < 1);
  if (!task) {
    console.log("Session " + session + " is already complete.");
    return;
  }
  skipMark(session, task);
  route();
  console.log("Skipped " + task + " in session " + session + ".");
};

window.finish = function finish(session) {
  const id = Number(session);
  if (id < 1 || id > 5) {
    console.warn("Use finish(1) through finish(5).");
    return;
  }
  for (let n = 1; n <= id; n++) SKIP_STEPS[n].forEach((task) => skipMark(n, task));
  if (currentRoute().name !== "session" || currentRoute().session !== id) location.hash = "#/session/" + id;
  else route();
  console.log("Session " + id + " is complete.");
};

const FINAL_FLAGS = { 3: ["f3a", "f3b", "f3c"], 4: ["f4"], 5: ["f5"] };

function openFinal() {
  if (currentRoute().name !== "final") location.hash = "#/final";
  else route();
}

window.skipFinal = function skipFinal() {
  if (!isFinalUnlocked()) for (let n = 1; n <= 5; n++) SKIP_STEPS[n].forEach((task) => skipMark(n, task));
  let next = 1;
  while (next <= 5 && (store.data.final[next] || 0) >= 1) next += 1;
  if (next > 5) {
    console.log("Final challenge is already complete.");
    openFinal();
    return;
  }
  (FINAL_FLAGS[next] || []).forEach((key) => store.setFlag(key));
  store.data.final[next] = 1;
  store.save();
  openFinal();
  console.log("Skipped final challenge " + next + " of 5.");
};

window.finishFinal = function finishFinal() {
  if (!isFinalUnlocked()) for (let n = 1; n <= 5; n++) SKIP_STEPS[n].forEach((task) => skipMark(n, task));
  for (let n = 1; n <= 5; n++) {
    (FINAL_FLAGS[n] || []).forEach((key) => store.setFlag(key));
    store.data.final[n] = 1;
  }
  store.save();
  openFinal();
  console.log("Final challenge is complete.");
};

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", route);
if (!location.hash) location.hash = "#/";
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* Offline support is optional on unsupported hosts. */ });
  });
}
