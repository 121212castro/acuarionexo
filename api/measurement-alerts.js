// AcuarioNexo · API route · alertas de medición inicial
// GET /api/measurement-alerts?aquarium_id=...
// Devuelve el mensaje que debe mostrarse/enviarse al móvil para completar la medición inicial.

const DEFAULT_FREQ = {
  marine: {
    temperature_c: 1,
    salinity_ppt: 2,
    specific_gravity: 2,
    ph: 2,
    kh_dkh: 3,
    nitrite_no2: 7,
    nitrate_no3: 7,
    phosphate_po4: 7,
    calcium_ca: 14,
    magnesium_mg: 14,
    potassium_k: 30
  },
  freshwater: {
    temperature_c: 1,
    ph: 7,
    kh_dkh: 14,
    gh: 14,
    ammonia_nh3: 7,
    nitrite_no2: 7,
    nitrate_no3: 7,
    phosphate_po4: 14,
    tds: 14,
    conductivity: 14,
    co2: 7,
    iron_fe: 14
  }
};

const LABELS = {
  temperature_c: 'Temperatura',
  salinity_ppt: 'Salinidad',
  specific_gravity: 'Densidad',
  ph: 'pH',
  kh_dkh: 'KH',
  nitrite_no2: 'NO2',
  nitrate_no3: 'NO3',
  phosphate_po4: 'PO4',
  calcium_ca: 'Calcio',
  magnesium_mg: 'Magnesio',
  potassium_k: 'Potasio',
  gh: 'GH',
  ammonia_nh3: 'NH3/NH4',
  tds: 'TDS',
  conductivity: 'Conductividad',
  co2: 'CO2',
  iron_fe: 'Hierro'
};

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function modeFor(aquarium) {
  const t = String(aquarium?.aquarium_type || '').toLowerCase();
  return ['freshwater', 'planted', 'betta', 'angelfish', 'breeding'].includes(t) ? 'freshwater' : 'marine';
}

function buildAlert(aquarium, measurements) {
  const mode = modeFor(aquarium);
  const required = Object.keys(DEFAULT_FREQ[mode]);
  const latest = {};
  for (const row of measurements || []) {
    const key = row.parameter_key || row.parameter;
    if (key && !latest[key]) latest[key] = row;
  }

  const pending = required.filter(k => !latest[k]).map(k => ({ key: k, label: LABELS[k] || k }));
  const now = Date.now();
  const delayed = required
    .filter(k => latest[k])
    .map(k => {
      const row = latest[k];
      const base = new Date(row.measured_at || row.created_at || Date.now()).getTime();
      const next = base + (DEFAULT_FREQ[mode][k] || 14) * 86400000;
      const daysLate = Math.floor((now - next) / 86400000);
      return daysLate > 0 ? { key: k, label: LABELS[k] || k, daysLate } : null;
    })
    .filter(Boolean);

  const title = pending.length ? 'Medición inicial pendiente' : delayed.length ? 'Medición retrasada' : 'Parámetros al día';
  const body = pending.length
    ? `${aquarium.name}: faltan ${pending.slice(0, 4).map(x => x.label).join(', ')}${pending.length > 4 ? '…' : ''}`
    : delayed.length
      ? `${aquarium.name}: ${delayed.slice(0, 4).map(x => `${x.label} ${x.daysLate}d`).join(', ')}`
      : `${aquarium.name}: medición inicial completa`;

  return {
    aquarium_id: aquarium.id,
    aquarium_name: aquarium.name,
    mode,
    status: pending.length ? 'initial_measurement_required' : delayed.length ? 'measurements_late' : 'ok',
    requires_mobile_message: pending.length > 0 || delayed.length > 0,
    pending,
    delayed,
    notification: {
      title,
      body,
      url: `/index.html?aquarium=${encodeURIComponent(aquarium.id)}&section=parametros`,
      tag: `aquarium-measurements-${aquarium.id}`
    }
  };
}

async function supabaseFetch(path, serviceKey, method = 'GET', body) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
  const r = await fetch(url, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `Supabase HTTP ${r.status}`);
  return text ? JSON.parse(text) : null;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!process.env.SUPABASE_URL || !serviceKey) return json(res, 500, { error: 'missing_supabase_env' });

    const aquariumId = req.query?.aquarium_id || req.query?.aquarium || (req.body && req.body.aquarium_id);
    if (!aquariumId) return json(res, 400, { error: 'missing_aquarium_id' });

    const aqRows = await supabaseFetch(`aquariums?select=*&id=eq.${encodeURIComponent(aquariumId)}&limit=1`, serviceKey);
    const aquarium = aqRows && aqRows[0];
    if (!aquarium) return json(res, 404, { error: 'aquarium_not_found' });

    const measurements = await supabaseFetch(`aquarium_measurements?select=*&aquarium_id=eq.${encodeURIComponent(aquariumId)}&order=measured_at.desc&limit=300`, serviceKey);
    const alert = buildAlert(aquarium, measurements || []);

    if (req.method === 'POST' && alert.requires_mobile_message) {
      try {
        await supabaseFetch('mobile_alerts', serviceKey, 'POST', [{
          user_id: aquarium.user_id,
          aquarium_id: aquarium.id,
          title: alert.notification.title,
          body: alert.notification.body,
          url: alert.notification.url,
          status: 'pending',
          payload: alert
        }]);
        alert.mobile_alert_queued = true;
      } catch (e) {
        alert.mobile_alert_queued = false;
        alert.mobile_alert_error = e.message;
      }
    }

    return json(res, 200, alert);
  } catch (e) {
    return json(res, 500, { error: e.message || 'unknown_error' });
  }
};
