import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PoModule } from '@po-ui/ng-components';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { PoTemplatesModule } from '@po-ui/ng-templates';

import ptBr from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatIconModule } from '@angular/material/icon';
import { TitulosComponent } from './titulos/titulos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabletituloComponent } from './tabletitulo/tabletitulo.component';
import { JwtInterceptor } from './common/jwt.interceptor';
import { ErrorInterceptor } from './common/error.interceptor';
import { SecurityInterceptor } from './common/security.interceptor';
import { RecaptchaModule } from 'ng-recaptcha';
import { LoginComponent } from './login/login.component';

registerLocaleData(ptBr);

@NgModule({
  declarations: [
    AppComponent,
    TitulosComponent,
    TabletituloComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PoModule,
    HttpClientModule,
    RouterModule.forRoot([]),
    PoTemplatesModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt' }, // configurar local Brasil
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}, },
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
