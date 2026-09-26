/**
 * RepoLens AI — API Service Layer
 * Communicates with the FastAPI backend via REST endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.detail || data.message || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Unable to connect to analysis engine. Ensure the backend is running.',
      0,
      null
    );
  }
}

/** Health check — GET /api/health */
export async function checkHealth() {
  try {
    return await request('/api/health');
  } catch {
    try {
      return await request('/health');
    } catch {
      return { status: 'offline' };
    }
  }
}

/** Analyze repository — POST /api/analyze */
export async function analyzeRepository(repoUrl) {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl }),
  });
}

/** Get repository details — GET /api/repository/{id} */
export async function getRepository(repoId) {
  return request(`/api/repository/${repoId}`);
}

/** Get architecture graph — GET /api/repository/{id}/graph */
export async function getRepositoryGraph(repoId) {
  return request(`/api/repository/${repoId}/graph`);
}

/** AI Chat — POST /api/chat */
export async function sendChatMessage(repositoryId, question) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      repository_id: repositoryId,
      question,
    }),
  });
}

export { ApiError };
