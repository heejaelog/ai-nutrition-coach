import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.35.10:8000';

async function request(method, path, body = null) {
  const token = await AsyncStorage.getItem('token');

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.detail || '요청 실패');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('POST', '/api/auth/register', body),
  login: (body) => request('POST', '/api/auth/login', body),

  // User
  getMe: () => request('GET', '/api/users/me'),
  updateMe: (body) => request('PUT', '/api/users/me', body),

  // Records
  getTodayRecord: () => request('GET', '/api/records/today'),
  saveRecord: (body) => request('POST', '/api/records/', body),

  // Dashboard
  getDashboard: () => request('GET', '/api/dashboard/today'),

  // Analysis
  getWeekly: () => request('GET', '/api/analysis/weekly'),
  getMonthly: (year, month) => request('GET', `/api/analysis/monthly?year=${year}&month=${month}`),

  // Friends
  searchUser: (userId) => request('GET', `/api/friends/search?user_id=${userId}`),
  sendFriendRequest: (userId) => request('POST', '/api/friends/request', { user_id: userId }),
  acceptFriendRequest: (friendshipId) => request('POST', `/api/friends/accept/${friendshipId}`),
  removeFriend: (friendshipId) => request('DELETE', `/api/friends/${friendshipId}`),
  getFriends: () => request('GET', '/api/friends/'),
  getPendingRequests: () => request('GET', '/api/friends/pending'),
  getFriendProfile: (userId) => request('GET', `/api/friends/${userId}/profile`),

  // Skins
  getSkins: () => request('GET', '/api/skins/'),
  buySkin: (skinId) => request('POST', `/api/skins/${skinId}/buy`),
  equipSkin: (skinId) => request('POST', `/api/skins/${skinId}/equip`),
  unequipSkin: () => request('POST', '/api/skins/unequip'),
};
