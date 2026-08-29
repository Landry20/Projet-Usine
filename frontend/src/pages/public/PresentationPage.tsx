import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Factory,
  FlaskConical,
  Link2,
  Package,
  Shield,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react';

export function PresentationPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <img src="/logo.svg" alt="Usine industrielle" />
          <div>
            <strong>Usine industrielle</strong>
            <span>Production · Produit fini · Laboratoire · Maintenance</span>
          </div>
        </div>
        <Link to="/connexion" className="btn btn-gold">
          Se connecter
          <ArrowRight size={16} />
        </Link>
      </header>

      <section className="landing-hero">
        <p className="landing-kicker">Application industrielle unique</p>
        <h1>Piloter l’usine dans un seul logiciel, sans mélanger les métiers.</h1>
        <p className="landing-lead">
          Ce n’est pas une GMAO avec un peu de production. C’est une application composée de
          quatre domaines métier plus le pilotage direction, réellement séparés à l’écran, et
          connectés par les données : bilan matière, tanks et expéditions, laboratoire, et
          maintenance des machines.
        </p>
        <div className="landing-cta">
          <Link to="/connexion" className="btn btn-gold">
            Accéder à l’application
            <ArrowRight size={16} />
          </Link>
          <a href="#compartiments" className="btn btn-ghost landing-ghost">
            Voir les domaines
          </a>
        </div>
      </section>

      <section className="landing-section" id="compartiments">
        <h2>Quatre domaines, une seule connexion</h2>
        <p>
          Chaque utilisateur se connecte une fois. Son menu s’ouvre sur son métier. Les
          administrateurs et la direction voient tous les espaces et changent de compartiment
          depuis la barre du haut.
        </p>
        <div className="landing-grid3">
          <article className="landing-card">
            <div className="landing-icon">
              <Factory size={22} />
            </div>
            <h3>Gestion de production</h3>
            <p>Demande de matière, journal de quart, bilan et rendement d’extraction.</p>
            <ul>
              <li>Demandes de matière première (pesée magasin)</li>
              <li>Journaux de quart et bilan matière</li>
              <li>Sous-produits paramétrables (tourteau, poussière, coque)</li>
              <li>Arrêt machine → demande de maintenance</li>
              <li>Validation chef de quart → responsable → chef d’usine</li>
            </ul>
          </article>
          <article className="landing-card">
            <div className="landing-icon">
              <Boxes size={22} />
            </div>
            <h3>Produit fini et expéditions</h3>
            <p>Du tank jusqu’au client : jaugeage, commande, empotage, pont bascule.</p>
            <ul>
              <li>Tanks, jaugeage, réservation</li>
              <li>Commandes clients et reste à livrer</li>
              <li>Conteneur, flexitank, scellé</li>
              <li>Litres et kilogrammes, pesée commerciale</li>
              <li>Traçabilité conteneur → lots de production</li>
            </ul>
          </article>
          <article className="landing-card">
            <div className="landing-icon">
              <FlaskConical size={22} />
            </div>
            <h3>Laboratoire et qualité</h3>
            <p>Un bulletin d’analyse conditionne le départ d’un conteneur.</p>
            <ul>
              <li>Échantillons MP, process, tank, chargement</li>
              <li>Paramètres et spécifications versionnées</li>
              <li>Bulletins signés (séparation des tâches)</li>
              <li>Non-conformités : blocage, déclassement, dérogation</li>
            </ul>
          </article>
          <article className="landing-card">
            <div className="landing-icon">
              <Wrench size={22} />
            </div>
            <h3>Gestion de maintenance</h3>
            <p>Garder les machines disponibles pour que la production puisse tourner.</p>
            <ul>
              <li>Parc équipements et QR codes</li>
              <li>Demandes d’intervention et ordres de travail</li>
              <li>Préventif, correctif, techniciens</li>
              <li>Stock de pièces de rechange</li>
              <li>Historique, coûts et indicateurs</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <h2>Les compartiments se parlent</h2>
        <p>Ils ne sont pas trois logiciels séparés. Ils partagent le référentiel et les flux métier.</p>
        <div className="landing-flows">
          <div className="landing-flow">
            <Factory size={18} />
            <span>Ordre de fabrication</span>
            <ArrowRight size={14} />
            <Package size={18} />
            <span>Contrôle qualité</span>
            <ArrowRight size={14} />
            <Boxes size={18} />
            <span>Lot en stock PF</span>
            <ArrowRight size={14} />
            <Truck size={18} />
            <span>Expédition</span>
          </div>
          <div className="landing-flow">
            <Factory size={18} />
            <span>Machine en panne</span>
            <ArrowRight size={14} />
            <Wrench size={18} />
            <span>Demande puis OT</span>
            <ArrowRight size={14} />
            <Wrench size={18} />
            <span>Réparation</span>
            <ArrowRight size={14} />
            <Factory size={18} />
            <span>Production reprend</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>Quatre stocks, pas un seul</h2>
        <p>Les règles ne sont pas les mêmes. Chaque stock a son circuit.</p>
        <div className="landing-grid4">
          <div className="landing-mini">
            <Warehouse size={18} />
            <strong>Matières premières</strong>
            <span>Consommées par les OF</span>
          </div>
          <div className="landing-mini">
            <Package size={18} />
            <strong>Semi-finis</strong>
            <span>Étapes intermédiaires</span>
          </div>
          <div className="landing-mini">
            <Boxes size={18} />
            <strong>Produits finis</strong>
            <span>Lots après contrôle</span>
          </div>
          <div className="landing-mini">
            <Wrench size={18} />
            <strong>Pièces maintenance</strong>
            <span>Délivrées sur les OT</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>Chacun voit son métier</h2>
        <div className="landing-grid2">
          <article className="landing-card">
            <Users size={20} />
            <h3>Droits par rôle</h3>
            <p>
              Un opérateur ouvre la production. Un magasinier PF ouvre les lots. Un technicien
              ouvre la maintenance. La qualité circule entre production et produits finis.
            </p>
          </article>
          <article className="landing-card">
            <Shield size={20} />
            <h3>Les administrateurs voient tout</h3>
            <p>
              Les comptes d’administration et de direction accèdent aux trois compartiments,
              changent de menu, et gèrent les utilisateurs, les sites et le journal d’audit.
            </p>
          </article>
          <article className="landing-card">
            <Link2 size={20} />
            <h3>Référentiel commun</h3>
            <p>
              Utilisateurs, permissions, sites, entrepôts, localisations et machines sont
              partagés. Une machine appartient à une ligne : la panne bloque la fabrication.
            </p>
          </article>
          <article className="landing-card">
            <Warehouse size={20} />
            <h3>Aucune quantité saisie à la main</h3>
            <p>
              Les stocks bougent uniquement par mouvement : consommation d’OF, entrée après
              contrôle, expédition, ou sortie de pièce sur un ordre de travail.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-bottom">
        <div>
          <h2>Prêt à entrer dans l’usine.</h2>
          <p>Identifiez-vous avec votre compte professionnel. Le logiciel ouvre le bon compartiment.</p>
        </div>
        <Link to="/connexion" className="btn btn-gold">
          Se connecter
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
