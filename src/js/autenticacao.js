/* ============================================================== 
    JWAY - O PORTEIRO INTELIGENTE (autenticacao.js)
   Lógica de Login, Ligação à BD, Encriptação e Recuperação de Password.
   ============================================================== */

// --- FUNÇÃO DE ENCRIPTAÇÃO (SHA-256) ---
// ⚠️ AVISO DE SEGURANÇA: SHA-256 não é recomendado para hashing de passwords.
// TODO: Migrar para bcrypt (npm install bcrypt) ou argon2 para maior segurança.
// No futuro, implementar hashing robusto com salt incluído.
async function encriptarPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 1. CARREGAR LISTA DE UTILIZADORES NA DROPDOWN
function carregarUtilizadores() {
    const dropdown = document.getElementById('user-dropdown');
    jwayDB.ref('dados/utilizadores').once('value')
    .then((snapshot) => {
        dropdown.innerHTML = '<option value="">Selecione o seu Utilizador...</option>'; 
        const users = [];
        snapshot.forEach((filho) => {
            const user = filho.val();
            if(user && user.nome) {
                users.push({ key: filho.key, nome: user.nome });
            }
        });
        users.sort((a, b) => a.nome.toLowerCase().localeCompare(b.nome.toLowerCase()));
        users.forEach((user) => {
            dropdown.innerHTML += `<option value="${user.key}">${user.nome}</option>`;
        });
    })
    .catch((erro) => {
        console.error("Erro BD:", erro);
        dropdown.innerHTML = '<option value="">Erro de ligação à Base de Dados.</option>';
    });
}

// 2. LÓGICA DE LOGIN (A MÁGICA DA PONTE ACONTECE AQUI)
async function fazerLogin() {
    const pass = document.getElementById('password').value;
    if (!pass) {
        mostrarMensagem("Introduza a palavra-passe!", "var(--color-alerta)");
        return;
    }

    if (modoAtual === 'admin') {
        const email = document.getElementById('email').value.trim();
        if (!email) {
            mostrarMensagem("Introduza o seu email de Administrador.", "var(--color-alerta)");
            return;
        }
        
        mostrarMensagem("A verificar credenciais...", "var(--color-preparacao)");
        
        // 1º PASSO: Autenticação Segura no Firebase
        jwayAuth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            
            // 2º PASSO: Extrair o username (ex: "andreia.martins@jway.pt" -> "andreia.martins")
            const usernameExtraido = email.split('@')[0].toLowerCase();

            // 3º PASSO: Ir à Base de Dados buscar o Perfil Real
            jwayDB.ref('dados/utilizadores').once('value')
            .then((snapshot) => {
                let perfilAdmin = null;
                
                if (snapshot.exists()) {
                    const users = snapshot.val();
                    // Procura o utilizador correspondente ao username
                    Object.keys(users).forEach(key => {
                        if (users[key] && users[key].utilizador && users[key].utilizador.toLowerCase() === usernameExtraido) {
                            perfilAdmin = users[key];
                        }
                    });
                }

                if (perfilAdmin) {
                    // Encontrou a pessoa! Guarda os dados reais para o Histórico e Top Bar
                    mostrarMensagem(`Bem-vindo/a, ${perfilAdmin.nome}!`, "var(--color-producao)");
                    window.JwaySession.set({
                        ativo: perfilAdmin.utilizador,
                        nome: perfilAdmin.nome,
                        categoria: perfilAdmin.categoria,
                        isAdmin: true
                    });
                } else {
                    // Plano B (Segurança): O Auth passou, mas a pessoa não está na BD (não devia acontecer)
                    mostrarMensagem("Bem-vindo, Administrador!", "var(--color-producao)");
                    window.JwaySession.set({
                        ativo: usernameExtraido,
                        nome: 'Administrador Chefe',
                        categoria: 'Administrador',
                        isAdmin: true
                    });
                }
                
                // Entra no Painel de Administração
                setTimeout(() => { window.location.href = 'admin-panel.html'; }, 1000);
            });
        })
        .catch((erro) => { 
            console.error(erro);
            mostrarMensagem("Acesso negado. Verifique os dados.", "var(--color-alerta)"); 
        });

    } else {
        // LOGIN DOS OPERADORES/TÉCNICOS (Via Dropdown)
        const userId = document.getElementById('user-dropdown').value;
        if (!userId) {
            mostrarMensagem("Selecione o seu nome na lista.", "var(--color-alerta)");
            return;
        }
        
        mostrarMensagem("A verificar acesso...", "var(--color-preparacao)");
        
        jwayDB.ref('dados/utilizadores/' + userId).once('value')
        .then(async (snapshot) => {
            if (snapshot.exists()) {
                const dados = snapshot.val();
                const passHash = await encriptarPassword(pass);
                // ⚠️ SEGURANÇA: Apenas comparar com hash SHA-256. Nunca aceitar plaintext!
                const senhaValida = dados.password === passHash;
                
                if (senhaValida) {
                    // Verificar se é primeiro login (flag mustChangePassword na BD)
                    const mustChangePass = dados.mustChangePassword === true;

                    // Autentica anonimamente no Firebase para acesso seguro à BD
                    await firebase.auth().signInAnonymously().catch(e => console.warn("Firebase Auth anónimo:", e));

                    if (mustChangePass) {
                        // Primeiro login - redirecionar para dashboard com modal de mudança
                        window.JwaySession.setFirstLogin(true);
                        window.JwaySession.set({
                            ativo: dados.utilizador,
                            nome: dados.nome,
                            categoria: dados.categoria || 'Operador (Maquinista)',
                            isAdmin: dados.isAdmin === true
                        });
                        setTimeout(() => { window.location.href = 'dashboard-maquinas.html'; }, 1000);
                        return;
                    }

                    // Password já está em hash (migração de plaintext concluída)
                    mostrarMensagem(`Bem-vindo/a, ${dados.nome}!`, "var(--color-producao)");
                    
                    // GUARDA O PERFIL COMPLETO (Incluindo a Categoria)
                    window.JwaySession.set({
                        ativo: dados.utilizador,
                        nome: dados.nome,
                        categoria: dados.categoria || 'Operador (Maquinista)',
                        isAdmin: dados.isAdmin === true
                    });
                    
                    // Se o Operador tiver a checkbox de Admin ativa na BD, vai para o Painel, senão vai para a Fábrica
                    if(dados.isAdmin === true || String(dados.isAdmin) === "true") {
                        setTimeout(() => { window.location.href = 'admin-panel.html'; }, 1000);
                    } else {
                        setTimeout(() => { window.location.href = 'dashboard-maquinas.html'; }, 1000);
                    }
                    
                } else { 
                    mostrarMensagem("Palavra-passe incorreta!", "var(--color-alerta)"); 
                }
            } else {
                mostrarMensagem("Utilizador não encontrado na base de dados.", "var(--color-alerta)");
            }
        })
        .catch((erro) => {
            console.error(erro);
            mostrarMensagem("Erro ao verificar o utilizador. Tente novamente.", "var(--color-alerta)");
        });
    }
}

