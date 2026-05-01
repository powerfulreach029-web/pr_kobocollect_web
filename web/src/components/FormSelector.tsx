import React from 'react';

interface FormSelectorProps {
  onSelect: (form: any) => void;
  onBack: () => void;
}

export const FormSelector: React.FC<FormSelectorProps> = ({ onSelect, onBack }) => {
  const blankForms = JSON.parse(localStorage.getItem('kobo_blank_forms') || '[]');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
      <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
        <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
        <h1 className="text-xl font-bold">Remplir un formulaire</h1>
      </header>

      <main className="flex-1 p-3 sm:p-4 max-w-2xl mx-auto w-full">
        {blankForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
               <i className="fas fa-file-alt text-3xl"></i>
            </div>
            <h3 className="text-gray-900 font-bold text-lg">Aucun formulaire</h3>
            <p className="text-gray-400 text-sm max-w-xs mt-2">Vous devez d'abord télécharger des modèles depuis le serveur.</p>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FORMULAIRES LOCAUX</span>
             </div>
             {blankForms.map((form: any) => (
                <div 
                  key={form.formId}
                  onClick={() => onSelect(form)}
                  className="bg-white p-6 rounded-3xl border border-gray-50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group active:scale-[0.98]"
                >
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                         <i className="fas fa-file-signature text-xl"></i>
                      </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors break-words">{form.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium truncate">Version: {form.version || '1'} • ID: {form.formId}</p>
                       </div>
                      <i className="fas fa-chevron-right text-gray-200 group-hover:text-primary transition-colors"></i>
                   </div>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};
