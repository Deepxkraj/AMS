import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import DashboardHome from './admin/DashboardHome';
import Approvals from './admin/Approvals';
import Assets from './admin/Assets';
import Complaints from './admin/Complaints';
import Departments from './admin/Departments';
import Users from './admin/Users';

const AdminDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="assets" element={<Assets />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users" element={<Users />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;

