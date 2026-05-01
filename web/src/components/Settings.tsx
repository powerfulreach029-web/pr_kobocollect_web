import React, { useState } from 'react';
import { ManualConfig } from './ManualConfig';
import type { ProjectConfig } from '../types';

interface SettingsProps {
  onBack: () => void;
  onSave: () => void;
  onAddProject: () => void;
  config: ProjectConfig | null;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onSave, onAddProject, config }) => {
  const [showManual, setShowManual] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleSaveConfig = (config: ProjectConfig) => {
    localStorage.setItem('kobo_config', JSON.stringify(config));
    onSave();
  };

  if (showAbout) {
    return (
      <div className="min-h-screen bg-white flex flex-col w-full animate-fade-in relative">
         <header className="p-6 flex items-center gap-4 border-b border-gray-50">
            <button onClick={() => setShowAbout(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
               <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="text-xl font-black text-gray-900">À propos</h1>
         </header>
         
         <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto">
            <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/20 rotate-6">
               <i className="fas fa-graduation-cap text-white text-5xl"></i>
            </div>
            
            <div className="space-y-4">
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">POWERFUL REACH</h2>
               <p className="text-gray-500 font-medium leading-relaxed">
                  Cette solution a été créée pour répondre à un besoin critique de la collecte de données par des moyens plus rapides, sécurisés et fiables.
               </p>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
               <a 
                 href="https://powerfulreach.netlify.app/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                  <i className="fas fa-globe"></i>
                  <span>EN SAVOIR PLUS</span>
               </a>
               
               <a 
                 href="https://wa.me/242050133271" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                  <i className="fab fa-whatsapp text-xl"></i>
                  <span>WHATSAPP</span>
               </a>

               <a 
                 href="mailto:powerfulreach029@gmail.com" 
                 className="w-full bg-gray-100 text-gray-600 font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                  <i className="fas fa-envelope"></i>
                  <span>EMAIL</span>
               </a>
            </div>

            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest pt-8">
               © 2026 POWERFUL REACH - Congo
            </p>
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
       <header className="bg-white p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
             <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-xl font-black text-gray-900">Options du profil</h1>
       </header>

       <main className="flex-1 p-6 space-y-4 max-w-lg mx-auto w-full">
          {/* Section Serveur Actuel */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-4 border-white flex flex-col gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                   <i className="fas fa-server"></i>
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-black text-gray-900 text-sm truncate">Serveur Actuel</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase truncate tracking-tight">Configuration active</p>
                </div>
             </div>
             <button 
               onClick={() => setShowManual(true)}
               className="w-full py-4 bg-gray-50 text-gray-600 font-bold rounded-2xl text-xs hover:bg-primary/5 hover:text-primary transition-all border-2 border-transparent"
             >
                Modifier les paramètres
             </button>
          </div>

          {/* Bouton Ajouter un projet (QR) */}
          <button 
            onClick={onAddProject}
            className="w-full bg-primary p-6 rounded-[2rem] shadow-xl shadow-primary/20 text-white flex items-center gap-5 active:scale-[0.98] transition-all"
          >
             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                <i className="fas fa-qrcode"></i>
             </div>
             <div className="text-left">
                <h3 className="font-black text-sm uppercase tracking-tight">Ajouter un projet</h3>
                <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Scanner un code QR</p>
             </div>
          </button>

          {/* Bouton À propos */}
          <button 
            onClick={() => setShowAbout(true)}
            className="w-full bg-white p-6 rounded-[2rem] shadow-sm border-4 border-white text-gray-800 flex items-center gap-5 active:scale-[0.98] transition-all"
          >
             <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-xl">
                <i className="fas fa-info-circle"></i>
             </div>
             <div className="text-left">
                <h3 className="font-black text-sm uppercase tracking-tight">À propos</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Informations sur l'application</p>
             </div>
          </button>

          <div className="p-8 text-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">KoBoCollect Web Port v2.5</p>
          </div>
       </main>

       {showManual && (
         <ManualConfig 
           initialConfig={config}
           onSave={(newConfig) => { handleSaveConfig(newConfig); setShowManual(false); }}
           onCancel={() => setShowManual(false)}
         />
       )}
    </div>
  );
};
