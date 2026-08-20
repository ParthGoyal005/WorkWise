const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

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

const DOCUMENT_CATEGORIES = [
  'HR Policy',
  'Leave Policy',
  'Travel Policy',
  'Expense Policy',
  'Employee Handbook',
  'Legal',
  'Technical',
  'Other',
];

const ACCESS_TYPES = {
  PUBLIC: 'public',
  DEPARTMENT: 'department',
  ROLE: 'role',
  SPECIFIC_USERS: 'specific_users',
};

const RULE_ACTIONS = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
};

const EMPLOYEE_TYPES = ['Permanent', 'Probation', 'Contract', 'Intern'];

const FILE_TYPES = {
  PDF: 'pdf',
  DOCX: 'docx',
  TXT: 'txt',
};

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const RAG_TOP_K = 5;

module.exports = {
  ROLES,
  DEPARTMENTS,
  DOCUMENT_CATEGORIES,
  ACCESS_TYPES,
  RULE_ACTIONS,
  EMPLOYEE_TYPES,
  FILE_TYPES,
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  RAG_TOP_K,
};
