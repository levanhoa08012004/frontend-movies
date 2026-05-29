import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function recommend(body) {
  const res = await api.post('/api/recommendations', body ?? {})
  return unwrap(res)
}

export async function recommendGenerative(body) {
  const res = await api.post('/api/recommendations/generative', body ?? {})
  return unwrap(res)
}

export async function recommendPersonalized() {
  const res = await api.get('/api/recommendations/personalized')
  return unwrap(res)
}

export async function conversationalSearch(body) {
  const res = await api.post('/api/search/conversational', body ?? {})
  return unwrap(res)
}
