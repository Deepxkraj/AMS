import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import DashboardHome from './citizen/DashboardHome';
import Complaints from './citizen/Complaints';
import NewComplaint from './citizen/NewComplaint';
import MapView from './citizen/MapView';

const CitizenDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="new-complaint" element={<NewComplaint />} />
        <Route path="map" element={<MapView />} />
      </Routes>
    </Layout>
  );
};

export default CitizenDashboard;

