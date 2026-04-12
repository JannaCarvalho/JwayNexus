/**
 * ⚠️ AVISO DE SEGURANÇA - SESSION MANAGEMENT (CLIENT-SIDE)
 * 
 * RISCO: Dados de sessão armazenados em localStorage podem ser modificados via DevTools ou JavaScript malicioso.
 * PROBLEMA: Qualquer script na página pode executar: localStorage.setItem('jwayUserIsAdmin', 'true')
 * IMPACTO CRÍTICO: Um utilizador não-admin pode elevar-se a admin sem legítima autorização.
 * 
 * RECOMENDAÇÃO: Para usar em produção, migrar para:
 * 1. HttpOnly, Secure session cookies (servidor envia após autenticação)
 * 2. Validação de acesso no Backend (cada endpoint protegido valida o role)
 * 3. JWT tokens com assinatura de servidor (não confiável em localStorage)
 * 
 * TODO: Implementar validação server-side em Firebase Cloud Functions ou backend separado.
 */

(function () {
    const KEYS = {
        active: 'jwayUserAtivo',
        name: 'jwayUserNome',
        category: 'jwayUserCat',
        isAdmin: 'jwayUserIsAdmin',
        firstLogin: 'jwayFirstLogin'
    };

    const LEGACY_KEYS = {
        active: 'jway_fabrica_user',
        category: 'jway_fabrica_cat',
        isAdmin: 'jway_fabrica_admin'
    };

    function normalizeBool(value) {
        return value === true || String(value || '').toLowerCase() === 'true';
    }

    function migrateLegacy() {
        const legacyActive = localStorage.getItem(LEGACY_KEYS.active);
        const legacyCategory = localStorage.getItem(LEGACY_KEYS.category);
        const legacyAdmin = localStorage.getItem(LEGACY_KEYS.isAdmin);

        if (!localStorage.getItem(KEYS.active) && legacyActive) {
            localStorage.setItem(KEYS.active, legacyActive);
        }
        if (!localStorage.getItem(KEYS.category) && legacyCategory) {
            localStorage.setItem(KEYS.category, legacyCategory);
        }
        if (!localStorage.getItem(KEYS.isAdmin) && legacyAdmin) {
            localStorage.setItem(KEYS.isAdmin, normalizeBool(legacyAdmin) ? 'true' : 'false');
        }

        localStorage.removeItem(LEGACY_KEYS.active);
        localStorage.removeItem(LEGACY_KEYS.category);
        localStorage.removeItem(LEGACY_KEYS.isAdmin);
    }

    function get() {
        migrateLegacy();
        return {
            ativo: localStorage.getItem(KEYS.active) || '',
            nome: localStorage.getItem(KEYS.name) || '',
            categoria: localStorage.getItem(KEYS.category) || '',
            isAdmin: normalizeBool(localStorage.getItem(KEYS.isAdmin)),
            firstLogin: normalizeBool(localStorage.getItem(KEYS.firstLogin))
        };
    }

    function set(session) {
        const next = session || {};

        if (next.ativo !== undefined) localStorage.setItem(KEYS.active, String(next.ativo || ''));
        if (next.nome !== undefined) localStorage.setItem(KEYS.name, String(next.nome || ''));
        if (next.categoria !== undefined) localStorage.setItem(KEYS.category, String(next.categoria || ''));
        if (next.isAdmin !== undefined) localStorage.setItem(KEYS.isAdmin, normalizeBool(next.isAdmin) ? 'true' : 'false');

        localStorage.removeItem(LEGACY_KEYS.active);
        localStorage.removeItem(LEGACY_KEYS.category);
        localStorage.removeItem(LEGACY_KEYS.isAdmin);
    }

    function setCategory(category) {
        localStorage.setItem(KEYS.category, String(category || ''));
        localStorage.removeItem(LEGACY_KEYS.category);
    }

    function clear() {
        localStorage.removeItem(KEYS.active);
        localStorage.removeItem(KEYS.name);
        localStorage.removeItem(KEYS.category);
        localStorage.removeItem(KEYS.isAdmin);
        localStorage.removeItem(KEYS.firstLogin);

        localStorage.removeItem(LEGACY_KEYS.active);
        localStorage.removeItem(LEGACY_KEYS.category);
        localStorage.removeItem(LEGACY_KEYS.isAdmin);
    }

    function setFirstLogin(value) {
        localStorage.setItem(KEYS.firstLogin, normalizeBool(value) ? 'true' : 'false');
    }

    function clearFirstLogin() {
        localStorage.removeItem(KEYS.firstLogin);
    }

    window.JwaySession = {
        get: get,
        set: set,
        setCategory: setCategory,
        clear: clear,
        setFirstLogin: setFirstLogin,
        clearFirstLogin: clearFirstLogin
    };

    migrateLegacy();
})();
