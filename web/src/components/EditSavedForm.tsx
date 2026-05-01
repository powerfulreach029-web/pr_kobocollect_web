import React, { useState } from 'react';

interface EditSavedFormProps {
  onBack: () => void;
  onEdit: (instance: any) => void;
}

export const EditSavedForm: React.FC<EditSavedFormProps> = ({ onBack, onEdit }) => {
  const [instances] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('kobo_instances') || '[]').filter((ins: any) => ins.status === 'draft');
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full animate-fade-in">
      <header className="bg-primary text-white p-4 shadow-md flex items-center gap-4 sticky top-0 z-50">
        <i className="fas fa-arrow-left cursor-pointer" onClick={onBack}></i>
        <h1 className="text-xl font-bold">Éditer formulaire enregistré</h1>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
             <i className="fas fa-edit text-5xl mb-4 opacity-20"></i>
             <p className="font-medium">Aucune ébauche disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
             <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   {instances.length} ÉBAUCHE(S)
                </span>
             </div>

             {instances.map(ins => (
                <div 
                  key={ins.id}
                  onClick={() => onEdit(ins)}
                  className="bg-white p-5 rounded-2xl border border-gray-50 hover:border-primary/20 hover:shadow-lg transition-all flex items-center gap-4 cursor-pointer active:scale-95"
                >
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <i className="fas fa-file-signature text-lg"></i>
                   </div>
                   <div className="flex-1">
                      <h3 className="font-bold text-gray-900 leading-tight">{ins.formName}</h3>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Enregistré le: {new Date(ins.timestamp || Date.now()).toLocaleString()}</p>
                   </div>
                   <div className="text-primary p-2 rounded-lg">
                      <i className="fas fa-edit"></i>
                   </div>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};
