import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackDevice from './pages/TrackDevice';
import UserDashboard from './pages/user/UserDashboard';
import MyDevices from './pages/user/MyDevices';
import AddDevice from './pages/user/AddDevice';
import RequestPickup from './pages/user/RequestPickup';
import UserRewards from './pages/user/UserRewards';
import UserProfile from './pages/user/UserProfile';
import CollectorDashboard from './pages/collector/CollectorDashboard';
import PickupRequests from './pages/collector/PickupRequests';
import AssignedPickups from './pages/collector/AssignedPickups';
import CompletedPickups from './pages/collector/CompletedPickups';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import PendingDevices from './pages/technician/PendingDevices';
import InspectionPage from './pages/technician/InspectionPage';
import TechnicianRepairsPage from './pages/technician/RepairsPage';
import CompletedPage from './pages/technician/CompletedPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllDevices from './pages/admin/AllDevices';
import UsersManagement from './pages/admin/UsersManagement';
import PickupManagement from './pages/admin/PickupManagement';
import AdminRepairsPage from './pages/admin/RepairsPage';
import RecyclingPage from './pages/admin/RecyclingPage';
import Analytics from './pages/admin/Analytics';

const protectedPage = (page, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{page}</ProtectedRoute>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/track" element={<TrackDevice />} />
      <Route path="/track/:deviceId" element={<TrackDevice />} />

      <Route path="/user/dashboard" element={protectedPage(<UserDashboard />, ['user'])} />
      <Route path="/user/devices" element={protectedPage(<MyDevices />, ['user'])} />
      <Route path="/user/add-device" element={protectedPage(<AddDevice />, ['user'])} />
      <Route path="/user/pickup" element={protectedPage(<RequestPickup />, ['user'])} />
      <Route path="/user/track" element={protectedPage(<TrackDevice />, ['user'])} />
      <Route path="/user/rewards" element={protectedPage(<UserRewards />, ['user'])} />
      <Route path="/user/profile" element={protectedPage(<UserProfile />, ['user', 'collector', 'technician', 'admin'])} />

      <Route path="/collector/dashboard" element={protectedPage(<CollectorDashboard />, ['collector'])} />
      <Route path="/collector/requests" element={protectedPage(<PickupRequests />, ['collector'])} />
      <Route path="/collector/assigned" element={protectedPage(<AssignedPickups />, ['collector'])} />
      <Route path="/collector/completed" element={protectedPage(<CompletedPickups />, ['collector'])} />

      <Route path="/technician/dashboard" element={protectedPage(<TechnicianDashboard />, ['technician'])} />
      <Route path="/technician/pending" element={protectedPage(<PendingDevices />, ['technician'])} />
      <Route path="/technician/inspection/:id" element={protectedPage(<InspectionPage />, ['technician'])} />
      <Route path="/technician/repairs" element={protectedPage(<TechnicianRepairsPage />, ['technician'])} />
      <Route path="/technician/completed" element={protectedPage(<CompletedPage />, ['technician'])} />

      <Route path="/admin/dashboard" element={protectedPage(<AdminDashboard />, ['admin'])} />
      <Route path="/admin/devices" element={protectedPage(<AllDevices />, ['admin'])} />
      <Route path="/admin/users" element={protectedPage(<UsersManagement />, ['admin'])} />
      <Route path="/admin/pickups" element={protectedPage(<PickupManagement />, ['admin'])} />
      <Route path="/admin/repairs" element={protectedPage(<AdminRepairsPage />, ['admin'])} />
      <Route path="/admin/recycling" element={protectedPage(<RecyclingPage />, ['admin'])} />
      <Route path="/admin/analytics" element={protectedPage(<Analytics />, ['admin'])} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
