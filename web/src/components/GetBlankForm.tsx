import React, { useEffect, useState } from 'react';
import type { ProjectConfig } from '../types';
import { fetchFormList, fetchFormXml, type ODKForm } from '../services/odkServer';

interface GetBlankFormProps {
  config: ProjectConfig;
  onBack: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}

export const GetBlankForm: React.FC<GetBlankFormProps> = ({ config, onBack, notify }) => {
  const [forms, setForms] = useState<ODKForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadForms = async () => {
      try {
        const list = await fetchFormList(config);
        setForms(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, [config]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedForms);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForms(next);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const savedForms = JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]');
      
      for (const formId of selectedForms) {
        const form = forms.find(f => f.formId === formId);
        if (form) {
          const xml = await fetchFormXml(config, form.downloadUrl);
          const newForm = { ...form, xml, downloadedAt: new Date().toISOString() };
          
          // Remplacer si déjà existant, sinon ajouter
          const index = savedForms.findIndex((f: any) => f.formId === formId);
          if (index > -1) savedForms[index] = newForm;
          else savedForms.push(newForm);
        }
      }
      
      localStorage.setItem('kobo_blank_forms', JSON.stringify(savedForms));
      notify(`${selectedForms.size} formulaire(s) téléchargé(s) !`);
      onBack();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Erreur lors du téléchargement", 'error');
      setError(err instanceof Error ? err.message : "Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
       <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
          <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
          <h1 className="text-xl font-bold">Télécharger un formulaire</h1>
       </header>

       <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Récupération de la liste...</p>
             </div>
          ) : error ? (
             <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                <h3 className="text-red-900 font-bold text-lg mb-2">Échec de la connexion</h3>
                <p className="text-red-600 text-sm mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200"
                >
                   RÉESSAYER
                </button>
             </div>
          ) : (
             <div className="space-y-3">
                <div className="flex justify-between items-center mb-6 px-2">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {forms.length} FORMULAIRES DISPONIBLES
                   </span>
                   <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                      Tout sélectionner
                   </button>
                </div>

                {forms.map(form => (
                   <div 
                     key={form.formId}
                     onClick={() => toggleSelect(form.formId)}
                     className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedForms.has(form.formId) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-50 hover:border-gray-200'}`}
                   >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${selectedForms.has(form.formId) ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-gray-50'}`}>
                         {selectedForms.has(form.formId) && <i className="fas fa-check text-[10px]"></i>}
                      </div>
                      <div className="flex-1">
                         <h3 className="font-bold text-gray-900 leading-tight">{form.name}</h3>
                         <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">ID: {form.formId} • Version: {form.version || '1'}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </main>

       {selectedForms.size > 0 && (
          <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 flex justify-center animate-slide-up">
             <button 
               onClick={handleDownload}
               disabled={downloading}
               className="w-full max-w-xs bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
             >
                {downloading ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <i className="fas fa-download"></i>
                )}
                <span>{downloading ? 'TÉLÉCHARGEMENT...' : `TÉLÉCHARGER (${selectedForms.size})`}</span>
             </button>
          </div>
       )}
    </div>
  );
};
