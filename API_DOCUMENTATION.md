# API REST - Portal de Fornecedor Braspine

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação JWT](#autenticação-jwt)
3. [Headers Obrigatórios](#headers-obrigatórios)
4. [Endpoints](#endpoints)
5. [Fluxo de Requisições](#fluxo-de-requisições)
6. [Códigos de Status HTTP](#códigos-de-status-http)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos de Implementação](#exemplos-de-implementação)

---

## 🔍 Visão Geral

API REST desenvolvida em ADVPL/Protheus para consulta de títulos e notas de fornecedores. A API utiliza autenticação JWT stateless para garantir segurança nas requisições.

**Base URL:** `https://[seu-servidor-protheus]/rest/api/braspine_doc_forne`

**Content-Type:** `application/json`

---

## 🔐 Autenticação JWT

A API utiliza autenticação JWT stateless. O token é gerado no endpoint de login e deve ser enviado em todas as requisições subsequentes.

### Características do Token JWT

- **Algoritmo:** SHA512
- **Expiração:** 1 hora (3600 segundos)
- **Claims incluídos:**
  - `cnpjraiz`: Raiz do CNPJ do fornecedor
  - `codigo`: Código do fornecedor no sistema
  - `fornecedornome`: Nome do fornecedor
  - `periodomax`: Período máximo permitido para consulta
  - `iat`: Data/hora de emissão (timestamp)
  - `exp`: Data/hora de expiração (timestamp)

### Armazenamento do Token

O front-end deve armazenar o token JWT após o login bem-sucedido. Recomenda-se usar:
- `localStorage` para persistência entre sessões
- `sessionStorage` para sessão única

---

## 📤 Headers Obrigatórios

Todas as requisições devem incluir os seguintes headers:

### Headers Comuns

| Header | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `Content-Type` | String | Sim | `application/json` |
| `tenantid` | String | Sim | Formato: `[grupo_empresa],[filial]` (ex: `02,020201`) |
| `Authorization` | String | Sim | Token do Protheus: `Bearer <token_protheus>` |

### Header para JWT do Fornecedor

| Header | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `X-Custon-Token` | String | Sim* | JWT do fornecedor: `Bearer <jwt_fornecedor>` |

*Obrigatório apenas para endpoints protegidos (após login)

---

## 🛠️ Endpoints

### 1. POST /login

Realiza o login do fornecedor e retorna o token JWT para autenticação nas requisições subsequentes.

#### Request

**URL:** `/login`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
tenantid: 02,020201
Authorization: Bearer <token_protheus>
```

**Body:**
```json
{
  "cCNPJraiz": "55431315",
  "cSenha": "hash_sha256_da_senha"
}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cCNPJraiz` | String | Sim | Raiz do CNPJ (8 primeiros dígitos) |
| `cSenha` | String | Sim | Senha do fornecedor (hash SHA256 em maiúsculo) |

**Validações:**
- CNPJ raiz deve ter 8 dígitos
- Senha deve ser o hash SHA256 da senha cadastrada (em maiúsculo)
- Fornecedor deve estar cadastrado no sistema
- Fornecedor deve possuir senha cadastrada

#### Response

**Status:** `200 OK`

**Body (Sucesso):**
```json
{
  "cnpjraiz": "55431315",
  "fornecedornome": "FORNECEDOR EXEMPLO LTDA",
  "codigo": "000001",
  "periodomax": "12",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjbnBqcmFpeiI6IjU1NDMxMzE1IiwiY29kaWdvIjoiMDAwMDAxIiwicGVyaW9kb21heCI6IjEyIn0..."
}
```

**Campos de Resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cnpjraiz` | String | Raiz do CNPJ do fornecedor |
| `fornecedornome` | String | Nome do fornecedor |
| `codigo` | String | Código do fornecedor no sistema |
| `periodomax` | String | Período máximo (em meses) para consulta de títulos |
| `token` | String | Token JWT para autenticação nas próximas requisições |

**Status:** `400 Bad Request`

**Body (Erro):**
```json
{
  "fault": {
    "faultstring": "Senha ou CNPJ raiz informados inválidos"
  }
}
```

**Possíveis Erros:**
- `"Raiz do CNPJ do fornecedor não informado"`
- `"Senha ou CNPJ raiz informados inválidos"`
- `"Fornecedor não encontrado. Verifique a raiz do CNPJ e tente novamente!"`
- `"Fornecedor sem senha de acesso cadastrada. Clique em Esqueceu sua senha para gerar uma senha que sera enviada por email"`
- `"tenantId não informado"`
- `"Erro ao deserializar JSON do body da requisição"`

---

### 2. POST /cadastro

Gera ou reenvia a senha do fornecedor por e-mail.

#### Request

**URL:** `/cadastro`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
tenantid: 02,020201
Authorization: Bearer <token_protheus>
```

**Body:**
```json
{
  "cCNPJraiz": "55431315"
}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cCNPJraiz` | String | Sim | Raiz do CNPJ (8 primeiros dígitos) |

**Validações:**
- CNPJ raiz deve ter 8 dígitos
- Fornecedor deve estar cadastrado no sistema
- Fornecedor deve possuir e-mail cadastrado

#### Response

**Status:** `200 OK`

**Body (Sucesso):**
```json
{
  "mensagem": "Senha cadastrada com sucesso para os emails: ********nho@gmail.com, *******ato@exemplo.com.br"
}
```

**Campos de Resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `mensagem` | String | Mensagem de sucesso contendo os e-mails mascarados para onde a senha foi enviada |

**⚠️ Importante - Mascaramento de E-mails:**

Por questões de segurança, os e-mails retornados na mensagem são **mascarados** automaticamente:
- Os e-mails mantêm apenas os **últimos 3 caracteres** do nome (antes do @) visíveis
- O domínio completo permanece visível
- Exemplo: `asagostinho@gmail.com` → `********nho@gmail.com`
- Para e-mails curtos (3 caracteres ou menos), apenas o primeiro caractere é visível

**Exemplos de Mascaramento:**

| E-mail Original | E-mail Mascarado |
|----------------|------------------|
| `asagostinho@gmail.com` | `********nho@gmail.com` |
| `contato@exemplo.com.br` | `********ato@exemplo.com.br` |
| `admin@braspine.com.br` | `*****min@braspine.com.br` |
| `ab@gmail.com` | `a*@gmail.com` |

**Status:** `400 Bad Request`

**Body (Erro):**
```json
{
  "fault": {
    "faultstring": "O Fornecedor não encontrado. Entre em contato com departamento financeiro"
  }
}
```

**Possíveis Erros:**
- `"Raiz do CNPJ do fornecedor não informado"`
- `"O Fornecedor não encontrado. Entre em contato com departamento financeiro"`
- `"Fornecedor não possui email cadastrado. Entre em contato com departamento financeiro"`
- `"Erro ao gerar a senha do fornecedor"`
- `"Erro ao atualizar a senha do fornecedor"`

---

### 3. GET /docforne

Consulta títulos e notas do fornecedor com programação de pagamento.

#### Request

**URL:** `/docforne`

**Method:** `GET`

**Headers:**
```
Content-Type: application/json
tenantid: 02,020201
Authorization: Bearer <token_protheus>
X-Custon-Token: Bearer <jwt_fornecedor>
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cCNPJraiz` | String | Não* | Raiz do CNPJ (8 primeiros dígitos). Se informado, deve ser igual ao CNPJ do token JWT |
| `cEmpresa` | String | Não | Raiz do CNPJ da empresa (01203549=BRASPINE, 05265768=BRASLUMBER, 40220649=BRASFOREST). Se vazio, retorna todas |
| `cSituacao` | String | Não | Situação do título: `ABERTO` ou `PAGO`. Se vazio, retorna todos |
| `cDataIni` | String | Sim | Data inicial de emissão (formato: `YYYYMMDD`, ex: `20240101`) |
| `cDataFim` | String | Sim | Data final de emissão (formato: `YYYYMMDD`, ex: `20241231`) |

*Obrigatório apenas se não estiver no token JWT

**Validações:**
- Token JWT deve ser válido e não expirado
- Se `cCNPJraiz` for informado, deve ser igual ao CNPJ do token JWT
- `cDataIni` e `cDataFim` são obrigatórios
- Data inicial deve ser menor ou igual à data final
- Período entre datas não deve exceder o `periodomax` do token

#### Response

**Status:** `200 OK`

**Body (Sucesso):**
```json
{
  "cnpjraiz": "55431315",
  "fornecedornome": "FORNECEDOR EXEMPLO LTDA",
  "titulos": [
    {
      "empresa": "BRASPINE",
      "cnpj": "01203549000123",
      "documento": "000123456",
      "parcela": "001",
      "emissao": "01/01/2024",
      "valor": "10.000,00",
      "situacao": "ABERTO",
      "programacao": "15/01/2024"
    },
    {
      "empresa": "BRASLUMBER",
      "cnpj": "05265768000145",
      "documento": "INV-000789",
      "parcela": "001",
      "emissao": "05/02/2024",
      "valor": "5.500,00",
      "situacao": "PAGO",
      "programacao": "20/02/2024"
    }
  ]
}
```

**Campos de Resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cnpjraiz` | String | Raiz do CNPJ do fornecedor |
| `fornecedornome` | String | Nome do fornecedor |
| `titulos` | Array | Lista de títulos encontrados |

**Estrutura do Objeto Título:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `empresa` | String | Nome da empresa (BRASPINE, BRASLUMBER ou BRASFOREST) |
| `cnpj` | String | CNPJ completo da empresa |
| `documento` | String | Número do documento (pode ser NF, Invoice ou INV conforme o tipo) |
| `parcela` | String | Número da parcela |
| `emissao` | String | Data de emissão (formato: DD/MM/YYYY) |
| `valor` | String | Valor do título (formatado com separadores) |
| `situacao` | String | Situação: `ABERTO` ou `PAGO` |
| `programacao` | String | Data de vencimento/programação de pagamento (formato: DD/MM/YYYY) |

**Status:** `400 Bad Request`

**Body (Erro):**
```json
{
  "fault": {
    "faultstring": "Token JWT do fornecedor expirado"
  }
}
```

**Possíveis Erros:**
- `"X-Custon-Token não informado"`
- `"Formato de X-Custon-Token inválido. Utilize Bearer <token>."`
- `"Token JWT do fornecedor não informado"`
- `"Token JWT inválido ou corrompido"`
- `"Token JWT do fornecedor expirado"`
- `"CNPJ raiz informado diferente do CNPJ do token"`
- `"Obrigatório informar a data de emissão inicial e final"`
- `"Raiz do CNPJ do fornecedor não informado"`
- `"tenantId não informado"`

---

## 🔄 Fluxo de Requisições

### Fluxo Completo de Autenticação e Consulta

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 1. POST /login
       │    Headers: tenantid, Authorization (Protheus)
       │    Body: { cCNPJraiz, cSenha }
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Protheus) │
└──────┬──────┘
       │
       │ 2. Valida credenciais
       │    Gera JWT token
       │
       │ 3. Response 200 OK
       │    { cnpjraiz, fornecedornome, codigo, periodomax, token }
       │
       ▼
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 4. Armazena token JWT
       │    (localStorage/sessionStorage)
       │
       │ 5. GET /docforne
       │    Headers: 
       │      - tenantid
       │      - Authorization (Protheus)
       │      - X-Custon-Token: Bearer <jwt_fornecedor>
       │    Query: cDataIni, cDataFim, cEmpresa, cSituacao
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Protheus) │
└──────┬──────┘
       │
       │ 6. Valida token JWT
       │    Verifica expiração
       │    Consulta títulos
       │
       │ 7. Response 200 OK
       │    { cnpjraiz, fornecedornome, titulos[] }
       │
       ▼
┌─────────────┐
│   Frontend  │
│  (Exibe     │
│   dados)    │
└─────────────┘
```

### Fluxo de Recuperação de Senha

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 1. POST /cadastro
       │    Headers: tenantid, Authorization (Protheus)
       │    Body: { cCNPJraiz }
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Protheus) │
└──────┬──────┘
       │
       │ 2. Valida CNPJ
       │    Gera nova senha (se necessário)
       │    Envia e-mail com senha
       │    Mascara e-mails para resposta
       │
       │ 3. Response 200 OK
       │    { mensagem: "Senha cadastrada com sucesso para os emails: ********nho@gmail.com" }
       │
       ▼
┌─────────────┐
│   Frontend  │
│  (Exibe     │
│   confirmação)
└─────────────┘
```

---

## 📊 Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `200` | OK | Requisição bem-sucedida |
| `400` | Bad Request | Erro de validação, parâmetros inválidos ou token inválido |
| `401` | Unauthorized | Token JWT ausente, inválido ou expirado |
| `500` | Internal Server Error | Erro interno do servidor |

---

## ⚠️ Tratamento de Erros

### Estrutura de Erro

Todos os erros retornam no formato:

```json
{
  "fault": {
    "faultstring": "Mensagem de erro descritiva"
  }
}
```

### Tratamento Recomendado no Front-end

```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    // Erro retornado pela API
    if (data.fault && data.fault.faultstring) {
      throw new Error(data.fault.faultstring);
    }
    throw new Error('Erro desconhecido');
  }
  
  // Sucesso
  return data;
} catch (error) {
  // Tratar erro
  console.error('Erro na requisição:', error.message);
  // Exibir mensagem ao usuário
}
```

### Tratamento Específico - Endpoint /cadastro

O endpoint `/cadastro` retorna uma mensagem de sucesso com e-mails mascarados. Exemplo de tratamento:

```javascript
// Exemplo para endpoint /cadastro
const response = await fetch(`${API_URL}/cadastro`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'tenantid': '02,020201',
    'Authorization': `Bearer ${protheusToken}`
  },
  body: JSON.stringify({ cCNPJraiz: '55431315' })
});

const data = await response.json();

if (response.ok && data.mensagem) {
  // Exibir mensagem de sucesso com e-mails mascarados
  alert(data.mensagem);
  // Exemplo: "Senha cadastrada com sucesso para os emails: ********nho@gmail.com, *******ato@exemplo.com.br"
} else {
  // Tratar erro
  const errorMsg = data.fault?.faultstring || 'Erro ao cadastrar senha';
  alert(errorMsg);
}
```

### Erros Comuns e Ações

| Erro | Ação Recomendada |
|------|------------------|
| `Token JWT do fornecedor expirado` | Redirecionar para tela de login |
| `Token JWT inválido ou corrompido` | Limpar token armazenado e redirecionar para login |
| `X-Custon-Token não informado` | Verificar se o token foi armazenado após login |
| `CNPJ raiz informado diferente do CNPJ do token` | Usar o CNPJ do token ou não informar o parâmetro |
| `Obrigatório informar a data de emissão inicial e final` | Validar campos de data antes de enviar |

---

## 💻 Exemplos de Implementação

### Angular/TypeScript

#### Serviço de Autenticação

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FornecedorAuthService {
  private apiUrl = 'https://seu-servidor-protheus/rest/api/braspine_doc_forne';
  private tokenKey = 'fornecedor_jwt';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Carregar token salvo ao inicializar
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  login(cnpjRaiz: string, senha: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'tenantid': '02,020201',
      'Authorization': 'Bearer ' + this.getProtheusToken()
    });

    const body = {
      cCNPJraiz: cnpjRaiz,
      cSenha: senha.toUpperCase() // Hash SHA256 em maiúsculo
    };

    return this.http.post(`${this.apiUrl}/login`, body, { headers }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.currentUserSubject.next(response);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUserFromToken(token: string): void {
    // Decodificar token JWT (usar biblioteca jwt-decode)
    try {
      const payload = this.decodeToken(token);
      this.currentUserSubject.next(payload);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      this.logout();
    }
  }

  private decodeToken(token: string): any {
    // Usar biblioteca jwt-decode ou implementar decodificação base64
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  private getProtheusToken(): string {
    // Obter token do Protheus (pode vir de outro serviço ou configuração)
    return 'seu_token_protheus_aqui';
  }
}
```

#### Interceptor HTTP

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { FornecedorAuthService } from './fornecedor-auth.service';

@Injectable()
export class FornecedorTokenInterceptor implements HttpInterceptor {
  constructor(
    private authService: FornecedorAuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Aplicar apenas para endpoints da API de fornecedor
    if (req.url.includes('braspine_doc_forne')) {
      const token = this.authService.getToken();
      
      if (token) {
        const cloned = req.clone({
          setHeaders: {
            'X-Custon-Token': `Bearer ${token}`
          }
        });
        return next.handle(cloned).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 400 || error.status === 401) {
              const errorMsg = error.error?.fault?.faultstring || '';
              if (errorMsg.includes('expirado') || errorMsg.includes('inválido')) {
                this.authService.logout();
                this.router.navigate(['/login']);
              }
            }
            return throwError(error);
          })
        );
      }
    }
    
    return next.handle(req);
  }
}
```

#### Serviço de Consulta de Títulos

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Titulo {
  empresa: string;
  cnpj: string;
  documento: string;
  parcela: string;
  emissao: string;
  valor: string;
  situacao: string;
  programacao: string;
}

export interface TitulosResponse {
  cnpjraiz: string;
  fornecedornome: string;
  titulos: Titulo[];
}

@Injectable({
  providedIn: 'root'
})
export class TitulosService {
  private apiUrl = 'https://seu-servidor-protheus/rest/api/braspine_doc_forne';

  constructor(private http: HttpClient) {}

  consultarTitulos(params: {
    cCNPJraiz?: string;
    cEmpresa?: string;
    cSituacao?: 'ABERTO' | 'PAGO';
    cDataIni: string; // YYYYMMDD
    cDataFim: string; // YYYYMMDD
  }): Observable<TitulosResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'tenantid': '02,020201',
      'Authorization': 'Bearer ' + this.getProtheusToken()
    });

    let httpParams = new HttpParams();
    if (params.cCNPJraiz) httpParams = httpParams.set('cCNPJraiz', params.cCNPJraiz);
    if (params.cEmpresa) httpParams = httpParams.set('cEmpresa', params.cEmpresa);
    if (params.cSituacao) httpParams = httpParams.set('cSituacao', params.cSituacao);
    httpParams = httpParams.set('cDataIni', params.cDataIni);
    httpParams = httpParams.set('cDataFim', params.cDataFim);

    return this.http.get<TitulosResponse>(`${this.apiUrl}/docforne`, {
      headers,
      params: httpParams
    });
  }

  private getProtheusToken(): string {
    return 'seu_token_protheus_aqui';
  }
}
```

#### Componente de Login

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FornecedorAuthService } from './fornecedor-auth.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: FornecedorAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      cnpjRaiz: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      senha: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { cnpjRaiz, senha } = this.loginForm.value;
      
      // Gerar hash SHA256 da senha em maiúsculo
      const senhaHash = CryptoJS.SHA256(senha).toString().toUpperCase();
      
      this.authService.login(cnpjRaiz, senhaHash).subscribe({
        next: (response) => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage = error.error?.fault?.faultstring || 'Erro ao realizar login';
        }
      });
    }
  }
}
```

### React/JavaScript

#### Hook de Autenticação

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = 'https://seu-servidor-protheus/rest/api/braspine_doc_forne';
const TOKEN_KEY = 'fornecedor_jwt';

export const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const payload = decodeToken(token);
        setUser(payload);
      } catch (error) {
        logout();
      }
    }
  }, [token]);

  const login = async (cnpjRaiz, senha) => {
    setLoading(true);
    try {
      const senhaHash = CryptoJS.SHA256(senha).toString().toUpperCase();
      
      const response = await axios.post(`${API_URL}/login`, {
        cCNPJraiz: cnpjRaiz,
        cSenha: senhaHash
      }, {
        headers: {
          'Content-Type': 'application/json',
          'tenantid': '02,020201',
          'Authorization': `Bearer ${getProtheusToken()}`
        }
      });

      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        setToken(response.data.token);
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      throw new Error(error.response?.data?.fault?.faultstring || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const decodeToken = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  };

  const getProtheusToken = () => {
    return 'seu_token_protheus_aqui';
  };

  return { token, user, loading, login, logout, isAuthenticated: !!token };
};
```

#### Interceptor Axios

```javascript
import axios from 'axios';

const API_URL = 'https://seu-servidor-protheus/rest/api/braspine_doc_forne';

// Interceptor para adicionar token JWT
axios.interceptors.request.use(
  (config) => {
    if (config.url.includes('braspine_doc_forne')) {
      const token = localStorage.getItem('fornecedor_jwt');
      if (token) {
        config.headers['X-Custon-Token'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400 || error.response?.status === 401) {
      const errorMsg = error.response?.data?.fault?.faultstring || '';
      if (errorMsg.includes('expirado') || errorMsg.includes('inválido')) {
        localStorage.removeItem('fornecedor_jwt');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 📝 Notas Importantes

### Segurança

1. **Nunca armazene a senha em texto plano** - sempre use hash SHA256
2. **Valide o token JWT antes de cada requisição** - verifique expiração
3. **Use HTTPS** em produção para proteger os dados em trânsito
4. **Implemente rate limiting** no front-end para evitar requisições excessivas
5. **E-mails mascarados** - O endpoint `/cadastro` retorna e-mails mascarados por segurança:
   - Apenas os últimos 3 caracteres do nome do e-mail são visíveis
   - O domínio completo permanece visível para identificação
   - Exemplo: `asagostinho@gmail.com` → `********nho@gmail.com`

### Performance

1. **Cache do token JWT** - evite decodificar múltiplas vezes
2. **Paginação** - considere implementar se houver muitos títulos
3. **Debounce** - use em campos de busca/filtro

### Validações no Front-end

Antes de enviar requisições, valide:
- Formato do CNPJ raiz (8 dígitos)
- Formato das datas (YYYYMMDD)
- Data inicial <= Data final
- Período não excede o `periodomax` do token

---

## 📞 Suporte

Para dúvidas ou problemas com a API, entre em contato com o departamento de TI.

**Versão da Documentação:** 1.1  
**Última Atualização:** 04/12/2025

**Changelog:**
- v1.1 (04/12/2025): Atualizado endpoint `/cadastro` para retornar mensagem única com e-mails mascarados por segurança
- v1.0 (15/01/2025): Versão inicial da documentação

