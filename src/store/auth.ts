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
          // Helper function to fetch user with roles
          const fetchUserWithRoles = async (userId: string) => {
            try {
              const [profileResult, rolesResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle(),
                supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', userId)
              ]);

              console.log('👥 Fetched roles for user:', userId, rolesResult.data);
              
              const roles = rolesResult.data?.map(r => r.role) || [];
              console.log('✅ User roles:', roles);
              
              return {
                profile: profileResult.data,
                roles
              };
            } catch (error) {
              console.error('❌ Error fetching profile/roles:', error);
              return { profile: null, roles: [] };
            }
          };

          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event, 'User ID:', session?.user?.id);
            set({ session, loading: true }); // KEEP loading true until roles are fetched
            
            if (session?.user) {
              // Fetch profile and roles - must use setTimeout to avoid deadlock
              setTimeout(async () => {
                const { profile, roles } = await fetchUserWithRoles(session.user.id);
                
                set({ 
                  user: { 
                    ...session.user, 
                    profile,
                    roles
                  } as AuthUser,
                  loading: false // NOW set loading false after roles are loaded
                });
                
                console.log('✅ User state updated with roles:', roles);
              }, 0);
            } else {
              console.log('🚪 User logged out');
              set({ user: null, loading: false });
            }
          });

          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 Initial session check:', session?.user?.id);
          
          if (session?.user) {
            set({ session, loading: true });
            const { profile, roles } = await fetchUserWithRoles(session.user.id);
            
            console.log('✅ Initial user set with roles:', roles);
            
            set({ 
              user: { 
                ...session.user, 
                profile,
                roles
              } as AuthUser,
              loading: false,
              initialized: true
            });
          } else {
            set({ session, loading: false, initialized: true });
          }
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
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