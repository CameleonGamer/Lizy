import { PronoteClient, PronoteQrPayload } from './pronoteClient';
import { Grade, Homework, TimetableLesson, SubjectAverage, PronoteUser } from '@/types';

export { PronoteQrPayload };

export const PronoteQrAuth = {
  /**
   * Decrypts encrypted hex field (login / jeton) using AES-128-CBC with key = MD5(pin)
   */
  decryptField(encryptedHex: string, pin: string): string {
    return PronoteClient.decryptQrField(encryptedHex, pin);
  },

  /**
   * Parses the raw scanned QR Code string into a typed payload
   */
  parseScannedString(rawString: string): PronoteQrPayload {
    let jsonStr = rawString.trim();
    // Look for JSON braces if wrapper present
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed.url || !parsed.login || !parsed.jeton) {
      throw new Error('Format de QR code Pronote invalide (champs url, login ou jeton manquants).');
    }

    return {
      url: parsed.url,
      login: parsed.login,
      jeton: parsed.jeton,
      version: parsed.version,
    };
  },

  /**
   * Performs the mobile handshake with Pronote using decrypted QR credentials
   * Matches the official reverse engineered protocol from bain3/pronotepy & delphiki/hass-pronote
   */
  async loginWithQr(
    payload: PronoteQrPayload,
    pin: string
  ): Promise<{
    user: PronoteUser;
    grades: Grade[];
    averages: SubjectAverage[];
    generalAverage: number;
    homework: Homework[];
    timetable: TimetableLesson[];
  }> {
    const client = new PronoteClient();
    return await client.authenticateWithQr(payload, pin);
  },
};
