import api from './api';

export async function askQuestion({ question, chatId }) {
  const { data } = await api.post('/ai/ask', { question, chatId });
  return data.data;
}

export async function semanticSearch(q) {
  const { data } = await api.get('/ai/search', { params: { q } });
  return data.data.results;
}

export async function listChats() {
  const { data } = await api.get('/ai/chats');
  return data.data.chats;
}

export async function getChat(id) {
  const { data } = await api.get(`/ai/chats/${id}`);
  return data.data.chat;
}

export async function regenerateSummary(documentId) {
  const { data } = await api.post(`/ai/documents/${documentId}/summary`);
  return data.data;
}

export async function compareDocuments(documentIdA, documentIdB) {
  const { data } = await api.post('/ai/compare', { documentIdA, documentIdB });
  return data.data;
}
