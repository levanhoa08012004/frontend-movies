import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function listMovies(params) {
  const res = await api.get('/api/movies', { params })
  return unwrap(res)
}

export async function searchMovies(q, params) {
  const res = await api.get('/api/movies/search', { params: { q, ...params } })
  return unwrap(res)
}

export async function getMovie(id, includeEpisodes = false) {
  const res = await api.get(`/api/movies/${id}`, { params: { includeEpisodes } })
  return unwrap(res)
}

export async function listEpisodes(movieId, params) {
  const res = await api.get(`/api/movies/${movieId}/episodes`, { params })
  return unwrap(res)
}

export async function getEpisode(movieId, episodeNumber, { server, serverName } = {}) {
  const res = await api.get(`/api/movies/${movieId}/episodes/${episodeNumber}`, {
    params: { server, serverName },
  })
  return unwrap(res)
}

export async function trending(params) {
  const res = await api.get('/api/movies/trending', { params })
  return unwrap(res)
}

export async function newReleases(params) {
  const res = await api.get('/api/movies/new-releases', { params })
  return unwrap(res)
}

export async function byGenre(genre, params) {
  const res = await api.get(`/api/movies/genre/${encodeURIComponent(genre)}`, { params })
  return unwrap(res)
}

export async function byCountry(country, params) {
  const res = await api.get(`/api/movies/country/${encodeURIComponent(country)}`, { params })
  return unwrap(res)
}

export async function byYear(year, params) {
  const res = await api.get(`/api/movies/year/${year}`, { params })
  return unwrap(res)
}

export async function topDay(params) {
  const res = await api.get('/api/movies/top/day', { params })
  return unwrap(res)
}

export async function topWeek(params) {
  const res = await api.get('/api/movies/top/week', { params })
  return unwrap(res)
}

export async function topMonth(params) {
  const res = await api.get('/api/movies/top/month', { params })
  return unwrap(res)
}

export async function rateMovie(movieId, star) {
  await api.post(`/api/movies/${movieId}/rate`, { star })
}

export async function listRatings(movieId, params) {
  const res = await api.get(`/api/movies/${movieId}/ratings`, { params })
  return unwrap(res)
}

export async function addComment(movieId, content, parentId) {
  const res = await api.post(`/api/movies/${movieId}/comments`, { content, parentId })
  return unwrap(res)
}

export async function listComments(movieId, params) {
  const res = await api.get(`/api/movies/${movieId}/comments`, { params })
  return unwrap(res)
}

export async function deleteComment(commentId) {
  await api.delete(`/api/movies/comments/${commentId}`)
}
