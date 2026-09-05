/**
 * Point d'entrée Vercel unique : /v1/* → NestJS (backend/dist).
 * Même projet que le frontend — pas d'environnement API séparé.
 */
const nestHandler = require('../backend/dist/vercel.js').default;

module.exports = async function handler(req, res) {
  const parts = req.query.path;
  const slug = Array.isArray(parts) ? parts.join('/') : parts || '';
  const qs = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  req.url = '/' + slug + qs;
  return nestHandler(req, res);
};
