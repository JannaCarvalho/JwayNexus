/* ==============================================================
   🔥 JWAY - LIGAÇÃO À BASE DE DADOS
   As "chaves de casa". Este ficheiro liga o site ao Firebase.
   ============================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyCX5ZJaWPYX6YqZ-WdcqDSvU6ajjx3HeOA",
    authDomain: "painel-jway.firebaseapp.com",
    databaseURL: "https://painel-jway-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "painel-jway",
    storageBucket: "painel-jway.firebasestorage.app",
    messagingSenderId: "289243511135",
    appId: "1:289243511135:web:c86ef83160a33abda2deea"
};

// 1. Inicia o motor do Firebase (garantindo que não liga duas vezes)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Cria "atalhos" globais para usarmos nos restantes ficheiros sem termos de escrever muito
const jwayAuth = firebase.auth();
const jwayDB = firebase.database();

// Se o browser suportar notificações Push, preparamos o motor
let jwayMessaging = null;
if (firebase.messaging && firebase.messaging.isSupported) {
    jwayMessaging = firebase.messaging();
}

console.log("✅ Ligação ao Firebase estabelecida com sucesso!");