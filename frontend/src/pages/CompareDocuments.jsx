import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { listDocuments } from '../services/documentService';
import { compareDocuments } from '../services/aiService';

export default function CompareDocuments() {
  const [documents, setDocuments] = useState([]);
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await listDocuments({ status: 'ready' });
        setDocuments(data.documents);
        if (data.documents.length >= 2) {
          setDocA(data.documents[0]._id);
          setDocB(data.documents[1]._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load documents.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCompare(e) {
    e.preventDefault();
    setComparing(true);
    setError('');
    setResult(null);
    try {
      const data = await compareDocuments(docA, docB);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <Spinner label="Loading accessible documents..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Compare</p>
          <h2>Multi-document comparison</h2>
          <p className="muted">
            Only documents you can access appear in the lists. Comparison uses RAG context from both.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <section className="panel">
        <form className="form" onSubmit={handleCompare}>
          <div className="form-row">
            <label className="field">
              <span>Document A</span>
              <select value={docA} onChange={(e) => setDocA(e.target.value)} required>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Document B</span>
              <select value={docB} onChange={(e) => setDocB(e.target.value)} required>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={comparing || documents.length < 2}
          >
            {comparing ? 'Comparing...' : 'Compare documents'}
          </button>
        </form>
      </section>

      {result ? (
        <section className="panel">
          <h3>
            {result.documentA.name} vs {result.documentB.name}
          </h3>
          <table className="compare-table">
            <tbody>
              <tr>
                <th>Similarities</th>
                <td>
                  <ul>
                    {(result.comparison.similarities || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <th>Differences</th>
                <td>
                  <ul>
                    {(result.comparison.differences || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <th>Important rules</th>
                <td>
                  <ul>
                    {(result.comparison.importantRules || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <th>Summary</th>
                <td>{result.comparison.summary}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}
    </AppLayout>
  );
}
