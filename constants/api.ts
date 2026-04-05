export const API_BASE = 'https://sae-register-production.up.railway.app/';  

export const API = {
  saes:      `${API_BASE}/api/saes`,
  saeById:   (id: number) => `${API_BASE}/api/saes/${id}`,
  import:    `${API_BASE}/api/import`,
};