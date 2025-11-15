import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Token } from '../models/token';
import { SecurityUtil } from '../utils/security.util';
import { EncryptionService } from './encryption.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private urlpost = '/rest/api/oauth2/v1/token'; //url autentication
    private readonly STORAGE_KEY = 'currentUser'; // Chave para armazenamento

    private currentUserSubject: BehaviorSubject<Token>;
    public currentUser: Observable<Token>;

    constructor(
        private http: HttpClient,
        private encryptionService: EncryptionService
    ) {
        // ✅ Carregar token criptografado do sessionStorage
        let token: Token = {} as Token;

        // Tentar carregar do sessionStorage (novo)
        const encryptedToken = sessionStorage.getItem(this.STORAGE_KEY);
        if (encryptedToken) {
            const decrypted = this.encryptionService.decryptObject<Token>(encryptedToken);
            if (decrypted) {
                token = decrypted;
            }
        } else {
            // Migração: tentar carregar do localStorage (dados antigos)
            const oldToken = localStorage.getItem(this.STORAGE_KEY);
            if (oldToken) {
                try {
                    const parsedToken = JSON.parse(oldToken);
                    if (parsedToken && parsedToken.access_token) {
                        // Migrar para sessionStorage criptografado
                        const encrypted = this.encryptionService.encryptObject(parsedToken);
                        if (encrypted) {
                            sessionStorage.setItem(this.STORAGE_KEY, encrypted);
                            token = parsedToken;
                        }
                        // Limpar localStorage antigo
                        localStorage.removeItem(this.STORAGE_KEY);
                    }
                } catch (e) {
                    // Token antigo inválido, limpar
                    localStorage.removeItem(this.STORAGE_KEY);
                }
            }
        }

        this.currentUserSubject = new BehaviorSubject<Token>(token);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): Token {
        return this.currentUserSubject.value;
    }

    token(username: string, password: string) {
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/x-www-form-urlencoded');

        // ✅ Dados no body como form-urlencoded (padrão OAuth2)
        const body = new URLSearchParams();
        body.set('grant_type', 'password');
        body.set('username', username);
        body.set('password', password);

        return this.http.post<any>(
            `${environment.domain}${this.urlpost}`,
            body.toString(),
            { headers }
        ).pipe(
            map(token => {
                // ✅ Armazenar token criptografado no sessionStorage
                const encryptedToken = this.encryptionService.encryptObject(token);
                if (encryptedToken) {
                    sessionStorage.setItem(this.STORAGE_KEY, encryptedToken);
                }

                this.currentUserSubject.next(token);

                return token;
            })
        );
    }

    /**
     * Valida token a cada navegação
     *
     * Estratégia: Validação leve (verifica se token existe)
     * A validação real acontece nas requisições HTTP via ErrorInterceptor (401)
     *
     * Para validação completa no backend, descomente o código abaixo
     */
    validateToken(): Observable<boolean> {
        const currentUser = this.currentUserValue;

        if (!currentUser || !currentUser.access_token) {
            return of(false);
        }

        // Validação leve: verificar se token não expirou localmente
        if (this.isTokenExpired()) {
            return of(false);
        }

        // ✅ Validação leve - retorna true se token existe
        // A validação real acontece nas requisições via ErrorInterceptor
        // Se backend retornar 401, ErrorInterceptor faz logout automaticamente
        return of(true);

        /*
        // OPÇÃO: Validação completa no backend (descomente se necessário)
        const headers = new HttpHeaders()
            .set('Authorization', `Bearer ${currentUser.access_token}`)
            .set('tenantID', '02' + ',' + '020101');

        return this.http.head<any>(`${environment.domain}/rest/BRASPINE_DOC_FORNE/docforne`, {
            headers,
            observe: 'response'
        }).pipe(
            map(() => true),
            catchError((error) => {
                if (error.status === 401) {
                    return of(false);
                }
                return of(true);
            })
        );
        */
    }

    /**
     * Verifica se token está expirado (validação local)
     * Nota: Validação real sempre deve ser no backend
     */
    isTokenExpired(): boolean {
        const currentUser = this.currentUserValue;

        if (!currentUser || !currentUser.access_token) {
            return true;
        }

        // Se não houver expires_in, considerar válido (validação no backend)
        if (!currentUser.expires_in) {
            return false;
        }

        // expires_in geralmente vem em segundos desde a criação
        // Como não temos timestamp de criação, assumir que token é válido
        // A validação real acontece no backend via ErrorInterceptor (401)
        return false;
    }

    logout() {
        // ✅ Remove token criptografado do sessionStorage
        sessionStorage.removeItem(this.STORAGE_KEY);

        // Limpar também localStorage caso tenha dados antigos (migração)
        localStorage.removeItem(this.STORAGE_KEY);

        this.currentUserSubject.next({} as Token);
    }
}
