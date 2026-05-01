import React, { useState, useEffect, useRef } from 'react';
import type { ProjectConfig } from '../types';

// Declaration for Leaflet global
declare const L: any;

interface Question {
  id: string;
  type: 'text' | 'integer' | 'decimal' | 'select1' | 'select' | 'date' | 'geopoint' | 'note';
  label: string;
  hint?: string;
  options?: { label: string; value: string }[];
  ref: string;
  required: boolean;
}

interface FormFillingProps {
  form: any;
  config: ProjectConfig;
  initialAnswers?: Record<string, any>;
  onBack: () => void;
  onSave: (instance: any, status: 'draft' | 'finalized', labelMap: any) => void;
}

export const FormFilling: React.FC<FormFillingProps> = ({ form, config, initialAnswers, onBack, onSave }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(form.xml, "text/xml");
    const extracted: Question[] = [];

    const getCleanTagName = (el: Element) => el.tagName.toLowerCase().split(':').pop();

    // 1. Parse Binds for types and constraints
    const binds: Record<string, { type: string, required: boolean }> = {};
    const metadataPaths: Record<string, string> = {};
    const bindEls = doc.getElementsByTagNameNS("*", "bind");
    for (let i = 0; i < bindEls.length; i++) {
      const nodeset = bindEls[i].getAttribute('nodeset');
      const type = bindEls[i].getAttribute('type');
      const preload = bindEls[i].getAttributeNS("http://openrosa.org/javarosa", "preload") || bindEls[i].getAttribute('jr:preload');
      const preloadParams = bindEls[i].getAttributeNS("http://openrosa.org/javarosa", "preloadParams") || bindEls[i].getAttribute('jr:preloadParams');
      const required = bindEls[i].getAttribute('required') === 'true()' || bindEls[i].getAttribute('required') === 'true';
      const relevant = bindEls[i].getAttribute('relevant');

      if (nodeset && preload) {
        metadataPaths[preloadParams || preload] = nodeset;
      }

      if (nodeset) binds[nodeset] = { type: type || '', required, relevant: relevant || undefined };
    }

    // Initialize metadata if this is a new form
    if (!initialAnswers) {
      const now = new Date();
      const meta: Record<string, string> = {};

      // Device ID persistent
      let deviceId = localStorage.getItem('kobo_device_id');
      if (!deviceId) {
        deviceId = 'web:' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('kobo_device_id', deviceId);
      }

      const instanceRoot = doc.querySelector('instance > *');
      const rootName = instanceRoot?.tagName || 'data';

      if (metadataPaths['start']) meta[metadataPaths['start']] = now.toISOString();
      else if (instanceRoot?.querySelector('start')) meta[`/${rootName}/start`] = now.toISOString();

      if (metadataPaths['today']) meta[metadataPaths['today']] = now.toISOString().split('T')[0];
      else if (instanceRoot?.querySelector('today')) meta[`/${rootName}/today`] = now.toISOString().split('T')[0];

      if (metadataPaths['deviceid']) meta[metadataPaths['deviceid']] = deviceId;
      else if (instanceRoot?.querySelector('deviceid')) meta[`/${rootName}/deviceid`] = deviceId;

      if (metadataPaths['username']) meta[metadataPaths['username']] = config.username || '';
      else if (instanceRoot?.querySelector('username')) meta[`/${rootName}/username`] = config.username || '';
      
      setAnswers(prev => ({ ...prev, ...meta }));
    }

    // 2. Parse itext for translations
    const itextMap: Record<string, string> = {};
    const translationEls = doc.getElementsByTagNameNS("*", "translation");
    // Use the first translation as default (usually French or English in these contexts)
    const activeTranslation = translationEls[0]; 
    if (activeTranslation) {
      const textEls = activeTranslation.getElementsByTagNameNS("*", "text");
      for (let i = 0; i < textEls.length; i++) {
        const id = textEls[i].getAttribute('id');
        const valueEl = textEls[i].getElementsByTagNameNS("*", "value")[0];
        if (id && valueEl) {
          itextMap[id] = valueEl.textContent || "";
        }
      }
    }

    const resolveLabel = (el: Element) => {
      const labels = el.getElementsByTagNameNS("*", "label");
      if (labels.length === 0) return "";
      const labelEl = labels[0];
      const ref = labelEl.getAttribute('ref');
      if (ref) {
        const itextMatch = ref.match(/jr:itext\(['"]?([^'"]+)['"]?\)/);
        if (itextMatch && itextMap[itextMatch[1]]) {
          return itextMap[itextMatch[1]];
        }
      }
      return labelEl.textContent || "";
    };

    const resolveHint = (el: Element) => {
      const hints = el.getElementsByTagNameNS("*", "hint");
      if (hints.length === 0) return "";
      const hintEl = hints[0];
      const ref = hintEl.getAttribute('ref');
      if (ref) {
        const itextMatch = ref.match(/jr:itext\(['"]?([^'"]+)['"]?\)/);
        if (itextMatch && itextMap[itextMatch[1]]) {
          return itextMap[itextMatch[1]];
        }
      }
      return hintEl.textContent || "";
    };

    const parseNode = (node: Element, parentRelevant?: string) => {
      const children = node.children;
      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        const tagName = getCleanTagName(el);
        const ref = el.getAttribute('ref') || "";
        const bindData = binds[ref] || {};
        
        // Combine current relevance with parent relevance
        const currentRelevant = bindData.relevant;
        const combinedRelevant = (parentRelevant && currentRelevant) 
          ? `(${parentRelevant}) and (${currentRelevant})` 
          : (currentRelevant || parentRelevant);

        if (tagName === 'group') {
          parseNode(el, combinedRelevant);
          continue;
        }

        if (tagName === 'input' || tagName === 'select1' || tagName === 'select' || tagName === 'range' || tagName === 'note' || tagName === 'upload') {
          const label = resolveLabel(el);
          const hint = resolveHint(el);

          const typeAttr = el.getAttribute('type');
          let type: Question['type'] = 'text';
          
          const labelLower = label.toLowerCase();
          const isGpsKeyword = labelLower.includes('coordonn') || labelLower.includes('gps') || labelLower.includes('localisation') || labelLower.includes('position');

          if (tagName === 'select1') type = 'select1';
          else if (tagName === 'select') type = 'select';
          else if (tagName === 'note') type = 'note';
          else if (bindData.type === 'geopoint' || typeAttr === 'geopoint' || isGpsKeyword) type = 'geopoint';
          else if (bindData.type === 'date' || typeAttr === 'date') type = 'date';
          else if (bindData.type === 'int' || bindData.type === 'integer' || typeAttr === 'int' || typeAttr === 'integer') type = 'integer';
          else if (bindData.type === 'decimal' || typeAttr === 'decimal') type = 'decimal';

          const relevant = combinedRelevant;
          const required = bindData.required || el.getAttribute('required') === 'true()' || el.getAttribute('required') === 'true';

          const options: { label: string; value: string }[] = [];
          let itemset = undefined;

          if (type === 'select1' || type === 'select') {
             // 1. Static items
             const itemEls = el.getElementsByTagNameNS("*", "item");
             for (let j = 0; j < itemEls.length; j++) {
                const item = itemEls[j];
                const itemLabel = resolveLabel(item);
                const valueEl = item.getElementsByTagNameNS("*", "value")[0];
                const itemValue = valueEl?.textContent || "";
                options.push({ label: itemLabel, value: itemValue });
             }

             // 2. Dynamic items (itemset)
             const itemsetEls = el.getElementsByTagNameNS("*", "itemset");
             if (itemsetEls.length > 0) {
                const nodeset = itemsetEls[0].getAttribute('nodeset');
                const labelNode = itemsetEls[0].getElementsByTagNameNS("*", "label")[0];
                const valueNode = itemsetEls[0].getElementsByTagNameNS("*", "value")[0];
                if (nodeset && labelNode && valueNode) {
                   itemset = {
                      nodeset,
                      labelRef: labelNode.getAttribute('ref') || "label",
                      valueRef: valueNode.getAttribute('ref') || "value"
                   };
                }
             }
          }

          extracted.push({ id: ref, type, label, hint, ref, options, required, relevant, itemset });
        }
      }
    };

    const body = doc.getElementsByTagNameNS("*", "body")[0] || doc.getElementsByTagName("body")[0] || doc.documentElement;
    parseNode(body);
    
    console.log("DEBUG: XML RAW", form.xml);
    console.log("DEBUG: BINDS", binds);
    console.log("DEBUG: QUESTIONS", extracted);

    setQuestions(extracted);
    setLoading(false);
  }, [form]);

  // GPS Map Logic
  useEffect(() => {
    let timeout: any;
    if (currentIndex >= 0 && questions[currentIndex]?.type === 'geopoint' && mapContainerRef.current) {
      timeout = setTimeout(() => {
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([0, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const latlng = [latitude, longitude];
            if (mapRef.current) {
              mapRef.current.setView(latlng, 16);
              if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
              markerRef.current = L.marker(latlng, {
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  html: "<div style='background-color:#3e9fcc; width:24px; height:24px; border-radius:50%; border:4px solid white; box-shadow:0 0 20px rgba(62,159,204,0.6); position:relative;'><div style='position:absolute; inset:-4px; border-radius:50%; border:2px solid #3e9fcc; animation: pulse 2s infinite;'></div></div>",
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })
              }).addTo(mapRef.current);

              const loc = `${latitude} ${longitude} ${pos.coords.altitude || 0} ${pos.coords.accuracy}`;
              setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: loc }));
            }
          },
          (err) => console.error("GPS Error", err),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }, 300);
    }
  }, [currentIndex, questions]);

  const evaluateXPath = (expr: string, context: Record<string, any>) => {
    if (!expr || expr === 'true()' || expr === 'true') return true;
    if (expr === 'false()' || expr === 'false') return false;
    
    let processed = expr;
    
    // 1. Replace ${var} references
    const varRefs = expr.match(/\${([^}]+)}/g) || [];
    for (const ref of varRefs) {
      const varName = ref.substring(2, ref.length - 1);
      const val = context[varName] || context[`/data/${varName}`] || "";
      processed = processed.replace(ref, `'${val}'`);
    }

    // 2. Replace absolute paths like /data/path or /root/path
    // We look for patterns that look like ODK paths but aren't inside quotes
    const pathRefs = processed.match(/(?<!['"])\/[a-zA-Z0-9_][a-zA-Z0-9_/]*/g) || [];
    for (const path of pathRefs) {
       const val = context[path] || "";
       processed = processed.replace(path, `'${val}'`);
    }

    // 3. Handle functions like selected(field, 'value')
    processed = processed.replace(/selected\(([^,]+),\s*['"]?([^'"]+)['"]?\)/g, (m, field, val) => {
      let fVal = field.trim();
      if (fVal.startsWith("'") && fVal.endsWith("'")) fVal = fVal.slice(1, -1);
      return fVal.split(/\s+/).includes(val) ? "true" : "false";
    });

    // 4. Basic operators and keywords
    processed = processed.replace(/(?<![!=])=(?![=])/g, "==") // replace = with == but not != or ==
                         .replace(/ or /g, " || ")
                         .replace(/ and /g, " && ")
                         .replace(/true\(\)/g, "true")
                         .replace(/false\(\)/g, "false")
                         .replace(/mod/g, "%")
                         .replace(/not\(([^)]+)\)/g, "!($1)");

    try {
      // Use a cleaner evaluation context
      const result = eval(processed);
      return !!result;
    } catch (e) {
      console.warn("XPath Eval Error:", expr, "->", processed, e);
      return true; // Default to visible on error to avoid blocking the form
    }
  };

  const getVisibleQuestions = () => questions.filter(q => evaluateXPath(q.relevant || "", answers));
  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = questions[currentIndex];
  const isCurrentVisible = evaluateXPath(currentQuestion?.relevant || "", answers);

  useEffect(() => {
    if (currentIndex < questions.length && !isCurrentVisible) {
       // Skip non-relevant
       setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, isCurrentVisible, questions.length]);

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const getOptions = (q: Question) => {
    if (q.options && q.options.length > 0) return q.options;
    if (q.itemset) {
       // Evaluate itemset nodeset for filtering
       const nodeset = q.itemset.nodeset;
       const instanceMatch = nodeset.match(/instance\(['"]?([^'"]+)['"]?\)/);
       if (!instanceMatch) return [];
       
       const instanceId = instanceMatch[1];
       const parser = new DOMParser();
       const doc = parser.parseFromString(form.xml, "text/xml");
       const instanceEl = doc.getElementById(instanceId) || doc.querySelector(`instance[id="${instanceId}"]`);
       if (!instanceEl) return [];

       const items = instanceEl.getElementsByTagNameNS("*", "item");
       const filtered: { label: string; value: string }[] = [];
       
       // Detect basic filters like [dept = ${dept}]
       const filterMatch = nodeset.match(/\[([^=]+)=\s*([^\]]+)\]/);
       
       for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (filterMatch) {
             const fieldName = filterMatch[1].trim();
             const filterValExpr = filterMatch[2].trim();
             const expectedVal = evaluateXPath(filterValExpr, answers);
             const actualVal = item.getElementsByTagNameNS("*", fieldName)[0]?.textContent || item.querySelector(fieldName)?.textContent || "";
             if (actualVal !== expectedVal) continue;
          }
          
          const lNode = item.getElementsByTagNameNS("*", q.itemset.labelRef)[0] || item.querySelector(q.itemset.labelRef);
          const vNode = item.getElementsByTagNameNS("*", q.itemset.valueRef)[0] || item.querySelector(q.itemset.valueRef);
          filtered.push({ label: lNode?.textContent || "", value: vNode?.textContent || "" });
       }
       return filtered;
    }
    return [];
  };

  const handleNext = () => {
    setError(null);
    if (currentQuestion && currentQuestion.required && currentQuestion.type !== 'note') {
      const answer = answers[currentQuestion.id];
      if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        setError("Réponse obligatoire pour continuer");
        return;
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentIndex > 0) {
       let prev = currentIndex - 1;
       while (prev >= 0 && !evaluateXPath(questions[prev].relevant || "", answers)) {
          prev--;
       }
       if (prev >= 0) setCurrentIndex(prev);
       else setCurrentIndex(0);
    }
  };

  const updateAnswer = (val: any) => {
    setError(null);
    setAnswers({ ...answers, [currentQuestion.id]: val });
  };

  const toggleSelectMultiple = (val: string) => {
    const current = answers[currentQuestion.id] || "";
    const selected = current ? current.split(' ') : [];
    const idx = selected.indexOf(val);
    if (idx > -1) selected.splice(idx, 1);
    else selected.push(val);
    updateAnswer(selected.join(' '));
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
       <p className="font-black text-xs text-gray-400 uppercase tracking-widest">Préparation du questionnaire...</p>
    </div>
  );

  const handleFinalize = (status: 'draft' | 'finalized') => {
    const finalAnswers = { ...answers };
    
    // Capture end time
    const parser = new DOMParser();
    const doc = parser.parseFromString(form.xml, "text/xml");
    const bindEls = doc.getElementsByTagNameNS("*", "bind");
    let endPath = "";
    for (let i = 0; i < bindEls.length; i++) {
       const preload = bindEls[i].getAttributeNS("http://openrosa.org/javarosa", "preload") || bindEls[i].getAttribute('jr:preload');
       const params = bindEls[i].getAttributeNS("http://openrosa.org/javarosa", "preloadParams") || bindEls[i].getAttribute('jr:preloadParams');
       if (preload === 'timestamp' && params === 'end') {
          endPath = bindEls[i].getAttribute('nodeset') || "";
          break;
       }
    }
    
    if (endPath) {
       finalAnswers[endPath] = new Date().toISOString();
    } else {
       // Fallback
       const instanceRoot = doc.querySelector('instance > *');
       const rootName = instanceRoot?.tagName || 'data';
       if (instanceRoot?.querySelector('end')) {
          finalAnswers[`/${rootName}/end`] = new Date().toISOString();
       }
    }

    const labelMap: Record<string, any> = {};
    questions.forEach(q => {
      const val = finalAnswers[q.id];
      let displayVal = val;
      if ((q.type === 'select1' || q.type === 'select') && val) {
         const opts = getOptions(q);
         if (q.type === 'select1') {
            displayVal = opts.find(o => o.value === val)?.label || val;
         } else {
            displayVal = val.split(' ').map((v: string) => opts.find(o => o.value === v)?.label || v).join(', ');
         }
      }
      labelMap[q.id] = { label: q.label, value: displayVal };
    });
    
    onSave(finalAnswers, status, labelMap);
  };

   if (isFinished) {
      return (
         <div className="h-screen bg-slate-50 flex flex-col w-full animate-fade-in overflow-hidden">
            <header className="bg-white/90 backdrop-blur-xl border-b p-4 flex items-center gap-3 sticky top-0 z-[1001] safe-area-top">
               <button onClick={() => setIsFinished(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  <i className="fas fa-arrow-left text-sm"></i>
               </button>
               <h1 className="font-black text-gray-900 uppercase tracking-tight text-sm">{form.name}</h1>
            </header>

            <main className="flex-1 px-6 py-12 flex flex-col max-w-2xl mx-auto w-full overflow-y-auto space-y-10">
               <div className="space-y-4">
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">
                     Vous êtes à la fin de "{form.name}".
                  </h2>
               </div>

               <div className="bg-blue-50 p-8 rounded-[2.5rem] border-4 border-white shadow-xl flex gap-6 items-start">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                     <i className="fas fa-pen-slash text-xl"></i>
                  </div>
                  <div className="space-y-2">
                     <p className="font-black text-blue-900 text-sm uppercase tracking-tight">Information importante</p>
                     <p className="text-blue-700/80 text-sm leading-relaxed font-medium">
                        Vous ne pourrez pas éditer ce formulaire après sa finalisation.
                        Si vous devez le modifier prochainement, choisissez "Enregistrer comme ébauche".
                     </p>
                   </div>
                </div>

               <div className="grid grid-cols-1 gap-4 pt-4">
                  <button 
                    onClick={() => handleFinalize('draft')}
                    className="w-full bg-white p-8 rounded-[2.5rem] border-4 border-gray-100 hover:border-primary/20 transition-all flex items-center gap-6 group active:scale-95 shadow-sm"
                  >
                     <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <i className="fas fa-save text-2xl"></i>
                     </div>
                     <div className="text-left">
                        <p className="font-black text-gray-900 text-lg leading-tight">Enregistrer comme ébauche</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sera modifiable plus tard</p>
                     </div>
                  </button>

                  <button 
                    onClick={() => handleFinalize('finalized')}
                    className="w-full bg-primary p-8 rounded-[2.5rem] border-4 border-primary shadow-2xl shadow-primary/30 flex items-center gap-6 group active:scale-95 text-white"
                  >
                     <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                        <i className="fas fa-paper-plane text-2xl"></i>
                     </div>
                     <div className="text-left">
                        <p className="font-black text-lg leading-tight">Finaliser le formulaire</p>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Prêt à être envoyé</p>
                     </div>
                  </button>
               </div>
            </main>

            <footer className="p-6 bg-white/80 backdrop-blur-xl border-t flex justify-center sticky bottom-0 z-[1001] safe-area-bottom">
               <button onClick={() => setIsFinished(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest px-8 py-4">
                  Retour au questionnaire
               </button>
            </footer>
         </div>
      );
   }

   return (
    <div className="h-screen bg-white flex flex-col w-full animate-fade-in overflow-hidden">
      <header className="bg-white/90 backdrop-blur-xl border-b p-4 flex items-center justify-between sticky top-0 z-[1001] safe-area-top">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
               <i className="fas fa-times text-sm"></i>
            </button>
            <div className="leading-tight">
               <p className="font-black text-gray-900 truncate max-w-[120px] text-sm uppercase tracking-tight">{form.name}</p>
               <span className="text-[9px] font-black text-primary uppercase tracking-widest">Moteur v2.5 Premium</span>
            </div>
         </div>
         <div className="flex-1 max-w-[100px] mx-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
         </div>
         <span className="text-[10px] font-black text-gray-400 tabular-nums">{currentIndex + 1}/{questions.length}</span>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col max-w-2xl mx-auto w-full overflow-y-auto overflow-x-hidden">
         {currentQuestion ? (
            <div className="space-y-8 animate-slide-up pb-24">
               <div className="space-y-3">
                  <div className="flex items-start gap-2">
                     <h2 
                        className="text-3xl md:text-4xl font-black text-gray-900 leading-[1.1] uppercase tracking-tighter"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.label }}
                     />
                     {currentQuestion.required && currentQuestion.type !== 'note' && <span className="text-red-500 font-black text-3xl animate-pulse">*</span>}
                  </div>
                  {currentQuestion.hint && <p className="text-sm text-gray-400 font-medium bg-gray-50 p-3 rounded-xl border-l-4 border-gray-200" dangerouslySetInnerHTML={{ __html: currentQuestion.hint }} /> }
               </div>

               {error && (
                  <div className="bg-red-500 text-white p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-shake shadow-lg shadow-red-200">
                     <i className="fas fa-triangle-exclamation text-lg"></i>
                     {error}
                  </div>
               )}

               <div className="flex-1">
                  {currentQuestion.type === 'note' ? (
                     <div className="bg-slate-50 p-10 rounded-[3rem] border-4 border-white shadow-xl text-center space-y-6">
                        <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-primary/20 rotate-3">
                           <i className="fas fa-info text-3xl"></i>
                        </div>
                        <p className="text-xl font-black text-gray-800 leading-tight" dangerouslySetInnerHTML={{ __html: currentQuestion.label }} />
                        <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full"></div>
                     </div>
                  ) : currentQuestion.type === 'geopoint' ? (
                     <div className="space-y-6">
                        <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl z-0 bg-gray-100">
                           <div ref={mapContainerRef} className="w-full h-full"></div>
                           <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              {!answers[currentQuestion.id] && <i className="fas fa-location-dot text-primary/20 text-6xl animate-pulse"></i>}
                           </div>
                           <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-white">
                              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                 <i className="fas fa-satellite animate-pulse"></i> GPS CONNECTÉ
                              </span>
                           </div>
                        </div>
                        <button 
                          onClick={handleNext}
                          className="w-full bg-primary text-white font-black py-7 rounded-[2.5rem] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                        >
                           <div className="flex items-center gap-3">
                              <i className="fas fa-map-location-dot text-2xl"></i>
                              <span className="text-xl tracking-tighter">ENREGISTRER MA POSITION</span>
                           </div>
                        </button>
                     </div>
                  ) : (currentQuestion.type === 'select1' || currentQuestion.type === 'select') ? (
                     <div className="space-y-3">
                        {getOptions(currentQuestion).map(opt => {
                           const isSelected = currentQuestion.type === 'select1' 
                             ? answers[currentQuestion.id] === opt.value 
                             : (answers[currentQuestion.id] || "").split(' ').includes(opt.value);
                           
                           return (
                             <button 
                                key={opt.value}
                                onClick={() => currentQuestion.type === 'select1' ? updateAnswer(opt.value) : toggleSelectMultiple(opt.value)}
                                className={`w-full p-6 rounded-[2rem] border-4 text-left transition-all flex items-center justify-between group active:scale-[0.97] ${isSelected ? 'bg-primary border-primary shadow-xl shadow-primary/20 text-white' : 'bg-gray-50 border-gray-50 hover:border-primary/10'}`}
                             >
                                 <span className={`text-lg font-black tracking-tight ${isSelected ? 'text-white' : 'text-gray-700'}`} dangerouslySetInnerHTML={{ __html: opt.label }} />
                                 <div className={`w-8 h-8 rounded-${currentQuestion.type === 'select1' ? 'full' : 'xl'} border-4 flex items-center justify-center transition-all ${isSelected ? 'border-white/40 bg-white' : 'border-gray-200 bg-white'}`}>
                                    {isSelected && <i className={`fas ${currentQuestion.type === 'select1' ? 'fa-circle text-[8px] text-primary' : 'fa-check text-xs text-primary'}`}></i>}
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  ) : currentQuestion.type === 'date' ? (
                     <input 
                       type="date"
                       value={answers[currentQuestion.id] || ''}
                       onChange={(e) => updateAnswer(e.target.value)}
                       className="w-full p-8 bg-gray-50 border-4 border-gray-50 rounded-[2.5rem] text-3xl font-black outline-none focus:bg-white focus:border-primary shadow-inner text-center"
                     />
                  ) : (
                     <textarea 
                       autoFocus
                       value={answers[currentQuestion.id] || ''}
                       onChange={(e) => updateAnswer(e.target.value)}
                       className="w-full p-8 bg-gray-50 border-4 border-gray-50 rounded-[3rem] text-2xl font-bold outline-none focus:bg-white focus:border-primary transition-all min-h-[350px] text-gray-900 shadow-inner"
                       placeholder="Tapez votre réponse ici..."
                     />
                  )}
               </div>
            </div>
         ) : (
            <div className="text-center space-y-8 animate-fade-in py-20">
               <div className="w-40 h-40 bg-green-500 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-200 rotate-6">
                  <i className="fas fa-check-double text-6xl"></i>
               </div>
               <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Mission Accomplie</h2>
            </div>
         )}
      </main>

      <footer className="p-6 bg-white/80 backdrop-blur-xl border-t flex gap-4 sticky bottom-0 z-[1001] safe-area-bottom">
         <button 
           onClick={handlePrev}
           className="px-8 py-6 rounded-2xl font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
         >
            Retour
         </button>
         <button 
           onClick={handleNext}
           className="flex-1 bg-primary text-white font-black py-6 rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 text-lg uppercase tracking-tighter"
         >
            {currentIndex === questions.length - 1 ? 'Terminer' : (currentQuestion?.type === 'note' ? 'Continuer' : 'Suivant')}
         </button>
      </footer>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .safe-area-top { padding-top: max(1rem, var(--safe-area-inset-top)); }
        .safe-area-bottom { padding-bottom: max(1rem, var(--safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};
