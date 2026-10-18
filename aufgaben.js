/* Wurzel-Check – gemeinsame Aufgaben-Logik für Schülerseite (index.html) und Lehrerseite (lehrer.html).
   Die Generatoren stammen aus der Wurzel-Regatta; statt Math.random() benutzen sie rand(),
   damit ein Test aus Testcode + Listennummer exakt reproduzierbar ist. */
"use strict";
const $ = id => document.getElementById(id);
let rand = Math.random;

/* ---------- Reproduzierbarer Zufall ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash32(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

/* ---------- Hilfsfunktionen ---------- */
const R = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const eq = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

function fmt(x) {
  x = Number(x.toPrecision(12));
  const neg = x < 0; x = Math.abs(x);
  let s = x.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
  let [i, d] = s.split('.');
  if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + i + (d ? ',' + d : '');
}
function parseNum(s) {
  s = String(s).trim().replace(/[\s  ']/g, '').replace(/^[−–]/, '-').replace(/^\+/, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}
const sq = x => `<span class="rt">√<span class="rad">${x}</span></span>`;
const cb = x => `<span class="rt">∛<span class="rad">${x}</span></span>`;
const pw = (b, e) => `${b}<sup>${e}</sup>`;
const pb = b => (b < 0 || !Number.isInteger(b)) ? `(${fmt(b)})` : fmt(b);   // Basis ggf. mit Klammer
const surd = (c, r) => (c === 1 ? '' : fmt(c)) + sq(r);
const tenPow = e => `10<sup>${fmt(e)}</sup>`;
const SQFREE = [2, 3, 5, 6, 7, 10, 11];

/* ---------- Skizzen ---------- */
const svgWrap = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${inner}</svg>`;
function skQuadrat(label, side = 'a = ?') {
  return svgWrap(240, 210, `
    <rect x="50" y="20" width="150" height="150" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
    <text x="125" y="102" text-anchor="middle" font-size="19" font-weight="600" fill="#1d2b36">${label}</text>
    <text x="125" y="196" text-anchor="middle" font-size="18" fill="#c2410c" font-weight="700">${side}</text>`);
}
function skWuerfel(label, side = 'a = ?') {
  return svgWrap(240, 220, `
    <polygon points="40,70 160,70 160,190 40,190" fill="#bfdbfe" stroke="#2563eb" stroke-width="2.5"/>
    <polygon points="40,70 85,30 205,30 160,70" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
    <polygon points="160,70 205,30 205,150 160,190" fill="#93c5fd" stroke="#2563eb" stroke-width="2.5"/>
    <text x="100" y="135" text-anchor="middle" font-size="17" font-weight="600" fill="#1d2b36">${label}</text>
    <text x="100" y="212" text-anchor="middle" font-size="17" fill="#c2410c" font-weight="700">${side}</text>`);
}
function skFigur(cells, label) {
  const s = 40, maxX = Math.max(...cells.map(c => c[0])) + 1, maxY = Math.max(...cells.map(c => c[1])) + 1;
  const w = maxX * s + 40, h = maxY * s + 60;
  const rects = cells.map(([x, y]) => `<rect x="${20 + x * s}" y="${20 + y * s}" width="${s}" height="${s}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`).join('');
  return svgWrap(w, h, rects + `<text x="${w / 2}" y="${h - 12}" text-anchor="middle" font-size="16" font-weight="600" fill="#1d2b36">${label}</text>`);
}
function skZweiQuadrate(A1, A2, s1, s2) {
  const k = 150 / (s1 + s2), a = s1 * k, b = s2 * k, base = 30 + Math.max(a, b);
  return svgWrap(240, base + 50, `
    <rect x="45" y="${base - a}" width="${a}" height="${a}" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
    <rect x="${45 + a}" y="${base - b}" width="${b}" height="${b}" fill="#ede9fe" stroke="#7c3aed" stroke-width="2.5"/>
    <text x="${45 + a / 2}" y="${base - a / 2 + 6}" text-anchor="middle" font-size="14" font-weight="600">${A1}</text>
    <text x="${45 + a + b / 2}" y="${base - b / 2 + 6}" text-anchor="middle" font-size="14" font-weight="600">${A2}</text>
    <line x1="45" y1="${base + 14}" x2="${45 + a + b}" y2="${base + 14}" stroke="#c2410c" stroke-width="2"/>
    <line x1="45" y1="${base + 8}" x2="45" y2="${base + 20}" stroke="#c2410c" stroke-width="2"/>
    <line x1="${45 + a + b}" y1="${base + 8}" x2="${45 + a + b}" y2="${base + 20}" stroke="#c2410c" stroke-width="2"/>
    <text x="${45 + (a + b) / 2}" y="${base + 38}" text-anchor="middle" font-size="16" font-weight="700" fill="#c2410c">Länge = ?</text>`);
}
function skRechteck(la, lb, inner = 'A = ?') {
  return svgWrap(260, 190, `
    <rect x="40" y="25" width="180" height="110" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
    <text x="130" y="86" text-anchor="middle" font-size="18" font-weight="700" fill="#c2410c">${inner}</text>
    <text x="130" y="162" text-anchor="middle" font-size="17">${la}</text>
    <text x="232" y="86" font-size="17">${lb}</text>`);
}
/* Körper aus gleichen Würfeln im Schrägbild. cells: [x, y, z] mit y = Höhe, z = Tiefe (nach hinten-oben) */
const KOERPER = {
  reihe2: { name: 'zwei Würfeln in einer Reihe', cells: [[0, 0, 0], [1, 0, 0]] },
  reihe3: { name: 'drei Würfeln in einer Reihe', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] },
  turm3: { name: 'drei aufeinandergestapelten Würfeln', cells: [[0, 0, 0], [0, 1, 0], [0, 2, 0]] },
  L4: { name: 'vier Würfeln', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]] },
  T4: { name: 'vier Würfeln', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0]] },
  block4: { name: 'vier Würfeln', cells: [[0, 0, 1], [1, 0, 1], [0, 0, 0], [1, 0, 0]] },
  treppe6: { name: 'sechs Würfeln', cells: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [0, 2, 0]] },
  podest6: { name: 'sechs Würfeln', cells: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 2, 0], [2, 0, 0]] },
  block8: { name: 'acht Würfeln', cells: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1], [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]] }
};
function skKoerper(cells, label, frage = 'a = ?') {
  const s = 46, d = 0.5;                                      // Kantenlänge in px, Verkürzung der Tiefe
  const P = (x, y, z) => [x * s + z * s * d, -(y * s + z * s * d)];
  const order = cells.slice().sort((a, b) => b[2] - a[2] || a[1] - b[1] || a[0] - b[0]);   // von hinten nach vorne
  let faces = '';
  for (const [x, y, z] of order) {
    const q = pts => pts.map(([a, b, c]) => P(a, b, c).join(',')).join(' ');
    faces += `<polygon points="${q([[x + 1, y, z], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z]])}" fill="#93c5fd" stroke="#2563eb" stroke-width="2"/>`;
    faces += `<polygon points="${q([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]])}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>`;
    faces += `<polygon points="${q([[x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z]])}" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/>`;
  }
  const xs = [], ys = [];
  cells.forEach(([x, y, z]) => [[x, y, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1], [x, y + 1, z]].forEach(c => { const [a, b] = P(...c); xs.push(a); ys.push(b); }));
  const minX = Math.min(...xs) - 10, maxX = Math.max(...xs) + 10, minY = Math.min(...ys) - 10, maxY = Math.max(...ys) + 58;
  const w = Math.max(maxX - minX, 200), cx = (minX + maxX) / 2;
  return `<svg viewBox="${cx - w / 2} ${minY} ${w} ${maxY - minY}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${faces}
    <text x="${cx}" y="${maxY - 32}" text-anchor="middle" font-size="16" font-weight="600" fill="#1d2b36">${label}</text>
    <text x="${cx}" y="${maxY - 10}" text-anchor="middle" font-size="16" font-weight="700" fill="#c2410c">${frage}</text></svg>`;
}
const FIGUREN = [
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]]
];

