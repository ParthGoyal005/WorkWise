import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { listChats } from '../services/aiService';

export default function ChatHistory() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await listChats();
        setChats(data);
      } catch (err) {
        setError(err.message || 'Failed to load chat history.');
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
          <p className="eyebrow">History</p>
          <h2>Your conversations</h2>
          <p className="muted">Reopen earlier questions and their cited sources.</p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Spinner label="Loading chats..." />
      ) : chats.length === 0 ? (
        <EmptyState
          title="No chats yet"
          description="Ask the assistant a question to start your first conversation."
          action={
            <Link to="/chat" className="btn btn-primary">
              Open assistant
            </Link>
          }
        />
      ) : (
        <div className="card-grid">
          {chats.map((chat) => (
            <Link key={chat._id} to={`/chat?chat=${chat._id}`} className="action-card">
              <h3>{chat.title}</h3>
              <p>{chat.lastQuestion || 'Conversation'}</p>
              <p className="meta-line">
                {chat.messages?.length || 0} messages ·{' '}
                {new Date(chat.updatedAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
