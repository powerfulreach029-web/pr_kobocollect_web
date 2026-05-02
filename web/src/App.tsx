import React, { useState, useEffect } from 'react';
import { FormFilling } from './components/FormFilling';
import { GetBlankForm } from './components/GetBlankForm';
import { InstanceSelector } from './components/InstanceSelector';
import { FormHistory } from './components/FormHistory';
import { FormManager } from './components/FormManager';
import { Settings } from './components/Settings';
import { FormSelector } from './components/FormSelector';
import { EditSavedForm } from './components/EditSavedForm';
import { QRScanner } from './components/QRScanner';
import type { View, BlankForm, FormInstance, ProjectConfig } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [isConfigured, setIsConfigured] = useState(false);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [selectedForm, setSelectedForm] = useState<BlankForm | null>(null);
  const [editingInstance, setEditingInstance] = useState<FormInstance | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAuthError, setShowAuthError] = useState(false);
  const [counts, setCounts] = useState({ blanks: 0, drafts: 0, finalized: 0, sent: 0, total_saved: 0 });

  useEffect(() => {
    if (view === 'home') {
      const blanks = JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]');
      const instancesStr = localStorage.getItem('kobo_instances') || '[]';
      const instances: FormInstance[] = JSON.parse(instancesStr);
      
      const drafts = instances.filter(i => i.status === 'draft').length;
      const finalized = instances.filter(i => i.status === 'finalized').length;
      const sent = instances.filter(i => i.status === 'sent' || i.status === 'submitted').length;
      const total_saved = blanks.length + instances.length;
      
      setCounts({ blanks: blanks.length, drafts, finalized, sent, total_saved });
    }
  }, [view]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (message.includes('401') || message.includes('Authentification échouée')) {
      setShowAuthError(true);
      return;
    }
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('kobo_config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    if (config?.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [config]);

  const handleConfigDone = () => {
    const savedConfig = localStorage.getItem('kobo_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    setIsConfigured(true);
    setView('home');
  };

  const handleStartFilling = (form: BlankForm) => {
    setSelectedForm(form);
    setEditingInstance(null);
    setView('filling');
  };

  const handleEditInstance = (instance: FormInstance) => {
    const blanks = JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]');
    const form = blanks.find((f: any) => f.formId === instance.formId);
    if (form) {
       setSelectedForm(form);
       setEditingInstance(instance);
       setView('filling');
    }
  };

  const handleSaveInstance = (answers: any, status: 'draft' | 'finalized' = 'draft', labelMap: any = {}, stay: boolean = false) => {
    if (!selectedForm) return;
    
    const instancesStr = localStorage.getItem('kobo_instances') || '[]';
    let instances: FormInstance[] = JSON.parse(instancesStr);
    let updatedInstance: FormInstance | null = null;
    
    if (editingInstance) {
       // Update existing
       instances = instances.map(ins => {
          if (ins.id === editingInstance.id) {
             updatedInstance = {
                ...ins,
                answers,
                status,
                labelMap,
                timestamp: new Date().toISOString()
             };
             return updatedInstance;
          }
          return ins;
       });
    } else {
       // Create new
       updatedInstance = {
         id: Date.now().toString(),
         formId: selectedForm.formId,
         formName: selectedForm.name,
         answers,
         labelMap,
         timestamp: new Date().toISOString(),
         status
       };
       instances.push(updatedInstance);
    }
    
    localStorage.setItem('kobo_instances', JSON.stringify(instances));
    
    showToast(status === 'finalized' ? 'Formulaire finalisé avec succès !' : 'Brouillon enregistré.');
    
    if (stay) {
       setEditingInstance(updatedInstance);
    } else {
       setView('home');
       setSelectedForm(null);
       setEditingInstance(null);
    }
  };

  const handleQRScan = (qrConfig: any) => {
    const formattedConfig: ProjectConfig = {
      id: qrConfig.id || Date.now().toString(),
      name: qrConfig.name || "Serveur Importé",
      serverUrl: qrConfig.server_url || qrConfig.serverUrl || "",
      username: qrConfig.username || "",
      password: qrConfig.password || ""
    };
    localStorage.setItem('kobo_config', JSON.stringify(formattedConfig));
    setConfig(formattedConfig);
    setIsConfigured(true);
    setView('home');
    showToast("Configuration importée avec succès !");
  };

  if (!isConfigured && view !== 'settings' && view !== 'qr_scan') {
    return <FirstLaunch 
      onScanQR={() => setView('qr_scan')} 
      onManual={() => setView('settings')} 
      onDemo={() => handleConfigDone()} 
    />;
  }

  if (view === 'setup_choice') {
    return <FirstLaunch 
      onScanQR={() => setView('qr_scan')} 
      onManual={() => setView('settings')} 
      onDemo={() => handleConfigDone()} 
      onBack={() => setView('home')}
    />;
  }

  if (view === 'qr_scan') {
    return <QRScanner onScan={handleQRScan} onBack={() => setView(isConfigured ? 'setup_choice' : 'home')} />;
  }

  if (view === 'settings') {
    return (
       <Settings 
         config={config}
         onBack={() => setView('home')} 
         onSave={handleConfigDone} 
         onAddProject={() => setView('qr_scan')}
       />
    );
  }

  if (view === 'get_blank_form' && config) {
    return <GetBlankForm config={config} onBack={() => setView('home')} notify={showToast} />;
  }

  if (view === 'select_form') {
    return <FormSelector onBack={() => setView('home')} onSelect={handleStartFilling} />;
  }

  if (view === 'edit_saved_form') {
    return <EditSavedForm onBack={() => setView('home')} onEdit={handleEditInstance} />;
  }

  if (view === 'filling' && selectedForm && config) {
    return (
       <FormFilling 
         form={selectedForm} 
         config={config}
         initialAnswers={editingInstance?.answers} 
         onBack={() => setView('home')} 
         onSave={handleSaveInstance} 
       />
    );
  }

  if (view === 'send_form' && config) {
    return <InstanceSelector config={config} onBack={() => setView('home')} notify={showToast} />;
  }

  if (view === 'history') {
    return <FormHistory onBack={() => setView('home')} />;
  }

  if (view === 'manage_forms') {
    return <FormManager onBack={() => setView('home')} notify={showToast} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in safe-area-inset">
        <header className="bg-white p-6 pb-6 rounded-b-[2.5rem] shadow-sm border-b border-gray-100 sticky top-0 z-50">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
                   <img src="/app-logo.png" alt="KoboCollect" className="w-full h-full object-cover" />
                </div>
                <div>
                   <h1 className="text-xl font-black text-gray-900 tracking-tighter">KoboCollect</h1>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Web Port v2.5</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView('setup_choice')}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                   <i className="fas fa-cog"></i>
                </button>
                <button 
                   onClick={() => setView('settings')}
                   className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border-2 border-white shadow-sm hover:bg-primary/20 transition-all"
                >
                   <i className="fas fa-user text-sm"></i>
                </button>
             </div>
          </div>
       </header>

       <main className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full py-8">
          <div className="grid grid-cols-1 gap-4">
             <MenuCard 
               primary
               icon="fa-file-pen" 
               title="Remplir un formulaire" 
               subtitle="Démarrer une nouvelle enquête" 
               count={counts.blanks}
               onClick={() => setView('select_form')}
             />
             <MenuCard 
               icon="fa-edit" 
               title="Ébauches" 
               subtitle="Éditer formulaire enregistré" 
               count={counts.drafts}
               onClick={() => setView('edit_saved_form')}
             />
             <MenuCard 
               icon="fa-paper-plane" 
               title="Prêt à envoyer" 
               subtitle="Envoyer formulaire finalisé" 
               count={counts.finalized}
               onClick={() => setView('send_form')}
             />
             <MenuCard 
               icon="fa-share-square" 
               title="Envoyer" 
               subtitle="Voir les formulaires envoyés" 
               count={counts.sent}
               onClick={() => setView('history')}
             />
             <MenuCard 
               icon="fa-download" 
               title="Télécharger le formulaire" 
               subtitle="Télécharger un formulaire vierge" 
               onClick={() => setView('get_blank_form')}
             />
             <MenuCard 
               icon="fa-trash-can" 
               title="Supprimer les formulaires" 
               subtitle="Supprimer un formulaire enregistré" 
               count={counts.total_saved}
               onClick={() => setView('manage_forms')}
             />
          </div>
       </main>

       <footer className="p-8 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
             Created by <a href="https://powerfulreach.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">POWERFUL REACH</a>
          </p>
       </footer>

       {toast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] px-6 py-4 rounded-2xl shadow-2xl animate-slide-up flex items-center gap-3 border-2 ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
             <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`}></i>
             <span className="font-black text-xs uppercase tracking-widest">{toast.message}</span>
          </div>
       )}

       {showAuthError && (
          <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
             <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-slide-up">
                <div className="bg-red-500 p-10 text-white text-center space-y-4">
                   <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                      <i className="fas fa-lock text-3xl"></i>
                   </div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Accès Refusé</h2>
                </div>
                <div className="p-10 text-center space-y-6">
                   <p className="text-gray-500 font-bold leading-relaxed">
                      Le serveur a refusé la connexion. Veuillez vérifier vos identifiants (nom d'utilisateur et mot de passe) dans les paramètres de l'application.
                   </p>
                   <div className="space-y-3">
                      <button 
                        onClick={() => { setShowAuthError(false); setView('settings'); }}
                        className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                         ALLER AUX PARAMÈTRES
                      </button>
                      <button 
                        onClick={() => setShowAuthError(false)}
                        className="w-full text-gray-400 font-black py-2 text-[10px] uppercase tracking-widest"
                      >
                         Ignorer
                      </button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

const FirstLaunch: React.FC<{ onScanQR: () => void; onManual: () => void; onDemo: () => void; onBack?: () => void }> = ({ onScanQR, onManual, onDemo, onBack }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center w-full animate-fade-in relative">
     {onBack && (
        <button onClick={onBack} className="absolute top-8 left-8 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-all">
           <i className="fas fa-arrow-left"></i>
        </button>
     )}
     <div className="mb-8 w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/30">
        <img src="/app-logo.png" alt="KoboCollect" className="w-full h-full object-cover" />
     </div>
     <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter uppercase">KoboCollect</h1>
     <p className="text-gray-400 mb-12 font-bold text-xs uppercase tracking-[0.3em]">Web Port Edition</p>
     
     <div className="space-y-4 w-full max-w-xs">
        <button className="w-full bg-primary text-white font-black py-6 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all" onClick={onScanQR}>
           <i className="fas fa-qrcode text-xl"></i>
           <span>CONFIGURER AVEC QR</span>
        </button>
        <button className="w-full bg-slate-50 text-gray-600 font-black py-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all" onClick={onManual}>
           <i className="fas fa-keyboard text-xl"></i>
           <span>MANUELLEMENT</span>
        </button>
     </div>
     <button className="mt-12 text-gray-300 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors" onClick={onDemo}>Essayer la démo</button>
  </div>
);

const MenuCard: React.FC<{ icon: string; title: string; subtitle: string; primary?: boolean; count?: number; onClick?: () => void }> = ({ icon, title, subtitle, primary, count, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full p-6 rounded-[2.5rem] text-left transition-all duration-300 active:scale-[0.98] flex items-center gap-5 border-4 relative overflow-hidden ${primary ? 'bg-primary border-primary shadow-2xl shadow-primary/20 text-white' : 'bg-white border-white shadow-sm hover:shadow-xl hover:border-primary/10'}`}
  >
     {count !== undefined && count > 0 && (
       <div className={`absolute top-4 right-4 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce ${primary ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
          {count}
       </div>
     )}
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl z-10 ${primary ? 'bg-white/20' : 'bg-primary/5 text-primary'}`}>
        <i className={`fas ${icon}`}></i>
     </div>
     <div className="flex-1 overflow-hidden">
        <h3 className="font-black text-lg leading-tight truncate">{title}</h3>
        <p className={`text-[10px] font-bold uppercase tracking-wide opacity-70 mt-1`}>{subtitle}</p>
     </div>
     <i className="fas fa-chevron-right text-xs opacity-30"></i>
  </button>
);

export default App;