// Ohne negative Exponenten (kennen die Schüler noch nicht): kleine Einheiten als „1 m = 10^n …“
const VORSILBEN = [['Giga', 'G', 9], ['Mega', 'M', 6], ['Kilo', 'k', 3], ['Zenti', 'c', -2], ['Milli', 'm', -3], ['Mikro', 'µ', -6], ['Nano', 'n', -9]];
function vorsilbenTabelle(mark = []) {
  return `<table class="vorsilben"><thead><tr><th>Vorsilbe</th><th>Zeichen</th><th>Umrechnung</th></tr></thead><tbody>${
    VORSILBEN.map(([n, z, e]) => `<tr class="${mark.includes(z) ? 'mark' : ''}"><td>${n}</td><td>${z}m</td><td>${
      e > 0 ? `1 ${z}m = 10<sup>${e}</sup> m` : `1 m = 10<sup>${-e}</sup> ${z}m`}</td></tr>`).join('')
  }</tbody></table>`;
}
/* Anklickbare Fachbegriffe in Aufgabentexten: begriff('wiss', 'Text') → zeigt eine Erklärung (ohne Zeitstrafe) */
const BEGRIFFE = {
  wiss: `<b>Wissenschaftliche Schreibweise:</b> Zahl · 10<sup>n</sup>, wobei <b>vor dem Komma genau eine Ziffer steht, die keine Null ist</b> (also 1 bis 9).<br>
    <span class="ja">✓</span> 52 000 = 5,2 · 10<sup>4</sup><br>
    <span class="nein">✗</span> 52 · 10<sup>3</sup> (zwei Ziffern vor dem Komma)<br>
    <span class="nein">✗</span> 0,52 · 10<sup>5</sup> (Null vor dem Komma)`
};
const begriff = (key, text) => `<span class="begriff" role="button" tabindex="0" data-b="${key}">${text}</span>`;
/* ---------- Aufgabengeneratoren ----------
   Jede Aufgabe: { title, q, sketch, type: 'num'|'mc'|'sci'|'surd', ...Lösung, hint, sol:[Schritte] } */
