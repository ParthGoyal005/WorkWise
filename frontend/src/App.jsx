import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GuestRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DocumentList from './pages/DocumentList';
import DocumentDetails from './pages/DocumentDetails';
import UploadDocument from './pages/UploadDocument';
import PermissionManagement from './pages/PermissionManagement';
import ChatAssistant from './pages/ChatAssistant';
import ChatHistory from './pages/ChatHistory';
import CompareDocuments from './pages/CompareDocuments';
import RuleBuilder from './pages/RuleBuilder';
import EligibilityTest from './pages/EligibilityTest';
import EmployeeManagement from './pages/EmployeeManagement';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/:id" element={<DocumentDetails />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/compare" element={<CompareDocuments />} />
            <Route path="/chat-history" element={<ChatHistory />} />
            <Route path="/rules/test" element={<EligibilityTest />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/documents/upload" element={<UploadDocument />} />
            <Route path="/permissions" element={<PermissionManagement />} />
            <Route path="/rules" element={<RuleBuilder />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
