/**
 * API unique : /v1/* → NestJS compilé (backend/dist).
 * Même projet Vercel que le frontend.
 */
const nestHandler = require('../backend/dist/vercel.js').default;

module.exports = async function handler(req, res) {
  const raw = req.url || '/';
  const qIndex = raw.indexOf('?');
  const search = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
  const params = new URLSearchParams(search);
  const forwarded = params.get('p');
  params.delete('p');
  const rest = params.toString();

  if (forwarded) {
    req.url = forwarded + (rest ? `?${rest}` : '');
  } else if (raw.startsWith('/api')) {
    const path = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).slice(4) || '/';
    req.url = (path.startsWith('/v1') ? path : `/v1${path === '/' ? '' : path}`) + (rest ? `?${rest}` : '');
  }

  return nestHandler(req, res);
};
