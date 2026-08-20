import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import {
  listDocuments,
  updatePermissions,
} from '../services/documentService';
import { listUsers } from '../services/authService';

const DEPARTMENTS = [
  'HR',
  'Finance',
  'Engineering',
  'Legal',
  'Operations',
  'Sales',
  'Marketing',
  'General',
];

export default function PermissionManagement() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('doc') || '');
  const [form, setForm] = useState({
    accessType: 'public',
    allowedDepartments: [],
    allowedRoles: [],
    allowedUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [docsData, usersData] = await Promise.all([
          listDocuments(),
          listUsers(),
        ]);
        setDocuments(docsData.documents);
        setUsers(usersData.users || []);
        const initialId = searchParams.get('doc') || docsData.documents[0]?._id || '';
        setSelectedId(initialId);
        const selected = docsData.documents.find((d) => d._id === initialId);
        if (selected) {
          setForm({
            accessType: selected.permissions?.accessType || 'public',
            allowedDepartments: selected.permissions?.allowedDepartments || [],
            allowedRoles: selected.permissions?.allowedRoles || [],
            allowedUsers: (selected.permissions?.allowedUsers || []).map((u) =>
              typeof u === 'string' ? u : u._id || u
            ),
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load permissions data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchParams]);

  function selectDocument(id) {
    setSelectedId(id);
    const selected = documents.find((d) => d._id === id);
    if (!selected) return;
    setForm({
      accessType: selected.permissions?.accessType || 'public',
      allowedDepartments: selected.permissions?.allowedDepartments || [],
      allowedRoles: selected.permissions?.allowedRoles || [],
      allowedUsers: (selected.permissions?.allowedUsers || []).map((u) =>
        typeof u === 'string' ? u : u._id || u
      ),
    });
  }

  function toggle(field, value) {
    setForm((prev) => {
      const list = prev[field] || [];
      return {
        ...prev,
        [field]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updatePermissions(selectedId, form);
      setDocuments((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
      setMessage('Permissions saved. RAG will respect these rules immediately.');
    } catch (err) {
      setError(err.message || 'Could not update permissions.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <Spinner label="Loading permission manager..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Security</p>
          <h2>Document permissions</h2>
          <p className="muted">
            Restricted documents never enter the AI context for unauthorized users.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      <section className="panel">
        <form className="form" onSubmit={handleSave}>
          <label className="field">
            <span>Document</span>
            <select
              value={selectedId}
              onChange={(e) => selectDocument(e.target.value)}
            >
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Access type</span>
            <select
              value={form.accessType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, accessType: e.target.value }))
              }
            >
              <option value="public">Public</option>
              <option value="department">Department based</option>
              <option value="role">Role based</option>
              <option value="specific_users">Specific users</option>
            </select>
          </label>

          {form.accessType === 'department' ? (
            <fieldset className="chip-fieldset">
              <legend>Allowed departments</legend>
              <div className="chip-row">
                {DEPARTMENTS.map((d) => (
                  <label key={d} className="chip">
                    <input
                      type="checkbox"
                      checked={form.allowedDepartments.includes(d)}
                      onChange={() => toggle('allowedDepartments', d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {form.accessType === 'role' ? (
            <fieldset className="chip-fieldset">
              <legend>Allowed roles</legend>
              <div className="chip-row">
                {['admin', 'employee'].map((r) => (
                  <label key={r} className="chip">
                    <input
                      type="checkbox"
                      checked={form.allowedRoles.includes(r)}
                      onChange={() => toggle('allowedRoles', r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {form.accessType === 'specific_users' ? (
            <fieldset className="chip-fieldset">
              <legend>Allowed users</legend>
              <div className="chip-row">
                {users.map((u) => (
                  <label key={u._id} className="chip">
                    <input
                      type="checkbox"
                      checked={form.allowedUsers.includes(u._id)}
                      onChange={() => toggle('allowedUsers', u._id)}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={saving || !selectedId}>
            {saving ? 'Saving...' : 'Save permissions'}
          </button>
        </form>
      </section>
    </AppLayout>
  );
}
