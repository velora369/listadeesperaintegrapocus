
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Lead, ProfessionalStatus } from '../types';
import { dbService } from '../services/dbService';
import { auth } from '../firebase';
import {
  enablePushNotifications,
  isPushSupported,
  type NotificationStatus,
} from '../services/notificationService';

export const AdminDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [dbError, setDbError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<NotificationStatus | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const pullDistance = useRef(0);
  const refreshTimeoutRef = useRef<number | null>(null);

  // Mapeamento para garantir que tudo apareça em PT-BR, mesmo dados antigos
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'Medical student': 'Estudante de Medicina',
      'Resident physician': 'Médico Residente',
      'Practicing physician': 'Médico Atuante',
      'Preparing for residency': 'Preparando para Residência',
      'Other': 'Outro',
      // Mapeamento reverso/direto para os novos valores
      [ProfessionalStatus.STUDENT]: 'Estudante de Medicina',
      [ProfessionalStatus.RESIDENT]: 'Médico Residente',
      [ProfessionalStatus.PRACTICING]: 'Médico Atuante',
      [ProfessionalStatus.PREPARING]: 'Preparando para Residência',
      [ProfessionalStatus.OTHER]: 'Outro'
    };
    return translations[status] || status;
  };

  useEffect(() => {
    isPushSupported().then(setPushSupported);
  }, []);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToLeads(
      (data) => {
        setLeads(data);
        setDbError(null);
        setIsRefreshing(false);

        // Feedback visual rápido indicando que o refresh terminou
        setJustRefreshed(true);
        if (refreshTimeoutRef.current) {
          window.clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = window.setTimeout(() => {
          setJustRefreshed(false);
          refreshTimeoutRef.current = null;
        }, 1600);
      },
      (error) => {
        console.error("Erro Firestore:", error);
        if (error.code === 'permission-denied') {
          setDbError("Acesso negado: Verifique as Regras de Segurança no Console do Firebase.");
        } else {
          setDbError(`Erro no banco de dados: ${error.message}`);
        }
        setIsRefreshing(false);
      }
    );
    return () => {
      unsubscribe();
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshTrigger]);

  const handlePullRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((t) => t + 1);
  }, []);

  const PULL_THRESHOLD = 70;
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window === 'undefined') return;
    if (window.scrollY <= 15) {
      touchStartY.current = e.touches[0].clientY;
      pullDistance.current = 0;
      setPullProgress(0);
    }
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const y = e.touches[0].clientY;
    if (y > touchStartY.current) {
      pullDistance.current = y - touchStartY.current;
      const progress = Math.min(pullDistance.current / PULL_THRESHOLD, 1);
      setPullProgress(progress);
    }
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (pullDistance.current >= PULL_THRESHOLD) {
      handlePullRefresh();
    }
    touchStartY.current = null;
    pullDistance.current = 0;
    setPullProgress(0);
  }, [handlePullRefresh]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        const matchesSearch = 
          lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        // O filtro deve considerar o status real salvo no banco
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        return dateSort === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
  }, [leads, searchTerm, statusFilter, dateSort]);

  const handleExportTXT = () => {
    if (leads.length === 0) return;
    
    let txtContent = `RELATÓRIO DE LEADS - INTEGRA POCUS\n`;
    txtContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    txtContent += `Total de leads: ${leads.length}\n`;
    txtContent += `================================================\n\n`;

    leads.forEach((l, index) => {
      txtContent += `LEAD #${index + 1}\n`;
      txtContent += `Data: ${new Date(l.timestamp).toLocaleDateString('pt-BR')} ${new Date(l.timestamp).toLocaleTimeString('pt-BR')}\n`;
      txtContent += `Nome: ${l.fullName}\n`;
      txtContent += `Contatos: WhatsApp: ${l.whatsapp} | Email: ${l.email}\n`;
      txtContent += `Status: ${translateStatus(l.status)}\n`;
      
      const details = l.universityName || l.residencyProgram || l.specialty || l.statusDetails || 'N/A';
      txtContent += `Detalhes: ${details}\n`;
      
      const tagsText = (l.tags && l.tags.length > 0) ? l.tags.join(', ') : 'Nenhuma';
      txtContent += `Tags: ${tagsText}\n`;

      const referral = l.referralSource || 'Não informado';
      txtContent += `Como conheceu: ${referral}\n`;

      txtContent += `------------------------------------------------\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_integra_pocus_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Data', 'Nome', 'WhatsApp', 'Email', 'Status', 'Detalhes', 'Origem', 'Tags'];
    const rows = leads.map(l => {
      const details = (l.universityName ? `UNIV: ${l.universityName} (${l.semester}º SEM)` : '') || 
                      (l.residencyProgram ? `PROG: ${l.residencyProgram}` : '') || 
                      (l.specialty ? `ESP: ${l.specialty}` : '') || 
                      l.statusDetails || '';
      
      return [
        new Date(l.timestamp).toLocaleDateString('pt-BR'),
        l.fullName.toUpperCase(),
        l.whatsapp,
        l.email,
        translateStatus(l.status),
        details,
        l.referralSource || 'N/A',
        (l.tags || []).join(' | ')
      ];
    });

    // Usar ponto e vírgula como separador para compatibilidade com Excel em PT-BR
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Adicionar BOM para garantir que o Excel reconheça o UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_integra_pocus_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTagLead = async (id: string, tag: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const currentTags = lead.tags || [];
    const newTags = currentTags.includes(tag) 
      ? currentTags.filter(t => t !== tag) 
      : [...currentTags, tag];
    
    try {
      await dbService.updateLeadTags(id, newTags);
    } catch (error) {
      console.error("Erro ao atualizar tags:", error);
    }
  };

  const handleEnablePush = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setPushLoading(true);
    setPushStatus(null);
    const result = await enablePushNotifications(user.uid);
    setPushStatus(result);
    setPushLoading(false);
  };

  const handleDeleteLead = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Tem certeza que deseja apagar permanentemente o lead "${name}"?`)) {
      try {
        await dbService.deleteLead(id);
      } catch (error: any) {
        alert(`Erro ao deletar: ${error.message}`);
      }
    }
  };

  return (
    <div
      className="w-full animate-in fade-in duration-500"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador visual enquanto o usuário está puxando para atualizar */}
      {pullProgress > 0 && !isRefreshing && (
        <div className="sticky top-0 z-20 flex items-center justify-center gap-2 py-3 text-xs text-slate-300 bg-slate-900/80 backdrop-blur border-b border-slate-700/60">
          <span
            className="inline-block w-5 h-5 border-2 border-slate-500 border-t-blue-400 rounded-full"
            style={{ transform: `scale(${0.8 + pullProgress * 0.4})`, opacity: 0.5 + pullProgress * 0.5 }}
          />
          <span className="tracking-wide uppercase">
            {pullProgress < 1 ? 'Puxe para atualizar a lista' : 'Solte para atualizar a lista'}
          </span>
        </div>
      )}

      {/* Banner forte quando está de fato atualizando */}
      {isRefreshing && (
        <div className="sticky top-0 z-30 flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-900/80 via-slate-900/80 to-blue-900/80 backdrop-blur border-b border-blue-600/60 shadow-lg text-xs text-blue-100">
          <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="tracking-[0.18em] uppercase">Atualizando lista de leads…</span>
        </div>
      )}

      {/* Toast rápido confirmando que o refresh terminou */}
      {justRefreshed && !isRefreshing && (
        <div className="fixed left-1/2 -translate-x-1/2 top-4 z-40 px-4 py-2 bg-emerald-600/90 border border-emerald-400/60 rounded-full shadow-2xl text-xs text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="inline-block w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none">
              <path d="M16.667 5.833 8.75 13.75 5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="tracking-[0.18em] uppercase">Lista atualizada</span>
        </div>
      )}
      {dbError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <p className="font-bold">Problema no Banco de Dados:</p>
          <p>{dbError}</p>
        </div>
      )}

      {pushSupported === true && (
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <p className="text-sm text-slate-300 mb-2">Receba um aviso no celular quando alguém se cadastrar na lista.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
            >
              {pushLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
              {pushLoading ? "Ativando…" : "Ativar notificações no celular"}
            </button>
            {pushStatus?.status === "ready" && (
              <span className="text-green-400 text-sm">Notificações ativadas.</span>
            )}
            {pushStatus?.status === "permission-denied" && (
              <span className="text-amber-400 text-sm">Permissão negada. Habilite nas configurações do navegador.</span>
            )}
            {pushStatus?.status === "no-vapid" && (
              <span className="text-amber-400 text-sm">Configure VITE_VAPID_KEY no .env (veja PUSH_SETUP.md).</span>
            )}
            {pushStatus?.status === "error" && (
              <span className="text-red-400 text-sm">{pushStatus.message}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">No iPhone: adicione esta página à tela inicial (Compartilhar → Adicionar à Tela de Início). iOS 16.4+.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h2 className="text-3xl font-bold">Dashboard de Leads</h2>
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleExportTXT}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 text-white font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar Relatório (.txt)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 text-white font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Exportar Relatório (.csv)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none"
        >
          <option value="all">Todos os Status</option>
          <option value={ProfessionalStatus.STUDENT}>Estudantes</option>
          <option value={ProfessionalStatus.RESIDENT}>Residentes</option>
          <option value={ProfessionalStatus.PRACTICING}>Médicos Atuantes</option>
          <option value={ProfessionalStatus.PREPARING}>Em Preparação</option>
          <option value={ProfessionalStatus.OTHER}>Outros</option>
        </select>

        <select
          value={dateSort}
          onChange={(e) => setDateSort(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none"
        >
          <option value="newest">Mais recentes primeiro</option>
          <option value="oldest">Mais antigos primeiro</option>
        </select>

        <div className="flex items-center justify-end px-2 text-sm text-slate-500 italic">
          {filteredLeads.length} leads encontrados
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-6 py-4 font-semibold text-slate-300">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Nome</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Contato</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Status / Info</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Origem / Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLead(e, lead.id, lead.fullName)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-all border border-red-500/30 active:scale-90"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="whitespace-nowrap">{new Date(lead.timestamp).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-100 uppercase text-xs tracking-wider">
                    {lead.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm space-y-1">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{lead.whatsapp}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400 text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{lead.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-blue-400 mb-1">{translateStatus(lead.status)}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                      {lead.universityName && `UNIV: ${lead.universityName} (${lead.semester}º SEM)`}
                      {lead.residencyProgram && `PROG: ${lead.residencyProgram}`}
                      {lead.specialty && `ESP: ${lead.specialty}`}
                      {lead.statusDetails && `INFO: ${lead.statusDetails}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] text-slate-500 mb-2 italic">
                      {lead.referralSource ? `Origem: ${lead.referralSource}` : 'Origem: N/A'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTagLead(lead.id, 'Prioridade')}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                          lead.tags?.includes('Prioridade')
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        Prioridade
                      </button>
                      <button
                        onClick={() => handleTagLead(lead.id, 'Contatado')}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                          lead.tags?.includes('Contatado')
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        Contatado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
