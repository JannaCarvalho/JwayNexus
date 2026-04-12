# 🔒 Jway Laboratorio - Audit de Segurança & Roadmap

## Resumo Executivo
**Audit completo realizado em 12/04/2026**
- **Total de Issues:** 18
- **CRÍTICA (5):** Requerem correção imediata
- **ALTA (4):** Requerem correção nos próximos sprints
- **MÉDIA (5):** Melhorias recomendadas
- **BAIXA (4):** Nice-to-have ou melhorias futuras

---

## 🔴 CRÍTICA - MÁXIMA PRIORIDADE

### 1. Firebase Database Rules - Permissivo Demais
**Localização:** `database.rules.json`  
**Problema:** Originalmente `.read: true` (qualquer pessoa na internet podia ler a BD inteira)  
**Status:** ✅ **FIXO**  
**Solução Implementada:**
```json
"dados": {
  ".read": "auth != null",        // Apenas usuários autenticados
  "utilizadores": {
    ".read": "root.child('utilizadores').child(auth.uid).child('role').val() === 'admin'",
    ".write": "root.child('utilizadores').child(auth.uid).child('role').val() === 'admin'"
  }
}
```

---

### 2. Firebase API Keys Expostas no Código (firebase-config.js)
**Localização:** `src/js/firebase-config.js` (linha 7-14)  
**Problema:** Chaves e Project ID visíveis em JavaScript cliente  
**Risco:** Atacante pode enumerar/modificar dados via API direta  
**Status:** ⚠️ **DOCUMENTADO - Ação futura recomendada**  
**Mitigações:**
- ✅ Database rules agora restringem acesso (vide ponto 1)
- ⏳ **TODO:** Implementar Firebase App Check (token de integridade)
- ⏳ **TODO:** Backend proxy para operações sensíveis

---

### 3. Plaintext Password Acceptance (autenticacao.js)
**Localização:** `src/js/autenticacao.js` (linha 116, original)  
**Problema:** `const senhaValida = dados.password === passHash || dados.password === pass;`  
- Se BD armazenar plaintext, era aceite  
- Atacante com acesso à BD poderia usar senhas em plaintext  
**Status:** ✅ **FIXO**  
**Solução Implementada:**
```javascript
// Apenas comparação com hash - rejeita plaintext
const senhaValida = dados.password === passHash;
```

---

### 4. Hardcoded Default Passwords (autenticacao.js)
**Localização:** `src/js/autenticacao.js` (linha 119, original)  
**Problema:** 
```javascript
dados.password === "Jway2026" || dados.password === "jway2026"
```
- Defauts hardcoded no código-fonte
- Qualquer desenvolvedor/fork conheceria a password padrão  
**Status:** ✅ **FIXO**  
**Solução:** Removida verificação; apenas `mustChangePassword` flag na BD

---

### 5. Session isAdmin Flag em localStorage (session-utils.js)
**Localização:** `src/js/session-utils.js`  
**Problema:** 
```javascript
localStorage.getItem('jwayUserIsAdmin') // Qualquer script pode modificar!
```
- Um utilizador não-admin pode abrir DevTools e fazer: `localStorage.setItem('jwayUserIsAdmin', 'true')`
- Elevação de privilégios instantânea  
**Status:** ⚠️ **DOCUMENTADO - Requer Backend**  
**Solução Recomendada:**
1. Mover para HttpOnly, Secure cookie (backend envia após auth)
2. Validar `role` no Server via Firebase Cloud Functions
3. Cada endpoint protegido valida permissões no backend

---

## 🟠 ALTA - Próximos 1-2 Sprints

### 6. SHA-256 para Password Hashing (Não Recomendado)
**Localização:** `src/js/autenticacao.js` (linha 5-11)  
**Problema:** SHA-256 é hash criptográfico, não password hashing (sem salt, sem delay)  
**Status:** ⚠️ **DOCUMENTADO**  
**Solução:**
```bash
npm install bcrypt
# Substituir encriptarPassword() com bcrypt.hash(password, 10)
# Implementar bcrypt.compare() para validação
```

---

### 7. Input Validation Insuficiente
**Localização:** Múltiplos ficheiros (index.html, admin-panel.html, etc.)  
**Problema:** Sem validação de emails, comprimento mínimo de password, special chars  
**Status:** ⏳ **Pendente**  
**Ações:**
- Email: Regex validação (RFC 5322 simplificado)
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Sanitizar inputs para XSS antes de renderizar

---