const G = {
  /* ===== Regatta 1: Potenzen ===== */
  potenzwert() {
    const c = pick([
      () => [2, R(3, 7)], () => [3, R(2, 4)], () => [4, R(2, 3)], () => [5, R(2, 3)], () => [R(6, 9), 2],
      () => [10, R(3, 6)], () => [-2, R(2, 5)], () => [-3, R(2, 3)], () => [pick([0.1, 0.2, 0.3, 0.5]), R(2, 3)],
      () => [pick([1.1, 1.2, 1.5]), 2]
    ])();
    const [b, e] = c, v = Math.pow(b, e);
    const prod = Array(e).fill(pb(b)).join(' · ');
    return {
      title: 'Potenzwert', q: `Berechne.<div class="big">${pw(pb(b), e)} = ?</div>`, type: 'num', ans: v,
      hint: `Der Exponent ${e} sagt dir, wie oft du die Basis ${pb(b)} mit sich selbst multiplizierst.` + (b < 0 ? ' Achte auf das Vorzeichen: gerade Anzahl Minus ergibt Plus.' : '') + (!Number.isInteger(b) ? ' Zähle am Ende die Nachkommastellen.' : ''),
      sol: [`${pw(pb(b), e)} = ${prod}`, `= ${fmt(v)}`]
    };
  },
  minusFalle() {
    const b = R(2, 5), e = pick([2, 4]), withPar = rand() < .5;
    const v = withPar ? Math.pow(-b, e) : -Math.pow(b, e);
    const term = withPar ? pw(`(−${b})`, e) : `−${pw(b, e)}`;
    return {
      title: 'Achtung, Minus!', q: `Berechne.<div class="big">${term} = ?</div>`, type: 'num', ans: v,
      hint: withPar ? 'Mit Klammer gehört das Minus zur Basis – es wird mitpotenziert.' : 'Ohne Klammer gehört das Minus nicht zur Basis. Erst potenzieren, dann das Minus davor.',
      sol: withPar ? [`${term} = ${Array(e).fill(`(−${b})`).join(' · ')} = ${fmt(v)}`] : [`${term} = −(${Array(e).fill(b).join(' · ')}) = ${fmt(v)}`]
    };
  },
  produktPotenz() {
    const b = R(2, 9), e = R(3, 6);
    while (e === b) return G.produktPotenz();
    const opts = shuffle([pw(b, e), pw(e, b), `${b} · ${e}`, pw(b, e + 1)]);
    return {
      title: 'Potenzschreibweise', q: `Ein Segelclub schreibt Produkte kurz. Welche Potenz passt?<div class="big">${Array(e).fill(b).join(' · ')}</div>`,
      type: 'mc', options: opts, ans: pw(b, e),
      hint: 'Die Zahl, die multipliziert wird, ist die Basis. Wie oft sie vorkommt, steht im Exponenten.',
      sol: [`Die ${b} kommt ${e}-mal als Faktor vor.`, `Also: ${pw(b, e)}`]
    };
  },
  exponent() {
    const [b, e] = pick([[2, R(3, 8)], [3, R(2, 5)], [5, R(2, 4)], [10, R(3, 7)], [4, R(2, 4)]]);
    return {
      title: 'Exponent gesucht', q: `Welcher Exponent fehlt?<div class="big">${b}<sup>□</sup> = ${fmt(Math.pow(b, e))}</div>`,
      type: 'num', ans: e, pre: '□ =',
      hint: `Multipliziere ${b} · ${b} · ${b} · … und zähle mit, bis ${fmt(Math.pow(b, e))} herauskommt.`,
      sol: [`${Array(e).fill(b).join(' · ')} = ${fmt(Math.pow(b, e))}`, `Das sind ${e} Faktoren, also □ = ${e}.`]
    };
  },
  groesstePotenz() {
    const pool = [[2, 3], [3, 2], [2, 4], [4, 2], [2, 5], [5, 2], [3, 3], [2, 6], [6, 2], [4, 3], [3, 4], [10, 2], [2, 7], [7, 2], [5, 3], [1, 9], [9, 1], [2, 1]];
    let set;
    do { set = shuffle(pool.slice()).slice(0, 4); }
    while (new Set(set.map(([b, e]) => b ** e)).size < 4);
    const best = set.reduce((m, x) => (x[0] ** x[1] > m[0] ** m[1] ? x : m));
    return {
      title: 'Wer segelt vorne?', q: 'Vier Boote tragen Potenzen als Segelnummer. Welches Boot hat die <b>größte</b> Zahl?',
      type: 'mc', options: set.map(([b, e]) => pw(b, e)), ans: pw(best[0], best[1]),
      hint: 'Berechne jeden Potenzwert. Vorsicht: 1 hoch irgendwas bleibt 1.',
      sol: set.map(([b, e]) => `${pw(b, e)} = ${b ** e}`).concat([`Am größten: ${pw(best[0], best[1])}`])
    };
  },

  /* ===== Regatta 2: Zehnerpotenzen ===== */
  sciExp() {
    const m = pick([1.5, 2.4, 3.07, 4.8, 5.25, 6.1, 7.3, 8.06, 9.2, 2.75, 3.6]);
    const e = R(3, 9);
    const n = m * Math.pow(10, e);
    return {
      title: 'Zehnerpotenz', q: `Ergänze den Exponenten.<div class="big">${fmt(n)} = ${fmt(m)} · 10<sup>□</sup></div>`,
      type: 'num', ans: e, pre: '□ =',
      hint: 'Zähle, um wie viele Stellen das Komma nach links rückt, bis nur noch eine Ziffer vor dem Komma steht.',
      sol: [`Das Komma rückt um ${Math.abs(e)} Stellen nach links.`, `${fmt(n)} = ${fmt(m)} · ${tenPow(e)}`]
    };
  },
  sciVoll() {
    const facts = [
      ['Der Bodensee enthält etwa', 48000000000, 'm³ Wasser'],
      ['Die Wasserfläche des Bodensees ist etwa', 536000000, 'm² groß'],
      ['Die Sonne ist etwa', 150000000, 'km von der Erde entfernt'],
      ['Das Ufer des Bodensees ist etwa', 273000, 'm lang'],
      ['Auf einer großen Regatta werden etwa', 2400000, 'Liter Getränke verkauft'],
      ['Licht legt pro Sekunde etwa', 300000000, 'm zurück']
    ];
    let txt, n, unit;
    if (rand() < .5) { [txt, n, unit] = pick(facts); }
    else {
      const m = pick([2.6, 3.45, 4.1, 5.8, 7.25, 9.4, 1.35]); const e = pick([4, 5, 6, 7, 8]);
      n = Number((m * Math.pow(10, e)).toPrecision(6));
      txt = ''; unit = '';
    }
    const e = Math.floor(Math.log10(Math.abs(n)) + 1e-9), m = Number((n / Math.pow(10, e)).toPrecision(6));
    return {
      title: 'Wissenschaftliche Schreibweise', q: unit ? `${txt} <b>${fmt(n)}</b> ${unit}.<br>Schreibe die Zahl in ${begriff('wiss', 'wissenschaftlicher Schreibweise')}.`
        : `Schreibe die Zahl <b>${fmt(n)}</b> in ${begriff('wiss', 'wissenschaftlicher Schreibweise')}.`,
      type: 'sci', m, e,
      hint: 'Vor dem Komma steht genau eine Ziffer (1 bis 9). Dann zählst du, um wie viele Stellen das Komma gewandert ist.',
      sol: [`Komma so verschieben, dass eine Ziffer davor steht: ${fmt(m)}`, `Es rückt ${Math.abs(e)} Stellen nach ${e >= 0 ? 'links' : 'rechts'} → Exponent ${fmt(e)}`, `${fmt(n)} = ${fmt(m)} · ${tenPow(e)}`]
    };
  },
  sciZuruck() {
    const m = pick([3.07, 4.5, 6.02, 8.1, 1.25, 2.9, 7.04]), e = pick([3, 4, 5, 6, 7]);
    const n = Number((m * Math.pow(10, e)).toPrecision(8));
    return {
      title: 'Zurück zur Dezimalzahl', q: `Schreibe als Dezimalzahl.<div class="big">${fmt(m)} · ${tenPow(e)} = ?</div>`, type: 'num', ans: n,
      hint: `Mal ${tenPow(e)} heißt: Komma um ${e} Stellen nach rechts. Fehlende Stellen mit Nullen auffüllen.`,
      sol: [`Komma um ${Math.abs(e)} Stellen nach ${e > 0 ? 'rechts' : 'links'} verschieben.`, `${fmt(m)} · ${tenPow(e)} = ${fmt(n)}`]
    };
  },
  technisch() {
    const e = pick([3, 6, 9]);
    const lead = e > 0 ? pick([12, 45, 230, 7.5, 86, 310, 1.8]) : pick([25, 4.5, 120, 80, 3.2]);
    const n = Number((lead * Math.pow(10, e)).toPrecision(8));
    return {
      title: 'Technische Schreibweise', q: `In der Technik nimmt man nur die Exponenten 3, 6 oder 9. Ergänze.<div class="big">${fmt(n)} = □ · ${tenPow(e)}</div>`,
      type: 'num', ans: lead, pre: '□ =',
      hint: `Schiebe das Komma um genau ${Math.abs(e)} Stellen nach ${e > 0 ? 'links' : 'rechts'}. Vor dem Komma dürfen hier auch mehrere Ziffern stehen.`,
      sol: [`Komma um ${Math.abs(e)} Stellen nach ${e > 0 ? 'links' : 'rechts'}: ${fmt(lead)}`, `${fmt(n)} = ${fmt(lead)} · ${tenPow(e)}`]
    };
  },
  einheiten() {
    // nur EINE Umwandlung: von Meter direkt in mm, µm oder nm (1 m = 10^e …)
    const c = pick([
      { txt: 'Ein Regentropfen hat', v: pick([0.002, 0.003, 0.004]), was: 'Durchmesser', to: 'mm', name: 'Millimeter', e: 3 },
      { txt: 'Ein Segeltuch ist', v: pick([0.0003, 0.0004, 0.00035]), was: 'dick', to: 'µm', name: 'Mikrometer', e: 6 },
      { txt: 'Eine dünne Angelschnur ist', v: pick([0.00012, 0.00015, 0.0002]), was: 'dick', to: 'µm', name: 'Mikrometer', e: 6 },
      { txt: 'Ein Haar ist etwa', v: pick([0.00006, 0.00007, 0.00008]), was: 'dick', to: 'µm', name: 'Mikrometer', e: 6 },
      { txt: 'Eine Lackschicht auf dem Bootsrumpf ist', v: pick([0.00005, 0.00006, 0.00008]), was: 'dick', to: 'nm', name: 'Nanometer', e: 9 }
    ]);
    const f = Math.pow(10, c.e), res = Number((c.v * f).toPrecision(8));
    return {
      title: 'Kleine Größen', q: `${c.txt} <b>${fmt(c.v)} m</b> ${c.was}. Gib das in <b>${c.to}</b> (${c.name}) an.<br><small class="muted">Nutze die Tabelle mit den Vorsilben.</small>`,
      sketch: vorsilbenTabelle([c.to[0]]), type: 'num', ans: res, post: c.to,
      hint: `${c.name.replace('meter', '')} steht für 10<sup>${c.e}</sup> (1 m = 10<sup>${c.e}</sup> ${c.to}). Schreib die Zehnerpotenz einfach dazu: ${fmt(c.v)} m = ${fmt(c.v)} · 10<sup>${c.e}</sup> ${c.to}. Dann ausrechnen – das Komma rückt ${c.e} Stellen nach rechts.`,
      sol: [`Zehnerpotenz aus der Tabelle dazuschreiben: ${fmt(c.v)} m = ${fmt(c.v)} · 10<sup>${c.e}</sup> ${c.to}`, `= ${fmt(c.v)} · ${fmt(f)} ${c.to}`, `= ${fmt(res)} ${c.to} (Komma ${c.e} Stellen nach rechts)`]
    };
  },

  /* ===== Regatta 3: Quadrat- und Kubikwurzeln ===== */
  wurzelGanz() {
    const n = R(4, 20);
    return {
      title: 'Quadratwurzel', q: `Bestimme.<div class="big">${sq(n * n)} = ?</div>`, type: 'num', ans: n,
      hint: `Welche Zahl ergibt mit sich selbst multipliziert ${n * n}?`,
      sol: [`${n} · ${n} = ${n * n}`, `also ${sq(n * n)} = ${n}`]
    };
  },
  wurzelDez() {
    const n = R(2, 15), k = pick([-1, -2, 1, 2]);
    const r = n * Math.pow(10, k), rad = Number((r * r).toPrecision(10));
    return {
      title: 'Wurzel aus Dezimalzahlen', q: `Bestimme.<div class="big">${sq(fmt(rad))} = ?</div>`, type: 'num', ans: r,
      hint: k < 0 ? `Denk an ${sq(n * n)} = ${n}. Das Ergebnis hat halb so viele Nachkommastellen wie die Zahl unter der Wurzel.` : `Denk an ${sq(n * n)} = ${n}. Zwei Nullen unter der Wurzel ergeben eine Null im Ergebnis.`,
      sol: [`${fmt(r)} · ${fmt(r)} = ${fmt(rad)}`, `also ${sq(fmt(rad))} = ${fmt(r)}`]
    };
  },
  einschachteln() {
    let n; do { n = R(11, 390); } while (Number.isInteger(Math.sqrt(n)));
    const f = Math.floor(Math.sqrt(n));
    const opts = shuffle([...new Set([[f, f + 1], [f - 1, f], [f + 1, f + 2], [Math.floor(n / 2) - 1, Math.floor(n / 2)]].map(([a, b]) => `${a} < ${sq(n)} < ${b}`))]);
    return {
      title: 'Einschachteln', q: `Zwischen welchen benachbarten ganzen Zahlen liegt ${sq(n)}?`, type: 'mc', options: opts, ans: `${f} < ${sq(n)} < ${f + 1}`,
      hint: `Suche die Quadratzahlen direkt unter und über ${n}.`,
      sol: [`${f}<sup>2</sup> = ${f * f} &lt; ${n} &lt; ${(f + 1) * (f + 1)} = ${f + 1}<sup>2</sup>`, `also ${f} &lt; ${sq(n)} &lt; ${f + 1}`]
    };
  },
  quadratFlaeche() {
    const a = pick([R(3, 25), R(11, 99) / 10, R(11, 99) / 10, pick([1.5, 2.5, 3.5, 4.5, 0.8, 1.2])]);
    const A = Number((a * a).toPrecision(10));
    const ctx = pick(['Ein quadratisches Sonnensegel über dem Steg', 'Eine quadratische Badeplattform im See', 'Ein quadratisches Startfeld aus Bojen', 'Ein quadratischer Bootsanhänger-Stellplatz']);
    return {
      title: 'Vom Quadrat zur Seite', q: `${ctx} hat den Flächeninhalt <b>${fmt(A)} m²</b>. Wie lang ist eine Seite?`,
      sketch: skQuadrat(`A = ${fmt(A)} m²`), type: 'num', ans: a, post: 'm',
      hint: 'Beim Quadrat gilt A = a · a. Du suchst also die Zahl, die mit sich selbst multipliziert den Flächeninhalt ergibt.',
      sol: [`a = ${sq(fmt(A))}`, `${fmt(a)} · ${fmt(a)} = ${fmt(A)}`, `a = ${fmt(a)} m`]
    };
  },
  wuerfelVolumen() {
    const a = pick([R(2, 15), R(12, 49) / 10, R(12, 49) / 10, pick([1.5, 0.5, 0.2, 20])]);
    const V = Number((a * a * a).toPrecision(10)), u = a >= 20 ? 'cm' : pick(['cm', 'dm']);
    const ctx = pick(['Ein würfelförmiger Ankerstein', 'Eine würfelförmige Proviantkiste', 'Ein würfelförmiger Schwimmkörper einer Boje']);
    return {
      title: 'Vom Würfel zur Kante', q: `${ctx} hat das Volumen <b>${fmt(V)} ${u}³</b>. Wie lang ist eine Kante?`,
      sketch: skWuerfel(`V = ${fmt(V)} ${u}³`), type: 'num', ans: a, post: u,
      hint: 'Beim Würfel gilt V = a · a · a. Gesucht ist die Kubikwurzel.',
      sol: [`a = ${cb(fmt(V))}`, `${fmt(a)} · ${fmt(a)} · ${fmt(a)} = ${fmt(V)}`, `a = ${fmt(a)} ${u}`]
    };
  },
  kubikwurzel() {
    // kleine Zahlen, ohne Taschenrechner; Dezimalfälle nur etwa jede sechste Aufgabe
    const r = rand(), a = r < 1 / 6 ? pick([0.1, 0.2]) : r < 0.25 ? 10 : R(2, 5);
    const V = Number((a ** 3).toPrecision(10)), dez = a < 1, g = Math.round(a * 10);
    return {
      title: 'Kubikwurzel', q: `Bestimme.<div class="big">${cb(fmt(V))} = ?</div>`, type: 'num', ans: a,
      hint: dez ? `Denk an ${cb(g ** 3)} = ${g}. Drei Nachkommastellen unter der Wurzel ergeben eine Nachkommastelle im Ergebnis.`
        : `Welche Zahl ergibt dreimal mit sich selbst multipliziert ${fmt(V)}?`,
      sol: dez ? [`Ohne Komma: ${cb(g ** 3)} = ${g}, denn ${g} · ${g} · ${g} = ${g ** 3}`,
                  `${fmt(V)} hat drei Nachkommastellen → das Ergebnis hat eine: ${fmt(a)}`,
                  `Probe: ${fmt(a)} · ${fmt(a)} · ${fmt(a)} = ${fmt(V)}`]
        : [`${fmt(a)} · ${fmt(a)} · ${fmt(a)} = ${fmt(V)}`, `also ${cb(fmt(V))} = ${fmt(a)}`]
    };
  },
  wuerfelGebilde() {
    const key = pick(['L4', 'T4', 'block4', 'treppe6', 'podest6', 'block8', 'reihe3', 'turm3']), K = KOERPER[key], k = K.cells.length;
    const a = pick([R(2, 9), R(2, 9), R(12, 35) / 10]), V = Number((k * a ** 3).toPrecision(10));
    const ctx = key === 'podest6' ? 'Das Siegerpodest der Regatta' : key === 'treppe6' ? 'Eine Treppe zum Steg' : pick(['Ein Fundament für den Bootssteg', 'Ein Stapel Proviantkisten', 'Ein Ballastblock für eine Boje']);
    return {
      title: 'Körper aus Würfeln', q: `${ctx} besteht aus <b>${k} gleich großen Würfeln</b>. Zusammen haben sie das Volumen <b>${fmt(V)} dm³</b>. Wie lang ist die Kante eines Würfels?`,
      sketch: skKoerper(K.cells, `V gesamt = ${fmt(V)} dm³`), type: 'num', ans: a, post: 'dm',
      hint: `Zähle die Würfel (${k}) und rechne aus, wie groß das Volumen eines einzelnen Würfels ist. Dann ziehst du die Kubikwurzel.`,
      sol: [`Ein Würfel: ${fmt(V)} : ${k} = ${fmt(a ** 3)} dm³`, `a = ${cb(fmt(a ** 3))} = ${fmt(a)} dm`, `Probe: ${fmt(a)} · ${fmt(a)} · ${fmt(a)} = ${fmt(a ** 3)}`]
    };
  },
  gebildeOberflaeche() {
    const key = pick(['reihe2', 'reihe3', 'turm3']), K = KOERPER[key], n = K.cells.length, faces = 4 * n + 2;
    const a = R(2, 10), O = faces * a * a;
    const ctx = key === 'turm3' ? `Ein Turm aus ${n} würfelförmigen Kisten` : `Ein Schwimmsteg aus ${n} würfelförmigen Pontons`;
    return {
      title: 'Oberfläche eines Würfelkörpers', q: `${ctx} wird rundum gestrichen, auch unten. Die gestrichene Oberfläche ist <b>${O} dm²</b>. Wie lang ist die Kante eines Würfels?`,
      sketch: skKoerper(K.cells, `O = ${O} dm²`), type: 'num', ans: a, post: 'dm',
      hint: `Zähle, aus wie vielen Quadraten die Oberfläche besteht. Jeder Würfel hat 6 Flächen – aber wo zwei Würfel aneinanderstoßen, sind 2 Flächen verdeckt.`,
      sol: [`Quadrate: ${n} · 6 = ${6 * n}, davon ${n - 1} · 2 = ${2 * (n - 1)} verdeckt → ${faces} Quadrate`, `Ein Quadrat: ${O} : ${faces} = ${a * a} dm²`, `a = ${sq(a * a)} = ${a} dm`]
    };
  },
  figurQuadrate() {
    const cells = pick(FIGUREN), k = cells.length, a = pick([R(2, 12), R(12, 45) / 10]), A = Number((k * a * a).toPrecision(10));
    return {
      title: 'Gebilde aus Quadraten', q: `Ein Steg-Belag besteht aus <b>${k} gleich großen</b> quadratischen Platten. Zusammen sind sie <b>${fmt(A)} dm²</b> groß. Wie lang ist die Seite einer Platte?`,
      sketch: skFigur(cells, `gesamt ${fmt(A)} dm²`), type: 'num', ans: a, post: 'dm',
      hint: 'Rechne zuerst aus, wie groß eine einzelne Platte ist. Dann ziehst du die Wurzel.',
      sol: [`Eine Platte: ${fmt(A)} : ${k} = ${fmt(a * a)} dm²`, `a = ${sq(fmt(a * a))} = ${fmt(a)} dm`]
    };
  },

  /* ===== Regatta 4: Wurzelgesetze & Gebilde ===== */
  wurzelProdukt() {
    const k = pick([2, 3, 5, 6, 7]), p = 1, q = R(2, 3), a = k * p * p, b = k * q * q;
    return {
      title: 'Wurzeln multiplizieren', q: `Berechne.<div class="big">${sq(a)} · ${sq(b)} = ?</div>`, type: 'num', ans: k * p * q,
      hint: 'Fasse zu einer Wurzel zusammen: √a · √b = √(a · b). Das Produkt ist eine Quadratzahl.',
      sol: [`${sq(a)} · ${sq(b)} = ${sq(`${a} · ${b}`)} = ${sq(a * b)}`, `= ${k * p * q}`]
    };
  },
  wurzelQuotient() {
    const k = pick([2, 3, 5, 10]), n = R(2, 9), a = k * n * n;
    return {
      title: 'Wurzeln dividieren', q: `Berechne.<div class="big">${sq(a)} : ${sq(k)} = ?</div>`, type: 'num', ans: n,
      hint: 'Fasse zu einer Wurzel zusammen: √a : √b = √(a : b).',
      sol: [`${sq(a)} : ${sq(k)} = ${sq(`${a} : ${k}`)} = ${sq(n * n)}`, `= ${n}`]
    };
  },
  zusammenfassen() {
    const k = pick(SQFREE), c = [R(2, 9), R(1, 9), R(1, 6)], s = [1, pick([1, -1]), pick([1, -1])];
    let res = c[0] + s[1] * c[1] + s[2] * c[2];
    if (res <= 0) return G.zusammenfassen();
    const term = `${c[0]}${sq(k)} ${s[1] > 0 ? '+' : '−'} ${c[1]}${sq(k)} ${s[2] > 0 ? '+' : '−'} ${c[2]}${sq(k)}`;
    return {
      title: 'Wurzelterme zusammenfassen', q: `Fasse zusammen.<div class="big">${term}</div>`, type: 'surd', c: res, r: k,
      hint: `Alle Summanden haben dieselbe Wurzel ${sq(k)}. Rechne nur mit den Zahlen davor – wie bei 3x + 2x.`,
      sol: [`${c[0]} ${s[1] > 0 ? '+' : '−'} ${c[1]} ${s[2] > 0 ? '+' : '−'} ${c[2]} = ${res}`, `Ergebnis: ${surd(res, k)}`]
    };
  },
  teilweise() {
    let m, k; do { m = R(2, 6); k = pick(SQFREE); } while (m * m * k > 300);
    return {
      title: 'Teilweise Wurzel ziehen', q: `Ziehe die Wurzel teilweise.<div class="big">${sq(m * m * k)} = ?</div>`, type: 'surd', c: m, r: k,
      hint: `Zerlege ${m * m * k} in eine möglichst große Quadratzahl mal eine Restzahl. Quadratzahlen: 4, 9, 16, 25, 36 …`,
      sol: [`${sq(m * m * k)} = ${sq(`${m * m} · ${k}`)}`, `= ${sq(m * m)} · ${sq(k)}`, `= ${surd(m, k)}`]
    };
  },
  quadratWurzelterm() {
    let m, k; do { m = R(2, 6); k = pick([2, 3, 5, 6, 7]); } while (m * m * k > 200);
    const A = m * m * k;
    const ctx = pick(['Ein quadratisches Sonnendeck auf dem Steg', 'Eine quadratische Liegewiese am Ufer', 'Ein quadratisches Segeltuch für das Bootsdach']);
    return {
      title: 'Quadratseite als Wurzelterm', q: `${ctx} hat den Flächeninhalt <b>${A} m²</b>. Gib die Seitenlänge als vereinfachten Wurzelterm an.`,
      sketch: skQuadrat(`A = ${A} m²`), type: 'surd', c: m, r: k, post: 'm',
      hint: `Die Seite ist a = ${sq(A)}. ${A} ist keine Quadratzahl – zerlege ${A} in eine Quadratzahl mal eine Restzahl und ziehe teilweise die Wurzel.`,
      sol: [`a = ${sq(A)} = ${sq(`${m * m} · ${k}`)}`, `= ${sq(m * m)} · ${sq(k)} = ${surd(m, k)} m`]
    };
  },

  wuerfelOberflaeche() {
    const a = pick([R(2, 15), R(12, 49) / 10, 1.5, 2.5]), O = Number((6 * a * a).toPrecision(10));
    return {
      title: 'Würfel aus der Oberfläche', q: `Eine würfelförmige Kiste für Segelzubehör soll ringsum lackiert werden. Ihre Oberfläche beträgt <b>${fmt(O)} dm²</b>. Wie lang ist eine Kante?`,
      sketch: skWuerfel(`O = ${fmt(O)} dm²`), type: 'num', ans: a, post: 'dm',
      hint: 'Ein Würfel hat 6 gleich große quadratische Flächen. Wie groß ist eine davon?',
      sol: [`Eine Fläche: ${fmt(O)} : 6 = ${fmt(a * a)} dm²`, `a = ${sq(fmt(a * a))} = ${fmt(a)} dm`]
    };
  },

  /* ===== Regatta 5: Verknüpfungen ===== */
  teilweiseZusammen() {
    const k = pick([2, 3, 5, 6, 7]);
    let m1, m2; do { m1 = R(2, 5); m2 = R(2, 5); } while (m1 === m2 || m1 * m1 * k > 150 || m2 * m2 * k > 150);
    const c1 = R(1, 3), c2 = R(1, 3), sub = rand() < .35;
    const res = c1 * m1 + (sub ? -1 : 1) * c2 * m2;
    if (res <= 0) return G.teilweiseZusammen();
    const cf = c => c === 1 ? '' : c + ' · ';
    return {
      title: 'Erst zerlegen, dann zusammenfassen', q: `Vereinfache so weit wie möglich.<div class="big">${cf(c1)}${sq(m1 * m1 * k)} ${sub ? '−' : '+'} ${cf(c2)}${sq(m2 * m2 * k)}</div>`,
      type: 'surd', c: res, r: k,
      hint: `So wie es da steht, kannst du nicht zusammenfassen. Ziehe erst bei beiden Wurzeln teilweise die Wurzel – dann steht überall ${sq(k)}.`,
      sol: [`${sq(m1 * m1 * k)} = ${surd(m1, k)} &nbsp; und &nbsp; ${sq(m2 * m2 * k)} = ${surd(m2, k)}`, `${cf(c1)}${surd(m1, k)} ${sub ? '−' : '+'} ${cf(c2)}${surd(m2, k)} = ${surd(c1 * m1, k)} ${sub ? '−' : '+'} ${surd(c2 * m2, k)}`, `= ${surd(res, k)}`]
    };
  },
  dreiTerme() {
    const k = pick([2, 3, 5]);
    const m = [R(2, 4), R(2, 5), 1];
    const c3 = R(1, 6);
    const res = m[0] + m[1] - c3;
    if (res <= 0 || m[0] === m[1]) return G.dreiTerme();
    return {
      title: 'Wurzel-Kombi', q: `Vereinfache so weit wie möglich.<div class="big">${sq(m[0] * m[0] * k)} + ${sq(m[1] * m[1] * k)} − ${c3 === 1 ? '' : c3}${sq(k)}</div>`,
      type: 'surd', c: res, r: k,
      hint: `Ziehe bei den ersten beiden Wurzeln teilweise die Wurzel. Danach haben alle drei Summanden ${sq(k)}.`,
      sol: [`${sq(m[0] * m[0] * k)} = ${surd(m[0], k)}, &nbsp; ${sq(m[1] * m[1] * k)} = ${surd(m[1], k)}`, `${surd(m[0], k)} + ${surd(m[1], k)} − ${surd(c3, k)} = ${surd(res, k)}`]
    };
  },
  zweiQuadrate() {
    const k = pick([2, 3, 5]);
    let m1, m2; do { m1 = R(2, 4); m2 = R(2, 5); } while (m1 === m2);
    const A1 = m1 * m1 * k, A2 = m2 * m2 * k;
    return {
      title: 'Zwei Pontons', q: `Zwei quadratische Schwimmpontons liegen direkt nebeneinander. Sie haben die Flächen <b>${A1} m²</b> und <b>${A2} m²</b>. Wie lang sind beide zusammen? Gib das Ergebnis als vereinfachten Wurzelterm an.`,
      sketch: skZweiQuadrate(`${A1} m²`, `${A2} m²`, m1, m2), type: 'surd', c: m1 + m2, r: k, post: 'm',
      hint: `Die Seitenlängen sind ${sq(A1)} und ${sq(A2)}. Ziehe teilweise die Wurzel und fasse dann zusammen.`,
      sol: [`Seiten: ${sq(A1)} = ${surd(m1, k)} &nbsp; und &nbsp; ${sq(A2)} = ${surd(m2, k)}`, `Länge: ${surd(m1, k)} + ${surd(m2, k)} = ${surd(m1 + m2, k)} m`]
    };
  },
  quadratUmfang() {
    const k = pick([2, 3, 5, 6]), m = R(2, 5), A = m * m * k;
    return {
      title: 'Zaun ums Quadrat', q: `Ein quadratischer Liegeplatz an Land hat <b>${A} m²</b>. Er soll ringsum mit einem Seil abgesperrt werden. Wie lang ist das Seil? Gib einen vereinfachten Wurzelterm an.`,
      sketch: skQuadrat(`A = ${A} m²`, 'Umfang = ?'), type: 'surd', c: 4 * m, r: k, post: 'm',
      hint: 'Erst die Seitenlänge als Wurzel bestimmen und teilweise die Wurzel ziehen. Der Umfang besteht aus 4 Seiten.',
      sol: [`a = ${sq(A)} = ${sq(`${m * m} · ${k}`)} = ${surd(m, k)} m`, `u = 4 · ${surd(m, k)} = ${surd(4 * m, k)} m`]
    };
  },
  wuerfelKette() {
    const a = R(2, 9), V = a ** 3;
    return {
      title: 'Würfel: von V nach O', q: `Ein würfelförmiger Schwimmkörper hat das Volumen <b>${V} dm³</b>. Er bekommt einen neuen Anstrich. Wie groß ist seine Oberfläche?`,
      sketch: skWuerfel(`V = ${V} dm³`, 'O = ?'), type: 'num', ans: 6 * a * a, post: 'dm²',
      hint: 'Zwei Schritte: Kubikwurzel ergibt die Kante. Dann: 6 Quadrate mit dieser Seitenlänge.',
      sol: [`a = ${cb(V)} = ${a} dm`, `Eine Fläche: ${a} · ${a} = ${a * a} dm²`, `O = 6 · ${a * a} = ${6 * a * a} dm²`]
    };
  },
  klammerWurzel() {
    const k = pick([2, 3, 5]);
    let p, q; do { p = R(1, 4); q = R(2, 5); } while (p === q);
    return {
      title: 'Wurzel mal Klammer', q: `Berechne.<div class="big">${sq(k)} · (${sq(k * p * p)} + ${sq(k * q * q)})</div>`, type: 'num', ans: k * (p + q),
      hint: `Multipliziere ${sq(k)} mit jedem Summanden in der Klammer und fasse jeweils zu einer Wurzel zusammen.`,
      sol: [`= ${sq(`${k} · ${k * p * p}`)} + ${sq(`${k} · ${k * q * q}`)}`, `= ${sq(k * k * p * p)} + ${sq(k * k * q * q)}`, `= ${k * p} + ${k * q} = ${k * (p + q)}`]
    };
  },
  rechteckWurzel() {
    const k = pick([2, 3, 5, 6]);
    let p, q; do { p = R(1, 4); q = R(2, 5); } while (p === q);
    const a = k * p * p, b = k * q * q;
    return {
      title: 'Rechteckiges Segel-Lager', q: `Ein rechteckiger Lagerraum für Segel ist <b>${sq(a)} m</b> lang und <b>${sq(b)} m</b> breit. Wie groß ist seine Fläche?`,
      sketch: skRechteck(`√${a} m`, `√${b} m`),
      type: 'num', ans: k * p * q, post: 'm²',
      hint: 'A = Länge · Breite. Fasse die beiden Wurzeln zu einer zusammen – unter der Wurzel steht dann eine Quadratzahl.',
      sol: [`A = ${sq(a)} · ${sq(b)} = ${sq(a * b)}`, `= ${k * p * q} m²`]
    };
  },
  sciProdukt() {
    const a = R(2, 4), b = R(2, 3), e1 = R(2, 6), e2 = R(2, 5);
    const m = a * b, e = e1 + e2;
    return {
      title: 'Zehnerpotenzen multiplizieren', q: `Auf dem Bodensee fahren an einem Sommertag rund ${a} · ${tenPow(e1)} Boote, jedes im Schnitt ${b} · ${tenPow(e2)} m weit. Wie viele Meter sind das zusammen? Gib das Ergebnis in ${begriff('wiss', 'wissenschaftlicher Schreibweise')} an.<br><small class="muted">(Fantasiezahlen – nur zum Rechnen.)</small>`,
      type: 'sci', m: m >= 10 ? m / 10 : m, e: m >= 10 ? e + 1 : e,
      hint: `Multipliziere die Zahlen vorne (${a} · ${b}) und die Zehnerpotenzen getrennt. Bei gleicher Basis werden die Exponenten addiert.`,
      sol: [`${a} · ${b} = ${m}`, `${tenPow(e1)} · ${tenPow(e2)} = ${tenPow(e)}`, m >= 10 ? `${m} · ${tenPow(e)} = ${fmt(m / 10)} · ${tenPow(e + 1)}` : `Ergebnis: ${m} · ${tenPow(e)}`]
    };
  }
};


