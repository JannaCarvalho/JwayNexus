// 1. Importar os scripts do Firebase compatíveis com Service Workers
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

// 2. Inicializar o Firebase (com os dados do teu projeto JWAY)
firebase.initializeApp({
    apiKey: "AIzaSyCX5ZJaWPYX6YqZ-WdcqDSvU6ajjx3HeOA",
    authDomain: "painel-jway.firebaseapp.com",
    databaseURL: "https://painel-jway-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "painel-jway",
    storageBucket: "painel-jway.firebasestorage.app",
    messagingSenderId: "289243511135",
    appId: "1:289243511135:web:c86ef83160a33abda2deea"
});

// 3. Iniciar o serviço de mensagens
const messaging = firebase.messaging();

// 4. Lógica para quando a notificação chega em Background (Página fechada/minimizada)
messaging.onBackgroundMessage((payload) => {
    console.log('Recebido em background: ', payload);
    
    const notificationTitle = payload.notification.title;
    
    // --- OPÇÕES DE PERSONALIZAÇÃO DA NOTIFICAÇÃO ---
    const notificationOptions = {
        body: payload.notification.body,
        
        // Ícone principal e Badge (Ajustado para a pasta imagens)
        icon: '/imagens/jway48x48.ico', 
        badge: '/imagens/jway48x48.ico',
        
        // Cor de Fundo do ícone (Azul JWAY)
        color: '#00a8ff', 
        
        // Forçar o telemóvel a vibrar
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        
        // Evitar que as mensagens fechem sozinhas
        requireInteraction: true,

        // O que acontece quando se clica na notificação
        data: {
            url: 'https://painel-jway.web.app/admin-panel.html' // Redireciona direto para o painel admin
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- LÓGICA PARA ABRIR O SITE AO CLICAR NA NOTIFICAÇÃO ---
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Vai abrir o link que definimos em data.url
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});