import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import {
  listRules,
  createRule,
  deleteRule,
  draftRule,
  updateRule,
} from '../services/ruleService';

const EMPTY_FORM = {
  name: '',
  description: '',
  logic: 'AND',
  action: 'APPROVE',
  conditions: [{ field: 'casualLeavesTaken', operator: '<=', value: 12 }],
  isActive: true,
  priority: 100,
};

export default function RuleBuilder() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRules(await listRules());
    } catch (err) {
      setError(err.message || 'Failed to load rules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateCondition(index, key, value) {
    setForm((prev) => {
      const conditions = [...prev.conditions];
      conditions[index] = { ...conditions[index], [key]: value };
      return { ...prev, conditions };
    });
  }

  async function handleDraft() {
    setError('');
    try {
      const draft = await draftRule(naturalLanguage);
      setForm({
        name: draft.name || '',
        description: draft.description || '',
        logic: draft.logic || 'AND',
        action: draft.action || 'REJECT',
        conditions: draft.conditions || EMPTY_FORM.conditions,
        isActive: true,
        priority: 100,
        naturalLanguageSource: draft.naturalLanguageSource,
      });
      setMessage('Draft loaded into the form. Review before saving.');
    } catch (err) {
      setError(err.message || 'Could not draft rule.');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        conditions: form.conditions.map((c) => ({
          ...c,
          value: Number.isNaN(Number(c.value)) ? c.value : Number(c.value),
        })),
      };
      await createRule(payload);
      setForm(EMPTY_FORM);
      setNaturalLanguage('');
      setMessage('Rule saved. The engine evaluates JSON only — never the natural language.');
      load();
    } catch (err) {
      setError(err.message || 'Could not save rule.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule) {
    try {
      await updateRule(rule._id, { isActive: !rule.isActive });
      load();
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await deleteRule(id);
      load();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Rule Engine</p>
          <h2>Rule builder</h2>
          <p className="muted">
            Rules are evaluated deterministically. AI can draft JSON or explain outcomes, but never
            decides approval.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      <section className="panel">
        <h3>Draft from natural language</h3>
        <div className="form-row">
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Describe the rule</span>
            <input
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
              placeholder='If casual leave exceeds 12 then reject'
            />
          </label>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleDraft}>
          Convert with AI
        </button>
      </section>

      <section className="panel">
        <h3>Structured rule</h3>
        <form className="form" onSubmit={handleSave}>
          <div className="form-row">
            <label className="field">
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Action</span>
              <select
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
              >
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
                <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>

          <label className="field">
            <span>Logic</span>
            <select
              value={form.logic}
              onChange={(e) => setForm((f) => ({ ...f, logic: e.target.value }))}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </label>

          {form.conditions.map((condition, index) => (
            <div className="form-row" key={`condition-${index}`}>
              <label className="field">
                <span>Field</span>
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                >
                  <option value="casualLeavesTaken">casualLeavesTaken</option>
                  <option value="medicalLeavesTaken">medicalLeavesTaken</option>
                  <option value="wfhDaysUsed">wfhDaysUsed</option>
                  <option value="requestedLeaves">requestedLeaves</option>
                  <option value="leavesTakenPlusRequested">leavesTakenPlusRequested</option>
                  <option value="employeeType">employeeType</option>
                  <option value="department">department</option>
                </select>
              </label>
              <label className="field">
                <span>Operator</span>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                >
                  {['==', '!=', '>', '>=', '<', '<='].map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Value</span>
                <input
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-ghost-dark"
            onClick={() =>
              setForm((f) => ({
                ...f,
                conditions: [
                  ...f.conditions,
                  { field: 'requestedLeaves', operator: '>', value: 5 },
                ],
              }))
            }
          >
            Add condition
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save rule'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Active rules</h3>
        {loading ? (
          <Spinner label="Loading rules..." />
        ) : (
          <div className="card-grid">
            {rules.map((rule) => (
              <article key={rule._id} className="doc-card">
                <div className="doc-card-top">
                  <span className={`status-pill ${rule.isActive ? 'status-ready' : 'status-failed'}`}>
                    {rule.isActive ? 'active' : 'inactive'}
                  </span>
                  <span className="access-pill">{rule.action}</span>
                </div>
                <h3>{rule.name}</h3>
                <p className="muted">{rule.description}</p>
                <p className="meta-line">
                  {rule.logic} · {rule.conditions.length} condition(s)
                </p>
                <div className="doc-card-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => toggleActive(rule)}>
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(rule._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
