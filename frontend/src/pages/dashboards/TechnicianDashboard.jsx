import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import DashboardHome from './technician/DashboardHome';
import Assets from './technician/Assets';
import Complaints from './technician/Complaints';
import CompletedTasks from './technician/CompletedTasks';

const TechnicianDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="assets" element={<Assets />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="completed-tasks" element={<CompletedTasks />} />
      </Routes>
    </Layout>
  );
};

export default TechnicianDashboard;

