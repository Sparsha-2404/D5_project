import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { NotifProvider } from './context/NotifContext';

import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import HomePage from './pages/user/HomePage';
import ServicesPage from './pages/user/ServicesPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import FacilitiesPage from './pages/user/FacilitiesPage';
import WalletPage from './pages/user/WalletPage';
import NotificationsPage from './pages/user/NotificationsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminServices from './pages/admin/AdminServices';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFacilities from './pages/admin/AdminFacilities';
import AdminReviews from './pages/admin/AdminReviews';
import AdminTracking from './pages/admin/AdminTracking';

import StaffTasksPage from './pages/staff/StaffTasksPage';
import StaffCompletedPage from './pages/staff/StaffCompletedPage';
import StaffStatsPage from './pages/staff/StaffStatsPage';
import StaffNotificationsPage from './pages/staff/StaffNotificationsPage';
import StaffProfilePage from './pages/staff/StaffProfilePage';

import UserLayout from './components/common/UserLayout';
import AdminLayout from './components/common/AdminLayout';
import StaffLayout from './components/common/StaffLayout';

const ResidentRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'staff') return <Navigate to="/staff" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to={user.role === 'staff' ? '/staff' : '/'} />;
  return children;
};

const StaffRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'staff' && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <SocketProvider>
      <NotifProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<ResidentRoute><UserLayout /></ResidentRoute>}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/:category" element={<ServicesPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="facilities" element={<FacilitiesPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="/staff" element={<StaffRoute><StaffLayout /></StaffRoute>}>
            <Route index element={<StaffTasksPage />} />
            <Route path="completed" element={<StaffCompletedPage />} />
            <Route path="stats" element={<StaffStatsPage />} />
            <Route path="notifications" element={<StaffNotificationsPage />} />
            <Route path="profile" element={<StaffProfilePage />} />
          </Route>

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="facilities" element={<AdminFacilities />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </NotifProvider>
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Figtree, sans-serif', fontSize: '14px' } }} />
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
