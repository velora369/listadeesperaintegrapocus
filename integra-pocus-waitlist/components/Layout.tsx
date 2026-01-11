
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  footerAddon?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, footerAddon }) => {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#020617] text-slate-100 flex flex-col">
      {/* Branded Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[120px] rounded-full"></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-10 md:py-14 px-6 flex justify-center items-center">
        <div className="flex items-center w-full max-w-4xl justify-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <img 
            src="https://yungwizzeprod2.wordpress.com/wp-content/uploads/2025/10/logo-integrapocus-branco-img.webp" 
            alt="Integra POCUS Logo" 
            className="h-24 md:h-40 lg:h-48 w-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all duration-500 hover:scale-105"
            loading="eager"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow px-4 md:px-6 pb-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-slate-600 text-sm border-t border-white/5 mx-6">
        <p className="mb-2">&copy; {new Date().getFullYear()} Integra POCUS. Todos os direitos reservados.</p>
        {footerAddon}
      </footer>
    </div>
  );
};
