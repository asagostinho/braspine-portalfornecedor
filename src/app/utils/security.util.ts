/**
 * Utilitário para segurança e ofuscação de dados sensíveis
 */
export class SecurityUtil {

  /**
   * Ofusca dados sensíveis para logs
   */
  static maskSensitiveData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Ocultar senhas e tokens longos
      if (data.length > 10) {
        return data.substring(0, 4) + '***' + data.substring(data.length - 4);
      }
      return '***';
    }

    if (typeof data === 'object') {
      const masked = Array.isArray(data) ? [...data] : { ...data };

      const sensitiveKeys = [
        'password',
        'senha',
        'token',
        'access_token',
        'refresh_token',
        'recaptchaToken',
        'cSenha'
      ];

      for (const key in masked) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
          masked[key] = '***MASKED***';
        } else if (typeof masked[key] === 'object') {
          masked[key] = this.maskSensitiveData(masked[key]);
        }
      }

      return masked;
    }

    return data;
  }

  /**
   * Remove dados sensíveis de uma URL
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const sensitiveParams = ['password', 'senha', 'token', 'cSenha'];

      sensitiveParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Log seguro que não expõe dados sensíveis
   * Em produção, não loga nada
   */
  static safeLog(message: string, data?: any): void {
    // Não logar em produção
    if (this.isProduction()) {
      return;
    }

    // Apenas em desenvolvimento
    if (data) {
      console.log(message, this.maskSensitiveData(data));
    } else {
      console.log(message);
    }
  }

  /**
   * Verifica se está em ambiente de produção
   */
  static isProduction(): boolean {
    return !window.location.hostname.includes('localhost') &&
           !window.location.hostname.includes('127.0.0.1');
  }
}

