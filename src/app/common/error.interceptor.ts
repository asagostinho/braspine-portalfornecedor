import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { PoNotificationService } from '@po-ui/ng-components';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService,
                private msg: PoNotificationService
                 ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // auto logout if 401 response returned from api

                const error = "Token inválido ou expirado";
                this.authenticationService.logout();
                this.msg.error(error);
                this.msg.setDefaultDuration(3);
                //location.reload();

            }

            // Para outros erros, relance o objeto de erro original (err)
            // para que outros catchError possam inspecioná-lo completamente.
            return throwError(() => err);
        }))
    }
}
