// === Missile Trajectory Visualization — Renderer ===

const X0 = 62, X1 = 640, Y0 = 28, Y1 = 300;

let selectedType = 3;
let selectedCountry = 'ALL';

// Cached DOM refs
const $chart = document.getElementById('chart');
const $select = document.getElementById('country-select');
const $buttons = document.getElementById('type-buttons');
const $legend = document.getElementById('legend');
const $summary = document.getElementById('phase-summary');
const $desc = document.getElementById('description');

// --- Theme ---

function applyTheme(mode) {
  localStorage.setItem('mtv-theme', mode);
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.theme === mode);
  });
}

// --- Populate country select from data ---

function populateCountrySelect() {
  $select.innerHTML = Object.entries(COUNTRIES).map(([key, c]) =>
    `<option value="${key}">${key === 'ALL' ? 'All countries' : c.label}</option>`
  ).join('');
}

// --- Math helpers ---

function trajectoryFn(type, apogee) {
  if (type === 'ballistic') return t => 4 * apogee * t * (1 - t);
  if (type === 'cruise') return t => {
    if (t < 0.03) return (t / 0.03) * apogee;
    if (t > 0.97) return ((1 - t) / 0.03) * apogee;
    return apogee;
  };
  return t => {
    const b = 0.06;
    return t < b ? (t / b) * apogee : apogee * Math.pow(1 - (t - b) / (1 - b), 1.35);
  };
}

function computeScales(countryKey, activeSelection) {
  const c = COUNTRIES[countryKey];
  let maxRange = 0, maxApogee = 0;
  if (activeSelection === 3) {
    TYPE_KEYS.forEach(tk => {
      const d = c[tk];
      if (d) { maxRange = Math.max(maxRange, d.range); maxApogee = Math.max(maxApogee, d.apogee); }
    });
  } else {
    const d = c[TYPE_KEYS[activeSelection]];
    if (d) { maxRange = d.range; maxApogee = d.apogee; }
  }
  let hm;
  if (maxApogee < 1) {
    hm = Math.max(Math.ceil(maxApogee * 1.3 * 1000 / 100) * 100 / 1000, 0.5);
  } else {
    hm = Math.max(Math.ceil(maxApogee * 1.3 / 100) * 100, 100);
  }
  return {
    dm: Math.ceil(maxRange * 1.15 / 500) * 500 || 2500,
    hm
  };
}

function altTicks(hm) {
  if (hm <= 1) return [0.1, 0.2, 0.3, 0.4];
  if (hm <= 200) return [50, 100, 150];
  if (hm <= 700) return [100, 200, 300, 400, 500, 600];
  if (hm <= 1200) return [200, 400, 600, 800, 1000];
  return [200, 400, 600, 800, 1000, 1200, 1400];
}

function distTicks(dm) {
  const iv = dm <= 3000 ? 500 : dm <= 9000 ? 1000 : dm <= 18000 ? 2000 : 3000;
  const t = [];
  for (let d = iv; d < dm; d += iv) t.push(d);
  return t;
}

function project(d, h, dm, hm) {
  return { x: X0 + (d / dm) * (X1 - X0), y: Y1 - (h / hm) * (Y1 - Y0) };
}

