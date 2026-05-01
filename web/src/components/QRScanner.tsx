import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (config: any) => void;
  onBack: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onBack }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        try {
          const config = JSON.parse(decodedText);
          if (config.server_url || config.serverUrl) {
             scannerRef.current?.clear();
             onScan(config);
          }
        } catch (e) {
          console.error("Invalid QR Code content", e);
        }
      },
      (errorMessage) => {
        // Just ignoring errors during scanning
      }
    );

    return () => {
      scannerRef.current?.clear().catch(e => console.error("Error clearing scanner", e));
    };
  }, [onScan]);

  return (
    <div className="min-h-screen bg-black flex flex-col w-full animate-fade-in relative">
       <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
          <button 
            onClick={onBack} 
            className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
          >
             <i className="fas fa-times text-xl"></i>
          </button>
          <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20">
             <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Scanner de QR Code</span>
          </div>
          <div className="w-12"></div>
       </header>

       <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
          <div id="qr-reader" className="w-full max-w-sm rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl"></div>
          
          <div className="text-center space-y-2 max-w-xs">
             <h2 className="text-white font-black text-xl tracking-tight">Visez le code QR</h2>
             <p className="text-white/50 text-xs font-medium leading-relaxed">
                Positionnez le code QR de configuration KoboCollect dans le cadre pour l'importer automatiquement.
             </p>
          </div>
       </div>

       <style>{`
          #qr-reader { border: none !important; }
          #qr-reader img { display: none !important; }
          #qr-reader__dashboard { background: transparent !important; color: white !important; font-family: inherit !important; }
          #qr-reader__status_span { color: white !important; font-size: 10px !important; text-transform: uppercase !important; font-weight: 900 !important; }
          #qr-reader button { 
             background: rgba(255,255,255,0.1) !important; 
             color: white !important; 
             border: 2px solid rgba(255,255,255,0.2) !important; 
             border-radius: 1rem !important;
             padding: 0.75rem 1.5rem !important;
             font-weight: 900 !important;
             text-transform: uppercase !important;
             font-size: 10px !important;
             letter-spacing: 0.1em !important;
             transition: all 0.2s !important;
          }
          #qr-reader button:hover { background: rgba(255,255,255,0.2) !important; }
       `}</style>
    </div>
  );
};
