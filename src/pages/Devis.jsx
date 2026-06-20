import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal.jsx';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

const STATUTS = ['brouillon', 'envoyé', 'accepté', 'refusé'];

function emptyForm(defaultClientId) {
  return {
    client_id: defaultClientId || '',
    date_creation: todayISO(),
    date_validite: addDaysISO(30),
    notes: '',
    lignes: [{ description: '', quantite: 1, prix_unitaire: 0 }],
  };
}

export default function Devis() {
  const [devisList, setDevisList] = useState([]);
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
      const [devisData, clientsData] = await Promise.all([api.get('/devis'), api.get('/clients')]);
      setDevisList(devisData);
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
      const full = await api.get(`/devis/${row.id}`);
      setEditingId(full.id);
      setForm({
        client_id: full.client_id,
        date_creation: full.date_creation,
        date_validite: full.date_validite || '',
        notes: full.notes || '',
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
    if (!form.client_id) return alert('Choisis un client.');
    const lignes = form.lignes.filter((l) => l.description.trim());
    if (!lignes.length) return alert('Ajoute au moins une ligne.');
    try {
      if (editingId) {
        await api.put(`/devis/${editingId}`, { ...form, lignes });
      } else {
        await api.post('/devis', { ...form, lignes });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateStatut(row, statut) {
    try {
      await api.put(`/devis/${row.id}`, {
        client_id: row.client_id,
        date_creation: row.date_creation,
        date_validite: row.date_validite,
        notes: row.notes,
        statut,
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce devis ?')) return;
    try {
      await api.delete(`/devis/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleConvert(id) {
    if (!confirm('Créer une facture à partir de ce devis ?')) return;
    try {
      await api.post(`/devis/${id}/convert`);
      alert("Facture créée — retrouve-la dans l'onglet Factures.");
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePDF(row) {
    try {
      await api.downloadPDF(`/devis/${row.id}/pdf`, `${row.numero}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  }

  const formTotal = form.lignes.reduce((s, l) => s + lineTotal(l), 0);

  return (
    <div>
      <div className="view-head">
        <div>
          <h2>Devis</h2>
          <div className="view-sub">{devisList.length} devis</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau devis</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!loading && !clients.length && (
        <div className="banner">Ajoute d'abord un client avant de créer un devis.</div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : devisList.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Numéro</th><th>Client</th><th>Date</th><th>Validité</th><th>Montant</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {devisList.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.numero}</td>
                  <td>{clientName(d.client_id)}</td>
                  <td>{fmtDate(d.date_creation)}</td>
                  <td>{fmtDate(d.date_validite)}</td>
                  <td className="mono">{fmtEUR(d.total_ht)}</td>
                  <td>
                    <select value={d.statut} onChange={(e) => updateStatut(d, e.target.value)}>
                      {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleConvert(d.id)}>→ Facture</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handlePDF(d)}>PDF</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Modifier</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(d.id)}>Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h3>Aucun devis</h3>
          <p>Crée un devis pour démarrer une mission avec un client.</p>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Modifier le devis' : 'Nouveau devis'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="field">
            <label>Client *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Date du devis</label>
              <input type="date" value={form.date_creation} onChange={(e) => setForm({ ...form, date_creation: e.target.value })} />
            </div>
            <div className="field">
              <label>Valable jusqu'au</label>
              <input type="date" value={form.date_validite} onChange={(e) => setForm({ ...form, date_validite: e.target.value })} />
            </div>
          </div>

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