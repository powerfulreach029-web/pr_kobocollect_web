export interface ProjectConfig {
  id: string;
  name: string;
  serverUrl: string;
  username?: string;
  password?: string;
  color?: string;
  icon?: string;
}

export type View = 'home' | 'settings' | 'get_blank_form' | 'select_form' | 'filling' | 'send_form' | 'history' | 'manage_forms' | 'edit_saved_form' | 'setup_choice' | 'qr_scan';
