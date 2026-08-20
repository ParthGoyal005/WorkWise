import api from './api';

export async function listRules() {
  const { data } = await api.get('/rules');
  return data.data.rules;
}

export async function createRule(payload) {
  const { data } = await api.post('/rules', payload);
  return data.data.rule;
}

export async function updateRule(id, payload) {
  const { data } = await api.patch(`/rules/${id}`, payload);
  return data.data.rule;
}

export async function deleteRule(id) {
  await api.delete(`/rules/${id}`);
}

export async function draftRule(naturalLanguage) {
  const { data } = await api.post('/rules/draft', { naturalLanguage });
  return data.data.draft;
}

export async function evaluateRule(facts) {
  const { data } = await api.post('/rules/evaluate', facts);
  return data.data;
}

export async function listEmployees() {
  const { data } = await api.get('/admin/employees');
  return data.data.employees;
}

export async function updateEmployee(id, payload) {
  const { data } = await api.patch(`/admin/employees/${id}`, payload);
  return data.data.employee;
}

export async function createEmployee(payload) {
  const { data } = await api.post('/admin/employees', payload);
  return data.data.employee;
}

export async function deleteEmployee(id) {
  await api.delete(`/admin/employees/${id}`);
}

export async function getAnalytics() {
  const { data } = await api.get('/admin/analytics');
  return data.data.analytics;
}
