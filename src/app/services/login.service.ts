import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PoMenuItem, PoNotificationService } from '@po-ui/ng-components';
import { environment } from 'src/environments/environment';

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


  login(loginEvent: any) {
    //const headers = new HttpHeaders().set('tenantID', emp + ',' + filial);
    let headers = new HttpHeaders().set('tenantID', '02' + ',' + '020101');
    let params = new HttpParams()
                          .set('cCNPJraiz', loginEvent.login)
                          .set('cSenha', loginEvent.password);
    let httpOptions = {
      headers: headers,
      params: params
    };

    return this.http.post(`${this.domain}${this.endpointlogin }`, null, httpOptions)
    //não precisa do dominio porque esta usando as configuraçõe de proxy do arquivo proxy.conf.js
    //return this.http.post(`${this.endpointlogin }`, null, httpOptions)
      .pipe(
        catchError((error: any) => {
          console.error('-------- Login Service Error Diagnosis --------');
          console.error('Complete error object received:', error);
          console.error('---------------------------------------------');

          let errorMessage = 'Erro na comunicação com o servidor.';

          if (error && error.error && typeof error.error === 'object' && (error.error.message || error.error.errorMessage)) {
              errorMessage = error.error.message || error.error.errorMessage;
          }
          else if (error && error.error && typeof error.error === 'string') {
              try {
                  const parsedError = JSON.parse(error.error);
                  errorMessage = parsedError.message || parsedError.errorMessage || errorMessage;
              } catch (parseError) {
                  console.error('Failed to parse error.error string:', parseError);
                  errorMessage = error.message || errorMessage;
              }
          }
          else if (error && typeof error.responseText === 'string') {
              try {
                  console.warn('Workaround: Attempting to parse error.responseText');
                  const parsedError = JSON.parse(error.responseText);
                  errorMessage = parsedError.message || parsedError.errorMessage || errorMessage;
              } catch (parseError) {
                  console.error('Failed to parse error.responseText string:', parseError);
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
    //const headers = new HttpHeaders().set('tenantID', emp + ',' + filial);
    let headers = new HttpHeaders().set('tenantID', '02' + ',' + '020101');
    let params = new HttpParams()
                          .set('cCNPJraiz', raizcnpj);

    let httpOptions = {
      headers: headers,
      params: params
    };

    return this.http.post(`${this.domain}${this.endpointcadastro}`, null, httpOptions)
    //return this.http.post(`${this.endpointcadastro}`, null, httpOptions)
      .pipe(
        catchError(error => {
         // Return an observable with a user-facing error message.
          return throwError(() => new Error(error.error.errorMessage));
        })
      );
  }


}
