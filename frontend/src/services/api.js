const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const authApi = {
  me: () => apiRequest('/auth/me'),
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (details) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const assignmentsApi = {
  list: () => apiRequest('/assignments'),
  create: (assignment) => apiRequest('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignment),
  }),
  update: (id, assignment) => apiRequest(`/assignments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(assignment),
  }),
  remove: (id) => apiRequest(`/assignments/${id}`, { method: 'DELETE' }),
};

export const submissionsApi = {
  list: () => apiRequest('/submissions'),
  submit: (assignmentId, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest(`/submissions/assignments/${assignmentId}`, {
      method: 'POST',
      body: form,
    });
  },
  evaluate: (id, evaluation) => apiRequest(`/submissions/${id}/evaluation`, {
    method: 'PATCH',
    body: JSON.stringify(evaluation),
  }),
  fileUrl: (id) => `${API_URL}/submissions/${id}/file`,
};
