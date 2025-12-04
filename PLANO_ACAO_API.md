# 📋 Plano de Ação - Ajustes para Conformidade com API

## 🔍 Análise Comparativa: Documentação vs Código Atual

### ✅ O que está correto:
- Uso de SHA256 para hash da senha
- Headers `Content-Type` e `Authorization` (Protheus)
- Estrutura básica dos endpoints

### ❌ O que precisa ser ajustado:

---

## 🔴 **1. Hash SHA256 - Conversão para Maiúsculo**

**Problema:** A documentação exige que o hash SHA256 seja enviado em **MAIÚSCULO**.

**Localização:** `src/app/services/login.service.ts:44`

**Ação:**
```typescript
// ATUAL:
cSenha: SecurityUtil.encryptSHA256(loginEvent.password),

// DEVE SER:
cSenha: SecurityUtil.encryptSHA256(loginEvent.password).toUpperCase(),
```

**Arquivo:** `src/app/utils/security.util.ts`
- Adicionar `.toUpperCase()` no método `encryptSHA256` OU
- Converter no serviço de login

---

## 🔴 **2. Header tenantid - Case Sensitive**

**Problema:** A documentação especifica `tenantid` (minúsculo), mas o código usa `tenantID` (camelCase).

**Localizações:**
- `src/app/services/login.service.ts:37`
- `src/app/services/login.service.ts:85`
- `src/app/services/titulos.service.ts:36`

**Ação:**
```typescript
// ATUAL:
.set('tenantID', '02' + ',' + '020101')

// DEVE SER:
.set('tenantid', '02' + ',' + '020101')
```

---

## 🔴 **3. Token JWT do Fornecedor - Armazenamento e Uso**

**Problema:** O token JWT retornado no login não está sendo armazenado nem enviado nas requisições subsequentes.

**Documentação:**
- Token vem no campo `token` da resposta do `/login`
- Deve ser armazenado em `localStorage` ou `sessionStorage`
- Deve ser enviado no header `X-Custon-Token: Bearer <jwt_fornecedor>` em todas as requisições protegidas

**Ações necessárias:**

### 3.1. Armazenar token após login
**Arquivo:** `src/app/login/login.component.ts:120-125`

```typescript
// Após login bem-sucedido, adicionar:
if (response.token) {
  localStorage.setItem('fornecedor_jwt', response.token);
  // ou sessionStorage.setItem('fornecedor_jwt', response.token);
}
```

### 3.2. Criar serviço/interceptor para gerenciar token
**Novo arquivo:** `src/app/services/fornecedor-auth.service.ts` (opcional)
- Métodos: `getToken()`, `setToken()`, `removeToken()`, `isAuthenticated()`

### 3.3. Criar interceptor para adicionar header X-Custon-Token
**Novo arquivo:** `src/app/common/fornecedor-token.interceptor.ts`
- Interceptar requisições para endpoints `BRASPINE_DOC_FORNE`
- Adicionar header `X-Custon-Token: Bearer <token>` quando token existir

---

## 🔴 **4. Tratamento de Erros - Estrutura fault.faultstring**

**Problema:** A API retorna erros em `error.error.fault.faultstring`, mas o código procura em `error.error.message` ou `error.error.errorMessage`.

**Localizações:**
- `src/app/services/login.service.ts:50-77`
- `src/app/services/titulos.service.ts:49-52`
- `src/app/login/login.component.ts:137-143`
- `src/app/login/login.component.ts:190-194`

**Ação:**
```typescript
// ATUAL:
errorMessage = error.error.message || error.error.errorMessage;

// DEVE SER:
errorMessage = error.error?.fault?.faultstring || 
               error.error?.message || 
               error.error?.errorMessage || 
               'Erro desconhecido';
```

---

## 🔴 **5. Endpoint /cadastro - Nova Estrutura de Resposta**

**Problema:** A API agora retorna uma mensagem única com e-mails mascarados, mas o código espera `listemail` e `fornecedornome` separados.

**Documentação:**
```json
{
  "mensagem": "Senha cadastrada com sucesso para os emails: ********nho@gmail.com, *******ato@exemplo.com.br"
}
```

