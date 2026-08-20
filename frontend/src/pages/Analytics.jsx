import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { getAnalytics } from '../services/ruleService';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setAnalytics(await getAnalytics());
      } catch (err) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h2>Analytics dashboard</h2>
          <p className="muted">Usage across users, documents, chats, and access controls.</p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Spinner label="Loading analytics..." />
      ) : analytics ? (
        <>
          <section className="card-grid stats-grid">
            <article className="stat-card">
              <span>Users</span>
              <strong>{analytics.userCount}</strong>
            </article>
            <article className="stat-card">
              <span>Documents</span>
              <strong>{analytics.documentCount}</strong>
            </article>
            <article className="stat-card">
              <span>AI chats</span>
              <strong>{analytics.chatCount}</strong>
            </article>
            <article className="stat-card">
              <span>Summaries</span>
              <strong>{analytics.summaryCount}</strong>
            </article>
            <article className="stat-card">
              <span>Restricted docs</span>
              <strong>{analytics.restrictedDocuments}</strong>
            </article>
          </section>

          <div className="detail-grid">
            <section className="panel">
              <h3>Most viewed documents</h3>
              <ul className="plain-list">
                {(analytics.mostViewedDocuments || []).map((doc) => (
                  <li key={doc._id}>
                    <strong>{doc.name}</strong>
                    <span>
                      {doc.viewCount} views · {doc.department}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h3>Most asked questions</h3>
              <ul className="plain-list">
                {(analytics.mostAskedQuestions || []).map((item) => (
                  <li key={item.question}>
                    <strong>{item.question}</strong>
                    <span>{item.count} times</span>
                  </li>
                ))}
                {!analytics.mostAskedQuestions?.length ? (
                  <li className="muted">No chat activity yet.</li>
                ) : null}
              </ul>
            </section>

            <section className="panel">
              <h3>Document access stats</h3>
              <ul className="plain-list">
                {(analytics.documentAccessStats || []).map((item) => (
                  <li key={item.accessType}>
                    <strong>{item.accessType}</strong>
                    <span>{item.count} documents</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
