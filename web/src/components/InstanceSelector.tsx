import React, { useState } from 'react';
import { submitInstance } from '../services/odkServer';
import type { ProjectConfig } from '../types';

interface InstanceSelectorProps {
  config: ProjectConfig;
  onBack: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}

export const InstanceSelector: React.FC<InstanceSelectorProps> = ({ config, onBack, notify }) => {
  const [instances] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('kobo_instances') || '[]').filter((ins: any) => ins.status === 'finalized');
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingInstance, setPreviewingInstance] = useState<any | null>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const allInstances = JSON.parse(localStorage.getItem('kobo_instances') || '[]');
      
      for (const id of selectedIds) {
        const instance = instances.find(ins => ins.id === id);
        if (instance) {
          const blanks = JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]');
          const blankForm = blanks.find((f: any) => f.formId === instance.formId);
          if (!blankForm || !blankForm.xml) {
             throw new Error(`Modèle XML introuvable pour le formulaire: ${instance.formName}`);
          }
          await submitInstance(config, instance.formId, blankForm.xml, instance.id, instance.answers);
          
          // Marquer comme envoyé
          const idx = allInstances.findIndex((ins: any) => ins.id === id);
          if (idx > -1) {
            allInstances[idx].status = 'submitted';
            allInstances[idx].submittedAt = new Date().toISOString();
          }
        }
      }
      
      localStorage.setItem('kobo_instances', JSON.stringify(allInstances));
      notify(`${selectedIds.size} formulaire(s) envoyé(s) avec succès !`);
      onBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      notify(msg, 'error');
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
      <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
        <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
        <h1 className="text-xl font-bold">Envoyer un formulaire</h1>
      </header>

      <main className="flex-1 p-3 sm:p-4 max-w-2xl mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm mb-4 flex items-center gap-3">
             <i className="fas fa-exclamation-circle"></i>
             {error}
          </div>
        )}

        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
             <i className="fas fa-paper-plane text-5xl mb-4 opacity-20"></i>
             <p className="font-medium">Aucun formulaire prêt à être envoyé</p>
          </div>
        ) : (
          <div className="space-y-3">
             <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   {instances.length} FORMULAIRES À ENVOYER
                </span>
             </div>

              {instances.map(ins => (
                 <div 
                   key={ins.id}
                   className={`p-5 rounded-2xl border transition-all flex items-center gap-4 ${selectedIds.has(ins.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-50 hover:border-gray-200'}`}
                 >
                    <div 
                      onClick={() => toggleSelect(ins.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors cursor-pointer shrink-0 ${selectedIds.has(ins.id) ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-gray-50'}`}
                    >
                       {selectedIds.has(ins.id) && <i className="fas fa-check text-[10px]"></i>}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSelect(ins.id)}>
                       <h3 className="font-bold text-gray-900 leading-tight break-words">{ins.formName}</h3>
                       <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium truncate">Finalisé le: {new Date(ins.timestamp || Date.now()).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewingInstance(ins); }}
                      className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-colors shrink-0"
                      title="Voir le contenu"
                    >
                       <i className="fas fa-eye"></i>
                    </button>
                 </div>
              ))}
          </div>
        )}
      </main>

      {previewingInstance && (
         <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] animate-slide-up overflow-hidden">
               <header className="p-4 sm:p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex-1 min-w-0 pr-4">
                     <h2 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base truncate">Aperçu des données</h2>
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest truncate">{previewingInstance.formName}</p>
                  </div>
                  <button onClick={() => setPreviewingInstance(null)} className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
                     <i className="fas fa-times text-xs sm:text-sm"></i>
                  </button>
               </header>
               
               <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 bg-slate-50/50">
                  {Object.entries(previewingInstance.answers).map(([key, value]: [string, any]) => {
                     const mapInfo = previewingInstance.labelMap?.[key];
                     const questionText = mapInfo?.label || key.split('/').pop()?.toUpperCase() || key;
                     const answerText = mapInfo?.value || String(value);
                     
                     // Skip if no value
                     if (value === undefined || value === null || value === "") return null;

                     return (
                        <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                           <div className="flex items-start gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                              <p 
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight"
                                dangerouslySetInnerHTML={{ __html: questionText }}
                              />
                           </div>
                           <p 
                             className="font-bold text-gray-800 text-sm break-words pl-3.5 border-l-2 border-gray-50"
                             dangerouslySetInnerHTML={{ __html: answerText }}
                           />
                        </div>
                     );
                  })}
               </div>

               <footer className="p-4 sm:p-6 border-t bg-white sticky bottom-0">
                  <button 
                    onClick={() => setPreviewingInstance(null)}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-xs sm:text-sm"
                  >
                     FERMER L'APERÇU
                  </button>
               </footer>
            </div>
         </div>
      )}

      {selectedIds.size > 0 && (
         <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 flex justify-center animate-slide-up">
            <button 
              onClick={handleSend}
              disabled={sending}
              className="w-full max-w-xs bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
               {sending ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
               ) : (
                  <i className="fas fa-paper-plane"></i>
               )}
               <span>{sending ? 'ENVOI EN COURS...' : `ENVOYER SÉLECTION (${selectedIds.size})`}</span>
            </button>
         </div>
      )}
    </div>
  );
};
