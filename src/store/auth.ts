import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      initialize: async () => {
        if (get().initialized) return;
        
        try {
          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            set({ session, loading: false });
            
            if (session?.user) {
              // Fetch profile and roles after state change
              setTimeout(async () => {
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                  
                  const { data: userRoles } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', session.user.id);
                  
                  const roles = userRoles?.map(r => r.role) || [];
                  
                  set({ 
                    user: { 
                      ...session.user, 
                      profile,
                      roles
                    } as AuthUser
                  });
                } catch (error) {
                  console.error('Error fetching profile:', error);
                  set({ user: session.user as AuthUser });
                }
              }, 0);
            } else {
              set({ user: null });
            }
          });

          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          set({ session });
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id);
            
            const roles = userRoles?.map(r => r.role) || [];
            
            set({ 
              user: { 
                ...session.user, 
                profile,
                roles
              } as AuthUser
            });
          }

          set({ loading: false, initialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ loading: false, initialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        // Don't persist session as it's managed by Supabase
        user: state.user,
        initialized: state.initialized
      }),
    }
  )
);