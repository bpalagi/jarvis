export interface UserProfile {
  uid: string;
  display_name: string;
  email: string;
}

export interface Session {
  id: string;
  uid: string;
  title: string;
  session_type: string;
  started_at: number;
  ended_at?: number;
  notes?: string;
  sync_state: 'clean' | 'dirty';
  updated_at: number;
}

export interface Transcript {
  id: string;
  session_id: string;
  start_at: number;
  end_at?: number;
  speaker?: string;
  text: string;
  lang?: string;
  created_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface AiMessage {
  id: string;
  session_id: string;
  sent_at: number;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  model?: string;
  created_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface Summary {
  session_id: string;
  generated_at: number;
  model?: string;
  text: string;
  tldr: string;
  bullet_json: string;
  action_json: string;
  tokens_used?: number;
  updated_at: number;
  sync_state: 'clean' | 'dirty';
}

export interface PersonalizePrompt {
  id: string;
  prompt: string;
  created_at: number;
}

export interface SessionDetails {
  session: Session;
  transcripts: Transcript[];
  ai_messages: AiMessage[];
  summary: Summary | null;
}


let API_ORIGIN = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9001'
  : '';

const loadRuntimeConfig = async (): Promise<string | null> => {
  try {
    const response = await fetch('/runtime-config.json');
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Runtime config loaded:', config);
      return config.API_URL;
    }
  } catch (error) {
    console.log('⚠️ Failed to load runtime config:', error);
  }
  return null;
};

let apiUrlInitialized = false;
let initializationPromise: Promise<void> | null = null;

const initializeApiUrl = async () => {
  if (apiUrlInitialized) return;

  // Electron IPC 관련 코드를 모두 제거하고 runtime-config.json 또는 fallback에만 의존합니다.
  const runtimeUrl = await loadRuntimeConfig();
  if (runtimeUrl) {
    API_ORIGIN = runtimeUrl;
    apiUrlInitialized = true;
    return;
  }

  console.log('📍 Using fallback API URL:', API_ORIGIN);
  apiUrlInitialized = true;
};

if (typeof window !== 'undefined') {
  initializationPromise = initializeApiUrl();
}

const userInfoListeners: Array<(userInfo: UserProfile | null) => void> = [];

export const getUserInfo = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;

  const storedUserInfo = localStorage.getItem('jarvis_user');
  if (storedUserInfo) {
    try {
      return JSON.parse(storedUserInfo);
    } catch (error) {
      console.error('Failed to parse user info:', error);
      localStorage.removeItem('jarvis_user');
    }
  }
  return null;
};

export const setUserInfo = (userInfo: UserProfile | null, skipEvents: boolean = false) => {
  if (typeof window === 'undefined') return;

  if (userInfo) {
    localStorage.setItem('jarvis_user', JSON.stringify(userInfo));
  } else {
    localStorage.removeItem('jarvis_user');
  }

  if (!skipEvents) {
    userInfoListeners.forEach(listener => listener(userInfo));

    window.dispatchEvent(new Event('userInfoChanged'));
  }
};

export const onUserInfoChange = (listener: (userInfo: UserProfile | null) => void) => {
  userInfoListeners.push(listener);

  return () => {
    const index = userInfoListeners.indexOf(listener);
    if (index > -1) {
      userInfoListeners.splice(index, 1);
    }
  };
};

export const getApiHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const userInfo = getUserInfo();
  if (userInfo?.uid) {
    headers['X-User-ID'] = userInfo.uid;
  }

  return headers;
};


export const apiCall = async (path: string, options: RequestInit = {}) => {
  if (!apiUrlInitialized && initializationPromise) {
    await initializationPromise;
  }

  if (!apiUrlInitialized) {
    await initializeApiUrl();
  }

  const url = `${API_ORIGIN}${path}`;
  console.log('🌐 apiCall (Local Mode):', {
    path,
    API_ORIGIN,
    fullUrl: url,
    initialized: apiUrlInitialized,
    timestamp: new Date().toISOString()
  });

  const defaultOpts: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...getApiHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  };
  return fetch(url, defaultOpts);
};


