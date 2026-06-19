import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import { Perfil, Usuario } from '../types';

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  temPerfil: (...perfis: Perfil[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Restaura a sessão a partir do token salvo
    async function restaurar() {
      if (!tokenStore.access) {
        setCarregando(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUsuario({
          id: data.id,
          email: data.email,
          perfil: data.perfil,
          nome: data.email,
          filialId: data.filialId ?? null,
        });
      } catch {
        tokenStore.clear();
      } finally {
        setCarregando(false);
      }
    }
    restaurar();
  }, []);

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha });
    tokenStore.set(data.accessToken, data.refreshToken);
    setUsuario(data.usuario);
  }

  function logout() {
    tokenStore.clear();
    setUsuario(null);
  }

  function temPerfil(...perfis: Perfil[]) {
    return !!usuario && perfis.includes(usuario.perfil);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, temPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
