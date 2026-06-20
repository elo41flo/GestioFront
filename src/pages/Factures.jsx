import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal.jsx';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function fmtEUR(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function lineTotal(l) {
  return (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0);
}

const STATUTS = ['brouillon', 'envoyée', 'payée'];

function emptyForm(defaultClientId) {
  return {
    client_id: defaultClientId || '',
    date_emission: todayISO(),
    date_echeance: '',
    notes: '',
    statut: 'brouillon',
    lignes: [{ description: '', quantite: 1, prix_unitaire: 0 }],
  };
}

export default function Factures() {
  const [facturesList, setFacturesList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [facturesData, clientsData] = await Promise.all([api.get('/factures'), api.get('/clients')]);
      setFacturesList(facturesData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function clientName(id) {
    const c = clients.find((c) => c.id === id);
    return c ? c.nom : '—';
  }

  function openCreate() {
    if (!clients.length) { alert("Ajoute d'abord un client."); return; }
    setEditingId(null);
    setForm(emptyForm(clients[0].id));
    setModalOpen(true);
  }

  async function openEdit(row) {
    try {
      const full = await api.get(`/factures/${row.id}`);
      setEditingId(full.id);
      setForm({
        client_id: full.client_id,
        date_emission: full.date_emission,
        date_echeance: full.date_echeance,
        notes: full.notes || '',
        statut: full.statut,
        lignes: full.lignes.map((l) => ({ description: l.description, quantite: l.quantite, prix_unitaire: l.prix_unitaire })),
      });
      setModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  }

  function updateLine(idx, field, value) {
    const lignes = [...form.lignes];
    lignes[idx] = { ...lignes[idx], [field]: value };
    setForm({ ...form, lignes });
  }
  function addLine() {
    setForm({ ...form, lignes: [...form.lignes, { description: '', quantite: 1, prix_unitaire: 0 }] });
  }
  function removeLine(idx) {
    setForm({ ...form, lignes: form.lignes.filter((_, i) => i !== idx) });
  }

  async function handleSubmit() {
    const lignes = form.lignes.filter((l) => l.description.trim());
    if (!lignes.length) return alert('Ajoute au moins une ligne.');
    try {
      if (editingId) {
        await api.put(`/factures/${editingId}`, {
          date_echeance: form.date_echeance,
          statut: form.statut,
          notes: form.notes,
          lignes,
        });
      } else {
        if (!form.client_id) return alert('Choisis un client.');
        await api.post('/factures', {
          client_id: form.client_id,
          date_emission: form.date_emission,
          date_echeance: form.date_echeance || undefined,
          notes: form.notes,
          lignes,
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateStatut(row, statut) {
    try {
      await api.put(`/factures/${row.id}`, { statut });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette facture ?')) return;
    try {
      await api.delete(`/factures/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePDF(row) {
    try {
      await api.downloadPDF(`/factures/${row.id}/pdf`, `${row.numero}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  }

  const formTotal = form.lignes.reduce((s, l) => s + lineTotal(l), 0);

  return (
    <div>
      <div className="view-head">
        <div>
          <h2>Factures</h2>
          <div className="view-sub">{facturesList.length} facture{facturesList.length > 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle facture</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!loading && !clients.length && (
        <div className="banner">Ajoute d'abord un client avant de créer une facture.</div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : facturesList.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Numéro</th><th>Client</th><th>Émission</th><th>Échéance</th><th>Montant</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {facturesList.map((f) => (
                <tr key={f.id}>
                  <td className="mono">{f.numero}</td>
                  <td>{clientName(f.client_id)}</td>
                  <td>{fmtDate(f.date_emission)}</td>
                  <td>{fmtDate(f.date_echeance)}</td>
                  <td className="mono">{fmtEUR(f.total_ht)}</td>
                  <td>
                    <select value={f.statut} onChange={(e) => updateStatut(f, e.target.value)}>
                      {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {f.statut_effectif === 'en retard' && (
                      <span style={{ marginLeft: 6, color: 'var(--rust)', fontSize: 11, fontWeight: 600 }}>en retard</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handlePDF(f)}>PDF</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>Modifier</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id)}>Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h3>Aucune facture</h3>
          <p>Crée une facture directement, ou convertis un devis accepté depuis l'onglet Devis.</p>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Modifier la facture' : 'Nouvelle facture'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          {editingId ? (
            <div className="field-row">
              <div className="field"><label>Client</label><input value={clientName(form.client_id)} disabled /></div>
              <div className="field"><label>Émission</label><input value={fmtDate(form.date_emission)} disabled /></div>
            </div>
          ) : (
            <div className="field">
              <label>Client *</label>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          )}

          <div className="field-row">
            {!editingId && (
              <div className="field">
                <label>Date d'émission</label>
                <input type="date" value={form.date_emission} onChange={(e) => setForm({ ...form, date_emission: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Échéance {!editingId && '(laisser vide = auto)'}</label>
              <input type="date" value={form.date_echeance} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} />
            </div>
          </div>

          {editingId && (
            <div className="field">
              <label>Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <table className="lines-table">
            <thead>
              <tr>
                <th style={{ width: '46%' }}>Description</th>
                <th style={{ width: '14%' }}>Qté</th>
                <th style={{ width: '20%' }}>PU HT</th>
                <th style={{ width: '16%' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.lignes.map((l, i) => (
                <tr key={i}>
                  <td><input value={l.description} onChange={(e) => updateLine(i, 'description', e.target.value)} /></td>
                  <td><input type="number" min="0" step="1" value={l.quantite} onChange={(e) => updateLine(i, 'quantite', e.target.value)} /></td>
                  <td><input type="number" min="0" step="0.01" value={l.prix_unitaire} onChange={(e) => updateLine(i, 'prix_unitaire', e.target.value)} /></td>
                  <td className="mono">{fmtEUR(lineTotal(l))}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => removeLine(i)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-sm" onClick={addLine}>+ Ligne</button>
          <div className="lines-total">Total HT : {fmtEUR(formTotal)}</div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Notes (optionnel)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}