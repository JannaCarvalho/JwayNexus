# 🔐 Guia: Migração SHA-256 → bcrypt

## Objetivo
Substituir SHA-256 (hash simples) por bcrypt (password hashing adequado com salt).

---

## Passo 1: Instalar bcrypt

```bash
npm install bcrypt
# ou
npm install bcryptjs  # Alternativa compatível com navegador
```

> **Nota:** Se não tiver `package.json`, criar um:
> ```bash
> npm init -y
> npm install bcrypt
> ```

---

## Passo 2: Atualizar `autenticacao.js`

### Remover função SHA-256:
```javascript
// ❌ REMOVER ISTO:
async function encriptarPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Substituir por bcrypt:
```javascript
// ✅ NOVO:
async function encriptarPassword(password) {
    const bcrypt = require('bcrypt');
    const SALT_ROUNDS = 10;  // Aumentar para 12 ou 14 em produção
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function compararPassword(password, hash) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(password, hash);
}
```

---

## Passo 3: Atualizar lógica de login

### ANTES (linha ~116):
```javascript
const senhaValida = dados.password === passHash;
```

### DEPOIS:
```javascript
const senhaValida = await compararPassword(pass, dados.password);
```

---

## Passo 4: Migração de Passwords Existentes

**Problema:** Passwords antigas estão em SHA-256, novas em bcrypt  
**Solução:** Detectar formato e rehashar na primeira utilização

```javascript
async function fazerLogin() {
    // ... validações iniciais ...
    
    if (snapshot.exists()) {
        const dados = snapshot.val();
        let senhaValida = false;
        
        // 1. Tentar comparação com bcrypt
        try {
            senhaValida = await compararPassword(pass, dados.password);
        } catch (e) {
            // Se falhar, pode ser SHA-256 antigo
            const passHash = await encriptarPassword(pass);  // SHA-256
            senhaValida = dados.password === passHash;
            
            if (senhaValida) {
                // Rehash com bcrypt na BD
                const novoHash = await bcryptHash(pass, 10);
                await jwayDB.ref(`dados/utilizadores/${userId}/password`).set(novoHash);
                console.log(`✅ Password migrada de SHA-256 para bcrypt para: ${dados.utilizador}`);
            }
        }
        
        if (senhaValida) {
            // ... resto da lógica ...
        }
    }
}
```

---

## Passo 5: Testar

```javascript
// Testes rápidos em console
const test = async () => {
    const hash1 = await encriptarPassword("minha_password123");
    const match = await compararPassword("minha_password123", hash1);
    console.log("✅ bcrypt working:", match);  // true
    
    const wrong = await compararPassword("senha_errada", hash1);
    console.log("❌ Wrong password:", wrong);  // false
};
test();
```

---

## ⚠️ Considerações Importantes

### 1. Compatibilidade Navegador
- **bcrypt nativo:** Bem suportado em Node.js, mas pode ser lento em navegador
- **bcryptjs:** Alternativa em JavaScript puro (mais lenta, mas funciona em browser)

**Recomendação para Browser:**
```bash
npm install bcryptjs  # Em vez de bcrypt
```

### 2. SALT_ROUNDS
- Min: 10 (padrão)
- Recomendado em produção: 12-14
- Cada aumento demora ~2x mais tempo de hashing

### 3. Tempo de Execução
- Bcrypt é **propositalmente lento** (2-3 segundos por hash)
- Normal e esperado (protege contra brute force)

### 4. Rollback
Se precisar reverter durante implementação:
1. Manter suporte para SHA-256 por 30 dias
2. Log de senhas migradas para auditoria
3. Teste com utilizadores piloto primeiro

---

## 📋 Checklist de Implementação

- [ ] Instalar `bcrypt` ou `bcryptjs` via npm
- [ ] Criar `encriptarPassword(pass)` com bcrypt.hash()
- [ ] Criar `compararPassword(pass, hash)` com bcrypt.compare()
- [ ] Atualizar login operator com lógica de comparação bcrypt
- [ ] Adicionar migração SHA-256 → bcrypt automática
- [ ] Testes locais (mock de passwords)
- [ ] Deploy em staging (testar com utilizadores reais)
- [ ] Monitorar logs de migração
- [ ] Deploy em produção
- [ ] Remover suporte SHA-256 após 30 dias

---

## 🚨 Alternativa Rápida (Se sem Backend)

Se não conseguir usar Backend Functions, criar Cloud Function:

```javascript
// Firebase Cloud Function (deploy com: firebase deploy --only functions)
const functions = require('firebase-functions');
const bcrypt = require('bcrypt');

exports.hashPassword = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new Error('Not authenticated');
    
    const hash = await bcrypt.hash(data.password, 10);
    return { hash };
});

exports.verifyPassword = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new Error('Not authenticated');
    
    const match = await bcrypt.compare(data.password, data.hash);
    return { match };
});
```

---

## 📚 Recursos

- [bcrypt.js Documentação](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

---

**Próxima ação:** Contactar Tim de Backend para setup de Cloud Functions ou npm package
