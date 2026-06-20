import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY = {
  nom_entreprise: '', siret: '', adresse: '', code_postal: '', ville: '',
  telephone: '', iban: '', bic: '', regime_fiscal: '', delai_paiement: 30,
};

export default function Parametres() {
  const [form, setForm] = useState(EMPTY);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/users/me');
        setEmail(data.email);
        setForm({
          nom_entreprise: data.nom_entreprise || '',
          siret: data.siret || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          telephone: data.telephone || '',
          iban: data.iban || '',
          bic: data.bic || '',
          regime_fiscal: data.regime_fiscal || 'Auto-entrepreneur — TVA non applicable, art. 293 B du CGI',
          delai_paiement: data.delai_paiement || 30,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom_entreprise.trim()) return alert('Le nom de ton entreprise est requis.');
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/users/me', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement…</p>;

  return (
    <div>
      <div className="view-head">
        <div>
          <h2>Paramètres</h2>
          <div className="view-sub">Tes informations, utilisées sur les devis et factures</div>
        </div>
      </div>

      {!form.siret && (
        <div className="banner">Renseigne au moins le nom et le SIRET pour pouvoir générer des PDF.</div>
      )}
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 16, marginBottom: 16 }}>
          <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-dark)', padding: '0 6px' }}>Identité</legend>
          <div className="field"><label>Email</label><input value={email} disabled /></div>
          <div className="field">
            <label>Nom / Raison commerciale *</label>
            <input value={form.nom_entreprise} onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })} />
          </div>
          <div className="field">
            <label>SIRET</label>
            <input value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
          </div>
          <div className="field">
            <label>Adresse</label>
            <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Code postal</label>
              <input value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
            </div>
            <div className="field">
              <label>Ville</label>
              <input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 16, marginBottom: 16 }}>
          <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-dark)', padding: '0 6px' }}>Paiement</legend>
          <div className="field-row">
            <div className="field">
              <label>IBAN</label>
              <input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </div>
            <div className="field">
              <label>BIC</label>
              <input value={form.bic} onChange={(e) => setForm({ ...form, bic: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Délai de paiement par défaut (jours)</label>
            <input type="number" value={form.delai_paiement} onChange={(e) => setForm({ ...form, delai_paiement: Number(e.target.value) })} />
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 16, marginBottom: 20 }}>
          <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-dark)', padding: '0 6px' }}>Mention légale (régime fiscal)</legend>
          <div className="field">
            <textarea rows={2} value={form.regime_fiscal} onChange={(e) => setForm({ ...form, regime_fiscal: e.target.value })} />
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
              Affichée sur chaque PDF. Vérifie qu'elle correspond à ta situation réelle.
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && <span style={{ marginLeft: 12, color: 'var(--emerald)', fontSize: 13 }}>Enregistré ✓</span>}
      </form>
    </div>
  );
}