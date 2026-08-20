import { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';

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

const EMPLOYEE_TYPES = ['Permanent', 'Probation', 'Contract', 'Intern'];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || 'General',
    employeeType: user?.employeeType || 'Permanent',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      await updateProfile(form);
      await refreshProfile();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Profile</h2>
          <p className="muted">Update your display name and workplace details.</p>
        </div>
      </section>

      <section className="panel narrow">
        <Alert type="success" message={message} onClose={() => setMessage('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={user?.email || ''} disabled />
          </label>

          <label className="field">
            <span>Role</span>
            <input type="text" value={user?.role || ''} disabled />
          </label>

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <div className="form-row">
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

            <label className="field">
              <span>Employee type</span>
              <select name="employeeType" value={form.employeeType} onChange={handleChange}>
                {EMPLOYEE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>
    </AppLayout>
  );
}
