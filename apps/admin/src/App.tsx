import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { api, getToken, setToken, clearToken, type FotoPendente } from './api';

/* ---------- Auth context ---------- */
interface AuthCtx {
  authed: boolean;
  nome: string;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx>(null!);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(!!getToken());
  const [nome, setNome] = useState(localStorage.getItem('ajulabs_admin_nome') || 'Admin');

  const login = useCallback(async (email: string, senha: string) => {
    const { token, nome } = await api.login(email, senha);
    setToken(token);
    localStorage.setItem('ajulabs_admin_nome', nome);
    setNome(nome);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('ajulabs_admin_nome');
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, nome, login, logout }}>{children}</AuthContext.Provider>
  );
}

/* ---------- Login ---------- */
function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    setErro('');
    setCarregando(true);
    try {
      await login(email.trim(), senha);
      navigate('/fotos');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Administração AjuLabs</h1>
        <p>Acesso restrito à equipe.</p>
        {erro ? <div className="login-error">{erro}</div> : null}
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
        </div>
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
        </div>
        <button className="btn btn-primary" onClick={entrar} disabled={carregando}>
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Layout com sidebar ---------- */
function Layout({ children, pendentes }: { children: React.ReactNode; pendentes: number }) {
  const { nome, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          AjuLabs Admin
        </div>
        <NavLink to="/fotos" className="nav-link">
          Fotos pendentes
          {pendentes > 0 ? <span className="nav-badge">{pendentes}</span> : null}
        </NavLink>
        {/* Próximas fases: Logs, Denúncias, Gestão */}
        <div className="sidebar-foot">
          <div>{nome}</div>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="work">{children}</main>
    </div>
  );
}

/* ---------- Tela de fotos pendentes ---------- */
function FotosPendentes({ onCount }: { onCount: (n: number) => void }) {
  const [fotos, setFotos] = useState<FotoPendente[] | null>(null);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState('');
  const [processando, setProcessando] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  // silencioso=true não mostra o estado de "carregando" (usado no polling)
  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setErro('');
      setAtualizando(true);
      try {
        const { fotos } = await api.listarFotosPendentes();
        setFotos(fotos);
        onCount(fotos.length);
      } catch (e) {
        if (!silencioso) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
          setFotos([]);
        }
      } finally {
        setAtualizando(false);
      }
    },
    [onCount],
  );

  useEffect(() => {
    void carregar();
    // Polling: atualiza a lista a cada 30s sem o admin precisar recarregar.
    const intervalo = setInterval(() => void carregar(true), 30000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const agir = async (id: string, acao: 'aprovar' | 'rejeitar') => {
    setProcessando(id);
    try {
      if (acao === 'aprovar') await api.aprovarFoto(id);
      else await api.rejeitarFoto(id);
      setFotos((prev) => {
        const next = (prev || []).filter((f) => f.id !== id);
        onCount(next.length);
        return next;
      });
      mostrarToast(acao === 'aprovar' ? 'Foto aprovada.' : 'Foto rejeitada.');
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'Erro ao processar.');
    } finally {
      setProcessando(null);
    }
  };

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1>Fotos pendentes</h1>
          <p>Revise as fotos de perfil enviadas antes que fiquem visíveis aos usuários.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => void carregar()} disabled={atualizando}>
          {atualizando ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {erro ? <div className="login-error">{erro}</div> : null}

      {fotos === null ? (
        <div className="empty">Carregando…</div>
      ) : fotos.length === 0 ? (
        <div className="panel empty">
          <strong>Tudo em dia</strong>
          Nenhuma foto aguardando revisão.
        </div>
      ) : (
        <div className="photo-grid">
          {fotos.map((f) => (
            <div className="photo-card" key={f.id}>
              <img className="img" src={f.fotoPendenteUrl} alt={`Foto de ${f.nome}`} />
              <div className="meta">
                <div className="name">{f.nome}</div>
                <div className="sub">
                  Enviada em {new Date(f.enviadaEm).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn btn-approve"
                  disabled={processando === f.id}
                  onClick={() => agir(f.id, 'aprovar')}
                >
                  Aprovar
                </button>
                <button
                  className="btn btn-reject"
                  disabled={processando === f.id}
                  onClick={() => agir(f.id, 'rejeitar')}
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}

/* ---------- App ---------- */
function ProtectedArea() {
  const { authed } = useAuth();
  const [pendentes, setPendentes] = useState(0);
  if (!authed) return <Navigate to="/login" replace />;
  return (
    <Layout pendentes={pendentes}>
      <Routes>
        <Route path="/fotos" element={<FotosPendentes onCount={setPendentes} />} />
        <Route path="*" element={<Navigate to="/fotos" replace />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/*" element={<ProtectedArea />} />
      </Routes>
    </AuthProvider>
  );
}
