import { Component, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { LoginService } from './services/login.service';
import { PoLanguage, PoNotificationService, PoDialogService } from '@po-ui/ng-components';
import { PoPageLoginLiterals } from '@po-ui/ng-templates';
import { first, of } from 'rxjs';
import { Email } from './interface/email';
import { ConfigService } from './services/config.service';
import { Token } from '@angular/compiler';
import { AuthenticationService } from './services/authentication.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [PoNotificationService]
})


export class AppComponent implements AfterViewInit{

  public cnpj = '';
  public maxperiodo:string = '3' ;
  title = 'Consulta Documentos do Fornecedor ';
  credencial: string = '';
  config: any;
  currentUser!: Token;
  isLogged = false;
  //isLogged = true;
  fornecedornome: string = '';
  linguageList: Array<PoLanguage> = [];
  loading: boolean = false;
  loginErrors:Array<string> = [];
  passwordErrors:Array<string> = [];
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


  constructor(
    private loginService: LoginService,
    private msg: PoNotificationService,
    private poDialog: PoDialogService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
    private renderer: Renderer2,
    private el: ElementRef
  ){
    this.authenticationService.currentUser.subscribe((x: any ) => this.currentUser = x);
    this.configService.getConfig().subscribe((data: any) => {
        if (data.userapi){
          this.config = data.userapi;
          console.log(this.config);
        }
      }, (error) => {
        console.error(error);
      });
  }

   ngAfterViewInit() {
    // Tenta encontrar o input de login dentro do po-page-login após a view ser inicializada
    // O seletor pode precisar de ajuste dependendo da estrutura interna exata do PO UI
    try {
      const loginInput = this.el.nativeElement.querySelector('po-page-login input[name="login"]');
      if (loginInput) {
        this.renderer.setAttribute(loginInput, 'maxlength', '8');
      }
    } catch (e) {
      console.error('Erro ao tentar definir maxlength no input de login:', e);
    }
  }



  async login(formData: any) {
        this.loading = true;

            this.authenticationService.token(this.config.login, this.config.password).pipe(first())
            .subscribe(
                data => {

                    this.loginService.login(formData).subscribe((response: any)=>{

                        this.cnpj = response.cnpjraiz;
                        this.fornecedornome = response.fornecedornome;
                        this.maxperiodo = response.periodomax;
                        this.isLogged = true;
                        this.loading = false;
                        this.title += response.fornecedornome;

                        this.msg.success('Login efetuado com sucesso!')


                },
                error => {
                    console.error('Erro no loginService.login:', error);

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
                        console.error("Falha ao tentar corrigir encoding da mensagem de erro:", e);
                        // Se falhar, usa a mensagem original
                    }

                    // Log da mensagem APÓS tentativa de correção
                    console.log('Mensagem de erro (após correção) no AppComponent:', errorMessage);

                    // Passa a duração diretamente para a notificação específica (em ms) - Testando 5s
                    this.msg.error({ message: errorMessage, duration: 5000 });
                    this.loading = false;
                });





            },
              (error: any) => {
                console.error('Erro no authenticationService.token:', error);
                const errorMessage = error?.message || 'Erro de autenticação. Verifique suas credenciais ou tente novamente.';
                this.msg.error(errorMessage);
                this.msg.setDefaultDuration(3);
                this.loading = false;
              }
            );


        // }else{

        //       this.msg.error("Falha ao ler arquivo json de configuração, contate o suporte");
        //       this.msg.setDefaultDuration(3);
        //       this.loading = false;


        // }

  }


  public cadastrarSenha() {

    this.loading = true;

    if (this.raizcnpj.trim()){
        this.loginService.cadastrar(this.raizcnpj).subscribe((response: any)=>{
        this.listemail = response.listemail;
        this.fornecedornome = response.fornecedornome;

        this.mensagem = `Senha cadastrada com sucesso para o fornecedor ${this.fornecedornome} `
        this.mensagem += "</br> "
        this.mensagem += "A senha foi enviado para os seguintes emails : "

        this.listemail.forEach(item => {
          this.mensagem += `</br>&nbsp;&nbsp;&nbsp;&nbsp; ${item.email.toLowerCase()}`
        })

        this.poDialog.alert({
          ok: () => (this.loading = false),
          title: 'Cadastro de Senha',
          message: this.mensagem

        });

        },
        (error: any) => {
          if (error.message){
            this.msg.error(error.message)
            this.msg.setDefaultDuration(3);
          }
          this.loading = false;
        }
      );

    }else{
      this.msg.error("Obrigatório informar a raiz do CNPJ ( somente os 8 primeiros números ) !")
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
