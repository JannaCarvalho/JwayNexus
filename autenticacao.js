/* ==============================================================
   🛡️ JWAY - O PORTEIRO INTELIGENTE (autenticacao.js)
   Lógica de Login, Ligação à BD, Encriptação e Recuperação de Password.
   ============================================================== */

// --- FUNÇÃO DE ENCRIPTAÇÃO (SHA-256) ---
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
        dropdown.innerHTML = '<option value="">Selecione o seu nome...</option>'; 
        snapshot.forEach((filho) => {
            const user = filho.val();
            // Segurança extra para ignorar "buracos" de utilizadores apagados
            if(user && user.nome) {
                dropdown.innerHTML += `<option value="${filho.key}">${user.nome}</option>`;
            }
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
                    localStorage.setItem('jwayUserAtivo', perfilAdmin.utilizador);
                    localStorage.setItem('jwayUserNome', perfilAdmin.nome);
                    localStorage.setItem('jwayUserCat', perfilAdmin.categoria);
                    localStorage.setItem('jwayUserIsAdmin', 'true');
                } else {
                    // Plano B (Segurança): O Auth passou, mas a pessoa não está na BD (não devia acontecer)
                    mostrarMensagem("Bem-vindo, Administrador!", "var(--color-producao)");
                    localStorage.setItem('jwayUserAtivo', usernameExtraido);
                    localStorage.setItem('jwayUserNome', 'Administrador Chefe');
                    localStorage.setItem('jwayUserCat', 'Administrador');
                    localStorage.setItem('jwayUserIsAdmin', 'true');
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
                
                if (dados.password === passHash) {
                    mostrarMensagem(`Bem-vindo/a, ${dados.nome}!`, "var(--color-producao)");
                    
                    // GUARDA O PERFIL COMPLETO (Incluindo a Categoria)
                    localStorage.setItem('jwayUserAtivo', dados.utilizador);
                    localStorage.setItem('jwayUserNome', dados.nome);
                    localStorage.setItem('jwayUserCat', dados.categoria || 'Operador (Maquinista)');
                    localStorage.setItem('jwayUserIsAdmin', dados.isAdmin || false);
                    
                    // Se o Operador tiver a checkbox de Admin ativa na BD, vai para o Painel, senão vai para a Fábrica
                    if(dados.isAdmin === true || String(dados.isAdmin) === "true") {
                        setTimeout(() => { window.location.href = 'admin-panel.html'; }, 1000);
                    } else {
                        setTimeout(() => { window.location.href = 'planeamentojway.html'; }, 1000);
                    }
                    
                } else { 
                    mostrarMensagem("Palavra-passe incorreta!", "var(--color-alerta)"); 
                }
            }
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

// 4. MENSAGENS VISUAIS
function mostrarMensagem(texto, cor) {
    const msgBox = document.getElementById('login-msg');
    msgBox.innerText = texto;
    msgBox.style.color = cor;
    msgBox.style.display = 'block';
}

// Arranca o carregamento da Dropdown mal a página abre
document.addEventListener("DOMContentLoaded", carregarUtilizadores);