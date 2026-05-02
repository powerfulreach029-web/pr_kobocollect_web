export interface ProjectConfig {
  id: string;
  name: string;
  serverUrl: string;
  username?: string;
  password?: string;
  color?: string;
  icon?: string;
  theme?: 'light' | 'dark';
}

export interface BlankForm {
  formId: string;
  name: string;
  downloadUrl: string;
  version?: string;
  hash?: string;
  xml?: string;
}

export interface FormInstance {
  instanceId: string;
  formId: string;
  formName: string;
  data: any;
  status: 'draft' | 'finalized' | 'submitted';
  lastUpdated: string;
  xml?: string;
}

export type View = 'home' | 'settings' | 'get_blank_form' | 'select_form' | 'filling' | 'send_form' | 'history' | 'manage_forms' | 'edit_saved_form' | 'setup_choice' | 'qr_scan';

