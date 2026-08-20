import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { askQuestion, getChat } from '../services/aiService';

export default function ChatAssistant() {
  const [searchParams] = useSearchParams();
  const [chatId, setChatId] = useState(searchParams.get('chat') || null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(Boolean(searchParams.get('chat')));
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function hydrate() {
      const existingId = searchParams.get('chat');
      if (!existingId) return;
      try {
        const chat = await getChat(existingId);
        setChatId(chat._id);
        setMessages(chat.messages || []);
      } catch (err) {
        setError(err.message || 'Could not load chat.');
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, [searchParams]);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setError('');
    const pending = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', content: pending, sources: [] }]);

    try {
      const result = await askQuestion({ question: pending, chatId });
      setChatId(result.chatId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer, sources: result.sources || [] },
      ]);
    } catch (err) {
      setError(err.message || 'Could not get an answer.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">RAG Assistant</p>
          <h2>Ask about company policies</h2>
          <p className="muted">
            Answers use only documents you are permitted to access, with source citations.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <section className="chat-shell panel">
        {loading ? (
          <Spinner label="Loading conversation..." />
        ) : (
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="muted">
                Try asking: “What is the leave policy?” or “How many WFH days can I take?”
              </p>
            ) : (
              messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`chat-bubble ${msg.role}`}>
                  <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
                  <p>{msg.content}</p>
                  {msg.sources?.length ? (
                    <div className="source-list">
                      <span>Sources</span>
                      <ul>
                        {msg.sources.map((source) => (
                          <li key={source.chunkId || `${source.documentName}-${source.chunkIndex}`}>
                            {source.documentName} · chunk {source.chunkIndex}
                            {source.pageNumber != null ? ` · page ${source.pageNumber}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))
            )}
            {asking ? <Spinner label="Searching accessible documents..." /> : null}
          </div>
        )}

        <form className="chat-input" onSubmit={handleAsk}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a policy question..."
            disabled={asking}
          />
          <button type="submit" className="btn btn-primary" disabled={asking}>
            Ask
          </button>
        </form>
      </section>
    </AppLayout>
  );
}
