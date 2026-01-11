
import React from 'react';

interface SuccessMessageProps {
  onReset: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ onReset }) => {
  return (
    <div className="max-w-xl mx-auto w-full text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-white">Inscrição Confirmada!</h2>
        <p className="text-slate-400 text-lg mb-8 max-w-sm">
          Seus dados foram registrados com sucesso. Fique atento(a) ao seu e-mail e WhatsApp para novidades sobre a próxima turma.
        </p>
        
        <button
          onClick={onReset}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700"
        >
          Voltar para o início
        </button>
      </div>
    </div>
  );
};
