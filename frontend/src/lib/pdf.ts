import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RapportPdf {
  titre: string;
  compartiment: string;
  colonnes: string[];
  lignes: Array<Array<string | number>>;
  nomFichier: string;
}

/** Génère un PDF A4 entreprise — présentation uniquement, pas de calcul métier. */
export function telechargerRapportPdf(r: RapportPdf) {
  const paysage = r.colonnes.length > 5;
  const doc = new jsPDF({ orientation: paysage ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const maintenant = new Date().toLocaleString('fr-FR');

  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, paysage ? 297 : 210, 22, 'F');
  doc.setTextColor(201, 162, 39);
  doc.setFontSize(9);
  doc.text('APPLICATION INDUSTRIELLE', 14, 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(r.titre, 14, 16);
  doc.setFontSize(9);
  doc.text(r.compartiment, paysage ? 280 : 196, 16, { align: 'right' });

  doc.setTextColor(60, 74, 94);
  doc.setFontSize(9);
  doc.text(`Émis le ${maintenant}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [r.colonnes],
    body: r.lignes.length ? r.lignes : [['Aucune donnée']],
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [11, 31, 58], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 245, 248] },
    margin: { left: 14, right: 14 },
  });

  const fin = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  doc.setFontSize(8);
  doc.setTextColor(107, 122, 141);
  doc.text('Rapport généré depuis l’application — données calculées côté serveur.', 14, fin + 10);
  doc.save(r.nomFichier);
}