function buildSegment(type, apogee, range, dm, hm, t0, t1) {
  const fn = trajectoryFn(type, apogee);
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = t0 + (t1 - t0) * i / 80;
    const p = project(t * range, fn(t), dm, hm);
    pts.push(`${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
}

// --- Legend ---

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.6);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.6);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.6);
  return `rgb(${r},${g},${b})`;
}

function renderLegend(allMode, tk) {
  let items;
  if (allMode) {
    items = TYPE_KEYS.map(k => ({ color: TYPE_COLORS[k], label: TYPE_NAMES[k] }));
  } else {
    const seen = new Set();
    items = FLIGHT_PHASES[tk].filter(p => {
      if (seen.has(p.sp)) return false;
      seen.add(p.sp);
      return true;
    }).map(p => ({ color: SPEED_COLORS[p.sp], label: p.label }));
  }
  $legend.innerHTML = items.map(({ color, label }) =>
    `<span class="legend-item" style="background:${hexToRgba(color, 0.1)};color:${darkenHex(color)}">
      <span class="legend-dot" style="background:${color}"></span>${label}
    </span>`
  ).join('');
}

// --- Main render ---

function render() {
  const country = COUNTRIES[selectedCountry];
  const active = selectedType;
  const allMode = active === 3;
  const noData = active < 3 && !country[TYPE_KEYS[active]];

  // No data for this type — show message and buttons, hide chart
  if (noData) {
    $chart.innerHTML = `<text x="340" y="180" font-size="14" fill="var(--text-tertiary)" text-anchor="middle">${country.label} has no known ${TYPE_NAMES[TYPE_KEYS[active]].toLowerCase()} capability</text>`;
    $summary.innerHTML = '';
    $desc.textContent = '';
    renderLegend(false, TYPE_KEYS[active]);
    renderButtons(active);
    return;
  }

  const { dm, hm } = computeScales(selectedCountry, active);
  const useMeters = hm < 1;
  let h = '';

  // Altitude grid lines
  altTicks(hm).filter(a => a < hm).forEach(alt => {
    const y = project(0, alt, dm, hm).y;
    const label = useMeters ? `${Math.round(alt * 1000)}` : `${alt}`;
    h += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="var(--border-tertiary)" stroke-width="0.5" stroke-dasharray="3 3"/>`;
    h += `<text x="56" y="${(y + 4).toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="end">${label}</text>`;
  });

  // Y-axis label
  const mY = (Y0 + Y1) / 2;
  const altUnit = useMeters ? 'altitude (m)' : 'altitude (km)';
  h += `<text x="10" y="${mY.toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle" transform="rotate(-90 10 ${mY.toFixed(1)})">${altUnit}</text>`;

  // Reference lines
  if (100 < hm) {
    const y = project(0, 100, dm, hm).y;
    h += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="${SPEED_COLORS.sub}" stroke-width="0.5" stroke-dasharray="5 3" opacity="0.4"/>`;
    h += `<text x="${X1 - 4}" y="${(y - 4).toFixed(1)}" font-size="9" fill="${SPEED_COLORS.sub}" text-anchor="end" opacity="0.55">edge of space (100 km)</text>`;
  }
  if (408 < hm) {
    const y = project(0, 408, dm, hm).y;
    h += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="var(--border-tertiary)" stroke-width="0.5" stroke-dasharray="4 3" opacity="0.25"/>`;
    h += `<text x="${X1 - 4}" y="${(y - 4).toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="end" opacity="0.45">ISS orbit ~408 km</text>`;
  }
  if (12 / hm > 0.04) {
    const y = project(0, 12, dm, hm).y;
    h += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="var(--border-secondary)" stroke-width="0.5" stroke-dasharray="3 2" opacity="0.4"/>`;
    h += `<text x="${X1 - 4}" y="${(y - 4).toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="end" opacity="0.6">commercial airspace (~12 km)</text>`;
  }

  // Ground
  const groundY = project(0, 0, dm, hm).y;
  h += `<line x1="${X0}" y1="${groundY}" x2="${X1}" y2="${groundY}" stroke="var(--border-secondary)" stroke-width="1.5"/>`;

  // Distance ticks
  distTicks(dm).forEach(d => {
    const px = project(d, 0, dm, hm).x;
    h += `<line x1="${px.toFixed(1)}" y1="${groundY}" x2="${px.toFixed(1)}" y2="${(groundY - 4).toFixed(1)}" stroke="var(--border-tertiary)" stroke-width="0.5"/>`;
    h += `<text x="${px.toFixed(1)}" y="${(groundY + 13).toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">${d >= 1000 ? `${d / 1000}k` : d}</text>`;
  });
  h += `<text x="${((X0 + X1) / 2).toFixed(1)}" y="${(groundY + 25).toFixed(1)}" font-size="9" fill="var(--text-tertiary)" text-anchor="middle">ground distance (km)</text>`;

  // Trajectories
  TYPE_KEYS.forEach(tk => {
    const td = country[tk];
    if (!td || (!allMode && TYPE_KEYS[active] !== tk)) return;
    const tc = TYPE_COLORS[tk];
    const sw = allMode ? 1.8 : 2.5;
    const op = allMode ? 0.8 : 1;

    if (allMode) {
      h += `<path d="${buildSegment(tk, td.apogee, td.range, dm, hm, 0, 1)}" fill="none" stroke="${tc}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
    } else {
      FLIGHT_PHASES[tk].forEach(ph => {
        h += `<path d="${buildSegment(tk, td.apogee, td.range, dm, hm, ph.t0, ph.t1)}" fill="none" stroke="${SPEED_COLORS[ph.sp]}" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
      });
      const at = tk === 'boostglide' ? 0.06 : 0.5;
      const fn = trajectoryFn(tk, td.apogee);
      const ap = project(at * td.range, fn(at), dm, hm);
      h += `<circle cx="${ap.x.toFixed(1)}" cy="${ap.y.toFixed(1)}" r="4" fill="rgba(128, 128, 125, 1)"/>`;
      const apogeeLabel = useMeters ? `${Math.round(td.apogee * 1000)} m` : `${td.apogee} km`;
      h += `<text x="${(ap.x + 8).toFixed(1)}" y="${(ap.y - 6).toFixed(1)}" font-size="10" fill="rgba(128, 128, 128, 1)" font-weight="500">↑ ${apogeeLabel}</text>`;
    }
  });

  $chart.innerHTML = h;

  // Phase summary cards
  if (!allMode) {
    const tk = TYPE_KEYS[active];
    const td = country[tk];
    $summary.style.gridTemplateColumns = `repeat(${Math.min(FLIGHT_PHASES[tk].length, 4)}, minmax(0, 1fr))`;
    $summary.innerHTML = FLIGHT_PHASES[tk].map(p =>
      `<div class="phase-card">
        <div class="phase-card-header">
          <span class="legend-dot" style="background:${SPEED_COLORS[p.sp]}"></span>
          <span class="phase-card-label">${p.label}</span>
        </div>
        <div class="phase-card-note">${p.note}</div>
      </div>`
    ).join('');
    $desc.innerHTML = `<strong style="color:var(--text-secondary)">${country.label} — ${td.ex}.</strong> ${TYPE_DESCRIPTIONS[tk]}`;
  } else {
    $summary.innerHTML = '';
    $desc.textContent = '';
  }

  renderLegend(allMode, allMode ? null : TYPE_KEYS[active]);
  renderButtons(active);
}

function renderButtons(active) {
  $buttons.innerHTML = [
    { label: 'All types', i: 3, tk: null },
    ...TYPE_KEYS.map((tk, i) => ({ label: TYPE_NAMES[tk], i, tk })),
  ].map(({ label, i, tk }) => {
    const act = i === active;
    const ac = tk ? TYPE_COLORS[tk] : 'var(--text-primary)';
    return `<button class="btn${act ? ' on' : ''}" data-type="${i}" style="${act ? `border-color:${ac};color:${ac};background:var(--bg-secondary);` : ''}">${label}</button>`;
  }).join('');
}

// --- Event listeners ---

$select.addEventListener('change', function () {
  selectedCountry = this.value;
  render();
});

$buttons.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  selectedType = parseInt(btn.dataset.type, 10);
  render();
});

document.querySelector('.theme-toggle').addEventListener('click', function (e) {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  applyTheme(btn.dataset.theme);
});

// --- Init ---

populateCountrySelect();
applyTheme(localStorage.getItem('mtv-theme') || 'system');
render();
