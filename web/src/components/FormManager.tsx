import React, { useState } from 'react';

interface FormManagerProps {
  onBack: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}

export const FormManager: React.FC<FormManagerProps> = ({ onBack, notify }) => {
  const [blankForms, setBlankForms] = useState<any[]>(() => JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]'));
  const [instances, setInstances] = useState<any[]>(() => JSON.parse(localStorage.getItem('kobo_instances') || '[]'));
  const [selectedBlanks, setSelectedBlanks] = useState<Set<string>>(new Set());
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());

  const deleteSelected = () => {
    const nextBlanks = blankForms.filter(f => !selectedBlanks.has(f.formId));
    const nextInstances = instances.filter(i => !selectedInstances.has(i.id));
    
    localStorage.setItem('kobo_blank_forms', JSON.stringify(nextBlanks));
    localStorage.setItem('kobo_instances', JSON.stringify(nextInstances));
    
    setBlankForms(nextBlanks);
    setInstances(nextInstances);
    setSelectedBlanks(new Set());
    setSelectedInstances(new Set());
    notify("Éléments supprimés avec succès.");
  };

  const hasSelection = selectedBlanks.size > 0 || selectedInstances.size > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
      <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
        <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
        <h1 className="text-xl font-bold">Supprimer formulaire</h1>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-8">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Modèles de formulaires</h3>
          {blankForms.length === 0 ? <p className="text-xs text-gray-400 px-2 italic">Aucun modèle</p> : blankForms.map(f => (
            <div 
              key={f.formId} 
              onClick={() => {
                const next = new Set(selectedBlanks);
                if (next.has(f.formId)) next.delete(f.formId); else next.add(f.formId);
                setSelectedBlanks(next);
              }}
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${selectedBlanks.has(f.formId) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}
            >
               <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedBlanks.has(f.formId) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200'}`}>
                  {selectedBlanks.has(f.formId) && <i className="fas fa-check text-[8px]"></i>}
               </div>
               <span className="text-sm font-bold text-gray-700">{f.name}</span>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Saisies enregistrées</h3>
          {instances.length === 0 ? <p className="text-xs text-gray-400 px-2 italic">Aucune saisie</p> : instances.map(i => (
            <div 
              key={i.id} 
              onClick={() => {
                const next = new Set(selectedInstances);
                if (next.has(i.id)) next.delete(i.id); else next.add(i.id);
                setSelectedInstances(next);
              }}
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${selectedInstances.has(i.id) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}
            >
               <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedInstances.has(i.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200'}`}>
                  {selectedInstances.has(i.id) && <i className="fas fa-check text-[8px]"></i>}
               </div>
               <div className="flex-1">
                  <span className="text-sm font-bold text-gray-700">{i.formName}</span>
                  <p className="text-[10px] text-gray-400 uppercase">{i.status === 'submitted' ? 'Soumis' : 'Brouillon'}</p>
               </div>
            </div>
          ))}
        </section>
      </main>

      {hasSelection && (
         <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 flex justify-center animate-slide-up">
            <button 
              onClick={deleteSelected}
              className="w-full max-w-xs bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
               <i className="fas fa-trash-alt"></i>
               SUPPRIMER LA SÉLECTION
            </button>
         </div>
      )}
    </div>
  );
};
