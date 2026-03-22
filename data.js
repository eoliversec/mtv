// === Missile Trajectory Visualization — Data ===
// To add a country, add an entry to COUNTRIES below.
// See CONTRIBUTING.md for the format.

const SPEED_COLORS = {
  sub: '#378ADD',
  sup: '#EF9F27',
  hyp: '#E24B4A',
  coast: '#22B8CF',
  reentry: '#C73E8C'
};

const TYPE_KEYS = ['ballistic', 'cruise', 'boostglide'];

const TYPE_NAMES = {
  ballistic: 'Ballistic (ICBM)',
  cruise: 'Cruise missile',
  boostglide: 'Boost-glide (HGV)'
};

const TYPE_COLORS = {
  ballistic: SPEED_COLORS.hyp,
  cruise: SPEED_COLORS.sub,
  boostglide: SPEED_COLORS.sup
};

// Each country entry:
//   label      — display name
//   ballistic  — { range (km), apogee (km), ex (example system) } or null
//   cruise     — { range (km), apogee (km), ex (example system) } or null
//   boostglide — { range (km), apogee (km), ex (example system) } or null
const COUNTRIES = {
  ALL: {
    label: 'Global max',
    ballistic:  { range: 13000, apogee: 1200, ex: 'RS-28 Sarmat / DF-41 / Minuteman III' },
    cruise:     { range: 2500,  apogee: 0.1,  ex: 'Kalibr / Tomahawk' },
    boostglide: { range: 6000,  apogee: 80,   ex: 'Avangard / DF-ZF' }
  },
  USA: {
    label: 'USA',
    ballistic:  { range: 13000, apogee: 1100, ex: 'LGM-30G Minuteman III' },
    cruise:     { range: 1800,  apogee: 0.1,  ex: 'BGM-109 Tomahawk Block V' },
    boostglide: { range: 2800,  apogee: 60,   ex: 'LRHW / Dark Eagle' }
  },
  UK: {
    label: 'UK',
    ballistic:  { range: 12000, apogee: 1000, ex: 'UGM-133 Trident D5 (SLBM)' },
    cruise:     { range: 1800,  apogee: 0.1,  ex: 'BGM-109 Tomahawk' },
    boostglide: null
  },
  China: {
    label: 'China',
    ballistic:  { range: 15000, apogee: 1300, ex: 'DF-41' },
    cruise:     { range: 2000,  apogee: 0.1,  ex: 'CJ-10 / YJ-100' },
    boostglide: { range: 2500,  apogee: 80,   ex: 'DF-17 / DF-ZF' }
  },
  Iran: {
    label: 'Iran',
    ballistic:  { range: 2000,  apogee: 480,  ex: 'Khorramshahr' },
    cruise:     { range: 1500,  apogee: 0.1,  ex: 'Hoveizeh' },
    boostglide: { range: 1400,  apogee: 150,  ex: 'Fattah' }
  },
  Russia: {
    label: 'Russia',
    ballistic:  { range: 18000, apogee: 1400, ex: 'RS-28 Sarmat' },
    cruise:     { range: 2500,  apogee: 0.1,  ex: '3M-54 Kalibr' },
    boostglide: { range: 6000,  apogee: 80,   ex: 'Avangard HGV' }
  },
};

const FLIGHT_PHASES = {
  ballistic: [
    { t0: 0,    t1: 0.06, sp: 'hyp',     label: 'Boost',            note: 'Mach 0 → 20+ (3–5 min burn)' },
    { t0: 0.06, t1: 0.5,  sp: 'sup',     label: 'Ascending coast',  note: 'Decelerating against gravity' },
    { t0: 0.5,  t1: 0.94, sp: 'coast',   label: 'Descending coast', note: 'Re-accelerating under gravity' },
    { t0: 0.94, t1: 1.0,  sp: 'reentry', label: 'Terminal re-entry', note: 'Mach 20+ — predictable arc' },
  ],
  cruise: [
    { t0: 0,    t1: 0.03, sp: 'sup',      label: 'Launch / climb',   note: 'Boost motor or air/ship launch' },
    { t0: 0.03, t1: 0.97, sp: 'sub',      label: 'Sustained cruise', note: 'Mach 0.7–0.9 — jet engine throughout' },
    { t0: 0.97, t1: 1.0,  sp: 'reentry',  label: 'Terminal',         note: 'Subsonic — manoeuvrable to target' },
  ],
  boostglide: [
    { t0: 0,    t1: 0.06, sp: 'hyp',   label: 'Boost',            note: 'Mach 0 → 20+ (rocket motor)' },
    { t0: 0.06, t1: 1.0,  sp: 'coast', label: 'Hypersonic glide', note: 'Mach 5–20+ — manoeuvrable throughout' },
  ],
};

const TYPE_DESCRIPTIONS = {
  ballistic:  'Unpowered for ~95% of flight. Trajectory is calculable from motor cut-off, but terminal velocity of Mach 20+ makes interception extremely difficult. Highest range of the three types.',
  cruise:     'Sustained jet propulsion throughout. Shortest-ranged despite full propulsion — carrying fuel for the entire journey is mass-expensive. Flies at 50–100 m altitude. Hardest to detect on radar.',
  boostglide: 'Rocket-boosted to hypersonic speed, then unpowered aerodynamic glide. Operates in a radar/intercept gap — too low for ballistic missile defences, too fast for air-defence systems. Mid-flight manoeuvring defeats predictive intercept.',
};
