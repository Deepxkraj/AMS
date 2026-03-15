// Test login and dashboards with full HOD, Technician, and Citizen dashboard
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import Layout from './components/Layout/Layout';
import HODDashboardHome from './pages/dashboards/hod/DashboardHome';
import HODAssets from './pages/dashboards/hod/Assets';
import HODComplaints from './pages/dashboards/hod/Complaints';
import HODTechnicians from './pages/dashboards/hod/Technicians';
import HODApprovals from './pages/dashboards/hod/Approvals';
import HODMaintenance from './pages/dashboards/hod/Maintenance';
import HODCompletedTasks from './pages/dashboards/hod/CompletedTasks';
import TechnicianDashboardHome from './pages/dashboards/technician/DashboardHome';
import TechnicianAssets from './pages/dashboards/technician/Assets';
import TechnicianComplaints from './pages/dashboards/technician/Complaints';
import TechnicianCompletedTasks from './pages/dashboards/technician/CompletedTasks';
import CitizenDashboardHome from './pages/dashboards/citizen/DashboardHome';
import CitizenComplaints from './pages/dashboards/citizen/Complaints';
import NewComplaint from './pages/dashboards/citizen/NewComplaint';

const SimpleHODDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<HODDashboardHome />} />
        <Route path="assets" element={<HODAssets />} />
        <Route path="complaints" element={<HODComplaints />} />
        <Route path="technicians" element={<HODTechnicians />} />
        <Route path="maintenance" element={<HODMaintenance />} />
        <Route path="completed-tasks" element={<HODCompletedTasks />} />
        <Route path="approvals" element={<HODApprovals />} />
      </Routes>
    </Layout>
  );
};

const SimpleTechnicianDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<TechnicianDashboardHome />} />
        <Route path="assets" element={<TechnicianAssets />} />
        <Route path="complaints" element={<TechnicianComplaints />} />
        <Route path="completed-tasks" element={<TechnicianCompletedTasks />} />
      </Routes>
    </Layout>
  );
};

const SimpleCitizenDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<CitizenDashboardHome />} />
        <Route path="complaints" element={<CitizenComplaints />} />
        <Route path="complaints/new" element={<NewComplaint />} />
      </Routes>
    </Layout>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/hod/*" element={<SimpleHODDashboard />} />
            <Route path="/technician/*" element={<SimpleTechnicianDashboard />} />
            <Route path="/citizen/*" element={<SimpleCitizenDashboard />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

