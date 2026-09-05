/**
 * API unique : /v1/* → NestJS compilé (backend/dist).
 * Même projet Vercel que le frontend.
 */
function restaurerUrl(req) {
  const raw = req.url || '/';
  const qIndex = raw.indexOf('?');
  const search = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
  const params = new URLSearchParams(search);
  const forwarded = params.get('p');
  params.delete('p');
  const rest = params.toString();

  if (forwarded) {
    req.url = forwarded + (rest ? `?${rest}` : '');
    return;
  }
  if (raw.startsWith('/api')) {
    const path = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).slice(4) || '/';
    req.url = (path.startsWith('/v1') ? path : `/v1${path === '/' ? '' : path}`) + (rest ? `?${rest}` : '');
  }
}

module.exports = async function handler(req, res) {
  try {
    restaurerUrl(req);
    const mod = require('../backend/dist/vercel.js');
    const nestHandler = mod.default || mod;
    if (typeof nestHandler !== 'function') {
      throw new Error('Handler NestJS introuvable dans backend/dist/vercel.js');
    }
    return nestHandler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'API indisponible',
        error: err && err.message ? err.message : String(err),
      }),
    );
  }
};
