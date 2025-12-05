import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';
import { PoNotificationService } from '@po-ui/ng-components';
import { SecurityUtil } from '../utils/security.util';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private readonly FORNECEDOR_JWT_KEY = 'fornecedor_jwt';
    private readonly FORNECEDOR_CNPJ_KEY = 'fornecedor_cnpjraiz';

    constructor(
        private authenticationService: AuthenticationService,
        private msg: PoNotificationService,
        private router: Router
    ) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // Verificar se é erro relacionado a token JWT ou X-Custon-Token
            const errorMessage = err?.error?.fault?.faultstring || 
                                 err?.error?.message || 
                                 err?.error?.errorMessage || 
                                 '';
            
            const isTokenError = this.isTokenRelatedError(errorMessage);
            const isFornecedorEndpoint = request.url.includes('BRASPINE_DOC_FORNE');

            // Se for erro 401 ou erro relacionado a token em endpoints de fornecedor
            if (err.status === 401 || (isTokenError && isFornecedorEndpoint)) {
                // Limpar token e CNPJ do fornecedor do localStorage
                localStorage.removeItem(this.FORNECEDOR_JWT_KEY);
                localStorage.removeItem(this.FORNECEDOR_CNPJ_KEY);
                
                // Logout do sistema (token Protheus)
                this.authenticationService.logout();
                
                // Corrigir encoding e tornar mensagem mais amigável
                const friendlyMessage = SecurityUtil.getFriendlyErrorMessage(errorMessage || "Token inválido ou expirado. Por favor, faça login novamente.");
                // Erros de token são críticos - usar error (não fecha automaticamente)
                this.msg.error({ message: friendlyMessage });
                
                // Redirecionar para login
                this.router.navigate(['/']);
            }

            // Para outros erros, relance o objeto de erro original (err)
            // para que outros catchError possam inspecioná-lo completamente.
            return throwError(() => err);
        }))
    }

    /**
     * Verifica se a mensagem de erro está relacionada a problemas com token JWT ou X-Custon-Token
     */
    private isTokenRelatedError(errorMessage: string): boolean {
        if (!errorMessage) return false;
        
        const errorLower = errorMessage.toLowerCase();
        const tokenErrorKeywords = [
            'x-custon-token',
            'token jwt',
            'token do fornecedor',
            'token inválido',
            'token expirado',
            'token corrompido',
            'token não informado',
            'formato de x-custon-token'
        ];

        return tokenErrorKeywords.some(keyword => errorLower.includes(keyword));
    }
}
