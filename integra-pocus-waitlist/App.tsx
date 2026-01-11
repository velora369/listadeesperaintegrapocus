
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { Layout } from './components/Layout';
import { LeadForm } from './components/LeadForm';
import { SuccessMessage } from './components/SuccessMessage';
import { AdminDashboard } from './components/AdminDashboard';

const App: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [view, setView] = useState<'form' | 'admin'>('form');
  const [user, setUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Escuta mudanças na autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    } catch (error) {
      console.error("Erro no login:", error);
      alert('E-mail ou senha incorretos.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('form');
  };

  const toggleView = () => {
    if (view === 'form') {
      setView('admin');
    } else {
      setView('form');
      setIsSuccess(false);
    }
  };

  // Tela de carregamento premium
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[100]">
        <div className="relative">
          <img 
            src="https://yungwizzeprod2.wordpress.com/wp-content/uploads/2025/10/logo-integrapocus-branco-img.webp" 
            alt="Loading..." 
            className="h-24 md:h-32 opacity-20 animate-pulse"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="mt-8 text-slate-500 text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Integra POCUS...</p>
      </div>
    );
  }

  const adminFooterAddon = (
    <div className="mt-4 flex flex-col items-center space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
      <button
        onClick={toggleView}
        className="text-slate-700 hover:text-slate-300 transition-colors text-[9px] uppercase tracking-[0.2em] font-medium py-1 px-3 rounded hover:bg-white/5"
      >
        {view === 'form' ? 'Acesso Administrativo' : 'Voltar ao Formulário'}
      </button>
      {user && view === 'admin' && (
        <div className="flex items-center space-x-3 text-[9px] text-slate-500 tracking-wider">
          <span>{user.email}</span>
          <button onClick={handleLogout} className="text-red-900/60 hover:text-red-500 underline uppercase">Sair</button>
        </div>
      )}
    </div>
  );

  return (
    <Layout footerAddon={adminFooterAddon}>
      <div className="flex flex-col min-h-full">
        {view === 'form' ? (
          isSuccess ? (
            <SuccessMessage onReset={() => setIsSuccess(false)} />
          ) : (
            <LeadForm onSuccess={() => setIsSuccess(true)} />
          )
        ) : (
          !user ? (
            <div className="max-w-md mx-auto mt-20 w-full animate-in fade-in zoom-in-95 duration-500">
              <form onSubmit={handleAdminLogin} className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-2 text-center text-white font-sans">Login Admin</h2>
                <p className="text-slate-500 text-sm text-center mb-8">Acesso restrito para equipe Integra POCUS.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">E-mail</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Senha</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500/50 outline-none text-white transition-all"
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-white/5"
                        title={showPassword ? "Esconder senha" : "Mostrar senha"}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingAuth}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 py-4 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center text-white"
                  >
                    {isLoadingAuth ? (
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : "Entrar no Painel"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <AdminDashboard />
          )
        )}
      </div>
    </Layout>
  );
};

export default App;
