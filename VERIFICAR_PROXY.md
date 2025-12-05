# 🔍 Como Verificar se o Proxy Está Funcionando

## ✅ Configuração Atual

- ✅ `proxy.conf.json` existe e está configurado
- ✅ `angular.json` tem proxyConfig configurado
- ✅ `package.json` atualizado com flag explícita
- ✅ `environment.development.ts` com domain vazio

## 🧪 Teste 1: Verificar no DevTools

1. Abra o navegador em `http://localhost:4200`
2. Abra DevTools (F12)
3. Vá na aba **Network**
4. Tente fazer login
5. **Verifique:**
   - A requisição deve aparecer como `/rest/api/oauth2/v1/token` (caminho relativo)
   - Clique na requisição e veja:
     - **Request URL:** deve ser `http://localhost:4200/rest/api/oauth2/v1/token`
     - **Remote Address:** deve mostrar o IP `192.168.1.97:8090` (se o proxy funcionou)
     - **Status:** deve ser 200 (sucesso) ou outro código, mas **NÃO** deve ser erro de SSL

## 🧪 Teste 2: Verificar Erro SSL

Se o proxy **NÃO** estiver funcionando:
- ❌ Você verá erro: `ERR_CERT_COMMON_NAME_INVALID` ou `net::ERR_CERT_AUTHORITY_INVALID`
- ❌ A requisição falhará antes de chegar ao servidor

Se o proxy **ESTIVER** funcionando:
- ✅ Não haverá erro de certificado SSL
- ✅ A requisição será redirecionada pelo proxy

## 🧪 Teste 3: Verificar Logs do Console

No terminal onde o `ng serve` está rodando, quando você fizer uma requisição, pode aparecer:
```
[HPM] GET /rest/api/oauth2/v1/token -> https://192.168.1.97:8090
```

## 🔧 Se o Proxy Não Estiver Funcionando

### Opção 1: Reiniciar com flag explícita

```powershell
# Pare o servidor (Ctrl+C)
ng serve --proxy-config proxy.conf.json
```

### Opção 2: Verificar se o arquivo está no lugar certo

O `proxy.conf.json` deve estar na **raiz do projeto** (mesmo nível do `package.json`)

### Opção 3: Verificar sintaxe do JSON

```powershell
# Testar se o JSON é válido
Get-Content proxy.conf.json | ConvertFrom-Json
```

Se der erro, o JSON está inválido.

### Opção 4: Usar proxy.conf.js (alternativa)

Se o JSON não funcionar, podemos criar um arquivo JavaScript:

```javascript
// proxy.conf.js
const PROXY_CONFIG = {
  "/rest": {
    "target": "https://192.168.1.97:8090",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "rejectUnauthorized": false
  }
};

module.exports = PROXY_CONFIG;
```

E atualizar `angular.json`:
```json
"proxyConfig": "proxy.conf.js"
```

## 📝 Nota Importante

**O Angular pode não mostrar a mensagem do proxy no console**, mas isso **não significa que não está funcionando**. A melhor forma de verificar é:

1. ✅ Fazer uma requisição
2. ✅ Verificar no DevTools se não há erro SSL
3. ✅ Verificar se a requisição foi bem-sucedida

---

**Última atualização:** 2025-12-05

