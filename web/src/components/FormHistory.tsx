import React from 'react';

interface FormHistoryProps {
  onBack: () => void;
}

export const FormHistory: React.FC<FormHistoryProps> = ({ onBack }) => {
  const instances = JSON.parse(localStorage.getItem('kobo_instances') || '[]').filter((ins: any) => ins.status === 'submitted');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
      <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
        <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
        <h1 className="text-xl font-bold">Formulaires envoyés</h1>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
             <i className="fas fa-history text-5xl mb-4 opacity-20"></i>
             <p className="font-medium">Aucun formulaire envoyé pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="px-2 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HISTORIQUE DES SOUMISSIONS</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full">{instances.length} ENVOIS</span>
             </div>
             {instances.map((ins: any) => (
                <div key={ins.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <div className="flex items-start justify-between mb-4">
                      <div>
                         <h3 className="font-bold text-gray-900">{ins.formName}</h3>
                         <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mt-1">ID: {ins.formId}</p>
                      </div>
                      <div className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2">
                         <i className="fas fa-check-circle"></i> ENVOYÉ
                      </div>
                   </div>
                   <div className="flex items-center gap-6 text-[10px] text-gray-400 border-t pt-4">
                      <div className="flex items-center gap-2">
                         <i className="far fa-clock"></i>
                         <span>Saisi le {new Date(ins.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <i className="fas fa-paper-plane"></i>
                         <span>Soumis le {new Date(ins.submittedAt).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};
