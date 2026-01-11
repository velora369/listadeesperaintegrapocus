
import React, { useState } from 'react';
import { FormState, ProfessionalStatus } from '../types';
import { dbService } from '../services/dbService';

interface LeadFormProps {
  onSuccess: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSuccess }) => {
  // Inicializamos com o status de Estudante por padrão conforme solicitado ("as is the standard")
  const [formData, setFormData] = useState<Partial<FormState>>({
    fullName: '',
    whatsapp: '',
    email: '',
    status: ProfessionalStatus.STUDENT,
    universityName: '',
    semester: '',
    residencyProgram: '',
    specialty: '',
    statusDetails: '',
    referralSource: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length > 2) {
        if (cleaned.length > 7) {
          return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
        }
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
      }
      return cleaned;
    }
    return value.substring(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError(null);
    if (name === 'whatsapp') {
      setFormData(prev => ({ ...prev, [name]: formatWhatsApp(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validação extra manual para campos dinâmicos
    if (formData.status === ProfessionalStatus.STUDENT) {
      if (!formData.universityName || !formData.semester) {
        setError("Por favor, preencha o nome da universidade e o semestre.");
        setIsSubmitting(false);
        return;
      }
    } else if (formData.status === ProfessionalStatus.RESIDENT) {
      if (!formData.residencyProgram) {
        setError("Por favor, informe o programa de residência.");
        setIsSubmitting(false);
        return;
      }
    } else if (formData.status === ProfessionalStatus.PRACTICING) {
      if (!formData.specialty) {
        setError("Por favor, informe sua especialidade.");
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      await dbService.saveLead(formData as FormState);
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao salvar lead:", err);
      if (err.code === 'permission-denied' || err.message?.includes('permissions')) {
        setError("Erro de configuração no banco de dados. Contate o administrador.");
      } else {
        setError("Ocorreu um erro ao enviar seus dados. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Lista de Espera – Primeira Turma Integra POCUS 2026
        </h1>
        <p className="text-slate-400 text-lg">
          Deixe seus dados para ser avisado(a) sobre a próxima turma presencial.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          <p className="font-bold mb-1">Ops! Verifique os dados:</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Nome Completo</label>
          <input
            required
            type="text"
            name="fullName"
            value={formData.fullName || ''}
            onChange={handleChange}
            placeholder="Seu nome completo"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">WhatsApp / Celular</label>
            <input
              required
              type="text"
              name="whatsapp"
              value={formData.whatsapp || ''}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Melhor E-mail</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="seuemail@email.com"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Status Profissional</label>
          <select
            required
            name="status"
            value={formData.status || ''}
            onChange={handleChange}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="" disabled className="bg-slate-900">Selecione uma opção</option>
            <option value={ProfessionalStatus.STUDENT} className="bg-slate-900">Estudante de Medicina</option>
            <option value={ProfessionalStatus.RESIDENT} className="bg-slate-900">Médico Residente</option>
            <option value={ProfessionalStatus.PRACTICING} className="bg-slate-900">Médico Atuante</option>
            <option value={ProfessionalStatus.PREPARING} className="bg-slate-900">Preparando para Residência</option>
            <option value={ProfessionalStatus.OTHER} className="bg-slate-900">Outro</option>
          </select>
        </div>

        {/* Campos Dinâmicos para Estudante - Agora aparecem por padrão */}
        {formData.status === ProfessionalStatus.STUDENT && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-300">Nome da Universidade</label>
              <input
                required
                type="text"
                name="universityName"
                value={formData.universityName || ''}
                onChange={handleChange}
                placeholder="Ex: USP, UNIFESP..."
                className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-300">Semestre Atual</label>
              <input
                required
                type="number"
                name="semester"
                min="1"
                max="12"
                value={formData.semester || ''}
                onChange={handleChange}
                placeholder="Ex: 8"
                className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {formData.status === ProfessionalStatus.RESIDENT && (
          <div className="space-y-2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-blue-300">Programa / Especialidade da Residência</label>
            <input
              required
              type="text"
              name="residencyProgram"
              value={formData.residencyProgram || ''}
              onChange={handleChange}
              placeholder="Ex: Clínica Médica, Emergência..."
              className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        )}

        {formData.status === ProfessionalStatus.PRACTICING && (
          <div className="space-y-2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-blue-300">Especialidade Médica</label>
            <input
              required
              type="text"
              name="specialty"
              value={formData.specialty || ''}
              onChange={handleChange}
              placeholder="Ex: Cardiologia, Anestesia..."
              className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        )}

        {formData.status === ProfessionalStatus.OTHER && (
          <div className="space-y-2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-blue-300">Especifique seu status</label>
            <input
              required
              type="text"
              name="statusDetails"
              value={formData.statusDetails || ''}
              onChange={handleChange}
              placeholder="Descreva seu status profissional"
              className="w-full bg-slate-950/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Como conheceu a Integra POCUS? (Opcional)</label>
          <select
            name="referralSource"
            value={formData.referralSource || ''}
            onChange={handleChange}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="" className="bg-slate-900">Selecione uma opção</option>
            <option value="Instagram" className="bg-slate-900">Instagram</option>
            <option value="Indicação" className="bg-slate-900">Indicação de Amigo/Colega</option>
            <option value="LinkedIn" className="bg-slate-900">LinkedIn</option>
            <option value="Google" className="bg-slate-900">Pesquisa no Google</option>
            <option value="Outro" className="bg-slate-900">Outro</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processando...</span>
            </>
          ) : (
            <span>Entrar na lista de espera</span>
          )}
        </button>
      </form>
    </div>
  );
};
