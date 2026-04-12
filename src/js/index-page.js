window.modoAtual = 'operador';

const inputPass = document.getElementById('password');
const iconOlho = document.getElementById('olho-magico');
const formLogin = document.getElementById('login-form');
const btnLogin = document.getElementById('login-button');
const btnLoginLabel = document.getElementById('login-btn-label');
const btnModoOperador = document.getElementById('btn-modo-operador');
const btnModoAdmin = document.getElementById('btn-modo-admin');
const linkRecuperar = document.getElementById('link-recuperar');

function setLoginLoading(isLoading) {
    if (!btnLogin) return;
    btnLogin.disabled = isLoading;
    btnLogin.classList.toggle('is-loading', isLoading);
    if (btnLoginLabel) btnLoginLabel.innerText = isLoading ? 'A VALIDAR ACESSO' : 'ENTRAR NO SISTEMA';
}

function iniciarLogin() {
    setLoginLoading(true);
    try {
        fazerLogin();
    } finally {
        setTimeout(() => setLoginLoading(false), 9000);
    }
}

window.aplicarModoLogin = function (modo) {
    const divOp = document.getElementById('modo-operador');
    const divAdmin = document.getElementById('modo-admin');
    const titulo = document.getElementById('titulo-login');
    const isAdmin = modo === 'admin';

    if (btnModoOperador) {
        btnModoOperador.classList.toggle('active', !isAdmin);
        btnModoOperador.setAttribute('aria-selected', String(!isAdmin));
    }
    if (btnModoAdmin) {
        btnModoAdmin.classList.toggle('active', isAdmin);
        btnModoAdmin.setAttribute('aria-selected', String(isAdmin));
    }

    if (divOp) divOp.style.display = isAdmin ? 'none' : 'block';
    if (divAdmin) divAdmin.style.display = isAdmin ? 'block' : 'none';
    if (linkRecuperar) linkRecuperar.style.display = 'inline-block';
    if (titulo) titulo.innerText = isAdmin ? 'ACESSO ADMINISTRADOR' : 'ACESSO FÁBRICA';

    window.modoAtual = isAdmin ? 'admin' : 'operador';
};

window.recuperarPasswordAcesso = function () {
    if (window.modoAtual === 'admin') {
        recuperarPassword();
        return;
    }
    if (typeof solicitarRecuperacaoPasswordFabrica === 'function') {
        solicitarRecuperacaoPasswordFabrica();
    }
};

window.alternarModoLogin = function () {
    window.aplicarModoLogin(window.modoAtual === 'operador' ? 'admin' : 'operador');
};

function mostrarPassword(e) {
    if (e) e.preventDefault();
    if (!inputPass || !iconOlho) return;
    inputPass.type = 'text';
    iconOlho.src = 'src/assets/images/hidden.png';
}

function esconderPassword() {
    if (!inputPass || !iconOlho) return;
    inputPass.type = 'password';
    iconOlho.src = 'src/assets/images/eye.png';
}

if (btnModoOperador) {
    btnModoOperador.addEventListener('click', () => window.aplicarModoLogin('operador'));
}
if (btnModoAdmin) {
    btnModoAdmin.addEventListener('click', () => window.aplicarModoLogin('admin'));
}
if (linkRecuperar) {
    linkRecuperar.addEventListener('click', function (e) {
        e.preventDefault();
        window.recuperarPasswordAcesso();
    });
}

if (iconOlho) {
    iconOlho.addEventListener('mousedown', mostrarPassword);
    iconOlho.addEventListener('mouseup', esconderPassword);
    iconOlho.addEventListener('mouseleave', esconderPassword);
    iconOlho.addEventListener('touchstart', mostrarPassword);
    iconOlho.addEventListener('touchend', esconderPassword);
    iconOlho.addEventListener('touchcancel', esconderPassword);
    iconOlho.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (inputPass && inputPass.type === 'password') mostrarPassword(e);
            else esconderPassword();
        }
    });
}

if (formLogin) {
    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        iniciarLogin();
    });
}

if (typeof window.mostrarMensagem === 'function') {
    const mostrarMensagemOriginal = window.mostrarMensagem;
    window.mostrarMensagem = function (texto, cor) {
        mostrarMensagemOriginal(texto, cor);
        if (cor !== 'var(--color-preparacao)') {
            setLoginLoading(false);
        }
    };
}

window.aplicarModoLogin('operador');

if (navigator.userAgent.includes('SamsungBrowser')) {
    const style = document.createElement('style');
    style.textContent = `
        * {
            forced-color-adjust: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        body, .login-box, .input-field, .btn-primary {
            background-color: inherit !important;
            background-image: none !important;
        }
        .login-box { background: rgba(10, 25, 47, 0.9) !important; }
        .input-field { background: rgba(0,0,0,0.5) !important; }
        .btn-primary { background-color: #00a8ff !important; }
    `;
    document.head.appendChild(style);
}

