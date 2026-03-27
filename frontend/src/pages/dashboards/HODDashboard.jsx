import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import DashboardHome from './hod/DashboardHome';
import Approvals from './hod/Approvals';
import Assets from './hod/Assets';
import Technicians from './hod/Technicians';
import Complaints from './hod/Complaints';
import Maintenance from './hod/Maintenance';
import CompletedTasks from './hod/CompletedTasks';

const HODDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="assets" element={<Assets />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="completed-tasks" element={<CompletedTasks />} />
        <Route path="technicians" element={<Technicians />} />
      </Routes>
    </Layout>
  );
};

export default HODDashboard;

