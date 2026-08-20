import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Hello, {user?.name?.split(' ')[0]}</h2>
          <p className="muted">
            {isAdmin
              ? 'Manage documents, permissions, rules, and analytics from one place.'
              : 'Ask questions about policies you are allowed to see, compare documents, and test leave eligibility.'}
          </p>
        </div>
      </section>

      <section className="card-grid">
        {isAdmin ? (
          <>
            <Link to="/documents/upload" className="action-card">
              <h3>Upload documents</h3>
              <p>Add PDF, DOCX, or TXT policies for embedding and RAG.</p>
            </Link>
            <Link to="/permissions" className="action-card">
              <h3>Manage permissions</h3>
              <p>Control who can access each document before search runs.</p>
            </Link>
            <Link to="/rules" className="action-card">
              <h3>Rule builder</h3>
              <p>Create leave and eligibility rules without AI deciding outcomes.</p>
            </Link>
            <Link to="/analytics" className="action-card">
              <h3>Analytics</h3>
              <p>Track chats, documents, and access patterns.</p>
            </Link>
          </>
        ) : (
          <>
            <Link to="/chat" className="action-card">
              <h3>Ask the assistant</h3>
              <p>Get answers grounded only in documents you can access.</p>
            </Link>
            <Link to="/compare" className="action-card">
              <h3>Compare policies</h3>
              <p>See similarities and differences across two documents.</p>
            </Link>
            <Link to="/rules/test" className="action-card">
              <h3>Test eligibility</h3>
              <p>Run leave scenarios through the deterministic rule engine.</p>
            </Link>
            <Link to="/chat-history" className="action-card">
              <h3>Chat history</h3>
              <p>Reopen previous conversations and cited sources.</p>
            </Link>
          </>
        )}
      </section>

      <section className="info-panel">
        <h3>Your access profile</h3>
        <dl className="meta-list">
          <div>
            <dt>Role</dt>
            <dd>{user?.role}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{user?.department}</dd>
          </div>
          <div>
            <dt>Employee type</dt>
            <dd>{user?.employeeType}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
      </section>
    </AppLayout>
  );
}
