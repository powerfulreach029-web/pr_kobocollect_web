import React, { useState } from 'react';
import type { ProjectConfig } from '../types';

interface ManualConfigProps {
  onSave: (config: ProjectConfig) => void;
  onCancel: () => void;
  initialConfig?: ProjectConfig | null;
}

export const ManualConfig: React.FC<ManualConfigProps> = ({ onSave, onCancel, initialConfig }) => {
  const [url, setUrl] = useState(initialConfig?.serverUrl || 'https://kc.kobotoolbox.org');
  const [username, setUsername] = useState(initialConfig?.username || '');
  const [password, setPassword] = useState(initialConfig?.password || '');
  const [name, setName] = useState(initialConfig?.name || 'Nouveau Projet');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (initialConfig) {
      setUrl(initialConfig.serverUrl || 'https://kc.kobotoolbox.org');
      setUsername(initialConfig.username || '');
      setPassword(initialConfig.password || '');
      setName(initialConfig.name || 'Nouveau Projet');
    }
  }, [initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialConfig?.id || Math.random().toString(36).substr(2, 9),
      name,
      serverUrl: url,
      username,
      password,
      color: initialConfig?.color || '#3e9fcc'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-primary p-6 text-white text-center">
          <h2 className="text-xl font-bold">Paramètres du serveur</h2>
          <p className="text-xs opacity-80 mt-1">Saisissez les détails de votre serveur KoBo/ODK</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nom du projet</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-primary/50 focus:bg-white transition-all outline-none text-gray-900"
              placeholder="Ex: Mission Santé"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">URL du serveur</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-primary/50 focus:bg-white transition-all outline-none text-gray-900"
              placeholder="https://kc.kobotoolbox.org"
              required
            />
            <p className="text-[9px] text-gray-400 font-medium px-1">Conseil: Utilisez kc.kobotoolbox.org pour KoboToolbox.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Utilisateur</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-primary/50 focus:bg-white transition-all outline-none text-sm text-gray-900"
                placeholder="Optionnel"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-primary/50 focus:bg-white transition-all outline-none text-sm text-gray-900 pr-10"
                  placeholder="Optionnel"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
             <button 
              type="submit"
              className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
