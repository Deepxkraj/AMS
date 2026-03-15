import { Routes, Route } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import DashboardHome from './DashboardHome';
import Assets from './Assets';
import Complaints from './Complaints';
import Technicians from './Technicians';
import Approvals from './Approvals';

const HODDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="assets" element={<Assets />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="approvals" element={<Approvals />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default HODDashboard;