/* ---------- Zusätzliche Generatoren für den Check ---------- */
const rootN = (n, x) => `<span class="rt"><sup class="idx">${n}</sup>√<span class="rad">${x}</span></span>`;
G.trAnzeige = function () {
  const m = pick([2.5, 3.8, 4.73, 6.02, 1.25, 7.1, 9.46, 5.9, 1.08, 3.35]), e = R(5, 9);
  const v = k => fmt(Number((m * Math.pow(10, k)).toPrecision(8)));
  const right = v(e);
  const opts = shuffle([right, v(e - 1), v(e + 1), fmt(Number((m * e).toPrecision(8)))]);
  return {
    title: 'Taschenrechneranzeige', q: `Der Taschenrechner zeigt:<div class="display">${String(m)}E${e}</div>Welche Zahl ist gemeint?`,
    type: 'mc', options: opts, ans: right,
    hint: `„E${e}“ bedeutet „· 10 hoch ${e}“. Das Komma rückt also ${e} Stellen nach rechts.`,
    sol: [`${String(m)}E${e} bedeutet ${fmt(m)} · ${tenPow(e)}`, `Komma ${e} Stellen nach rechts: ${right}`]
  };
};
G.nteWurzel = function () {
  const [n, a] = pick([[4, 2], [4, 3], [5, 2], [6, 2], [4, 10], [5, 10], [3, 4], [3, 6], [4, 5]]);
  const v = Math.pow(a, n);
  return {
    title: 'n-te Wurzel', q: `Bestimme.<div class="big">${rootN(n, fmt(v))} = ?</div>`, type: 'num', ans: a,
    hint: `Welche Zahl ergibt ${n}-mal mit sich selbst multipliziert ${fmt(v)}?`,
    sol: [`${Array(n).fill(a).join(' · ')} = ${fmt(v)}`, `also ${rootN(n, fmt(v))} = ${a}`]
  };
};

