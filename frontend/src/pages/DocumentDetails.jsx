import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { getDocument } from '../services/documentService';
import { regenerateSummary } from '../services/aiService';

export default function DocumentDetails() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [document, setDocument] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getDocument(id);
      setDocument(data.document);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Could not load document.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRegenerate() {
    setSummaryLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await regenerateSummary(id);
      setSummary(result.summary);
      setMessage('Summary regenerated.');
    } catch (err) {
      setError(err.message || 'Summary generation failed. Add a Gemini API key in backend/.env.');
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <Spinner label="Loading document..." />
      </AppLayout>
    );
  }

  if (!document) {
    return (
      <AppLayout>
        <Alert type="error" message={error || 'Document not found.'} />
        <Link to="/documents">Back to documents</Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-header row-between">
        <div>
          <p className="eyebrow">{document.category}</p>
          <h2>{document.name}</h2>
          <p className="muted">
            {document.department} · uploaded{' '}
            {new Date(document.createdAt).toLocaleString()} by{' '}
            {document.uploadedBy?.name || 'unknown'}
          </p>
        </div>
        {isAdmin ? (
          <Link to={`/permissions?doc=${document._id}`} className="btn btn-secondary">
            Manage permissions
          </Link>
        ) : null}
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      <div className="detail-grid">
        <section className="panel">
          <h3>Details</h3>
          <dl className="meta-list">
            <div>
              <dt>Status</dt>
              <dd>{document.status}</dd>
            </div>
            <div>
              <dt>File type</dt>
              <dd>{document.fileType}</dd>
            </div>
            <div>
              <dt>Chunks</dt>
              <dd>{document.chunkCount}</dd>
            </div>
            <div>
              <dt>Views</dt>
              <dd>{document.viewCount}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{document.permissions?.accessType}</dd>
            </div>
            <div>
              <dt>Original file</dt>
              <dd>{document.originalFileName}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="row-between">
            <h3>AI summary</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRegenerate}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Generating...' : summary ? 'Regenerate' : 'Generate summary'}
            </button>
          </div>
          {summary?.summary ? (
            <p className="summary-text">{summary.summary}</p>
          ) : (
            <p className="muted">
              No summary yet. Generate one after the document is processed (requires Gemini API key).
            </p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
