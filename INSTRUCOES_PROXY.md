# 🚀 Instruções para Resolver Erro SSL com Proxy

## ⚠️ Erro Atual
```
ERR_CERT_COMMON_NAME_INVALID
```

## ✅ Solução Implementada

### 1. **Arquivos Configurados:**
- ✅ `proxy.conf.json` - Proxy configurado
- ✅ `angular.json` - Proxy habilitado
- ✅ `environment.development.ts` - Domain vazio para usar proxy

### 2. **Passos para Aplicar:**

#### **PASSO 1: Parar o servidor Angular (se estiver rodando)**
```bash
# Pressione Ctrl+C no terminal onde o ng serve está rodando
```

#### **PASSO 2: Limpar cache e reinstalar (opcional, mas recomendado)**
```bash
# Limpar cache do Angular
# No Windows PowerShell:
Remove-Item -Recurse -Force .angular -ErrorAction SilentlyContinue

# No Windows CMD:
rmdir /s /q .angular

# No Linux/Mac:
rm -rf .angular
```

#### **PASSO 3: Reiniciar o servidor Angular**
```bash
npm start
# ou
ng serve
```

#### **PASSO 4: Verificar se o proxy está funcionando**

Ao iniciar, você deve ver no console algo como:
```
[HPM] Proxy created: /rest  ->  https://192.168.1.97:8090
```

### 3. **Como Funciona:**

- **Antes:** Requisições iam direto para `https://192.168.1.97:8090` → Erro SSL
- **Agora:** Requisições vão para `/rest/*` → Proxy redireciona para `https://192.168.1.97:8090` (ignorando SSL)

### 4. **Verificação:**

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Faça uma requisição (ex: login)
4. Verifique que a URL da requisição é relativa: `/rest/BRASPINE_DOC_FORNE/login`
5. Não deve aparecer erro de certificado

---

## 🔧 Se Ainda Não Funcionar:

### **Opção A: Verificar se o proxy está sendo usado**

Adicione no `proxy.conf.json`:
```json
{
  "/rest": {
    "target": "https://192.168.1.97:8090",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "rejectUnauthorized": false,
    "headers": {
      "Connection": "keep-alive"
    },
    "onProxyReq": function(proxyReq, req, res) {
      console.log('Proxy Request:', req.method, req.url);
    },
    "onError": function(err, req, res) {
      console.log('Proxy Error:', err);
    }
  }
}
```

### **Opção B: Usar flag explícita no comando**

```bash
ng serve --proxy-config proxy.conf.json
```

### **Opção C: Verificar porta do Angular**

O Angular roda na porta 4200 por padrão. Certifique-se de acessar:
```
http://localhost:4200
```

---

## 📝 Notas Importantes:

1. **O proxy só funciona em desenvolvimento** (`ng serve`)
2. **Em produção**, você precisa de certificado SSL válido
3. **Reinicie o servidor** após qualquer mudança no proxy
4. **O domain está vazio** em `environment.development.ts` - isso é correto!

---

## 🐛 Troubleshooting:

### Problema: "Proxy não está funcionando"
- ✅ Verifique se `angular.json` tem `"proxyConfig": "proxy.conf.json"`
- ✅ Verifique se o servidor foi reiniciado
- ✅ Verifique os logs do console ao iniciar

### Problema: "Ainda aparece erro SSL"
- ✅ Certifique-se de que está usando `http://localhost:4200` (não https)
- ✅ Verifique se as requisições estão indo para `/rest/*` (relativas)
- ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)

### Problema: "404 Not Found"
- ✅ Verifique se o servidor Protheus está rodando em `192.168.1.97:8090`
- ✅ Teste acessar diretamente no Postman para confirmar

---

**Última atualização:** 2025-01-27

