/**
 * Wrapper bao quanh avatar — hỗ trợ 2 chế độ:
 *   1) frame.imageUrl  → IMG overlay
 *        - PNG/WebP/SVG transparent → alpha thật
 *        - JPEG nền đen → mix-blend-mode: screen
 *   2) frame.cssClass  → CSS wrapper
 *
 * Quan trọng: khi có image frame, CONTAINER chiếm đúng diện tích frame
 * (size × scale) thay vì size avatar — siblings (text, icons) sẽ
 * tự space đúng, không bị frame đè lên.
 *
 * Prop `size` luôn là kích thước AVATAR visible (vòng tròn ảnh).
 */

import { assetUrl } from '../../utils/assetUrl.js'

function isLikelyTransparent(url) {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.png') || clean.endsWith('.webp') || clean.endsWith('.svg')
}

function resolveImageUrl(url) {
  if (!url) return null
  return assetUrl(url) || url   // path /uploads/... → full URL ; URL ngoài giữ nguyên
}

export default function AvatarFrame({ frame, size = 40, children, className = '' }) {
  const rawImageUrl = frame?.imageUrl
  const imageUrl = resolveImageUrl(rawImageUrl)
  const cssClass = frame?.cssClass

  // Mode 1: image overlay
  if (imageUrl) {
    const transparent = isLikelyTransparent(rawImageUrl)
    const scale = transparent ? 1.5 : 1.6
    const containerSize = Math.round(size * scale)
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Avatar core — căn giữa, rounded clip */}
        <span
          className="absolute z-0 grid place-items-center overflow-hidden rounded-full bg-black/40"
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {children}
        </span>
        {/* Frame overlay — fill toàn container */}
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          style={{
            objectFit: 'contain',
            mixBlendMode: transparent ? 'normal' : 'screen',
            filter: transparent ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' : undefined,
          }}
        />
      </span>
    )
  }

  // Mode 2: CSS class wrapper
  if (cssClass) {
    return (
      <span className={`${cssClass} shrink-0 ${className}`}>
        <span
          className="grid place-items-center overflow-hidden rounded-full bg-black/40"
          style={{ width: size, height: size }}
        >
          {children}
        </span>
      </span>
    )
  }

  // Mode 3: avatar trần
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-black/40 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  )
}
