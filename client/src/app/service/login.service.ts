import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../Task';
import { HttpClient } from "@angular/common/http";
import {Router} from "@angular/router"
import { server } from '../Backend';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  base_url = server.base_url;

  constructor(public http: HttpClient,private router: Router) {     
    if (localStorage.getItem("token") !== null) {
    this.router.navigate(['/home'])
  }}

  setLoginToken(data:any){
    localStorage.setItem("token", data);
    this.router.navigate(['/home'])
  }

  register(username: string, password: string) : Observable<any>{
    const body = { "username": username,"password": password };
    return this.http.post(this.base_url + "api/Register",body);
  }

  login(username: string, password: string) : Observable<any>{
    const body = { "username": username,"password": password };
    return this.http.post(this.base_url + "api/Login",body)
  }

}
