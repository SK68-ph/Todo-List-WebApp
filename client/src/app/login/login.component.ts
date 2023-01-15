import { Observable } from 'rxjs';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoadingService } from '../service/loading.service';
import { LoginService } from '../service/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loading$ = this.loader.loading$;
  // @ts-ignore
  @ViewChild('username', { static: true }) username: ElementRef; // @ts-ignore
  @ViewChild('password', { static: true }) password: ElementRef;
  errorMsg:string = '';
  isRegistration = false;
  isLoginError = false;
  isRegisterError = false;
  btnLoginActive = false;
  btnRegisterActive = false;

  constructor(private loginService: LoginService,public loader: LoadingService) {
  }

  ngOnInit(): void {
  }
  
  isStringValid(s:string) {
    return /^[\sa-zA-Z0-9]+$/g.test(s);
  }

  onSubmit(){
    this.isRegistration ? this.registerUser() : this.loginUser();
  }

  showRegisterForm() {
    this.isRegistration = !this.isRegistration;
    return this.isRegistration;
  }


  onInputKeyUp() {
    if (this.username.nativeElement.value.length >= 5 && this.password.nativeElement.value.length >= 5 && this.isStringValid(this.username.nativeElement.value) && this.isStringValid(this.password.nativeElement.value)) {
      this.btnLoginActive = true
      this.btnRegisterActive = true
    }
    else{
      this.btnLoginActive = false
      this.btnRegisterActive = false
    }
  }

  registerUser() {
    this.loader.show();
    this.isRegisterError = false;

    this.loginService
      .register(
        this.username.nativeElement.value,
        this.password.nativeElement.value
      )
      .subscribe(
        (data) => {
          this.loginUser();
        },
        (err) => {
          this.isLoginError = true;
          this.errorMsg = err.error;
          this.loader.hide();

        },
        () => {
          this.loader.hide();
        }
      );
  }
// add client input validation
  loginUser() {
    this.loader.show();
    this.isLoginError = false;

    const user = this.username.nativeElement.value;
    const pass = this.password.nativeElement.value;

    this.loginService
      .login(
        user,
        pass
      )
      .subscribe(
        (data) => {
          this.loginService.setLoginToken(data);
          console.log(data);
        },
        (err) => {
          this.isLoginError = true;
          this.errorMsg = err.error;
          this.loader.hide();
        },
        () => {
          this.loader.hide();
        }
      );
  }
}
