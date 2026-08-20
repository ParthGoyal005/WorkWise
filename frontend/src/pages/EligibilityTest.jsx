import { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import { evaluateRule } from '../services/ruleService';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'HR',
  'Finance',
  'Engineering',
  'Legal',
  'Operations',
  'Sales',
  'Marketing',
  'General',
];

export default function EligibilityTest() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    casualLeavesTaken: 4,
    medicalLeavesTaken: 0,
    wfhDaysUsed: 0,
    requestedLeaves: 3,
    employeeType: user?.employeeType || 'Permanent',
    department: user?.department || 'Engineering',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await evaluateRule({
        ...form,
        casualLeavesTaken: Number(form.casualLeavesTaken),
        medicalLeavesTaken: Number(form.medicalLeavesTaken),
        wfhDaysUsed: Number(form.wfhDaysUsed),
        requestedLeaves: Number(form.requestedLeaves),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Evaluation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Eligibility</p>
          <h2>Test leave scenarios</h2>
          <p className="muted">
            The rule engine decides APPROVE / REJECT / MANUAL_REVIEW. AI only explains the result.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <section className="panel narrow">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field">
              <span>Casual leaves taken</span>
              <input
                type="number"
                min="0"
                name="casualLeavesTaken"
                value={form.casualLeavesTaken}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              <span>Requested leaves</span>
              <input
                type="number"
                min="0"
                name="requestedLeaves"
                value={form.requestedLeaves}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span>Employee type</span>
              <select name="employeeType" value={form.employeeType} onChange={handleChange}>
                {['Permanent', 'Probation', 'Contract', 'Intern'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Department</span>
              <select name="department" value={form.department} onChange={handleChange}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Evaluating...' : 'Run rule engine'}
          </button>
        </form>
      </section>

      {result ? (
        <section className="panel">
          <div className={`decision-banner decision-${result.action.toLowerCase()}`}>
            Decision: {result.action}
          </div>
          <p>{result.explanation}</p>
          {result.appliedRule ? (
            <p className="muted">Matched rule: {result.appliedRule.name}</p>
          ) : (
            <p className="muted">No restrictive rule matched.</p>
          )}
        </section>
      ) : null}
    </AppLayout>
  );
}
