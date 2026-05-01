import type { ProjectConfig } from '../types';

export interface ODKForm {
  formId: string;
  name: string;
  downloadUrl: string;
  version?: string;
  hash?: string;
}

export const fetchFormList = async (config: ProjectConfig): Promise<ODKForm[]> => {
  let url = `${config.serverUrl}/formList`;
  
  // Contournement CORS pour le serveur Kobo officiel en mode développement
  if (url.includes('kc.kobotoolbox.org')) {
    url = url.replace('https://kc.kobotoolbox.org', '/kobo-proxy');
  } else if (url.includes('kf.kobotoolbox.org')) {
    url = url.replace('https://kf.kobotoolbox.org', '/kf-proxy');
  }
  
  const headers: HeadersInit = {
    'X-OpenRosa-Version': '1.0',
  };

  if (config.username && config.password) {
    const auth = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Erreur serveur: ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  const forms: ODKForm[] = [];
  const formElements = xmlDoc.getElementsByTagName("xform");

  for (let i = 0; i < formElements.length; i++) {
    const form = formElements[i];
    forms.push({
      formId: form.getElementsByTagName("formID")[0]?.textContent || "",
      name: form.getElementsByTagName("name")[0]?.textContent || "",
      downloadUrl: form.getElementsByTagName("downloadUrl")[0]?.textContent || "",
      version: form.getElementsByTagName("version")[0]?.textContent || "",
      hash: form.getElementsByTagName("hash")[0]?.textContent || ""
    });
  }

  return forms;
};

export const fetchFormXml = async (config: ProjectConfig, downloadUrl: string): Promise<string> => {
  let url = downloadUrl;
  
  if (url.includes('kc.kobotoolbox.org')) {
    url = url.replace('https://kc.kobotoolbox.org', '/kobo-proxy');
  } else if (url.includes('kf.kobotoolbox.org')) {
    url = url.replace('https://kf.kobotoolbox.org', '/kf-proxy');
  }

  const headers: HeadersInit = {
    'X-OpenRosa-Version': '1.0',
  };

  if (config.username && config.password) {
    const auth = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Erreur téléchargement: ${response.status}`);
  }

  return await response.text();
};

export const submitInstance = async (config: ProjectConfig, formId: string, formXml: string, instanceId: string, data: any): Promise<void> => {
  let url = `${config.serverUrl}/submission`;
  
  if (url.includes('kc.kobotoolbox.org')) {
    url = url.replace('https://kc.kobotoolbox.org', '/kobo-proxy');
  } else if (url.includes('kf.kobotoolbox.org')) {
    url = url.replace('https://kf.kobotoolbox.org', '/kf-proxy');
  }

  // Generate XML properly using the original form template
  const parser = new DOMParser();
  const doc = parser.parseFromString(formXml, "text/xml");
  
  const instanceEl = doc.getElementsByTagNameNS("*", "instance")[0];
  let rootNode: Element | null = null;
  if (instanceEl) {
    for (let i = 0; i < instanceEl.childNodes.length; i++) {
      if (instanceEl.childNodes[i].nodeType === 1) { 
        rootNode = instanceEl.childNodes[i] as Element;
        break;
      }
    }
  }
  
  if (!rootNode) throw new Error("No root node found in form instance");
  const submissionNode = rootNode.cloneNode(true) as Element;

  // Ensure version is present (Kobo _version_)
  if (!submissionNode.getAttribute('version')) {
    const version = doc.querySelector('model')?.getAttribute('version') || 
                   doc.documentElement.getAttribute('version');
    if (version) {
      submissionNode.setAttribute('version', version);
    }
  }

  for (const [path, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    
    const cleanPath = path.split('[')[0]; 
    const parts = cleanPath.split('/').filter(p => p);
    
    let current = submissionNode;
    if (parts.length > 0 && parts[0] === submissionNode.tagName) {
       parts.shift();
    }
    
    for (const part of parts) {
       let child = Array.from(current.children).find(c => c.tagName === part);
       if (!child) {
          child = doc.createElement(part);
          current.appendChild(child);
       }
       current = child;
    }
    current.textContent = String(value);
  }
  
  let metaNode = Array.from(submissionNode.children).find(c => c.tagName === 'meta');
  if (!metaNode) {
    metaNode = doc.createElement('meta');
    submissionNode.appendChild(metaNode);
  }
  
  let instanceIdNode = Array.from(metaNode.children).find(c => c.tagName === 'instanceID');
  if (!instanceIdNode) {
    instanceIdNode = doc.createElement('instanceID');
    metaNode.appendChild(instanceIdNode);
  }
  
  instanceIdNode.textContent = instanceId.startsWith('uuid:') ? instanceId : `uuid:${instanceId}`;

  const serializer = new XMLSerializer();
  const xmlData = serializer.serializeToString(submissionNode);
  
  console.log("DEBUG: Generated Submission XML", xmlData);

  const formData = new FormData();
  const blob = new Blob([xmlData], { type: 'text/xml' });
  formData.append('xml_submission_file', blob, 'submission.xml');

  const headers: HeadersInit = {
    'X-OpenRosa-Version': '1.0',
  };

  if (config.username && config.password) {
    const auth = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur soumission (${response.status}): ${errText}`);
  }
};