// 3. RECUPERAÇÃO DE PASSWORD (APENAS VIA FIREBASE AUTH)
function recuperarPassword() {
    const email = document.getElementById('email').value;
    if (!email) {
        mostrarMensagem("Introduza o email de Administrador primeiro.", "var(--color-alerta)");
        return;
    }

    mostrarMensagem("A enviar email de recuperação...", "var(--color-preparacao)");

    jwayAuth.sendPasswordResetEmail(email)
        .then(() => { 
            mostrarMensagem("Email enviado! Verifique a sua caixa de entrada.", "var(--color-producao)"); 
        })
        .catch((error) => { 
            console.error(error);
            mostrarMensagem("Erro ao enviar email. Verifique o endereço.", "var(--color-alerta)"); 
        });
}

// 3.1 RECUPERAÇÃO DE PASSWORD (MODO FÁBRICA -> ALERTA SÓ PARA ADMIN)
function solicitarRecuperacaoPasswordFabrica() {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown || !dropdown.value) {
        mostrarMensagem("Selecione o seu nome para pedir recuperação.", "var(--color-alerta)");
        return;
    }

    // Evita spam local do mesmo pedido em sequência curta.
    const cooldownKey = 'jway_reset_request_cooldown';
    const ultimaTentativa = parseInt(localStorage.getItem(cooldownKey) || '0', 10);
    if ((Date.now() - ultimaTentativa) < 120000) {
        mostrarMensagem("Pedido já enviado. Aguarde 2 minutos antes de repetir.", "var(--color-alerta)");
        return;
    }

    const userId = dropdown.value;
    const userNome = (dropdown.options[dropdown.selectedIndex] && dropdown.options[dropdown.selectedIndex].text) || 'Operador';
    const horaAtual = new Date();
    const hora = `${String(horaAtual.getDate()).padStart(2,'0')}/${String(horaAtual.getMonth() + 1).padStart(2,'0')}/${horaAtual.getFullYear()} ${String(horaAtual.getHours()).padStart(2,'0')}:${String(horaAtual.getMinutes()).padStart(2,'0')}`;

    const payload = {
        status: 'pendente',
        tear: 'GERAL',
        tipo: 'pedido_recuperacao_password',
        alvo: 'admin',
        msg: `Pedido de recuperação de palavra-passe: ${userNome}`,
        responsavel: userNome,
        userId: userId,
        hora: hora
    };

    mostrarMensagem("A enviar pedido para a Administração...", "var(--color-preparacao)");

    jwayDB.ref('dados/alertas').push(payload)
        .then(() => {
            localStorage.setItem(cooldownKey, String(Date.now()));
            mostrarMensagem("Pedido enviado. A Administração irá tratar da recuperação.", "var(--color-producao)");
        })
        .catch((erro) => {
            console.error(erro);
            mostrarMensagem("Não foi possível enviar o pedido. Tente novamente.", "var(--color-alerta)");
        });
}

// 4. MENSAGENS VISUAIS
function mostrarMensagem(texto, cor) {
    const msgBox = document.getElementById('login-msg');
    msgBox.innerText = texto;
    msgBox.classList.remove('positive', 'error');
    if (cor === 'var(--color-preparacao)' || cor === 'var(--color-producao)') {
        msgBox.classList.add('positive');
    } else {
        msgBox.classList.add('error');
    }
    msgBox.style.display = 'block';
}

// Arranca o carregamento da Dropdown mal a página abre
document.addEventListener("DOMContentLoaded", carregarUtilizadores);

