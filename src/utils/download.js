export function streamSuggestedName(episodeNumber, url = '') {
  const u = url.split('?')[0] || ''
  const ext = u.includes('.m3u8') ? 'm3u8' : u.includes('.mp4') ? 'mp4' : 'video'
  return `VieStream-tap-${episodeNumber}.${ext}`
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
