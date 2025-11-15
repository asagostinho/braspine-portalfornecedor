import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { Token } from '@angular/compiler';
import { LoginSuccessData } from './login/login.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public cnpj = '';
  public maxperiodo: string = '3';
  title = 'Consulta Documentos do Fornecedor ';
  currentUser!: Token;
  isLogged = false;
  fornecedornome: string = '';

  router: Router;

  constructor(
    private authenticationService: AuthenticationService,
    router: Router
  ) {
    this.router = router;
    this.authenticationService.currentUser.subscribe((x: any) => {
      this.currentUser = x;
      this.isLogged = !!(x && x.access_token);
    });
  }

  ngOnInit() {
    // ✅ Validar token a cada navegação
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isLogged) {
        this.validateTokenOnNavigation();
      }
    });

    // Verificar se já está logado ao iniciar
    this.checkInitialAuth();
  }

  /**
   * Valida token a cada navegação
   */
  private validateTokenOnNavigation(): void {
    this.authenticationService.validateToken().subscribe(isValid => {
      if (!isValid) {
        // Token inválido - fazer logout
        this.authenticationService.logout();
        this.isLogged = false;
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Verifica autenticação inicial
   */
  private checkInitialAuth(): void {
    const currentUser = this.authenticationService.currentUserValue;
    if (currentUser && currentUser.access_token) {
      // Validar token ao iniciar
      this.authenticationService.validateToken().subscribe(isValid => {
        if (isValid) {
          this.isLogged = true;
        } else {
          this.authenticationService.logout();
          this.isLogged = false;
        }
      });
    }
  }

  onLoginSuccess(loginData: LoginSuccessData): void {
    this.cnpj = loginData.cnpj;
    this.fornecedornome = loginData.fornecedornome;
    this.maxperiodo = loginData.maxperiodo;
    this.isLogged = true;
    this.title += loginData.fornecedornome;

    // Navegar para rota protegida após login
    this.router.navigate(['/titulos']);
  }
}