### 8. Missing Content Security Policy (CSP)
**Localização:** Todos os .html (header do servidor)  
**Problema:** Sem CSP headers, XSS e injection attacks possíveis  
**Status:** ⏳ **Pendente**  
**Recomendação:**
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://www.gstatic.com/firebasejs; 
  style-src 'self' 'unsafe-inline'
```

---

### 9. Missing CSRF Protection
**Localização:** Formulários de login, admin panel  
**Problema:** Sem tokens CSRF, ataque cross-site request forgery possível  
**Status:** ⏳ **Pendente (Baixo risco com Firebase Auth)**  
**Nota:** Firebase Auth reduz risco, mas recomenda-se CSRF token nos formulários

---

---

## 🟡 MÉDIA - Backlog Técnico

### 10-14. Inline Script Handlers & Code Organization
**Problema:** onclick="..." e <script> inline em HTML  
**Status:** ✅ **index.html** - FIXO; ⏳ **admin-panel.html, mapa-*.html** - Pendente  
**Ações:** Extrair para módulos .js separados (admin-page.js, etc.)

---

### 15. No Rate Limiting
**Problema:** Endpoints de login sem rate limiting (brute force possível)  
**Recomendação:** Firebase Cloud Functions com rate limiting ou backend separado

---

### 16. Insufficient Error Handling
**Problema:** Alguns erros Firebase logados na console (info sobre BD structure exposta)  
**Solução:** Genéricos no frontend, logs detalhados apenas no backend

---

### 17. Cache Versioning
**Problema:** Service Worker pode servir versões antigas em cache  
**Recomendação:** Versionar ficheiros (script.js?v=1.2.3) ou implementar Cache-Control headers

---

## 🟢 BAIXA - Melhorias Futuras

### 18. Console.log() em Produção
**Problema:** Informações de debug expostas  
**Ação:** Remover ou usar logger com níveis (development/production)

---

## 📋 Rodmap de Implementação

| # | Issue | Prioridade | Esforço | Sprint | Status |
|---|-------|-----------|--------|--------|--------|
| 1 | Database Rules | CRÍTICA | 15 min | Now | ✅ FIXO |
| 3 | Plaintext Password | CRÍTICA | 10 min | Now | ✅ FIXO |
| 4 | Hardcoded Defaults | CRÍTICA | 10 min | Now | ✅ FIXO |
| 5 | localStorage isAdmin | CRÍTICA | 4h | S1 | ⏳ Requires Backend |
| 2 | Firebase Keys | CRÍTICA | 2h | S1 | ⏳ App Check Setup |
| 6 | SHA-256 → bcrypt | ALTA | 2h | S2 | ⏳ npm install |
| 7 | Input Validation | ALTA | 3h | S2 | ⏳ Regex patterns |
| 8 | CSP Headers | ALTA | 1h | S2 | ⏳ Server config |
| 9 | CSRF Tokens | ALTA | 1.5h | S3 | ⏳ Form tokens |
| 10-14 | Code Organization | MÉDIA | 2h | S3 | ✅ Partial (index.html) |
| 15-18 | Other | BAIXA | 3h | Backlog | ⏳ Opcional |

---

## 🛠️ Quick Fixes Already Applied

```bash
✅ database.rules.json       - Atualizado com .read: "auth != null" e regras por role
✅ autenticacao.js           - Removida plaintext password acceptance
✅ autenticacao.js           - Removidos hardcoded defaults "Jway2026"
✅ session-utils.js          - Adicionado aviso XSS crítico (localStorage)
✅ firebase-config.js        - Documentação sobre API keys expostas
```

---

## ⚡ Próximas Ações (Ordem Recomendada)

1. **Imediato (Esta semana):**
   - ✅ Database rules tightened
   - ✅ Password handling hardened
   - ⏳ Setup Firebase Cloud Functions para validar role no backend

2. **Curto Prazo (1-2 semanas):**
   - Implementar Firebase App Check
   - Migrar `isAdmin` flag para server-side validation
   - Implementar bcrypt para password hashing
   - Adicionar CSP headers no servidor

3. **Médio Prazo (1 mês):**
   - Input validation em todos os formulários
   - CSRF token handling
   - Rate limiting no login
   - Extrair remaining inline handlers

4. **Longo Prazo:**
   - Audit segurança regular (trimestral)
   - OWASP Top 10 compliance check
   - Penetration testing

---

## 📚 Referências

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Documentação atualizada:** 12 de Abril de 2026  
**Próximo audit:** Julho de 2026
