/**
 * /v1/* → backend Node.js (Express) compilé.
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
  }
}

module.exports = async function handler(req, res) {
  try {
    restaurerUrl(req);
    const mod = require('../backend/dist/vercel.js');
    const nodeHandler = mod.default || mod;
    return nodeHandler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'API indisponible', error: err && err.message ? err.message : String(err) }));
  }
};
