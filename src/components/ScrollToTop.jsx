import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router không tự scroll lên đầu khi đổi route — gây khó chịu khi vừa
 * scroll giữa Watchlist xong nhấn vào 1 phim, MovieDetail mở ra ở vị trí giữa
 * thay vì đầu trang. Component này lắng nghe location.pathname và reset
 * scroll về (0, 0) mỗi lần đổi route.
 *
 * Đặt ngay dưới <BrowserRouter> (vd. trong App.jsx) — không render UI.
 *
 * Bỏ qua chỉ thay đổi search/hash (vd. ?status=success sau VNPay callback)
 * để không reset scroll khi component cập nhật state qua URL params.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
