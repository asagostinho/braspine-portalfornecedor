import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment';

/**
 * Serviço para criptografia de dados sensíveis
 * Usa AES (Advanced Encryption Standard) para criptografar tokens
 */
@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  // Chave de criptografia - combina domínio com chave fixa para maior segurança
  // Em produção, considere usar uma chave mais complexa ou gerada dinamicamente
  private get secretKey(): string {
    const baseKey = 'braspine-consultatitulos-secret-key-2025';
    const domainKey = environment.domain ? environment.domain.substring(0, 20) : '';
    return `${baseKey}-${domainKey}`;
  }

  /**
   * Criptografa um valor
   */
  encrypt(value: string): string {
    try {
      return CryptoJS.AES.encrypt(value, this.secretKey).toString();
    } catch (error) {
      // Erro ao criptografar - retorna valor original
      return value;
    }
  }

  /**
   * Descriptografa um valor
   */
  decrypt(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      // Se descriptografia falhou, retorna string vazia
      if (!decrypted) {
        return '';
      }

      return decrypted;
    } catch (error) {
      // Erro ao descriptografar - retorna vazio
      return '';
    }
  }

  /**
   * Criptografa um objeto JSON
   */
  encryptObject(obj: any): string {
    try {
      const jsonString = JSON.stringify(obj);
      return this.encrypt(jsonString);
    } catch (error) {
      // Erro ao criptografar objeto
      return '';
    }
  }

  /**
   * Descriptografa e parseia um objeto JSON
   */
  decryptObject<T>(encryptedValue: string): T | null {
    try {
      const decrypted = this.decrypt(encryptedValue);
      if (!decrypted) {
        return null;
      }
      return JSON.parse(decrypted) as T;
    } catch (error) {
      // Erro ao descriptografar objeto
      return null;
    }
  }
}

