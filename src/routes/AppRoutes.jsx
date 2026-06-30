import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import UserLayout from '../layouts/UserLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import CareLayout from '../layouts/CareLayout.jsx'
import CareSupportDashboard from '../pages/care/CareSupportDashboard.jsx'
import Admin from '../pages/Admin.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'
import AdminMovies from '../pages/AdminMovies.jsx'
import AdminStatsUsers from '../pages/AdminStatsUsers.jsx'
import AdminStatsVip from '../pages/AdminStatsVip.jsx'
import AdminMovieCreate from '../pages/admin/AdminMovieCreate.jsx'
import AdminMovieEdit from '../pages/admin/AdminMovieEdit.jsx'
import AdminEpisodes from '../pages/admin/AdminEpisodes.jsx'
import AdminEpisodesHub from '../pages/admin/AdminEpisodesHub.jsx'
import AdminEpisodeSources from '../pages/admin/AdminEpisodeSources.jsx'
import RequireAuth from '../components/RequireAuth.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'
import AdminRecsysProfile from '../pages/admin/AdminRecsysProfile.jsx'
import AdminVip from '../pages/admin/AdminVip.jsx'
import AdminVipBenefits from '../pages/admin/AdminVipBenefits.jsx'
import AdminVipItems from '../pages/admin/AdminVipItems.jsx'
import AdminNotifications from '../pages/admin/AdminNotifications.jsx'
import Charts from '../pages/Charts.jsx'
import HomeShell from '../pages/HomeShell.jsx'
import Devices from '../pages/Devices.jsx'
import EpisodeDetail from '../pages/EpisodeDetail.jsx'
import WatchSingle from '../pages/WatchSingle.jsx'
import Explore from '../pages/Explore.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import History from '../pages/History.jsx'
import Login from '../pages/Login.jsx'
import MovieDetail from '../pages/MovieDetail.jsx'
import Notifications from '../pages/Notifications.jsx'
import Profile from '../pages/Profile.jsx'
import Cosmetics from '../pages/profile/Cosmetics.jsx'
import Recommendations from '../pages/Recommendations.jsx'
import Register from '../pages/Register.jsx'
import Search from '../pages/Search.jsx'
import Vip from '../pages/Vip.jsx'
import Watchlist from '../pages/Watchlist.jsx'

function EpisodeListRedirect() {
  const { id } = useParams()
  return <Navigate to={`/movies/${id}`} replace />
}

export default function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Auth — full-page, không layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/quen-mat-khau" element={<ForgotPassword />} />
      <Route path="/dat-lai-mat-khau" element={<Navigate to="/quen-mat-khau" replace />} />

      {/* User-facing: Netflix-style Header + Footer.
          Lớp ngoài cho phép Guest truy cập. Các trang gated sau RequireAuth. */}
      <Route element={<UserLayout />}>
        {/* === Public (Guest + User + Admin truy cập) === */}
        <Route path="/" element={<HomeShell />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<Search />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/movies/:id/episodes" element={<EpisodeListRedirect />} />
        <Route path="/movies/:movieId/episodes/:episodeNumber" element={<EpisodeDetail />} />
        {/* Phim lẻ: player nội bộ thay vì mở m3u8 trong tab mới */}
        <Route path="/movies/:id/xem" element={<WatchSingle />} />
        <Route path="/vip" element={<Vip />} />

        {/* === Cần đăng nhập (Guest sẽ thấy prompt mời đăng nhập) === */}
        <Route element={<RequireAuth />}>
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/history" element={<History />} />
          <Route path="/activity-log" element={<Navigate to="/history" replace />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/offline-downloads" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/cosmetics" element={<Cosmetics />} />
          <Route path="/ho-so" element={<Navigate to="/profile" replace />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>
      </Route>

      {/* CARE: Chăm sóc khách hàng — chỉ chat */}
      <Route element={<CareLayout />}>
        <Route path="/quan-tri/cham-soc" element={<CareSupportDashboard />} />
        <Route path="/care" element={<Navigate to="/quan-tri/cham-soc" replace />} />
      </Route>

      {/* Admin: Sidebar + Topbar */}
      <Route element={<AdminLayout />}>
        <Route path="/quan-tri" element={<AdminDashboard />} />
        <Route path="/quan-tri/nguoi-dung" element={<Admin />} />
        <Route path="/quan-tri/phim" element={<AdminMovies />} />
        <Route path="/quan-tri/phim/moi" element={<AdminMovieCreate />} />
        <Route path="/quan-tri/phim/:id" element={<AdminMovieEdit />} />
        <Route path="/quan-tri/tap" element={<AdminEpisodesHub />} />
        <Route path="/quan-tri/phim/:id/tap" element={<AdminEpisodes />} />
        <Route path="/quan-tri/phim/:id/tap/:ep/nguon" element={<AdminEpisodeSources />} />
        <Route path="/quan-tri/vip" element={<AdminVip />} />
        <Route path="/quan-tri/vip/dac-quyen" element={<AdminVipBenefits />} />
        <Route path="/quan-tri/vip/items" element={<AdminVipItems />} />
        <Route path="/quan-tri/thong-ke" element={<AdminStatsUsers />} />
        <Route path="/quan-tri/bao-cao-vip" element={<AdminStatsVip />} />
        <Route path="/quan-tri/recsys-profile" element={<AdminRecsysProfile />} />
        <Route path="/quan-tri/thong-bao" element={<AdminNotifications />} />

        {/* Aliases tiếng Anh */}
        <Route path="/admin" element={<Navigate to="/quan-tri" replace />} />
        <Route path="/admin/users" element={<Navigate to="/quan-tri/nguoi-dung" replace />} />
        <Route path="/admin/movies" element={<Navigate to="/quan-tri/phim" replace />} />
        <Route path="/admin/stats-users" element={<Navigate to="/quan-tri/thong-ke" replace />} />
        <Route path="/admin/stats-vip" element={<Navigate to="/quan-tri/bao-cao-vip" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
