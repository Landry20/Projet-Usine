import type { LotDepot } from '../types';

export function imprimerEtiquetteLot(lot: LotDepot) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(lot.numero)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${lot.numero}</title>
<style>
  body { font-family: Segoe UI, sans-serif; padding: 24px; color: #122; }
  .card { width: 360px; border: 2px solid #122; padding: 18px; }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: 0.04em; }
  .mono { font-family: Consolas, monospace; font-size: 20px; font-weight: 700; }
  p { margin: 6px 0; font-size: 13px; }
  img { display: block; margin: 12px auto; }
</style></head><body>
  <div class="card">
    <p>MANUPRO — MATIÈRE PREMIÈRE</p>
    <h1 class="mono">${lot.numero}</h1>
    <p><strong>${lot.libelle}</strong></p>
    <p>${lot.produit?.refProduit ?? ''} — ${lot.produit?.designation ?? ''}</p>
    <p>Dépôt : ${lot.depot?.libelle ?? lot.emplacement ?? '—'}</p>
    <p>Quantité : ${lot.quantite} ${lot.produit?.unite ?? ''}</p>
    <img src="${qr}" alt="${lot.numero}" width="180" height="180" />
    <p style="text-align:center;font-size:11px">Scanner le QR pour identifier le lot</p>
  </div>
  <script>window.onload = function () { window.print(); }</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=420,height=560');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
