import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    title: 'Bienvenue sur Gestio',
    text: "L'outil de gestion pensé pour les micro-entrepreneurs : clients, devis et factures, au même endroit.",
  },
  {
    title: 'Clients & devis',
    text: 'Centralise tes clients et crée des devis professionnels en quelques clics, avec calcul automatique des montants.',
  },
  {
    title: 'Devis → Facture',
    text: 'Un devis accepté ? Convertis-le en facture en un clic. Numérotation séquentielle automatique, sans trou.',
  },
  {
    title: 'PDF prêts à envoyer',
    text: 'Télécharge tes devis et factures en PDF, avec tes mentions légales déjà en place.',
  },
];

export default function Welcome() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-brand">Gestio</div>
        <Link to="/login" className="welcome-login-link">Se connecter</Link>
      </header>

      <div className="welcome-card">
        <div className="welcome-slide">
          <div className="welcome-step">{index + 1} / {SLIDES.length}</div>
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>
        </div>

        <div className="welcome-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`welcome-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Aller à l'étape ${i + 1}`}
            />
          ))}
        </div>

        <div className="welcome-actions">
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>Précédent</button>
          )}
          {!isLast ? (
            <button className="btn btn-primary" onClick={() => setIndex(index + 1)}>Suivant</button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Créer mon compte</button>
          )}
        </div>
      </div>
    </div>
  );
}