import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { listDocuments, deleteDocument } from '../services/documentService';

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

export default function DocumentList() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({ department: '', category: '', name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.category) params.category = filters.category;
      if (filters.name) params.name = filters.name;
      const data = await listDocuments(params);
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(id);
      setMessage('Document deleted.');
      load();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  }

  return (
    <AppLayout>
      <section className="page-header row-between">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Documents</h2>
          <p className="muted">Only documents you are allowed to access appear here.</p>
        </div>
        {isAdmin ? (
          <Link to="/documents/upload" className="btn btn-primary">
            Upload document
          </Link>
        ) : null}
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      <form
        className="filter-bar"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          type="search"
          placeholder="Filter by name"
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
        />
        <select
          value={filters.department}
          onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Apply
        </button>
      </form>

      {loading ? (
        <Spinner label="Loading documents..." />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description={
            isAdmin
              ? 'Upload a PDF, DOCX, or TXT policy to get started.'
              : 'Ask an admin to grant you access to company documents.'
          }
          action={
            isAdmin ? (
              <Link to="/documents/upload" className="btn btn-primary">
                Upload first document
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="card-grid">
          {documents.map((doc) => (
            <article key={doc._id} className="doc-card">
              <div className="doc-card-top">
                <span className={`status-pill status-${doc.status}`}>{doc.status}</span>
                <span className="access-pill">{doc.permissions?.accessType}</span>
              </div>
              <h3>
                <Link to={`/documents/${doc._id}`}>{doc.name}</Link>
              </h3>
              <p className="muted">
                {doc.category} · {doc.department}
              </p>
              <p className="meta-line">
                {doc.chunkCount} chunks · {new Date(doc.createdAt).toLocaleDateString()}
              </p>
              <div className="doc-card-actions">
                <Link to={`/documents/${doc._id}`} className="btn btn-secondary">
                  Open
                </Link>
                {isAdmin ? (
                  <>
                    <Link to={`/permissions?doc=${doc._id}`} className="btn btn-ghost-dark">
                      Permissions
                    </Link>
                    <button type="button" className="btn btn-danger" 
                    onClick={() => handleDelete(doc._id, doc.name)}>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
