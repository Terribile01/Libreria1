export interface ApiKeyStructure {
  name: string;
  envVar: string;
  description: string;
  purpose: string;
  isConfigured: boolean;
  source: 'environment' | 'local' | 'missing';
  maskedValue?: string;
}

const STORAGE_PREFIX = 'leggo_api_key_';

/**
 * Utility to manage and retrieve API keys, supporting environment variables and local overrides (local storage).
 */
export const ApiKeyManager = {
  /**
   * Retrieves an API key by its environment variable name.
   * Prioritizes local user overrides (if allowed/provided), then falls back to VITE_ prefixed env variables.
   */
  get: (envVar: string): string => {
    // Try to get from local user storage override first
    const localVal = localStorage.getItem(`${STORAGE_PREFIX}${envVar}`);
    if (localVal) {
      return localVal;
    }

    // Try VITE_ prefix values from environment variables
    const index = `VITE_${envVar}`;
    const envVal = (import.meta as any).env?.[index] || (import.meta as any).env?.[envVar];
    if (envVal) {
      return envVal;
    }

    return '';
  },

  /**
   * Saves a user-specific API key override locally in the browser (masked/active session).
   */
  setLocal: (envVar: string, value: string): void => {
    if (!value) {
      localStorage.removeItem(`${STORAGE_PREFIX}${envVar}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${envVar}`, value);
    }
  },

  /**
   * Checks if an API key is configured and gets its current configuration status.
   */
  getDetails: (name: string, envVar: string, purpose: string, desc: string): ApiKeyStructure => {
    const localVal = localStorage.getItem(`${STORAGE_PREFIX}${envVar}`);
    const index = `VITE_${envVar}`;
    const envVal = (import.meta as any).env?.[index] || (import.meta as any).env?.[envVar];

    let source: 'environment' | 'local' | 'missing' = 'missing';
    let isConfigured = false;
    let rawValue = '';

    if (localVal) {
      source = 'local';
      isConfigured = true;
      rawValue = localVal;
    } else if (envVal) {
      source = 'environment';
      isConfigured = true;
      rawValue = envVal;
    }

    // Prepare helper to mask key (e.g. AIzaSy...xxxx)
    let maskedValue = '';
    if (isConfigured && rawValue) {
      if (rawValue.length > 8) {
        maskedValue = `${rawValue.substring(0, 6)}...${rawValue.substring(rawValue.length - 4)}`;
      } else {
        maskedValue = '••••••••';
      }
    }

    return {
      name,
      envVar,
      description: desc,
      purpose,
      isConfigured,
      source,
      maskedValue
    };
  },

  /**
   * Lists the configured status for all application API Keys.
   */
  listKeys: (): ApiKeyStructure[] => {
    return [
      ApiKeyManager.getDetails(
        'Gemini AI Key',
        'GEMINI_API_KEY',
        'Generazione di riassunti e assistente letterario intelligente.',
        'La chiave ufficiale di Google per accedere ai modelli Gemini 2.5/1.5.'
      ),
      ApiKeyManager.getDetails(
        'ElevenLabs TTS Key',
        'ELEVENLABS_API_KEY',
        'Sintesi vocale fotorealistica per audiolibri.',
        'Necessario per convertire capitoli interi in voci umane calde e naturali.'
      ),
      ApiKeyManager.getDetails(
        'DeepL Translation Key',
        'DEEPL_API_KEY',
        'Traduzione istantanea di brani e annotazioni.',
        'Consente di tradurre qualsiasi testo o parola difficile in oltre 30 lingue.'
      )
    ];
  }
};
