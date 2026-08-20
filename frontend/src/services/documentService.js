import api from './api';

export async function listDocuments(params = {}) {
  const { data } = await api.get('/documents', { params });
  return data.data;
}

export async function searchDocuments(params) {
  const { data } = await api.get('/documents/search', { params });
  return data.data;
}

export async function getDocument(id) {
  const { data } = await api.get(`/documents/${id}`);
  return data.data;
}

export async function uploadDocument(formData) {
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.document;
}

export async function updatePermissions(id, permissions) {
  const { data } = await api.patch(`/documents/${id}/permissions`, permissions);
  return data.data.document;
}

export async function deleteDocument(id) {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
}
