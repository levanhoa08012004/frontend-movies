import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import RoleBasedRoute from '../components/RoleBasedRoute.jsx'
import ActivityLog from '../pages/ActivityLog.jsx'
import Admin from '../pages/Admin.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'
import AdminImportCatalog from '../pages/AdminImportCatalog.jsx'
import AdminMovies from '../pages/AdminMovies.jsx'
import AdminStatsUsers from '../pages/AdminStatsUsers.jsx'
import AdminStatsVip from '../pages/AdminStatsVip.jsx'
import Charts from '../pages/Charts.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Home from '../pages/Home.jsx'
import Devices from '../pages/Devices.jsx'
import EpisodeDetail from '../pages/EpisodeDetail.jsx'
import EpisodeList from '../pages/EpisodeList.jsx'
import Explore from '../pages/Explore.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import History from '../pages/History.jsx'
import Login from '../pages/Login.jsx'
import MovieDetail from '../pages/MovieDetail.jsx'
import Notifications from '../pages/Notifications.jsx'
import OfflineDownloads from '../pages/OfflineDownloads.jsx'
import Profile from '../pages/Profile.jsx'
import Recommendations from '../pages/Recommendations.jsx'
import Register from '../pages/Register.jsx'
import Search from '../pages/Search.jsx'
import Vip from '../pages/Vip.jsx'
import Watchlist from '../pages/Watchlist.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/quen-mat-khau" element={<ForgotPassword />} />
      <Route path="/dat-lai-mat-khau" element={<Navigate to="/quen-mat-khau" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<Search />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/movies/:id/episodes" element={<EpisodeList />} />
        <Route path="/movies/:movieId/episodes/:episodeNumber" element={<EpisodeDetail />} />

        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/history" element={<History />} />
        <Route path="/activity-log" element={<Navigate to="/history" replace />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/offline-downloads" element={<Navigate to="/profile" replace />} />
        <Route path="/vip" element={<Vip />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ho-so" element={<Navigate to="/profile" replace />} />

        {/* Đường dẫn quản trị thân thiện (không dùng /admin) */}
        <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/quan-tri" element={<AdminDashboard />} />
          <Route path="/quan-tri/nguoi-dung" element={<Admin />} />
          <Route path="/quan-tri/phim" element={<AdminMovies />} />
          <Route path="/quan-tri/thong-ke" element={<AdminStatsUsers />} />
          <Route path="/quan-tri/bao-cao-vip" element={<AdminStatsVip />} />
          <Route path="/quan-tri/nhap-phim" element={<AdminImportCatalog />} />
          <Route path="/quan-tri/cong-cu-hanh-vi" element={<ActivityLog />} />
          <Route path="/quan-tri/cong-cu-offline" element={<OfflineDownloads />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>

        <Route path="/admin" element={<Navigate to="/quan-tri" replace />} />
        <Route path="/admin/users" element={<Navigate to="/quan-tri/nguoi-dung" replace />} />
        <Route path="/admin/movies" element={<Navigate to="/quan-tri/phim" replace />} />
        <Route path="/admin/stats-users" element={<Navigate to="/quan-tri/thong-ke" replace />} />
        <Route path="/admin/stats-vip" element={<Navigate to="/quan-tri/bao-cao-vip" replace />} />
        <Route path="/admin/import-catalog" element={<Navigate to="/quan-tri/nhap-phim" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
