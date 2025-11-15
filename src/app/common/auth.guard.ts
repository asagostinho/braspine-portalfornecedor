import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Guard que protege rotas e valida token a cada navegação
 *
 * Funcionalidades:
 * - Verifica se usuário está logado
 * - Valida token no backend a cada acesso à rota
 * - Bloqueia acesso se token inválido
 * - Redireciona para login se não autenticado
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthenticationService);

  const currentUser = authService.currentUserValue;

  // Verifica se há token armazenado
  if (!currentUser || !currentUser.access_token) {
    // Não logado - redireciona para login
    router.navigate(['/']);
    return false;
  }

  // Valida token no backend a cada navegação
  return authService.validateToken().pipe(
    map(isValid => {
      if (isValid) {
        return true; // Token válido, permite acesso
      } else {
        // Token inválido - faz logout e redireciona
        authService.logout();
        router.navigate(['/']);
        return false;
      }
    }),
    catchError(() => {
      // Erro na validação - faz logout e redireciona
      authService.logout();
      router.navigate(['/']);
      return of(false);
    })
  );
};
