export const API_BASE = 'http://192.168.1.93:8080';  // ← CHANGE ICI

export const API = {
  saes:      `${API_BASE}/api/saes`,
  saeById:   (id: number) => `${API_BASE}/api/saes/${id}`,
  import:    `${API_BASE}/api/import`,
};