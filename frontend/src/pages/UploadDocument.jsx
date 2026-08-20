import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import { uploadDocument } from '../services/documentService';

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

const CATEGORIES = [
  'HR Policy',
  'Leave Policy',
  'Travel Policy',
  'Expense Policy',
  'Employee Handbook',
  'Legal',
  'Technical',
  'Other',
];

const ACCESS_TYPES = [
  { value: 'public', label: 'Public' },
  { value: 'department', label: 'Department based' },
  { value: 'role', label: 'Role based' },
  { value: 'specific_users', label: 'Specific users' },
];

export default function UploadDocument() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    department: 'HR',
    category: 'HR Policy',
    accessType: 'public',
    allowedDepartments: [],
    allowedRoles: [],
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleMulti(field, value) {
    setForm((prev) => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a PDF, DOCX, or TXT file.');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    payload.append('name', form.name || file.name);
    payload.append('department', form.department);
    payload.append('category', form.category);
    payload.append('accessType', form.accessType);
    payload.append('allowedDepartments', JSON.stringify(form.allowedDepartments));
    payload.append('allowedRoles', JSON.stringify(form.allowedRoles));

    setSubmitting(true);
    try {
      const document = await uploadDocument(payload);
      navigate(`/documents/${document._id}`);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Upload document</h2>
          <p className="muted">
            After upload we extract text, create chunks, and generate embeddings for RAG.
          </p>
        </div>
      </section>

      <section className="panel narrow">
        <Alert type="error" message={error} onClose={() => setError('')} />

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>File (PDF, DOCX, TXT)</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Leave Policy 2026"
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Department</span>
              <select name="department" value={form.department} onChange={handleChange}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Category</span>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Access type</span>
            <select name="accessType" value={form.accessType} onChange={handleChange}>
              {ACCESS_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
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
                      onChange={() => toggleMulti('allowedDepartments', d)}
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
                      onChange={() => toggleMulti('allowedRoles', r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading & processing...' : 'Upload document'}
          </button>
        </form>
      </section>
    </AppLayout>
  );
}
