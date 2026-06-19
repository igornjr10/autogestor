import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listFiliais } from '../lib/filiais';
import { Filial } from '../types';
import { useAuth } from './AuthContext';

interface FilialContextValue {
  /** true quando o usuário é global (ADMIN sem filial fixa). */
  isGlobal: boolean;
  filiais: Filial[];
  /** Filial selecionada para visualização (apenas para usuário global). undefined = todas. */
  filialAtiva?: string;
  setFilialAtiva: (id?: string) => void;
}

const FilialContext = createContext<FilialContextValue | undefined>(undefined);
const STORAGE_KEY = 'gv_filial_ativa';

export function FilialProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const isGlobal = !!usuario && !usuario.filialId;

  const [filialAtiva, setFilialAtivaState] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined,
  );

  const { data: filiais = [] } = useQuery({
    queryKey: ['filiais'],
    queryFn: listFiliais,
    enabled: !!usuario,
  });

  function setFilialAtiva(id?: string) {
    setFilialAtivaState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  // Usuário de filial fixa: a "filial ativa" é sempre a dele (não usada nas queries,
  // pois o backend já força o escopo); mantemos undefined aqui.
  const efetiva = isGlobal ? filialAtiva : undefined;

  useEffect(() => {
    if (!isGlobal && filialAtiva) setFilialAtiva(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobal]);

  return (
    <FilialContext.Provider value={{ isGlobal, filiais, filialAtiva: efetiva, setFilialAtiva }}>
      {children}
    </FilialContext.Provider>
  );
}

export function useFilial() {
  const ctx = useContext(FilialContext);
  if (!ctx) throw new Error('useFilial deve ser usado dentro de FilialProvider');
  return ctx;
}
