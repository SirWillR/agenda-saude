/**
 * Cole aqui o firebaseConfig do app web (Console do Firebase → Configurações do projeto → Seus apps).
 * Esses valores são públicos por natureza; quem protege os dados é o firestore.rules.
 * Enquanto apiKey estiver vazio, o app roda em modo local e guarda tudo só neste navegador.
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const firebaseConfigured = firebaseConfig.apiKey !== '';
