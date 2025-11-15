import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PoMenuItem, PoNotificationService } from '@po-ui/ng-components';
import { environment } from 'src/environments/environment';
import { SecurityUtil } from '../utils/security.util';

export interface UserInfo {
  id: string;
  nome: string;
  empresa: string;
  filial: string;
}

@Injectable({
  providedIn: 'root'
})

export class LoginService {

  private domain: string | undefined;

  private endpointlogin = '/rest/BRASPINE_DOC_FORNE/login'
  private endpointcadastro = '/rest/BRASPINE_DOC_FORNE/cadastro'

  constructor(
    private http: HttpClient,
    private msg: PoNotificationService) {
      this.domain = environment.domain;   //busca dominio nas variveis de ambiente

    }


  login(loginEvent: any, recaptchaToken?: string) {
    // Headers com Content-Type para JSON
    let headers = new HttpHeaders()
      .set('tenantID', '02' + ',' + '020101')
      .set('Content-Type', 'application/json');

    // ✅ Dados sensíveis no BODY, não na URL (mais seguro)
    const body = {
      cCNPJraiz: loginEvent.login,
      cSenha: loginEvent.password,
      recaptchaToken: recaptchaToken || null
    };

    return this.http.post(`${this.domain}${this.endpointlogin}`, body, { headers })
      .pipe(
        catchError((error: any) => {

          let errorMessage = 'Erro na comunicação com o servidor.';

          if (error && error.error && typeof error.error === 'object' && (error.error.message || error.error.errorMessage)) {
              errorMessage = error.error.message || error.error.errorMessage;
          }
          else if (error && error.error && typeof error.error === 'string') {
              try {
                  const parsedError = JSON.parse(error.error);
                  errorMessage = parsedError.message || parsedError.errorMessage || errorMessage;
              } catch (parseError) {
                  errorMessage = error.message || errorMessage;
              }
          }
          else if (error && typeof error.responseText === 'string') {
              try {
                  const parsedError = JSON.parse(error.responseText);
                  errorMessage = parsedError.message || parsedError.errorMessage || errorMessage;
              } catch (parseError) {
                  errorMessage = error.message || errorMessage;
              }
          }
          else if (error && error.message) {
              errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  cadastrar(raizcnpj: string): Observable<any> {
    // Headers com Content-Type para JSON
    let headers = new HttpHeaders()
      .set('tenantID', '02' + ',' + '020101')
      .set('Content-Type', 'application/json');

    // ✅ Dados no body ao invés de query params
    const body = {
      cCNPJraiz: raizcnpj
    };

    return this.http.post(`${this.domain}${this.endpointcadastro}`, body, { headers })
      .pipe(
        catchError(error => {
          return throwError(() => new Error(error.error?.errorMessage || 'Erro ao cadastrar'));
        })
      );
  }


}
