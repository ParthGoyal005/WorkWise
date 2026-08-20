import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Alert from '../components/common/Alert';
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

const EMPLOYEE_TYPES = ['Permanent', 'Probation', 'Contract', 'Intern'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: 'General',
    employeeType: 'Permanent',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await signup(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detailMsg = err.details?.map((d) => d.message).join(' ');
      setError(detailMsg || err.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Employees get chat access. The first admin signup bootstraps the workspace."
    >
      <Alert type="error" message={error} onClose={() => setError('')} />

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            value={form.name}
            onChange={handleChange}
            placeholder="Priya Sharma"
          />
        </label>

        <label className="field">
          <span>Work email</span>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="priya@company.com"
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

        <label className="field">
          <span>Account type</span>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="employee">Employee</option>
            <option value="admin">Admin (first account only)</option>
          </select>
        </label>

        <div className="form-row">
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
