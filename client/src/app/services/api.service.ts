import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private url = environment.apiUrl + "/exec";

  constructor(private http: HttpClient) {}

  execute(procedureName: string, parameters: any): Observable<any> {
    return this.http.post<any>(this.url, {
      procedureName: procedureName,
      parameters: parameters
    });
  }
}