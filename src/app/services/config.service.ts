import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ConfigService {

constructor(private http: HttpClient) {}
 // Method to fetch the configuration JSON file

getConfig(): Observable<any> {

    const data = this.http.get('assets/config.json');
    return this.http.get('assets/config.json');
  }


}