/* Basisniveau (Abgleich mit dem Basistraining im Buch): nur positive ganze Basen, ohne Minus und ohne Dezimalzahlen */
G.potenzwertBasis = function () {
  const [b, e] = pick([[2, R(3, 7)], [3, R(2, 4)], [4, R(2, 3)], [5, R(2, 3)], [R(6, 12), 2], [10, R(3, 6)], [6, 3]]);
  const v = Math.pow(b, e);
  return {
    title: 'Potenzwert', q: `Berechne.<div class="big">${pw(b, e)} = ?</div>`, type: 'num', ans: v,
    hint: `Der Exponent ${e} sagt dir, wie oft du die Basis ${b} mit sich selbst multiplizierst.`,
    sol: [`${pw(b, e)} = ${Array(e).fill(b).join(' · ')}`, `= ${fmt(v)}`]
  };
};
/* Quadratwurzeln aus Dezimalzahlen und großen Zahlen, im Kopf lösbar (wie √0,16, √2,25, √900, √1 000 000) */
G.wurzelDezBasis = function () {
  const r = pick([() => pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15]) / 10, () => R(2, 15) * 10, () => R(1, 10) * 100])();
  const rad = Number((r * r).toPrecision(10));
  const base = Number.isInteger(r) ? +String(r).replace(/0+$/, '') : Math.round(r * 10);   // 0,7 → 7; 120 → 12; 300 → 3
  return {
    title: 'Quadratwurzel im Kopf', q: `Bestimme ohne Taschenrechner.<div class="big">${sq(fmt(rad))} = ?</div>`, type: 'num', ans: r,
    hint: !Number.isInteger(r) ? `Denk an ${sq(base * base)} = ${base}. Das Ergebnis hat halb so viele Nachkommastellen wie die Zahl unter der Wurzel.`
      : `Denk an ${sq(base * base)} = ${base}. Je zwei Nullen unter der Wurzel ergeben eine Null im Ergebnis.`,
    sol: [`${fmt(r)} · ${fmt(r)} = ${fmt(rad)}`, `also ${sq(fmt(rad))} = ${fmt(r)}`]
  };
};

