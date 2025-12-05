import * as CryptoJS from 'crypto-js';

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

  /**
   * Gera o hash MD5 de uma string
   */
  static encryptMD5(value: string): string {
    return CryptoJS.MD5(value).toString();
  }

  static encryptSHA256(value: string): string {
    return CryptoJS.SHA256(value).toString();
  }

  /**
   * Corrige problemas de encoding (UTF-8 interpretado como Latin-1)
   * Converte caracteres malformados como "nÃ£o" para "não"
   */
  static fixEncoding(text: string): string {
    if (!text) return text;

    try {
      // Tenta corrigir encoding UTF-8 mal interpretado como Latin-1
      return decodeURIComponent(escape(text));
    } catch (e) {
      // Se falhar, retorna o texto original
      return text;
    }
  }

  /**
   * Determina se um erro é crítico e deve usar notificação de erro (que não fecha automaticamente)
   * ou se pode usar warning (que fecha automaticamente)
   */
  static isCriticalError(errorMessage: string): boolean {
    if (!errorMessage) return false;

    const errorLower = errorMessage.toLowerCase();
    const criticalKeywords = [
      'token inválido',
      'token expirado',
      'sessão expirada',
      'autenticação',
      'login',
      'não autorizado',
      'unauthorized'
    ];

    return criticalKeywords.some(keyword => errorLower.includes(keyword));
  }

  /**
   * Torna mensagens de erro mais amigáveis ao usuário
   * Traduz mensagens técnicas em mensagens mais claras
   * Se a mensagem não estiver no mapeamento, retorna mensagem genérica
   */
  static getFriendlyErrorMessage(errorMessage: string): string {
    if (!errorMessage) {
      return 'Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.';
    }

    // Corrige encoding primeiro
    let message = this.fixEncoding(errorMessage);

    // Mapeamento de mensagens técnicas para mensagens amigáveis
    const friendlyMessages: { [key: string]: string } = {
      'cnpj raiz não informado': 'Por favor, informe o CNPJ raiz para realizar a consulta.',
      'cnpj raiz nÃ£o informado': 'Por favor, informe o CNPJ raiz para realizar a consulta.',
      'cnpj raiz não encontrado': 'CNPJ raiz não encontrado. Verifique se o CNPJ está correto.',
      'senha ou cnpj raiz informados inválidos': 'CNPJ ou senha inválidos. Verifique suas credenciais e tente novamente.',
      'fornecedor não encontrado': 'Fornecedor não encontrado. Verifique a raiz do CNPJ e tente novamente.',
      'fornecedor sem senha': 'Fornecedor sem senha de acesso cadastrada. Clique em "Esqueceu sua senha" para gerar uma nova senha.',
      'token jwt do fornecedor expirado': 'Sua sessão expirou. Por favor, faça login novamente.',
      'token jwt inválido ou corrompido': 'Sessão inválida. Por favor, faça login novamente.',
      'x-custon-token não informado': 'Erro de autenticação. Por favor, faça login novamente.',
      'obrigatório informar a data de emissão inicial e final': 'Por favor, informe a data inicial e a data final para realizar a consulta.',
      'data inicial deve ser menor ou igual à data final': 'A data inicial deve ser menor ou igual à data final.',
      'período informado excede ao período máximo': 'O período informado excede o período máximo permitido.',
      'tenantid não informado': 'Erro de configuração. Entre em contato com o suporte.',
      'erro ao deserializar json': 'Erro ao processar a requisição. Por favor, tente novamente.',
      'erro na comunicação com o servidor': 'Erro na comunicação com o servidor. Verifique sua conexão e tente novamente.'
    };

    // Busca mensagem amigável (case insensitive)
    const messageLower = message.toLowerCase();
    for (const [key, friendly] of Object.entries(friendlyMessages)) {
      if (messageLower.includes(key.toLowerCase())) {
        return friendly;
      }
    }

    // Se não encontrar mapeamento, retorna mensagem genérica
    return 'Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.';
  }

}

