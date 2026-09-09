import { api } from '@/lib/api-client';

const endpointMap: Record<string, string> = { profiles: 'users', user_roles: 'users', programs: 'programs', events: 'events', rosters: 'rosters', chat_rooms: 'chat-rooms', chat_messages: 'chat-messages', direct_messages: 'direct-messages', admin_assignments: 'admin-assignments', website_content: 'website-content' };
const fieldMap: Record<string, string> = { user_id: 'user', sender_id: 'sender', recipient_id: 'recipient', program_id: 'program', room_id: 'room', admin_id: 'admin' };
const mapTable = (table: string) => endpointMap[table] || table;
const mapField = (field: string, table?: string) => {
  if (table === 'user_roles' && field === 'user_id') return 'id';
  return fieldMap[field] || field;
};
const mapPayload = (payload: Record<string, unknown>) => Object.fromEntries(Object.entries(payload).map(([key, value]) => [mapField(key), value]));

class Query<T = any> implements PromiseLike<{ data: T; error: any; count?: number }> {
  private filters: Array<[string, string, unknown]> = []; private ordering?: string; private max?: number; private body: any; private method = 'GET'; private wantSingle = false; private head = false;
  constructor(private table: string) {}
  select(_columns = '*', options: any = {}) { this.head = Boolean(options.head); return this; }
  eq(field: string, value: unknown) { this.filters.push([mapField(field, this.table), 'eq', value]); return this; }
  neq(field: string, value: unknown) { this.filters.push([mapField(field, this.table), 'neq', value]); return this; }
  in(field: string, values: unknown[]) { this.filters.push([mapField(field, this.table), 'in', values]); return this; }
  order(field: string, options: { ascending?: boolean } = {}) { this.ordering = `${mapField(field, this.table)}=${options.ascending === false ? 'desc' : 'asc'}`; return this; }
  limit(value: number) { this.max = value; return this; }
  single() { this.wantSingle = true; return this; }
  maybeSingle() { this.wantSingle = true; return this; }
  insert(value: any) { this.method = 'POST'; this.body = Array.isArray(value) ? value[0] : value; return this; }
  update(value: any) { this.method = 'PATCH'; this.body = value; return this; }
  delete() { this.method = 'DELETE'; return this; }
  upsert(value: any) { this.method = 'POST'; this.body = Array.isArray(value) ? value[0] : value; return this; }
  then<TResult1 = { data: T; error: any; count?: number }, TResult2 = never>(onfulfilled?: ((value: { data: T; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.execute().then(onfulfilled as any, onrejected as any); }
  private async execute() {
    try {
      let path = `/${mapTable(this.table)}/`; const params = new URLSearchParams();
      for (const [field, op, value] of this.filters) { if (op === 'in') params.set(field, (value as unknown[]).join(',')); else if (op === 'neq') params.set(`${field}__not`, String(value)); else params.set(field, String(value)); }
      if (this.ordering) { const [field, direction] = this.ordering.split('='); params.set('ordering', direction === 'desc' ? `-${field}` : field); } if (this.max) params.set('limit', String(this.max));
      let result: any; if (this.method === 'GET') result = await api.get(path + (params.size ? `?${params}` : '')); else if (this.method === 'POST') result = await api.post(path, mapPayload(this.body || {})); else { const id = this.filters.find(([field]) => field === 'id')?.[2]; result = this.method === 'PATCH' ? await api.patch(`/${mapTable(this.table)}/${id}/`, mapPayload(this.body || {})) : await api.delete(`/${mapTable(this.table)}/${id}/`); }
      if (this.table === 'user_roles') result = Array.isArray(result) ? result.map((user: any) => ({ user_id: user.id, role: user.role })) : { role: result?.role };
      if (this.head) return { data: null, error: null, count: Array.isArray(result) ? result.length : 0 }; if (this.wantSingle) return { data: Array.isArray(result) ? result[0] || null : result, error: null }; return { data: result, error: null };
    } catch (error: any) { return { data: null, error }; }
  }
}

export const supabase = { from: (table: string) => new Query(table), removeChannel: (_channel: unknown) => undefined, channel: (_name: string) => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }), subscribe: () => ({}) }), auth: {
  onAuthStateChange: (_callback: unknown) => ({ data: { subscription: { unsubscribe: () => undefined } } }), getSession: async () => ({ data: { session: null } }),
  signUp: async ({ email, password, options }: any) => { try { await api.post('/users/register/', { email, password, username: email, ...options?.data }); return { error: null }; } catch (error) { return { error }; } },
  signInWithPassword: async ({ email, password }: any) => { try { const data = await api.post('/users/login/', { email, password }); localStorage.setItem('accessToken', data.access); localStorage.setItem('refreshToken', data.refresh); return { error: null }; } catch (error) { return { error }; } },
  signOut: async () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); return { error: null }; }, resetPasswordForEmail: async (email: string) => { try { await api.post('/users/reset-password/', { email }); return { error: null }; } catch (error) { return { error }; } },
} };
