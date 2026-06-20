import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal.jsx';

const EMPTY = { nom: '', siret: '', adresse: '', code_postal: '', ville: '', email: '', telephone: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = création
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/clients');
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }
  function openEdit(client) {
    setEditing(client);
    setForm({ ...EMPTY, ...client });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.nom.trim()) {
      alert('Le nom est requis.');
      return;
    }
    try {
      if (editing) {
        await api.put(`/clients/${editing.id}`, form);
      } else {
        await api.post('/clients', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce client ?')) return;
    try {
      await api.delete(`/clients/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="view-head">
        <div>
          <h2>Clients</h2>
          <div className="view-sub">
            {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau client</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Chargement…</p>
      ) : clients.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Ville</th><th>SIRET</th><th></th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nom}</strong></td>
                  <td>{c.email || '—'}</td>
                  <td>{c.ville || '—'}</td>
                  <td className="mono">{c.siret || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Modifier</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}>Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h3>Aucun client pour l'instant</h3>
          <p>Ajoute ton premier client pour pouvoir créer des devis et factures.</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Ajouter un client</button>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? 'Modifier le client' : 'Nouveau client'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="field">
            <label>Nom / Société *</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input value={form.telephone || ''} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Adresse</label>
            <input value={form.adresse || ''} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Code postal</label>
              <input value={form.code_postal || ''} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
            </div>
            <div className="field">
              <label>Ville</label>
              <input value={form.ville || ''} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>SIRET (si client pro)</label>
            <input value={form.siret || ''} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}