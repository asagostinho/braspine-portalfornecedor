import { Component, EventEmitter, Output, AfterViewInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { PoLanguage, PoNotificationService, PoDialogService } from '@po-ui/ng-components';
import { PoPageLoginLiterals } from '@po-ui/ng-templates';
import { first } from 'rxjs';
import { Email } from '../interface/email';
import { ConfigService } from '../services/config.service';
import { AuthenticationService } from '../services/authentication.service';
import { SecurityUtil } from '../utils/security.util';
import { environment } from '../../environments/environment';
import { RecaptchaComponent } from 'ng-recaptcha';

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
  @ViewChild('recaptcha', { static: false }) recaptcha: RecaptchaComponent | undefined;

  environment = environment;

  linguageList: Array<PoLanguage> = [];
  loading: boolean = false;
  isHideLoading: boolean = true; // Para o overlay de loading
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
    private router: Router,
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
      this.msg.warning({ message: 'Por favor, complete a verificação reCAPTCHA antes de fazer login.', duration: 5000 });

      // Resetar reCAPTCHA se já estava marcado e destacar visualmente
      this.resetAndHighlightRecaptcha();
    }
  }

  /**
   * Reseta o reCAPTCHA e faz scroll para destacá-lo
   */
  resetAndHighlightRecaptcha(): void {
    // Resetar o token
    this.recaptchaToken = '';

    // Resetar o componente reCAPTCHA se existir
    if (this.recaptcha) {
      try {
        // Reseta o reCAPTCHA usando o método reset() do componente
        this.recaptcha.reset();
      } catch (e) {
        // Se não conseguir resetar programaticamente, apenas limpa o token
        console.log('Não foi possível resetar o reCAPTCHA programaticamente', e);
      }
    }

    // Fazer scroll suave para o reCAPTCHA após um pequeno delay
    setTimeout(() => {
      const recaptchaElement = document.querySelector('.recaptcha-container');
      if (recaptchaElement) {
        recaptchaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Adicionar uma animação de destaque
        recaptchaElement.classList.add('highlight-recaptcha');
        setTimeout(() => {
          recaptchaElement.classList.remove('highlight-recaptcha');
        }, 2000);
      }
    }, 100);
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
    this.msg.error({ message: 'Erro ao carregar reCAPTCHA. Por favor, recarregue a página.', duration: 5000 });
  }

  async login(formData: any, recaptchaToken: string) {
    this.loading = true;
    this.isHideLoading = false; // Mostrar overlay de loading

    this.authenticationService.token(this.config.login, this.config.password).pipe(first())
      .subscribe(
        data => {
          this.loginService.login(formData, recaptchaToken).subscribe((response: any) => {
            // Armazenar token JWT do fornecedor após login bem-sucedido
            if (response.token) {
              localStorage.setItem('fornecedor_jwt', response.token);
            }

            // Armazenar CNPJ raiz para uso nas requisições
            if (response.cnpjraiz) {
              localStorage.setItem('fornecedor_cnpjraiz', response.cnpjraiz);
            }

            const loginData: LoginSuccessData = {
              cnpj: response.cnpjraiz,
              fornecedornome: response.fornecedornome,
              maxperiodo: response.periodomax
            };

            this.loading = false;
            this.isHideLoading = true; // Esconder overlay de loading
            this.recaptchaToken = ''; // Limpa token após login bem-sucedido
            this.msg.success({ message: 'Login efetuado com sucesso!', duration: 5000 });

            // Emite evento de sucesso para o componente pai (se necessário)
            this.loginSuccess.emit(loginData);

            // Navega para rota protegida após login
            this.router.navigate(['/titulos']);
          },
            error => {
              // Priorizar estrutura fault.faultstring conforme documentação da API
              const rawErrorMessage = error?.error?.fault?.faultstring ||
                                      error?.error?.message ||
                                      error?.error?.errorMessage ||
                                      error?.message ||
                                      'Erro desconhecido ao tentar fazer login.';

              // Corrigir encoding e tornar mensagem mais amigável
              const friendlyMessage = SecurityUtil.getFriendlyErrorMessage(rawErrorMessage);

              // Erros de login são críticos - usar error (não fecha automaticamente)
              this.msg.error({ message: friendlyMessage });
              this.loading = false;
              this.isHideLoading = true; // Esconder overlay de loading
              this.recaptchaToken = ''; // Limpa token em caso de erro para forçar novo reCAPTCHA
            });
        },
        (error: any) => {
          const errorMessage = error?.message || 'Erro de autenticação. Verifique suas credenciais ou tente novamente.';
          const friendlyMessage = SecurityUtil.getFriendlyErrorMessage(errorMessage);
          // Erros de autenticação são críticos - usar error (não fecha automaticamente)
          this.msg.error({ message: friendlyMessage });
          this.loading = false;
          this.isHideLoading = true; // Esconder overlay de loading
          this.recaptchaToken = ''; // Limpa token em caso de erro
        }
      );
  }

  public cadastrarSenha() {
    this.loading = true;
    this.isHideLoading = false; // Mostrar overlay de loading

    if (this.raizcnpj.trim()) {
      this.loginService.cadastrar(this.raizcnpj).subscribe((response: any) => {
        // Nova estrutura da API: retorna mensagem única com e-mails mascarados
        if (response.mensagem) {
          this.poDialog.alert({
            ok: () => {
              this.loading = false;
              this.isHideLoading = true; // Esconder overlay de loading
            },
            title: 'Cadastro de Senha',
            message: response.mensagem
          });
        } else {
          // Fallback para estrutura antiga (compatibilidade)
          this.listemail = response.listemail || [];
          this.fornecedornome = response.fornecedornome || '';

          this.mensagem = `Senha cadastrada com sucesso para o fornecedor ${this.fornecedornome} `;
          this.mensagem += "</br> ";
          this.mensagem += "A senha foi enviado para os seguintes emails : ";

          this.listemail.forEach(item => {
            this.mensagem += `</br>&nbsp;&nbsp;&nbsp;&nbsp; ${item.email.toLowerCase()}`;
          });

          this.poDialog.alert({
            ok: () => {
              this.loading = false;
              this.isHideLoading = true; // Esconder overlay de loading
            },
            title: 'Cadastro de Senha',
            message: this.mensagem
          });
        }
      },
        (error: any) => {
          // Priorizar estrutura fault.faultstring conforme documentação da API
          const rawErrorMessage = error?.error?.fault?.faultstring ||
                                  error?.error?.message ||
                                  error?.error?.errorMessage ||
                                  error?.message ||
                                  'Erro ao cadastrar senha';

          // Corrigir encoding e tornar mensagem mais amigável
          const friendlyMessage = SecurityUtil.getFriendlyErrorMessage(rawErrorMessage);

          if (friendlyMessage) {
            // Erros de cadastro podem usar warning (fecha automaticamente)
            this.msg.warning({ message: friendlyMessage, duration: 5000 });
          }
          this.loading = false;
          this.isHideLoading = true; // Esconder overlay de loading
        }
      );
    } else {
      this.msg.warning({ message: "Obrigatório informar a raiz do CNPJ ( somente os 8 primeiros números ) !", duration: 5000 });
      this.loading = false;
      this.isHideLoading = true; // Esconder overlay de loading
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

