# 🔒 Solução para Erro de Certificado SSL

## 📋 Problema Identificado

O erro `sslv3 alert certificate unknown` ocorre porque:
- O servidor usa HTTPS com IP local: `https://192.168.1.97:8090`
- O certificado SSL é auto-assinado ou não confiável
- O navegador bloqueia por segurança (Postman funciona porque ignora SSL)

## ✅ Soluções Disponíveis

### **Solução 1: Usar Proxy do Angular (Recomendado para Desenvolvimento)**

**Já implementado:**
- ✅ Arquivo `proxy.conf.json` criado
- ✅ Configuração no `angular.json` adicionada

**Como usar:**

1. **Opção A: Usar caminho relativo (recomendado)**
   - Alterar `environment.development.ts` para usar caminho relativo
   - O proxy redireciona automaticamente

2. **Opção B: Manter URL completa**
   - Manter `environment.development.ts` como está
   - O proxy ainda ajuda, mas pode precisar de ajustes

**Comando para iniciar com proxy:**
```bash
ng serve --proxy-config proxy.conf.json
```

Ou simplesmente:
```bash
npm start
```
(se o proxy já estiver configurado no angular.json)

---

### **Solução 2: Instalar Certificado no Navegador**

1. Acesse `https://192.168.1.97:8090` no navegador
2. Clique em "Avançado" ou "Advanced"
3. Clique em "Continuar mesmo assim" ou "Proceed to site"
4. Exporte o certificado (se possível)
5. Instale o certificado como confiável no sistema/navegador

**Chrome/Edge:**
- Configurações → Privacidade e segurança → Gerenciar certificados
- Importar certificado

**Firefox:**
- Opções → Privacidade e Segurança → Certificados → Ver Certificados → Autoridades

---

### **Solução 3: Usar HTTP em Desenvolvimento (Se possível)**

Se o servidor Protheus permitir HTTP em desenvolvimento:

```typescript
// environment.development.ts
domain: 'http://192.168.1.97:8090',  // HTTP ao invés de HTTPS
```

**⚠️ Atenção:** Apenas para desenvolvimento local. Nunca em produção!

---

### **Solução 4: Configurar Certificado Válido no Servidor (Produção)**

Para produção, configure um certificado SSL válido no servidor Protheus:
- Certificado de uma CA confiável (Let's Encrypt, etc.)
- Ou certificado corporativo interno

---

## 🛠️ Implementação Recomendada

### **Para Desenvolvimento:**

1. **Usar Proxy (já configurado):**
   ```bash
   ng serve
   ```

2. **Ajustar environment.development.ts:**
   ```typescript
   export const environment = {
     production: false,
     // Usar caminho relativo para o proxy funcionar
     domain: '',  // ou '/rest' se necessário
     recaptchaSiteKey: '6LeIDA0sAAAAAMZI2h7iBF3AYZBou9VjilYHE_ly'
   };
   ```

3. **Ajustar proxy.conf.json se necessário:**
   ```json
   {
     "/rest/*": {
       "target": "https://192.168.1.97:8090",
       "secure": false,
       "changeOrigin": true,
       "logLevel": "debug",
       "rejectUnauthorized": false
     }
   }
   ```

### **Para Produção:**

Manter `environment.ts` com URL completa e certificado válido:
```typescript
domain: 'https://apiportalfornecedores.braspine.com.br:8075',
```

---

## 📝 Notas Importantes

1. **`rejectUnauthorized: false`** no proxy desabilita validação SSL apenas em desenvolvimento
2. **Nunca use isso em produção** - sempre valide certificados SSL em produção
3. O proxy funciona apenas com `ng serve` (desenvolvimento)
4. Para build de produção, o proxy não funciona - precisa de certificado válido

---

## 🔍 Verificação

Após implementar, verifique:
1. ✅ Requisições funcionam no navegador
2. ✅ Sem erros de certificado no console
3. ✅ Logs do proxy mostram redirecionamento correto

---

**Última atualização:** 2025-01-27