export const searchConversations = async (query: string): Promise<Session[]> => {
  if (!query.trim()) {
    return [];
  }

  const response = await apiCall(`/api/conversations/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('Failed to search conversations');
  }
  return response.json();
};

export const getSessions = async (): Promise<Session[]> => {
  const response = await apiCall(`/api/conversations`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
};

export const getSessionDetails = async (sessionId: string): Promise<SessionDetails> => {
  const response = await apiCall(`/api/conversations/${sessionId}`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch session details');
  return response.json();
};

export const createSession = async (title?: string): Promise<{ id: string }> => {
  const response = await apiCall(`/api/conversations`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const response = await apiCall(`/api/conversations/${sessionId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete session');
};

export const getActiveSession = async (): Promise<Session | null> => {
  const response = await apiCall(`/api/conversations/active`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch active session');
  return response.json();
};

export const updateSessionNotes = async (sessionId: string, notes: string): Promise<void> => {
  const response = await apiCall(`/api/notes/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
  if (!response.ok) throw new Error('Failed to update session notes');
};

export const chatWithAssistant = async (sessionId: string, message: string): Promise<{ message: string, noteUpdate?: string }> => {
  const response = await apiCall(`/api/conversations/${sessionId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Failed to chat with assistant');
  return response.json();
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiCall(`/api/user/profile`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const updateUserProfile = async (data: { displayName: string }): Promise<void> => {
  const response = await apiCall(`/api/user/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update user profile');
};

export const findOrCreateUser = async (user: UserProfile): Promise<UserProfile> => {
  const response = await apiCall(`/api/user/find-or-create`, {
    method: 'POST',
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error('Failed to find or create user');
  return response.json();
};

export const saveApiKey = async (apiKey: string): Promise<void> => {
  const response = await apiCall(`/api/user/api-key`, {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
  if (!response.ok) throw new Error('Failed to save API key');
};

export const checkApiKeyStatus = async (): Promise<{ hasApiKey: boolean }> => {
  const response = await apiCall(`/api/user/api-key-status`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to check API key status');
  return response.json();
};

export const deleteAccount = async (): Promise<void> => {
  const response = await apiCall(`/api/user/profile`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete account');
};

export const getPersonalizePrompt = async (): Promise<PersonalizePrompt> => {
  const response = await apiCall(`/api/personalize`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch personalize prompt');
  return response.json();
};

export const updatePersonalizePrompt = async (data: { prompt: string }): Promise<void> => {
  const response = await apiCall(`/api/personalize`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update personalize prompt: ${response.status} ${errorText}`);
  }
};

export interface BatchData {
  profile?: UserProfile;
  personalize?: PersonalizePrompt;
  sessions?: Session[];
}

export const getBatchData = async (includes: ('profile' | 'personalize' | 'sessions')[]): Promise<BatchData> => {
  const response = await apiCall(`/api/user/batch?include=${includes.join(',')}`, { method: 'GET' });
  if (!response.ok) throw new Error('Failed to fetch batch data');
  return response.json();
};

export const logout = async () => {
  setUserInfo(null);

  localStorage.removeItem('openai_api_key');
  localStorage.removeItem('user_info');

  window.location.href = '/login';
};

// ── New Transcription & Notes API ──

export async function getSessionNotes(sessionId: string): Promise<string> {
  const res = await apiCall(`/api/notes/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.status}`);
  }
  const data = await res.json();
  return data.notes ?? '';
}

// Overloading updateSessionNotes to match existing signature if needed, 
// but the existing one uses PATCH /api/conversations/:id/notes.
// The new one uses PUT /api/notes/:id. 
// We will keep the existing one as primary if it works, or replace it.
// The existing one:
// export const updateSessionNotes = async (sessionId: string, notes: string): Promise<void> => { ... }
// It seems we have a conflict. The existing updateSessionNotes uses a different endpoint.
// I will rename the new one to updateSessionNotesDirect or just rely on the existing one if it does the same thing.
// However, the plan was to use the new /api/notes endpoint.
// Let's replace the existing updateSessionNotes with the new implementation but keep the signature.

export async function startTranscription(sessionId: string, audioSource: string = 'mic'): Promise<void> {
  const res = await apiCall(`/api/transcribe/start`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, audioSource }),
  });
  if (!res.ok) {
    throw new Error('Failed to start transcription');
  }
}

export async function stopTranscription(sessionId: string): Promise<void> {
  const res = await apiCall(`/api/transcribe/stop`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    throw new Error('Failed to stop transcription');
  }
}

export function streamTranscription(sessionId: string, onResult: (data: { speaker: string; text: string }) => void): EventSource {
  // Use the API_ORIGIN for the EventSource URL
  const url = `${API_ORIGIN}/api/transcribe/stream/${sessionId}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.text) {
        onResult(data);
      }
    } catch (err) {
      console.error('Error parsing SSE data', err);
    }
  };
  es.onerror = (e) => {
    console.error('Transcription SSE error', e);
    es.close();
  };
  return es;
} 