/* ---------- Wiederholung aus früheren Themen ----------
   Brüche addieren: nur EIN Bruch muss erweitert werden, Summe < 1 und schon gekürzt (kein Kürzen nötig) */
const frac = (z, n) => `<span class="fr"><span>${z}</span><span>${n}</span></span>`;
const ggT = (a, b) => b ? ggT(b, a % b) : a;
G.bruchAdd = function () {
  let b, k, d, a, c;
  do {
    b = pick([2, 3, 4, 5, 6]); k = pick([2, 3]); d = b * k;
    a = R(1, b - 1); c = R(1, d - 1);
  } while (d > 12 || ggT(a, b) !== 1 || ggT(c, d) !== 1 || a * k + c >= d || ggT(a * k + c, d) !== 1);
  const z = a * k + c, first = rand() < .5;   // mal steht der zu erweiternde Bruch vorne, mal hinten
  const term = first ? `${frac(a, b)} + ${frac(c, d)}` : `${frac(c, d)} + ${frac(a, b)}`;
  const ex = `${frac(a, b)} = ${frac(a * k, d)}`;
  return {
    title: 'Brüche addieren', q: `Berechne.<div class="big">${term} = ?</div>`, type: 'frac', n: z, d,
    hint: `Die Nenner sind verschieden. ${d} ist ein Vielfaches von ${b}: Erweitere ${frac(a, b)} mit ${k}, dann haben beide den Nenner ${d}. Danach Zähler addieren, der Nenner bleibt.`,
    sol: [`Erweitern mit ${k}: ${ex}`, `${first ? `${frac(a * k, d)} + ${frac(c, d)}` : `${frac(c, d)} + ${frac(a * k, d)}`} = ${frac(z, d)}`]
  };
};

/* Nur in der Übung: eine Nachkommastelle prüfen statt mühsam suchen (Taschenrechner erlaubt) */
G.einschachtelnDez = function () {
  let n; do { n = R(11, 150); } while (Number.isInteger(Math.sqrt(n)));
  const f = Math.floor(Math.sqrt(n));
  let k = Math.floor(Math.sqrt(100 * n)); while (k * k > 100 * n) k--; while ((k + 1) * (k + 1) <= 100 * n) k++;   // exakt: k² ≤ 100n < (k+1)²
  const d1 = s => (s / 10).toFixed(1).replace('.', ',');
  const iv = a => `${d1(a)} < ${sq(n)} < ${d1(a + 1)}`;
  const est = Math.round((f + (n - f * f) / (2 * f + 1)) * 10);   // lineare Schätzung als guter Startwert
  const cand = [k - 1, k + 1, f * 10 + (9 - (k - f * 10)), k + 3, k - 3, k + 5].filter(a => a !== k && a >= 10 * f && a + 1 <= 10 * (f + 1));   // nur Intervalle innerhalb der genannten ganzen Zahlen
  const opts = shuffle([...new Set([k, ...cand])].slice(0, 4).map(iv));
  const sqr = a => fmt(Number(((a / 10) ** 2).toFixed(4)));
  return {
    title: 'Auf eine Nachkommastelle', q: `${sq(n)} liegt zwischen ${f} und ${f + 1}. Zwischen welchen Zahlen liegt ${sq(n)} <b>genauer</b>?`,
    type: 'mc', options: opts, ans: iv(k),
    hint: `Schätze zuerst: ${n} liegt ${n - f * f < (f + 1) * (f + 1) - n ? `näher an ${f * f} = ${f}², also liegt ${sq(n)} eher knapp über ${f}` : `näher an ${(f + 1) * (f + 1)} = ${f + 1}², also liegt ${sq(n)} eher knapp unter ${f + 1}`}. Rechne mit dem Taschenrechner ${d1(est)}² und dann die Nachbarn – so musst du nicht alle Zahlen von ${d1(10 * f + 1)} an durchprobieren.`,
    sol: [`${d1(k)}² = ${sqr(k)} &lt; ${n}`, `${d1(k + 1)}² = ${sqr(k + 1)} &gt; ${n}`, `also ${iv(k)}`]
  };
};

