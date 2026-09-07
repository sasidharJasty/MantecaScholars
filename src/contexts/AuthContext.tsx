import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { ONBOARDING_VERSION, onboardingStorageKey } from '@/lib/onboarding';

export type UserRole = 'admin_i' | 'admin_ii' | 'admin_iii' | 'student' | 'guest';
export interface Profile { id: string; email: string; first_name?: string; last_name?: string; role: UserRole; member_id?: string | null; account_status?: string | null; has_seen_onboarding?: boolean; onboarding_completed?: boolean; created_at?: string; updated_at?: string; }
interface AuthContextType { user: any | null; session: { access_token: string } | null; profile: Profile | null; loading: boolean; signUp: (email: string, password: string, firstName?: string, lastName?: string, memberId?: string) => Promise<{ error: any }>; signIn: (email: string, password: string) => Promise<{ error: any }>; signOut: () => Promise<{ error: any }>; resetPassword: (email: string) => Promise<{ error: any }>; confirmPasswordReset: (uid: string, token: string, newPassword: string) => Promise<{ error: any }>; setOnboardingSeen: () => Promise<void>; isAdmin: () => boolean; canManagePrograms: () => boolean; canManageUsers: () => boolean; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null); const [profile, setProfile] = useState<Profile | null>(null); const [session, setSession] = useState<{ access_token: string } | null>(null); const [loading, setLoading] = useState(true);
  const loadUser = async () => { const token = localStorage.getItem('accessToken'); if (!token) return; const data = await api.get('/users/me/'); setUser(data); setProfile(data); setSession({ access_token: token }); };
  useEffect(() => { loadUser().catch(() => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); }).finally(() => setLoading(false)); }, []);
  const signIn = async (email: string, password: string) => { try { const tokens = await api.post('/users/login/', { email, password }); localStorage.setItem('accessToken', tokens.access); localStorage.setItem('refreshToken', tokens.refresh); const data = await api.get('/users/me/'); setUser(data); setProfile(data); setSession({ access_token: tokens.access }); return { error: null }; } catch (error: any) { return { error }; } };
  const signUp = async (email: string, password: string, firstName = '', lastName = '', memberId?: string) => { try { await api.post('/users/register/', { email, password, username: email, first_name: firstName, last_name: lastName, member_id: memberId || null }); return { error: null }; } catch (error: any) { return { error }; } };
  const resetPassword = async (email: string) => { try { await api.post('/users/reset-password/', { email }); return { error: null }; } catch (error: any) { return { error }; } };
  const confirmPasswordReset = async (uid: string, token: string, newPassword: string) => { try { await api.post('/users/reset-password-confirm/', { uid, token, new_password: newPassword }); return { error: null }; } catch (error: any) { return { error }; } };
  const signOut = async () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); setUser(null); setProfile(null); setSession(null); return { error: null }; };
  const setOnboardingSeen = async () => { if (!user || !profile) return; localStorage.setItem(onboardingStorageKey(user.id, profile.role), ONBOARDING_VERSION); const data = await api.patch(`/users/${user.id}/update_profile/`, { onboarding_completed: true }); setUser(data); setProfile(data); };
  const value = { user, session, profile, loading, signUp, signIn, signOut, resetPassword, confirmPasswordReset, setOnboardingSeen, isAdmin: () => Boolean(profile?.role?.startsWith('admin')), canManagePrograms: () => ['admin_i', 'admin_ii', 'admin_iii'].includes(profile?.role || ''), canManageUsers: () => profile?.role === 'admin_iii' };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
