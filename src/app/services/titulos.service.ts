import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PoTableColumn } from '@po-ui/ng-components';
import { Observable, catchError, pipe, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TitulosService {

  private domain: string | undefined;
  private endpoint = '/rest/BRASPINE_DOC_FORNE/docforne';

  constructor(private http: HttpClient) {
    this.domain = environment.domain;
  }

  getColumns(): Array<PoTableColumn> {
    return [
      { property: 'empresa', label: 'Empresa', type: 'string', width: '80px' },
      { property: 'cnpj', label: 'CNPJ', type: 'string', width: '80px' },
      { property: 'documento', label: 'Documento', type: 'string', width: '60px' },
      { property: 'parcela', label: 'Parcela', type: 'string', width: '60px' },
      { property: 'emissao', label: 'Emissão', type: 'string', width: '60px' },
      { property: 'valor', label: 'Valor', type: 'string', format: 'BRL' , width: '60px' },
      { property: 'situacao', label: 'Situação', type: 'string', width: '60px' },
      { property: 'programacao', label: 'Programação', type: 'string', width: '60px' },

    ];
  }



  buscarTitulo( cnpj: string, empresa: string, situacao: string, dataIni: string, dataFim: string): Observable<any> {
    let headers = new HttpHeaders().set('tenantID', '02' + ',' + '020101');
    let params = new HttpParams()
                          .set('cCNPJraiz', cnpj)
                          .set('cEmpresa', empresa)
                          .set('cSituacao', situacao)
                          .set('cDataIni', dataIni)
                          .set('cDataFim', dataFim);
    let httpOptions = {
      headers: headers,
      params: params
    };

    return this.http.get<any>(`${this.domain}${this.endpoint}`, httpOptions).pipe(
        catchError(error => {
        // Return an observable with a user-facing error message.
        const errorMessage = error?.error?.fault?.faultstring || 
                             error?.error?.errorMessage || 
                             'Erro ao buscar títulos';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