/* Taschenrechner erlaubt, wo sonst schriftliches Rechnen die Zeit frisst (Regel der Wurzel-Regatta) */
const MIT_TR = new Set(['exponent', 'groesstePotenz', 'quadratFlaeche', 'wuerfelVolumen', 'figurQuadrate',
  'wuerfelOberflaeche', 'wuerfelKette', 'rechteckWurzel', 'wuerfelGebilde', 'gebildeOberflaeche', 'trAnzeige', 'einschachtelnDez']);

/* ---------- Die Aufgabenplätze: 12 zum aktuellen Thema (je einer pro Kompetenz aus dem Kompetenzraster)
   + 1 Wiederholung aus einem früheren Thema (review: true, farblich abgesetzt, im Test immer zuletzt) ----------
   Reihenfolge NICHT ändern, solange Ergebnisse aus laufenden Tests eingesammelt werden. */
/* area = Abschnitt im Kompetenzraster, name = Themenname für „Gezielt üben“.
   Die „Ich kann …“-Sätze stehen in RASTER und müssen WORTGLEICH im Kompetenzraster stehen. */
const SLOTS = [
  { area: 'S. 10–11 Potenzen', name: 'Potenzschreibweise', gens: ['produktPotenz', 'exponent'] },
  { area: 'S. 10–11 Potenzen', name: 'Potenzwerte berechnen', gens: ['potenzwertBasis', 'groesstePotenz'] },
  { area: 'S. 12–13 Zehnerpotenzen', name: 'Zehnerpotenzen ausschreiben', gens: ['sciZuruck'] },
  { area: 'S. 12–13 Zehnerpotenzen', name: 'Wissenschaftliche und technische Schreibweise', gens: ['sciVoll', 'technisch', 'sciExp'] },
  { area: 'S. 12–13 Zehnerpotenzen', name: 'Taschenrechneranzeige', gens: ['trAnzeige'] },
  { area: 'S. 14–15 Quadratwurzeln', name: 'Quadratwurzeln bestimmen', gens: ['wurzelGanz', 'wurzelDezBasis'] },
  { area: 'S. 14–15 Quadratwurzeln', name: 'Seiten- und Kantenlängen', gens: ['quadratFlaeche'], practiceGens: ['quadratFlaeche', 'wuerfelOberflaeche'] },   // Würfel-Oberfläche (2 Schritte) nur in der Übung
  { area: 'S. 16–17 Bestimmen von Quadratwurzeln', name: 'Wurzeln näherungsweise bestimmen', gens: ['einschachteln'], practiceGens: ['einschachteln', 'einschachtelnDez'] },   // im Test nur ganze Zahlen
  { area: 'S. 20–21 Wurzeln multiplizieren und dividieren', name: 'Wurzeln multiplizieren und dividieren', gens: ['wurzelProdukt', 'wurzelQuotient'] },
  { area: 'S. 22–23 Rechnen mit Quadratwurzeln (a)', name: 'Teilweise Wurzel ziehen', gens: ['teilweise'] },
  { area: 'S. 22–23 Rechnen mit Quadratwurzeln (b)', name: 'Wurzelterme zusammenfassen', gens: ['zusammenfassen'] },
  { area: 'S. 24–25 Kubikwurzeln und n-te Wurzeln', name: 'Kubikwurzeln und n-te Wurzeln', gens: ['kubikwurzel', 'nteWurzel', 'wuerfelVolumen'] },
  { area: 'Wiederholung: Bruchrechnung', name: 'Brüche addieren', gens: ['bruchAdd'], review: true }   // bei künftigen Tests hier ein anderes altes Thema eintragen
];
const RASTER = {
  produktPotenz: 'Produkte als Potenz angeben und berechnen.',
  exponent: 'Zahlen in der Potenzschreibweise angeben.',
  potenzwert: 'Potenzwerte berechnen.', minusFalle: 'Potenzwerte berechnen.', potenzwertBasis: 'Potenzwerte berechnen.', groesstePotenz: 'Potenzwerte berechnen.',
  sciZuruck: 'Zahlen ohne Potenzen angeben.',
  sciVoll: 'Zahlen in technischer und wissenschaftlicher Schreibweise angeben.', sciExp: 'Zahlen in technischer und wissenschaftlicher Schreibweise angeben.', technisch: 'Zahlen in technischer und wissenschaftlicher Schreibweise angeben.',
  trAnzeige: 'die Taschenrechneranzeige interpretieren.',
  wurzelGanz: 'Quadratwurzeln bestimmen.', wurzelDez: 'Quadratwurzeln bestimmen.', wurzelDezBasis: 'Quadratwurzeln bestimmen.',
  quadratFlaeche: 'Seiten- und Kantenlängen von Quadraten und Würfeln durch Wurzelziehen bestimmen.',
  wuerfelOberflaeche: 'Seiten- und Kantenlängen von Quadraten und Würfeln durch Wurzelziehen bestimmen.',
  einschachteln: 'Quadratwurzeln näherungsweise bestimmen.', einschachtelnDez: 'Quadratwurzeln näherungsweise bestimmen.',
  wurzelProdukt: 'die Rechengesetze für Wurzeln anwenden.', wurzelQuotient: 'die Rechengesetze für Wurzeln anwenden.',
  teilweise: 'teilweise die Wurzel ziehen.',
  zusammenfassen: 'Terme durch Ausklammern vereinfachen und zusammenfassen.',
  bruchAdd: 'Brüche mit verschiedenen Nennern addieren.',
  kubikwurzel: 'Kubikwurzeln berechnen und vereinfachen.', nteWurzel: 'n-te Wurzeln berechnen.', wuerfelVolumen: 'Berechnungen an Würfeln durchführen.'
};

function makeTask(gen) { const t = G[gen](); t.gen = gen; t.tr = MIT_TR.has(gen); t.can = RASTER[gen]; return t; }

/* Rückmeldung in der Sprache des Kompetenzrasters: nach Abschnitten geordnet, je Aufgabe der „Ich kann …“-Satz */
function rasterReport(tasks, grades, withButtons = false) {
  const sym = g => g === 2 ? '<span class="g2">✓</span>' : g === 1 ? '<span class="g1">½</span>' : '<span class="g0">✗</span>';
  const idx = tasks.map((t, i) => i).sort((a, b) => tasks[a].slot - tasks[b].slot);
  let html = '', area = '';
  for (const i of idx) {
    const t = tasks[i];
    if (SLOTS[t.slot].area !== area) { if (area) html += '</div>'; area = SLOTS[t.slot].area; html += `<div class="rarea"><div class="rhead">${area}</div>`; }
    html += `<div class="rrow"><span class="sy">${sym(grades[i])}</span><span class="txt">Ich kann ${t.can}</span>${withButtons && grades[i] !== 2 ? ` <button class="mini" data-i="${t.slot}">üben</button>` : ''}</div>`;
  }
  return `<div class="rreport">${html}</div></div>`;
}

/* Übung: echter Zufall. slotIdx = null → alle Plätze; sonst n Aufgaben eines Platzes */
function practiceTasks(slotIdx = null, n = 5) {
  rand = Math.random;
  const gens = s => s.practiceGens || s.gens;   // die Übung darf mehr Varianten haben als der Test
  if (slotIdx === null) return shuffle(SLOTS.map((s, i) => Object.assign(makeTask(pick(gens(s))), { slot: i })));   // Übung gemischt, Test fest
  return Array.from({ length: n }, () => Object.assign(makeTask(pick(gens(SLOTS[slotIdx]))), { slot: slotIdx }));
}

/* Test: Aufgabentyp hängt nur vom Testcode ab (gleich für die ganze Klasse),
   die Zahlen hängen von Testcode + Listennummer ab (jeder bekommt andere). */
function testTasks(code, nr) {
  const out = SLOTS.map((s, i) => {
    rand = mulberry32(hash32(`typ|${code}|${i}`));
    const gen = pick(s.gens);
    rand = mulberry32(hash32(`zahl|${code}|${nr}|${i}`));
    return Object.assign(makeTask(gen), { slot: i });
  });
  rand = Math.random;
  return out;
}

