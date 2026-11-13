(() => {
  "use strict";

  const MAX = [99, 59, 59];
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- seven-segment digits ----------
  const SEGMENTS = {
    a: "6,2 54,2 48,8 12,8",
    b: "56,5 56,48 50,44 50,11",
    c: "56,52 56,95 50,89 50,56",
    d: "12,92 48,92 54,98 6,98",
    e: "4,52 10,56 10,89 4,95",
    f: "4,5 10,11 10,44 4,48",
    g: "8,50 12,46 48,46 52,50 48,54 12,54",
  };
  const DIGIT_MAP = [
    "abcdef", "bc", "abdeg", "abcdg", "bcfg",
    "acdfg", "acdefg", "abc", "abcdefg", "abcdfg",
  ];

  function makeDigit() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 60 100");
    svg.setAttribute("class", "seg-digit");
    const segs = {};
    for (const [k, pts] of Object.entries(SEGMENTS)) {
      const p = document.createElementNS(SVG_NS, "polygon");
      p.setAttribute("points", pts);
      svg.appendChild(p);
      segs[k] = p;
    }
    return {
      el: svg,
      set(n) {
        const on = DIGIT_MAP[n];
        for (const k in segs) segs[k].classList.toggle("on", on.includes(k));
      },
    };
  }

  const unitEls = [...document.querySelectorAll(".unit")];
  const digitPairs = unitEls.map((u) => {
    const holder = u.querySelector(".digits");
    const pair = [makeDigit(), makeDigit()];
    pair.forEach((d) => holder.appendChild(d.el));
    return pair;
  });

  function showDigital(h, m, s) {
    [h, m, s].forEach((v, i) => {
      digitPairs[i][0].set(Math.floor(v / 10));
      digitPairs[i][1].set(v % 10);
    });
  }

  // ---------- stopwatch dial ----------
  const ticksG = document.getElementById("ticks");
  const numeralsG = document.getElementById("numerals");
  const subTicksG = document.getElementById("subTicks");
  const ticks = [];

  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r1 = 168, r2 = major ? 150 : 160;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", (Math.sin(a) * r1).toFixed(2));
    line.setAttribute("y1", (-Math.cos(a) * r1).toFixed(2));
    line.setAttribute("x2", (Math.sin(a) * r2).toFixed(2));
    line.setAttribute("y2", (-Math.cos(a) * r2).toFixed(2));
    line.setAttribute("class", major ? "tick major" : "tick");
    ticksG.appendChild(line);
    ticks.push(line);
    if (major) {
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", (Math.sin(a) * 133).toFixed(2));
      t.setAttribute("y", (-Math.cos(a) * 133).toFixed(2));
      t.setAttribute("class", "numeral");
      t.textContent = i === 0 ? "60" : String(i).padStart(2, "0");
      numeralsG.appendChild(t);
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = 38, r2 = i % 3 === 0 ? 30 : 34;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", (Math.sin(a) * r1).toFixed(2));
    line.setAttribute("y1", (-Math.cos(a) * r1).toFixed(2));
    line.setAttribute("x2", (Math.sin(a) * r2).toFixed(2));
    line.setAttribute("y2", (-Math.cos(a) * r2).toFixed(2));
    line.setAttribute("class", "subtick");
    subTicksG.appendChild(line);
  }
  const subNumeralsG = document.getElementById("subNumerals");
  [3, 6, 9].forEach((n) => {
    const a = (n / 12) * Math.PI * 2;
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", (Math.sin(a) * 22).toFixed(2));
    t.setAttribute("y", (-Math.cos(a) * 22).toFixed(2));
    t.setAttribute("class", "subnum");
    t.textContent = String(n);
    subNumeralsG.appendChild(t);
  });

  const sweepHand = document.getElementById("sweepHand");
  const minuteHand = document.getElementById("minuteHand");
  const hourHand = document.getElementById("hourHand");
  const ring = document.getElementById("progressRing");
  const faceReadout = document.getElementById("faceReadout");
  const elapsedText = document.getElementById("elapsedText");
  const pctText = document.getElementById("pctText");
  const RING_LEN = 2 * Math.PI * 184;
  ring.style.strokeDasharray = `${RING_LEN} ${RING_LEN}`;

  const fmt = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Hands show the time REMAINING, so they start at the set value and sweep back toward 12.
  function renderWatch(elapsedMs, totalMs) {
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    const remSec = remainingMs / 1000;
    const secAngle = (remSec % 60) * 6;
    const minAngle = ((remSec / 60) % 60) * 6;
    const hourAngle = ((remSec / 3600) % 12) * 30;
    sweepHand.setAttribute("transform", `rotate(${secAngle.toFixed(3)})`);
    minuteHand.setAttribute("transform", `rotate(${minAngle.toFixed(3)})`);
    hourHand.setAttribute("transform", `rotate(${hourAngle.toFixed(3)})`);

    const frac = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;
    ring.style.strokeDashoffset = String(RING_LEN * (1 - frac));

    const remainingSec = Math.max(0, Math.ceil(remSec - 1e-6));
    faceReadout.textContent = fmt(remainingSec);
    elapsedText.textContent = fmt(Math.floor(elapsedMs / 1000));
    pctText.textContent = totalMs > 0 ? `${Math.floor((1 - frac) * 100)}%` : "0%";
    return remainingSec;
  }

  // ---------- state ----------
  const state = {
    values: [0, 5, 0],
    selected: 1,
    typed: 0,
    mode: "idle", // idle | running | paused | done
    totalMs: 0,
    elapsedBeforeMs: 0,
    startedAt: 0,
  };

  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusText = document.getElementById("statusText");
  const timesUp = document.getElementById("timesUp");
  const focusBtn = document.getElementById("focusBtn");
  const focusText = document.getElementById("focusText");
  const focusStartBtn = document.getElementById("focusStartBtn");
  const focusResetBtn = document.getElementById("focusResetBtn");
  const muteBtn = document.getElementById("muteBtn");
  const muteText = document.getElementById("muteText");

  let muted = false;
  try { muted = localStorage.getItem("devinCounterMuted") === "1"; } catch (_) { /* storage optional */ }

  function renderMute() {
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.title = muted ? "Unmute alarm (M)" : "Mute alarm (M)";
    muteText.textContent = muted ? "MUTED" : "SOUND ON";
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem("devinCounterMuted", muted ? "1" : "0"); } catch (_) { /* storage optional */ }
    renderMute();
  }

  const totalSecs = () => state.values[0] * 3600 + state.values[1] * 60 + state.values[2];

  function setMode(mode) {
    state.mode = mode;
    document.body.classList.remove("idle", "running", "paused", "done");
    document.body.classList.add(mode);
    statusText.textContent = { idle: "STANDBY", running: "RUNNING", paused: "PAUSED", done: "COMPLETE" }[mode];
    startBtn.textContent = mode === "running" ? "PAUSE" : mode === "paused" ? "RESUME" : "START";
    focusStartBtn.textContent = startBtn.textContent;
    updateStartEnabled();
  }

  function updateStartEnabled() {
    startBtn.disabled = state.mode === "idle" && totalSecs() === 0;
    focusStartBtn.disabled = startBtn.disabled;
  }

  function select(i) {
    if (state.mode !== "idle") return;
    state.selected = (i + 3) % 3;
    state.typed = 0;
    unitEls.forEach((u, k) => u.classList.toggle("selected", k === state.selected));
  }

  function refreshIdle() {
    showDigital(...state.values);
    state.totalMs = totalSecs() * 1000;
    renderWatch(0, state.totalMs);
    updateStartEnabled();
  }

  function adjust(unit, dir) {
    if (state.mode !== "idle") return;
    const max = MAX[unit];
    state.values[unit] = (state.values[unit] + dir + max + 1) % (max + 1);
    state.typed = 0;
    refreshIdle();
  }

  function typeDigit(d) {
    if (state.mode !== "idle") return;
    const u = state.selected;
    let v = state.typed === 0 ? d : state.values[u] * 10 + d;
    v = Math.min(v, MAX[u]);
    state.values[u] = v;
    state.typed += 1;
    if (state.typed >= 2) {
      if (u < 2) select(u + 1);
      else state.typed = 0;
    }
    refreshIdle();
  }

  // ---------- timer engine ----------
  let rafId = 0;

  const elapsedNow = () =>
    state.elapsedBeforeMs + (state.mode === "running" ? performance.now() - state.startedAt : 0);

  function frame() {
    const elapsed = Math.min(elapsedNow(), state.totalMs);
    const remaining = renderWatch(elapsed, state.totalMs);
    showDigital(Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60);
    if (elapsed >= state.totalMs) {
      finish();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (state.mode === "idle") {
      state.totalMs = totalSecs() * 1000;
      if (state.totalMs <= 0) return;
      state.elapsedBeforeMs = 0;
      unitEls.forEach((u) => u.classList.remove("selected"));
    }
    state.startedAt = performance.now();
    setMode("running");
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    state.elapsedBeforeMs = elapsedNow();
    cancelAnimationFrame(rafId);
    setMode("paused");
  }

  function reset() {
    cancelAnimationFrame(rafId);
    timesUp.hidden = true;
    state.elapsedBeforeMs = 0;
    setMode("idle");
    select(state.selected);
    refreshIdle();
  }

  function finish() {
    cancelAnimationFrame(rafId);
    state.elapsedBeforeMs = state.totalMs;
    renderWatch(state.totalMs, state.totalMs);
    showDigital(0, 0, 0);
    setMode("done");
    timesUp.hidden = false;
    chime();
  }

  function chime() {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.28, 0.56].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.25);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch (_) { /* audio is optional */ }
  }

  // ---------- full screen (watch only) ----------
  const isFocus = () => document.body.classList.contains("focus");

  function setFocus(on) {
    document.body.classList.toggle("focus", on);
    focusBtn.setAttribute("aria-pressed", String(on));
    focusBtn.title = on ? "Exit full screen (F)" : "Full screen (F)";
    focusText.textContent = on ? "EXIT" : "FULL SCREEN";
    const root = document.documentElement;
    if (on && !document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => { /* in-page mode still applies */ });
    } else if (!on && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && isFocus()) setFocus(false);
  });

  // ---------- events ----------
  startBtn.addEventListener("click", () => (state.mode === "running" ? pause() : start()));
  resetBtn.addEventListener("click", reset);
  focusStartBtn.addEventListener("click", () => (state.mode === "running" ? pause() : start()));
  focusResetBtn.addEventListener("click", reset);
  focusBtn.addEventListener("click", () => { setFocus(!isFocus()); focusBtn.blur(); });
  muteBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMute(); muteBtn.blur(); });
  timesUp.addEventListener("click", reset);

  document.querySelectorAll(".digits").forEach((el) => {
    el.addEventListener("click", () => select(Number(el.dataset.unit)));
    el.addEventListener("focus", () => select(Number(el.dataset.unit)));
  });

  unitEls.forEach((u) => {
    u.addEventListener("wheel", (e) => {
      if (state.mode !== "idle") return;
      e.preventDefault();
      const unit = Number(u.dataset.unit);
      select(unit);
      adjust(unit, e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  });

  // press-and-hold chevrons
  document.querySelectorAll(".chev").forEach((btn) => {
    let delayT = 0, repeatT = 0;
    const stop = () => { clearTimeout(delayT); clearInterval(repeatT); };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const unit = Number(btn.dataset.unit);
      const dir = Number(btn.dataset.dir);
      select(unit);
      adjust(unit, dir);
      stop();
      delayT = setTimeout(() => { repeatT = setInterval(() => adjust(unit, dir), 70); }, 380);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, stop));
  });

  document.getElementById("presets").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-secs]");
    if (!b || state.mode !== "idle") return;
    const s = Number(b.dataset.secs);
    state.values = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
    state.typed = 0;
    refreshIdle();
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "m" || e.key === "M") { toggleMute(); return; }
    if ((e.key === "f" || e.key === "F") && state.mode !== "done") { setFocus(!isFocus()); return; }
    if (e.key === "Escape" && isFocus() && state.mode !== "done") { setFocus(false); return; }
    if (state.mode === "done") { e.preventDefault(); reset(); return; }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      state.mode === "running" ? pause() : start();
    } else if (e.key === "Escape" || e.key === "r" || e.key === "R") {
      reset();
    } else if (state.mode === "idle") {
      if (/^[0-9]$/.test(e.key)) typeDigit(Number(e.key));
      else if (e.key === "ArrowLeft") { e.preventDefault(); select(state.selected - 1); }
      else if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); select(state.selected + (e.shiftKey ? -1 : 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); adjust(state.selected, 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); adjust(state.selected, -1); }
      else if (e.key === "Backspace") { state.values[state.selected] = 0; state.typed = 0; refreshIdle(); }
    }
  });

  // footer clock
  const clockNow = document.getElementById("clockNow");
  const tickClock = () => { clockNow.textContent = new Date().toLocaleTimeString([], { hour12: false }); };
  tickClock();
  setInterval(tickClock, 1000);

  // init
  renderMute();
  setMode("idle");
  select(1);
  refreshIdle();
})();
