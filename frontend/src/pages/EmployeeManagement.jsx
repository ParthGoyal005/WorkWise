import { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import {
  listEmployees,
  updateEmployee,
  createEmployee,
  deleteEmployee,
} from '../services/ruleService';

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

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    employeeCode: '',
    name: '',
    email: '',
    department: 'Engineering',
    employeeType: 'Permanent',
    casualLeavesTaken: 0,
    medicalLeavesTaken: 0,
    wfhDaysUsed: 0,
  });

  async function load() {
    setLoading(true);
    try {
      setEmployees(await listEmployees());
    } catch (err) {
      setError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createEmployee({
        ...form,
        casualLeavesTaken: Number(form.casualLeavesTaken),
        medicalLeavesTaken: Number(form.medicalLeavesTaken),
        wfhDaysUsed: Number(form.wfhDaysUsed),
      });
      setMessage('Employee created.');
      setForm({
        employeeCode: '',
        name: '',
        email: '',
        department: 'Engineering',
        employeeType: 'Permanent',
        casualLeavesTaken: 0,
        medicalLeavesTaken: 0,
        wfhDaysUsed: 0,
      });
      load();
    } catch (err) {
      setError(err.message || 'Create failed.');
    }
  }

  async function handleUpdate(employee, field, value) {
    try {
      await updateEmployee(employee._id, { [field]: Number(value) });
      setMessage(`Updated ${employee.name}.`);
      load();
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee record?')) return;
    try {
      await deleteEmployee(id);
      load();
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  }

  return (
    <AppLayout>
      <section className="page-header">
        <div>
          <p className="eyebrow">People</p>
          <h2>Employee management</h2>
          <p className="muted">
            Leave balances here feed the rule engine eligibility tests.
          </p>
        </div>
      </section>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={message} onClose={() => setMessage('')} />

      <section className="panel">
        <h3>Add employee</h3>
        <form className="form" onSubmit={handleCreate}>
          <div className="form-row">
            <label className="field">
              <span>Code</span>
              <input
                required
                value={form.employeeCode}
                onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Department</span>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primary">
            Create employee
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Records</h3>
        {loading ? (
          <Spinner label="Loading employees..." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Type</th>
                  <th>Casual</th>
                  <th>Medical</th>
                  <th>WFH</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.employeeCode}</td>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.employeeType}</td>
                    <td>
                      <input
                        className="inline-number"
                        type="number"
                        defaultValue={emp.casualLeavesTaken}
                        onBlur={(e) =>
                          handleUpdate(emp, 'casualLeavesTaken', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-number"
                        type="number"
                        defaultValue={emp.medicalLeavesTaken}
                        onBlur={(e) =>
                          handleUpdate(emp, 'medicalLeavesTaken', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-number"
                        type="number"
                        defaultValue={emp.wfhDaysUsed}
                        onBlur={(e) => handleUpdate(emp, 'wfhDaysUsed', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(emp._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