/* ---------- Bewerten ----------
   ans: { k } bei Auswahl, sonst { a1, a2 } als Text. Ergebnis: 2 = richtig, 1 = halb (Wert stimmt, Form nicht), 0 = falsch, -1 = leer */
function grade(t, ans) {
  if (!ans) return -1;
  if (t.type === 'mc') return ans.k == null ? -1 : (t.options[ans.k] === t.ans ? 2 : 0);
  const v1 = parseNum(ans.a1 || '');
  if (t.type === 'num') return isNaN(v1) ? -1 : (eq(v1, t.ans) ? 2 : 0);
  const v2 = parseNum(ans.a2 || '');
  if (t.type === 'sci') {
    if (isNaN(v1) || isNaN(v2)) return -1;
    const ok = eq(v1 * Math.pow(10, v2), t.m * Math.pow(10, t.e)) && Number.isInteger(v2);
    if (!ok) return 0;
    return (Math.abs(v1) >= 1 && Math.abs(v1) < 10) ? 2 : 1;
  }
  if (t.type === 'frac') {
    if (isNaN(v1) || isNaN(v2) || v2 === 0) return -1;
    return eq(v1 / v2, t.n / t.d) ? 2 : 0;   // jede gleichwertige Schreibweise zählt
  }
  if (t.type === 'surd') {
    const c = String(ans.a1 || '').trim() === '' ? 1 : v1;
    if (isNaN(c) || isNaN(v2)) return -1;
    const ok = c > 0 && eq(c * c * v2, t.c * t.c * t.r);
    if (!ok) return 0;
    return (c === t.c && v2 === t.r) ? 2 : 1;
  }
  return 0;
}
const points = g => g === 2 ? 1 : g === 1 ? 0.5 : 0;
const fmtPts = p => String(p).replace('.', ',');
/* Note linear (Realschule): volle Punktzahl = 1,0, halbe Punktzahl = 3,5, null Punkte = 6,0; auf eine Dezimale gerundet */
const noteFor = (pts, max = SLOTS.length) => Math.round((6 - 5 * pts / max) * 10 + 1e-9) / 10;
const fmtNote = n => n.toFixed(1).replace('.', ',');

/* Antwort lesbar machen (für Lehrerseite und Ergebnisanzeige) */
function answerText(t, ans) {
  if (!ans) return '—';
  if (t.type === 'mc') return ans.k == null ? '—' : t.options[ans.k];
  const a1 = String(ans.a1 || '').trim(), a2 = String(ans.a2 || '').trim();
  if (t.type === 'num') return a1 ? `${a1}${t.post ? ' ' + t.post : ''}` : '—';
  if (t.type === 'sci') return (a1 || a2) ? `${a1 || '?'} · 10<sup>${a2 || '?'}</sup>` : '—';
  if (t.type === 'surd') return (a1 || a2) ? `${a1}${sq(a2 || '?')}${t.post ? ' ' + t.post : ''}` : '—';
  if (t.type === 'frac') return (a1 || a2) ? frac(a1 || '?', a2 || '?') : '—';
  return '—';
}
function correctText(t) {
  if (t.type === 'mc') return t.ans;
  if (t.type === 'num') return `${fmt(t.ans)}${t.post ? ' ' + t.post : ''}`;
  if (t.type === 'sci') return `${fmt(t.m)} · ${tenPow(t.e)}`;
  if (t.type === 'surd') return `${surd(t.c, t.r)}${t.post ? ' ' + t.post : ''}`;
  if (t.type === 'frac') return frac(t.n, t.d);
}

/* ---------- Testcode: 4 Zufallsziffern + 1 Prüfziffer (fängt Tippfehler ab) ---------- */
function codeCheckDigit(d4) { const w = [3, 7, 9, 1]; return String([...d4].reduce((s, c, i) => s + (+c) * w[i], 0) % 10); }
function newTestCode() { const d = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); return d + codeCheckDigit(d); }
function validCode(c) { return /^\d{5}$/.test(c) && codeCheckDigit(c.slice(0, 4)) === c[4]; }

/* ---------- Schülernummer: 3 Ziffern, die letzte ist Prüfziffer ----------
   Gültig, wenn (3·d1 + 7·d2 + d3) mod 10 = 0. Das ergibt 90 mögliche Nummern (genug für eine Klasse)
   und fängt Zahlendreher und einzelne Tippfehler ab. Die Nummer verrät nichts über die Klassenliste. */
function validNr(n) {
  const s = String(n).trim();
  if (!/^[1-9]\d\d$/.test(s)) return false;
  return (3 * +s[0] + 7 * +s[1] + +s[2]) % 10 === 0;
}
const ALL_NRS = Array.from({ length: 900 }, (_, i) => i + 100).filter(validNr);
function randomNrs(count) {
  const pool = ALL_NRS.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(count, pool.length)).sort((a, b) => a - b);
}

/* ---------- Übungsstatistik (bleibt auf dem Schülergerät, bis sie per QR gezeigt wird) ----------
   { dev, rounds, drills, tasks, correct, days: ['2026-10-18', …], minutes, last } */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function encPractice(p) {
  if (!p) return '';
  return [p.dev, p.rounds, p.drills, p.tasks, p.correct, p.days.length, Math.round(p.minutes), (p.last || '').replace(/-/g, '')].join('.');
}
function decPractice(s) {
  if (!s) return null;
  const [dev, rounds, drills, tasks, correct, days, minutes, last] = s.split('.');
  return { dev, rounds: +rounds, drills: +drills, tasks: +tasks, correct: +correct, days: +days, minutes: +minutes,
    last: last ? `${last.slice(0, 4)}-${last.slice(4, 6)}-${last.slice(6, 8)}` : '' };
}

/* ---------- Ergebnis-Übertragung per QR-Code ----------
   Test:  WC2|code|nr|tabs|minuten|antworten|übung|prüfsumme  (die Lehrerseite bewertet anhand der Antworten selbst neu)
   Übung: WU1|nr|übung|prüfsumme                               (Übungsnachweis, auch von einem anderen Gerät) */
const SALT = 'Untersee-Hoeri';
const sig = s => hash32(SALT + '|' + s).toString(36).toUpperCase().padStart(7, '0').slice(-5);
function encAnswers(answers) {
  return answers.map(a => !a ? '' : a.k != null ? '#' + a.k : [a.a1 || '', a.a2 || ''].map(x => encodeURIComponent(String(x).trim()).replace(/!/g, '%21').replace(/~/g, '%7E')).join('~')).join('!');
}
function decAnswers(s) {
  return s.split('!').map(x => {
    if (x === '') return null;
    if (x[0] === '#') return { k: +x.slice(1) };
    const [a1, a2] = x.split('~').map(decodeURIComponent);
    return { a1, a2 };
  });
}
function makePayload(code, nr, tabs, minutes, answers, practice) {
  const body = ['WC2', code, nr, tabs, minutes, encAnswers(answers), encPractice(practice)].join('|');
  return body + '|' + sig(body);
}
function makePracticePayload(nr, practice) {
  const body = ['WU1', nr, encPractice(practice)].join('|');
  return body + '|' + sig(body);
}
function parsePayload(txt) {
  const p = String(txt).trim().split('|');
  if (p[0] === 'WC2' && p.length === 8) {
    const body = p.slice(0, 7).join('|');
    return { kind: 'test', code: p[1], nr: +p[2], tabs: +p[3], minutes: +p[4], answers: decAnswers(p[5]), practice: decPractice(p[6]), valid: sig(body) === p[7] };
  }
  if (p[0] === 'WU1' && p.length === 4) {
    const body = p.slice(0, 3).join('|');
    return { kind: 'practice', nr: +p[1], practice: decPractice(p[2]), valid: sig(body) === p[3] };
  }
  return null;
}
/* Kurzcode zum Abtippen (ohne Antworten und Übung): Nr-Bewertungen-Tabwechsel-Prüfsumme, z. B. 417-222120222202-0-K3F9A */
function makeShortCode(code, nr, tabs, grades) {
  const g = grades.map(x => Math.max(0, x)).join('');
  return `${nr}-${g}-${tabs}-${sig(`S|${code}|${nr}|${g}|${tabs}`)}`;
}
function parseShortCode(txt, code) {
  const m = String(txt).trim().toUpperCase().replace(/\s/g, '').match(new RegExp(`^(\\d{3})-([012]{${SLOTS.length}})-(\\d{1,3})-([0-9A-Z]{5})$`));
  if (!m) return null;
  const [, nr, g, tabs, s] = m;
  return { nr: +nr, grades: [...g].map(Number), tabs: +tabs, valid: sig(`S|${code}|${+nr}|${g}|${+tabs}`) === s };
}
