import api from './api';

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  return data.data;
} 

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.data.user;
}

export async function listUsers() {
  const { data } = await api.get('/auth/users');
  return data.data;
}
