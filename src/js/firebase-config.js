/* ==============================================================
   JWAY - LIGAÇÃO À BASE DE DADOS
   As "chaves de casa". Este ficheiro liga o site ao Firebase.
   ============================================================== */

/**
 * ⚠️ AVISO DE SEGURANÇA CRÍTICA - CHAVES FIREBASE EXPOSTAS
 * 
 * RISCO: Firebase API Key e Project ID visíveis no código-fonte do cliente
 * PROBLEMA: Um atacante pode:
 *   1. Usar a chave para fazer chamadas diretas às APIs Firebase
 *   2. Enumerar dados da Realtime Database (agora protegida com rules, mas antes era aberta)
 *   3. Enviar mensagens push maliciosas
 * 
 * MITIGAÇÃO ATUAL: Database rules restringem .read a "auth != null"
 * 
 * RECOMENDAÇÃO: Para maior segurança:
 * 1. Usar Firebase App Check (token de integridade do device)
 * 2. Implementar backend proxy para todas as operações Firebase
 * 3. Armazenar chaves em variáveis de ambiente (build-time injection)
 * 4. Fazer audit regular de projetos Firebase não utilizados
 * 
 * REFERÊNCIA: https://firebase.google.com/docs/projects/api/client-api-key
 */

const firebaseConfig = {
    apiKey: "AIzaSyCX5ZJaWPYX6YqZ-WdcqDSvU6ajjx3HeOA",
    authDomain: "painel-jway.firebaseapp.com",
    databaseURL: "https://painel-jway-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "painel-jway",
    storageBucket: "painel-jway.firebasestorage.app",
    messagingSenderId: "289243511135",
    appId: "1:289243511135:web:c86ef83160a33abda2deea"
};

// 1. Inicia o motor do Firebase (garantindo que n?o liga duas vezes)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Cria "atalhos" globais para usarmos nos restantes ficheiros sem termos de escrever muito
const jwayAuth = firebase.auth();
const jwayDB = firebase.database();

// Se o browser suportar notificações Push, preparamos o motor
let jwayMessaging = null;
if (firebase.messaging && typeof firebase.messaging.isSupported === 'function') {
    firebase.messaging.isSupported().then(supported => {
        if (supported) jwayMessaging = firebase.messaging();
    });
}

console.log("🔥 Ligação ao Firebase estabelecida com sucesso!");


