export const API_BASE = 'http://localhost:8080';  

export const API = {
  saes:      `${API_BASE}/api/saes`,
  saeById:   (id: number) => `${API_BASE}/api/saes/${id}`,
  import:    `${API_BASE}/api/import`,
};