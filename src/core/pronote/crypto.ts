import * as Crypto from 'expo-crypto';

/**
 * Pronote protocol cryptographic helpers
 */
export const PronoteCrypto = {
  /**
   * Computes SHA-256 digest in hex (uppercase for Pronote)
   */
  async sha256(data: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return digest.toUpperCase();
  },

  /**
   * Computes MD5 digest in hex (used in legacy challenge response)
   */
  async md5(data: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return digest.toUpperCase();
  },

  /**
   * Solves Pronote challenge: SHA256(alea + SHA256(password))
   */
  async solveChallenge(password: string, alea: string): Promise<string> {
    const passHash = await this.sha256(password);
    const combined = alea + passHash;
    return await this.sha256(combined);
  },

  /**
   * Generates a random cryptographic IV / salt
   */
  getRandomString(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};
