(function () {
    // ════════ Cores globais por categoria ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    // Única fonte de verdade para cores de categoria em todo o projeto.
    // Cada entrada: { color, bg, border }
    window.JwayCatColors = {
        'T?cnico de Desenho':      { color: '#00a8ff', bg: 'rgba(0,168,255,0.15)',   border: 'rgba(0,168,255,0.4)'   },
        'T?cnicos de Desenho':     { color: '#00a8ff', bg: 'rgba(0,168,255,0.15)',   border: 'rgba(0,168,255,0.4)'   },
        'Operador (Maquinista)':   { color: '#70AD47', bg: 'rgba(112,173,71,0.15)',  border: 'rgba(112,173,71,0.4)'  },
        'Operadores (Maquinistas)':{ color: '#70AD47', bg: 'rgba(112,173,71,0.15)',  border: 'rgba(112,173,71,0.4)'  },
        'Assistente de Produção':  { color: '#c471ed', bg: 'rgba(196,113,237,0.15)', border: 'rgba(196,113,237,0.4)' },
        'Auxiliar de Produção':    { color: '#c471ed', bg: 'rgba(196,113,237,0.15)', border: 'rgba(196,113,237,0.4)' },
        'Comercial':               { color: '#FFC000', bg: 'rgba(255,192,0,0.15)',   border: 'rgba(255,192,0,0.4)'   },
        'Comerciais':              { color: '#FFC000', bg: 'rgba(255,192,0,0.15)',   border: 'rgba(255,192,0,0.4)'   },
        'Administrador':           { color: '#ff4757', bg: 'rgba(255,71,87,0.15)',   border: 'rgba(255,71,87,0.4)'   },
        'Administração':           { color: '#ff4757', bg: 'rgba(255,71,87,0.15)',   border: 'rgba(255,71,87,0.4)'   },
    };
    const NAV_LINKS = [
        { href: 'admin-panel.html', icon: 'fa-solid fa-user-tie', label: 'Painel de Administração', requiresAdmin: true },
        { href: 'dashboard-maquinas.html', icon: 'fa-solid fa-industry', label: 'Painel de Estado Máquinas' },
        { href: 'mapa-encomendas.html', icon: 'fa-solid fa-boxes-stacked', label: 'Mapa de Encomendas' },
        { href: 'mapa-tinturaria.html', icon: 'fa-solid fa-fill-drip', label: 'Mapa de Partidas Tinturaria' }
    ];

    window.renderNavigationMenu = function (isAdmin) {
        const menu = document.getElementById('menu-nav-dropdown');
        if (!menu) return;

        const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();

        const html = NAV_LINKS
            .filter(function (link) { return !(link.requiresAdmin && !isAdmin); })
            .filter(function (link) { return link.href.toLowerCase() !== currentPage; })
            .map(function (link) {
                return '<a href="' + link.href + '"><i class="' + link.icon + '"></i> ' + link.label + '</a>';
            })
            .join('');

        menu.innerHTML = html;
    };
})();