**Localização:** `src/app/login/login.component.ts:168-202`

**Ação:**
```typescript
// ATUAL:
this.listemail = response.listemail;
this.fornecedornome = response.fornecedornome;
// ... monta mensagem manualmente

// DEVE SER:
if (response.mensagem) {
  this.poDialog.alert({
    ok: () => (this.loading = false),
    title: 'Cadastro de Senha',
    message: response.mensagem
  });
}
```

---

## 🔴 **6. Endpoint /docforne - Header X-Custon-Token**

**Problema:** O endpoint `/docforne` requer o header `X-Custon-Token`, mas não está sendo enviado.

**Localização:** `src/app/services/titulos.service.ts:35-46`

**Ação:**
- Adicionar header via interceptor (item 3.3) OU
- Adicionar manualmente no método `buscarTitulo`

---

## 🔴 **7. Validação de Expiração do Token JWT**

**Problema:** Não há validação de expiração do token JWT do fornecedor antes de fazer requisições.

**Ação:**
- Criar método para decodificar token JWT
- Verificar campo `exp` (expiração)
- Redirecionar para login se expirado
- Implementar no interceptor ou no serviço de autenticação

**Biblioteca sugerida:** `jwt-decode` ou implementação manual (base64 decode)

---

## 🔴 **8. Verificação de Endpoints - Case Sensitivity**

**Problema:** Verificar se os endpoints estão corretos conforme documentação.

**Documentação:**
- Base URL: `/rest/api/braspine_doc_forne`
- Endpoints: `/login`, `/cadastro`, `/docforne`

**Código atual:**
- `/rest/BRASPINE_DOC_FORNE/login`
- `/rest/BRASPINE_DOC_FORNE/cadastro`
- `/rest/BRASPINE_DOC_FORNE/docforne`

**Ação:** Verificar com backend qual é o caminho correto (pode ser case-sensitive no servidor).

---

## 📝 **Resumo das Alterações por Prioridade**

### 🔥 **Alta Prioridade (Crítico para funcionamento):**
1. ✅ Hash SHA256 em maiúsculo
2. ✅ Header `tenantid` (minúsculo)
3. ✅ Armazenar e enviar token JWT do fornecedor
4. ✅ Tratamento de erros (`fault.faultstring`)

### ⚠️ **Média Prioridade (Funcionalidade):**
5. ✅ Ajustar endpoint `/cadastro` para nova estrutura
6. ✅ Adicionar header `X-Custon-Token` em `/docforne`

### 📌 **Baixa Prioridade (Melhorias):**
7. ✅ Validação de expiração do token
8. ✅ Verificar case sensitivity dos endpoints

---

## 🛠️ **Arquivos que Serão Modificados**

1. `src/app/services/login.service.ts`
2. `src/app/services/titulos.service.ts`
3. `src/app/login/login.component.ts`
4. `src/app/utils/security.util.ts` (opcional)
5. `src/app/common/fornecedor-token.interceptor.ts` (NOVO)
6. `src/app/services/fornecedor-auth.service.ts` (NOVO - opcional)
7. `src/app/app.module.ts` ou `app.config.ts` (registrar interceptor)

---

## ✅ **Checklist de Implementação**

- [ ] 1. Corrigir hash SHA256 para maiúsculo
- [ ] 2. Corrigir header tenantid (minúsculo)
- [ ] 3. Armazenar token JWT após login
- [ ] 4. Criar interceptor para X-Custon-Token
- [ ] 5. Atualizar tratamento de erros
- [ ] 6. Ajustar endpoint /cadastro
- [ ] 7. Verificar endpoints (case)
- [ ] 8. Implementar validação de expiração
- [ ] 9. Testar fluxo completo de login
- [ ] 10. Testar consulta de títulos
- [ ] 11. Testar cadastro de senha

---

## 📚 **Referências**

- Documentação completa: `API_DOCUMENTATION.md`
- Exemplos de implementação: Seção "Exemplos de Implementação" da documentação

---

**Data de criação:** 2025-01-27  
**Versão:** 1.0

