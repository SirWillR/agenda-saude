/**
 * Cole aqui o firebaseConfig do app web (Console do Firebase → Configurações do projeto → Seus apps).
 * Esses valores são públicos por natureza; quem protege os dados é o firestore.rules.
 * Enquanto apiKey estiver vazio, o app roda em modo local e guarda tudo só neste navegador.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBlBTN-CYN2La01peCdBpn9OGDj_6qDdmg',
  authDomain: 'agenda-saude-a19eb.firebaseapp.com',
  projectId: 'agenda-saude-a19eb',
  storageBucket: 'agenda-saude-a19eb.firebasestorage.app',
  messagingSenderId: '538748847445',
  appId: '1:538748847445:web:b007f1352b83dae65f5bdc',
};

export const firebaseConfigured = firebaseConfig.apiKey !== '';
