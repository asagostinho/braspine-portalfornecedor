import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SecurityUtil } from '../utils/security.util';

/**
 * Interceptor que sanitiza logs e remove dados sensíveis do console
 */
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Em produção, não logar requisições com dados sensíveis
    if (SecurityUtil.isProduction()) {
      return next.handle(req);
    }

    // Em desenvolvimento, logar de forma sanitizada
    const sanitizedUrl = SecurityUtil.sanitizeUrl(req.url);
    const sanitizedBody = req.body ? SecurityUtil.maskSensitiveData(req.body) : null;
    const sanitizedParams = req.params ? SecurityUtil.maskSensitiveData(req.params) : null;

    SecurityUtil.safeLog('HTTP Request:', {
      url: sanitizedUrl,
      method: req.method,
      body: sanitizedBody,
      params: sanitizedParams
    });

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          // Logar resposta de forma sanitizada
          if (event.type === 4) { // HttpResponse
            SecurityUtil.safeLog('HTTP Response recebida (dados sensíveis ocultos)');
          }
        },
        error: (error) => {
          // Logar erro sem expor dados sensíveis
          SecurityUtil.safeLog('HTTP Error:', {
            status: error.status,
            message: error.message
          });
        }
      })
    );
  }
}

