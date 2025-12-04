import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Interceptor que adiciona o header X-Custon-Token com o JWT do fornecedor
 * em requisições para endpoints protegidos da API de fornecedores
 */
@Injectable()
export class FornecedorTokenInterceptor implements HttpInterceptor {

  private readonly FORNECEDOR_JWT_KEY = 'fornecedor_jwt';
  private readonly BRASPINE_DOC_FORNE_ENDPOINT = 'BRASPINE_DOC_FORNE';

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verificar se a requisição é para endpoints protegidos da API de fornecedores
    const isFornecedorEndpoint = request.url.includes(this.BRASPINE_DOC_FORNE_ENDPOINT) &&
                                  request.url.includes('/docforne'); // Apenas endpoint protegido

    if (isFornecedorEndpoint) {
      // Obter token JWT do fornecedor do localStorage
      const fornecedorToken = localStorage.getItem(this.FORNECEDOR_JWT_KEY);

      if (fornecedorToken) {
        // Adicionar header X-Custon-Token com o token JWT do fornecedor
        request = request.clone({
          setHeaders: {
            'X-Custon-Token': `Bearer ${fornecedorToken}`
          }
        });
      }
    }

    return next.handle(request);
  }
}

