import { Component, EventEmitter, Output, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { LoginService } from '../services/login.service';
import { PoLanguage, PoNotificationService, PoDialogService } from '@po-ui/ng-components';
import { PoPageLoginLiterals } from '@po-ui/ng-templates';
import { first } from 'rxjs';
import { Email } from '../interface/email';
import { ConfigService } from '../services/config.service';
import { AuthenticationService } from '../services/authentication.service';
import { environment } from '../../environments/environment';

export interface LoginSuccessData {
  cnpj: string;
  fornecedornome: string;
  maxperiodo: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [PoNotificationService]
})
export class LoginComponent implements AfterViewInit {

  @Output() loginSuccess = new EventEmitter<LoginSuccessData>();

  environment = environment;

  linguageList: Array<PoLanguage> = [];
  loading: boolean = false;
  loginErrors: Array<string> = [];
  passwordErrors: Array<string> = [];
  customLiterals: PoPageLoginLiterals = {
    welcome: 'Bem vindo Fornecedor',
    loginPlaceholder: 'Insira a raiz do CNPJ ( somente os 8 primeiros números )',
    passwordPlaceholder: 'Insira sua senha de acesso',
    submitLabel: 'Acessar sistema',
    loginHint: 'Caso não possua usuário entre em contato com o departamento financeiro',
    loginErrorPattern: 'Informar apenas números',
  };
  listemail: Array<Email> = [];
  mensagem: string = ' ';
  raizcnpj: string = ' ';
  recaptchaToken: string = '';
  pendingLoginData: any = null;
  config: any;
  fornecedornome: string = '';

  constructor(
    private loginService: LoginService,
    private msg: PoNotificationService,
    private poDialog: PoDialogService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    this.configService.getConfig().subscribe((data: any) => {
      if (data.userapi) {
        this.config = data.userapi;
      }
    }, (error) => {
      // Erro ao carregar configuração - silencioso
    });
  }

  ngAfterViewInit() {
    // Tenta encontrar o input de login dentro do po-page-login após a view ser inicializada
    try {
      const loginInput = this.el.nativeElement.querySelector('po-page-login input[name="login"]');
      if (loginInput) {
        this.renderer.setAttribute(loginInput, 'maxlength', '8');
      }
    } catch (e) {
      // Erro ao definir maxlength - não crítico, ignorar
    }
  }

  onLoginSubmit(formData: any) {
    // Armazena os dados do formulário
    this.pendingLoginData = formData;

    // Se já tem token do reCAPTCHA, executa login imediatamente
    if (this.recaptchaToken) {
      this.login(formData, this.recaptchaToken);
    } else {
      // Caso contrário, aguarda o usuário resolver o reCAPTCHA
      this.msg.warning('Por favor, complete a verificação reCAPTCHA antes de fazer login.');
    }
  }

  onRecaptchaResolved(captchaResponse: string | null): void {
    if (captchaResponse) {
      this.recaptchaToken = captchaResponse;

      // Se há dados de login pendentes, executa o login
      if (this.pendingLoginData) {
        this.login(this.pendingLoginData, this.recaptchaToken);
        this.pendingLoginData = null;
      }
    } else {
      // Token foi resetado (usuário desmarcou o reCAPTCHA)
      this.recaptchaToken = '';
    }
  }

  onRecaptchaError(error: any): void {
    this.recaptchaToken = '';
    this.msg.error('Erro ao carregar reCAPTCHA. Por favor, recarregue a página.');
  }

  async login(formData: any, recaptchaToken: string) {
    this.loading = true;

    this.authenticationService.token(this.config.login, this.config.password).pipe(first())
      .subscribe(
        data => {
          this.loginService.login(formData, recaptchaToken).subscribe((response: any) => {
            const loginData: LoginSuccessData = {
              cnpj: response.cnpjraiz,
              fornecedornome: response.fornecedornome,
              maxperiodo: response.periodomax
            };

            this.loading = false;
            this.recaptchaToken = ''; // Limpa token após login bem-sucedido
            this.msg.success('Login efetuado com sucesso!');

            // Emite evento de sucesso para o componente pai
            this.loginSuccess.emit(loginData);
          },
            error => {
              let errorMessage = 'Erro desconhecido ao tentar fazer login.';
              if (error && error.error && (error.error.message || error.error.errorMessage)) {
                errorMessage = error.error.message || error.error.errorMessage;
              } else if (error && error.message) {
                errorMessage = error.message;
              }

              // Tenta corrigir problema de encoding (UTF-8 exibido como Latin-1)
              try {
                let correctedMessage = decodeURIComponent(escape(errorMessage));
                errorMessage = correctedMessage;
              } catch (e) {
                // Erro ao corrigir encoding - usar mensagem original
              }

              this.msg.error({ message: errorMessage, duration: 5000 });
              this.loading = false;
              this.recaptchaToken = ''; // Limpa token em caso de erro para forçar novo reCAPTCHA
            });
        },
        (error: any) => {
          const errorMessage = error?.message || 'Erro de autenticação. Verifique suas credenciais ou tente novamente.';
          this.msg.error(errorMessage);
          this.msg.setDefaultDuration(3);
          this.loading = false;
          this.recaptchaToken = ''; // Limpa token em caso de erro
        }
      );
  }

  public cadastrarSenha() {
    this.loading = true;

    if (this.raizcnpj.trim()) {
      this.loginService.cadastrar(this.raizcnpj).subscribe((response: any) => {
        this.listemail = response.listemail;
        this.fornecedornome = response.fornecedornome;

        this.mensagem = `Senha cadastrada com sucesso para o fornecedor ${this.fornecedornome} `;
        this.mensagem += "</br> ";
        this.mensagem += "A senha foi enviado para os seguintes emails : ";

        this.listemail.forEach(item => {
          this.mensagem += `</br>&nbsp;&nbsp;&nbsp;&nbsp; ${item.email.toLowerCase()}`;
        });

        this.poDialog.alert({
          ok: () => (this.loading = false),
          title: 'Cadastro de Senha',
          message: this.mensagem
        });
      },
        (error: any) => {
          if (error.message) {
            this.msg.error(error.message);
            this.msg.setDefaultDuration(3);
          }
          this.loading = false;
        }
      );
    } else {
      this.msg.error("Obrigatório informar a raiz do CNPJ ( somente os 8 primeiros números ) !");
      this.loading = false;
    }
  }

  passwordChange() {
    if (this.passwordErrors.length) {
      this.passwordErrors = [];
    }
  }

  loginChange(event: any) {
    this.raizcnpj = event;
    if (this.loginErrors.length) {
      this.loginErrors = [];
    }
  }
}

