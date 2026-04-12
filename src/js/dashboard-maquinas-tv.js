(function () {
    window.tvModeAtivo = false;
    let tvAutoScrollInterval = null;
    let tvAutoScrollDirection = 1;
    let tvAutoScrollPauseUntil = 0;
    let tvScrollPulseTimeout = null;

    function marcarTvEmScroll() {
        if (!window.tvModeAtivo) return;
        document.body.classList.add('tv-scrolling');
        if (tvScrollPulseTimeout) clearTimeout(tvScrollPulseTimeout);
        tvScrollPulseTimeout = setTimeout(() => {
            document.body.classList.remove('tv-scrolling');
            tvScrollPulseTimeout = null;
        }, 240);
    }

    function isAdminSessao() {
        try {
            const sess = window.JwaySession && window.JwaySession.get ? window.JwaySession.get() : null;
            return !!(sess && sess.isAdmin === true);
        } catch (_) {
            return false;
        }
    }

    function pararAutoScrollTv() {
        if (tvAutoScrollInterval) {
            clearInterval(tvAutoScrollInterval);
            tvAutoScrollInterval = null;
        }
    }

    function iniciarAutoScrollTv() {
        pararAutoScrollTv();
        tvAutoScrollDirection = 1;
        tvAutoScrollPauseUntil = Date.now() + 1400;

        tvAutoScrollInterval = setInterval(() => {
            if (!window.tvModeAtivo) return;
            if (Date.now() < tvAutoScrollPauseUntil) return;

            const doc = document.documentElement;
            const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
            if (maxScroll < 24) return;

            const atual = window.scrollY || window.pageYOffset || 0;
            const proximo = Math.max(0, Math.min(maxScroll, atual + (tvAutoScrollDirection * 1.1)));
            window.scrollTo({ top: proximo, behavior: 'auto' });
            marcarTvEmScroll();

            if (proximo >= (maxScroll - 2) && tvAutoScrollDirection === 1) {
                tvAutoScrollDirection = -1;
                tvAutoScrollPauseUntil = Date.now() + 1800;
            } else if (proximo <= 2 && tvAutoScrollDirection === -1) {
                tvAutoScrollDirection = 1;
                tvAutoScrollPauseUntil = Date.now() + 1800;
            }
        }, 22);
    }

    function aplicarTvModeUi(ativo) {
        window.tvModeAtivo = !!ativo;
        document.body.classList.toggle('tv-mode', window.tvModeAtivo);
        document.documentElement.classList.toggle('tv-mode', window.tvModeAtivo);
        if (!window.tvModeAtivo) document.body.classList.remove('tv-scrolling');

        const btnTv = document.getElementById('btn-tv-mode');
        const btnTvFloating = document.getElementById('btn-tv-floating');
        [btnTv, btnTvFloating].forEach((btn) => {
            if (!btn) return;
            btn.classList.toggle('btn-tv-active', window.tvModeAtivo);
            btn.innerHTML = window.tvModeAtivo
                ? '<i class="fa-solid fa-up-right-and-down-left-from-center"></i> Sair TV'
                : '<i class="fa-solid fa-tv"></i> Modo TV';
            btn.title = window.tvModeAtivo ? 'Sair do modo TV' : 'Ativar modo TV';
        });

        localStorage.setItem('jwayTvMode', window.tvModeAtivo ? '1' : '0');

        if (window.tvModeAtivo) {
            iniciarAutoScrollTv();
        } else {
            pararAutoScrollTv();
            if (tvScrollPulseTimeout) {
                clearTimeout(tvScrollPulseTimeout);
                tvScrollPulseTimeout = null;
            }
        }
    }

    async function entrarFullscreen() {
        if (document.fullscreenElement) return;
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (_) {}
    }

    async function sairFullscreen() {
        if (!document.fullscreenElement) return;
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch (_) {}
    }

    window.toggleTvMode = async function (forceState) {
        if (!isAdminSessao()) {
            if (window.tvModeAtivo) aplicarTvModeUi(false);
            if (typeof window.showToast === 'function') {
                window.showToast('Apenas administradores podem usar o Modo TV.', 'error');
            }
            return;
        }

        const hasForce = typeof forceState === 'boolean';
        const nextState = hasForce ? forceState : !window.tvModeAtivo;

        aplicarTvModeUi(nextState);
        if (nextState) await entrarFullscreen();
        else await sairFullscreen();

        if (typeof window.verificarERenderizar === 'function') {
            window.verificarERenderizar();
        }
    };

    window.initTvModeFromStorage = function () {
        if (!isAdminSessao()) {
            localStorage.removeItem('jwayTvMode');
            aplicarTvModeUi(false);
            return;
        }
        if (localStorage.getItem('jwayTvMode') === '1') {
            setTimeout(() => { window.toggleTvMode(true); }, 180);
        }
    };

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && window.tvModeAtivo) {
            aplicarTvModeUi(false);
            if (typeof window.verificarERenderizar === 'function') {
                window.verificarERenderizar();
            }
        }
    });
})();
