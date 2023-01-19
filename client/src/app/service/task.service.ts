import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../Task';
import { API_LINK } from '../Backend';
import { HttpClient } from "@angular/common/http";
import {Router} from "@angular/router"

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  
  base_url = API_LINK.base_url;

  constructor(public http: HttpClient,private router: Router) {
    
  }

  isLoggedIn(){
    return localStorage.getItem('token') != null;
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getHttpHeader(){
    return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
  }

  getTasks(): Observable<Task[]> {
    const headers = this.getHttpHeader();
    return this.http.get<Task[]>(this.base_url + "api/Tasks", { headers });
  }

  deleteTask(id?: number): Observable<any> {
    const headers = this.getHttpHeader();
    return this.http.delete( this.base_url + "api/Tasks/" + id, { headers });
  }

  updateTask(task: Task): Observable<any> {
    const headers = this.getHttpHeader();
    return this.http.put(this.base_url + "api/Tasks/" + task.Id, task, { headers });
  }
  
  removeAllTask(): Observable<any>{
    const headers = this.getHttpHeader();
    return this.http.delete(this.base_url + "api/Tasks", { headers });
  }

  getServerStatus(): Observable<any>{
    const headers = this.getHttpHeader();
    return this.http.get(this.base_url + "api/Tasks/PingServer", { headers ,responseType: 'text'});
  }

  addTask(task: Task): Observable<any> {
    const headers = this.getHttpHeader();
    return this.http.post(this.base_url + "api/Tasks", task, { headers ,responseType: 'text'});
  }
}
