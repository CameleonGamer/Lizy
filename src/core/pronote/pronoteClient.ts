import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import pako from 'pako';
import { PRONOTE_APP_USER_AGENT } from './constants';
import { Grade, Homework, TimetableLesson, SubjectAverage, PronoteUser } from '@/types';
import { SecureStorage } from '../security/secureStorage';

export interface PronoteQrPayload {
  url: string;
  login: string;
  jeton: string;
  version?: number[];
  avecPageConnexion?: boolean;
}

export interface PronoteSessionCredentials {
  url: string;
  username: string;
  token: string;
  uuid: string;
  clientIdentifier?: string;
  lastConnected?: string;
}

/**
 * Converts a byte array to CryptoJS WordArray
 */
function uint8ArrayToWordArray(u8Array: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8Array.length; i++) {
    words[i >>> 2] |= (u8Array[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8Array.length);
}

/**
 * Removes every second character (Pronote alea stripping)
 */
function removeEverySecondChar(text: string): string {
  return text.split('').filter((_, i) => i % 2 === 0).join('');
}

/**
 * Parses comma-separated byte string into CryptoJS WordArray
 */
function parseCommaSeparatedBytesToWordArray(str: string): CryptoJS.lib.WordArray {
  const bytes = str
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return uint8ArrayToWordArray(new Uint8Array(bytes));
}

/**
 * Low-level Pronote Encryption layer matching pronotepy _Encryption
 */
class PronoteEncryption {
  aesKey: CryptoJS.lib.WordArray;
  aesIv: CryptoJS.lib.WordArray;
  aesIvTemp: Uint8Array;

  constructor() {
    this.aesIv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    // Generate 16 random bytes for iv_temp
    this.aesIvTemp = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      this.aesIvTemp[i] = Math.floor(Math.random() * 256);
    }
    this.aesKey = CryptoJS.MD5('');
  }

  aesEncrypt(dataStr: string): string {
    const encrypted = CryptoJS.AES.encrypt(dataStr, this.aesKey, {
      iv: this.aesIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
  }

  aesDecrypt(hexCipher: string): string {
    const ciphertext = CryptoJS.enc.Hex.parse(hexCipher);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, this.aesKey, {
      iv: this.aesIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  setIvFromTemp() {
    const tempWa = uint8ArrayToWordArray(this.aesIvTemp);
    this.aesIv = CryptoJS.MD5(tempWa);
  }

  setKey(keyWa: CryptoJS.lib.WordArray) {
    this.aesKey = keyWa;
  }
}

/**
 * Pronote Mobile Protocol Client reverse engineered from bain3/pronotepy & delphiki/hass-pronote
 */
export class PronoteClient {
  private rootSite: string = '';
  private htmlPage: string = '';
  private attributes: Record<string, any> = {};
  private encryption: PronoteEncryption;
  private requestNumber: number = 1;
  private clientIdentifier: string = '';
  private uuid: string = '';
  private periods: Array<{ id: string; name: string }> = [];
  private startDay: Date = new Date();
  private userRessource: any = null;

  constructor() {
    this.encryption = new PronoteEncryption();
  }

  /**
   * Decrypts encrypted hex field (login / jeton) using AES-128-CBC with key = MD5(pin) and zero IV
   */
  static decryptQrField(encryptedHex: string, pin: string): string {
    const key = CryptoJS.MD5(pin);
    const iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);

    const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('Code PIN invalide ou QR code expiré.');
    }
    return result;
  }

  /**
   * Calculates school week from date
   */
  private getWeek(date: Date): number {
    const diffTime = date.getTime() - this.startDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  }

  /**
   * Sends a low-level post to Pronote RPC endpoint
   */
  private async postRpc(functionName: string, onglet?: number, data?: any): Promise<any> {
    const postData: any = {};
    if (onglet !== undefined) {
      postData.Signature = { onglet };
    }
    if (data !== undefined) {
      postData.data = data;
    }

    let encodedDataSec: any = postData;
    const isEncrypted = Boolean(this.attributes.CrA);
    const isCompressed = Boolean(this.attributes.CoA);

    if (isCompressed) {
      const jsonBytes = new TextEncoder().encode(JSON.stringify(encodedDataSec));
      const deflated = pako.deflateRaw(jsonBytes, { level: 6 });
      const deflatedHex = Array.from(deflated)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      encodedDataSec = deflatedHex;
    }

    if (isEncrypted) {
      if (typeof encodedDataSec === 'object') {
        encodedDataSec = this.encryption.aesEncrypt(JSON.stringify(encodedDataSec));
      } else {
        // If compressed hex string, encrypt raw hex bytes
        encodedDataSec = this.encryption.aesEncrypt(encodedDataSec);
      }
    }

    // Encrypt request number
    const rNumber = this.encryption.aesEncrypt(String(this.requestNumber)).toLowerCase();

    const bodyPayload = {
      session: parseInt(this.attributes.h, 10),
      no: rNumber,
      id: functionName,
      dataSec: encodedDataSec,
    };

    const targetUrl = `${this.rootSite}/appelfonction/${this.attributes.a}/${this.attributes.h}/${rNumber}`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': PRONOTE_APP_USER_AGENT,
      },
      body: JSON.stringify(bodyPayload),
    });

    this.requestNumber += 2;

    if (!res.ok) {
      throw new Error(`Pronote HTTP status ${res.status}`);
    }

    const resJson = await res.json();

    if (resJson.Erreur) {
      const errCode = resJson.Erreur.G;
      const errMsg = resJson.Erreur.Titre || `Erreur Pronote code ${errCode}`;
      throw new Error(errMsg);
    }

    let responseDataSec = resJson.dataSec;

    // Decrypt if CrA
    if (isEncrypted && typeof responseDataSec === 'string') {
      const decryptedText = this.encryption.aesDecrypt(responseDataSec);
      if (!isCompressed) {
        try {
          responseDataSec = JSON.parse(decryptedText);
        } catch {
          responseDataSec = decryptedText;
        }
      } else {
        responseDataSec = decryptedText;
      }
    }

    // Decompress if CoA
    if (isCompressed) {
      const hex = typeof responseDataSec === 'string' ? responseDataSec : '';
      const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
      const inflated = pako.inflateRaw(bytes);
      const inflatedText = new TextDecoder().decode(inflated);
      responseDataSec = JSON.parse(inflatedText);
    }

    return { ...resJson, dataSec: responseDataSec };
  }

  /**
   * Full authentication with Pronote using QR code payload and 4-digit PIN
   */
  async authenticateWithQr(
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
    // 1. Decrypt credentials
    const decryptedLogin = PronoteClient.decryptQrField(payload.login, pin);
    const decryptedJeton = PronoteClient.decryptQrField(payload.jeton, pin);

    // 2. Normalize URL for mobile app
    let cleanUrl = payload.url.trim();
    const urlObj = new URL(cleanUrl);

    // Replace last segment with mobile.eleve.html
    const pathParts = urlObj.pathname.split('/');
    let lastSegment = pathParts[pathParts.length - 1];
    if (!lastSegment.startsWith('mobile.')) {
      lastSegment = 'mobile.' + lastSegment;
      pathParts[pathParts.length - 1] = lastSegment;
    }
    urlObj.pathname = pathParts.join('/');
    urlObj.search = 'fd=1&bydlg=A6ABB224-12DD-4E31-AD3E-8A39A1C2C335&login=true';

    const fixedUrl = urlObj.toString();
    this.rootSite = fixedUrl.substring(0, fixedUrl.lastIndexOf('/'));
    this.htmlPage = fixedUrl.substring(fixedUrl.lastIndexOf('/') + 1);

    // 3. GET HTML page and extract Start({ ... }) attributes
    const htmlRes = await fetch(fixedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': PRONOTE_APP_USER_AGENT,
      },
    });

    if (!htmlRes.ok) {
      throw new Error(`Impossible de contacter l'établissement Pronote (${htmlRes.status}).`);
    }

    const htmlText = await htmlRes.text();
    const startMatch = htmlText.match(/Start ?\({(?<param>[^}]*)}\)/);
    if (!startMatch || !startMatch.groups?.param) {
      throw new Error('Format de page Pronote inattendu (Start manquant). Vérifiez l’URL de votre établissement.');
    }

    this.attributes = {};
    const rawParams = startMatch.groups.param.split(',');
    for (const p of rawParams) {
      const parts = p.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim().replace(/['"]/g, '');
        const v = parts.slice(1).join(':').trim().replace(/['"]/g, '');
        if (v === 'true') this.attributes[k] = true;
        else if (v === 'false') this.attributes[k] = false;
        else this.attributes[k] = v;
      }
    }

    if (!this.attributes.h || !this.attributes.a) {
      throw new Error('Paramètres de session Pronote invalides.');
    }

    this.uuid = Crypto.randomUUID();
    this.clientIdentifier = this.uuid;

    // 4. Send FonctionParametres (initialise encryption IV)
    const ivBase64 = CryptoJS.enc.Base64.stringify(uint8ArrayToWordArray(this.encryption.aesIvTemp));
    const initPayload = {
      data: {
        Uuid: ivBase64,
        identifiantNav: this.clientIdentifier,
      },
    };

    const funcParamsRes = await this.postRpc('FonctionParametres', undefined, initPayload.data);
    this.encryption.setIvFromTemp();

    const generalInfo = funcParamsRes?.dataSec?.data?.General;
    if (generalInfo?.PremierLundi?.V) {
      const [d, m, y] = generalInfo.PremierLundi.V.split('/').map(Number);
      this.startDay = new Date(y, m - 1, d);
    }
    if (Array.isArray(generalInfo?.ListePeriodes)) {
      this.periods = generalInfo.ListePeriodes.map((p: any) => ({
        id: p.N,
        name: p.L,
      }));
    }

    // 5. Send Identification
    const identPayload = {
      genreConnexion: 0,
      genreEspace: parseInt(this.attributes.a, 10),
      identifiant: decryptedLogin,
      pourENT: false,
      enConnexionAuto: false,
      demandeConnexionAuto: false,
      demandeConnexionAppliMobile: true,
      demandeConnexionAppliMobileJeton: true,
      enConnexionAppliMobile: false,
      uuidAppliMobile: this.uuid,
      loginTokenSAV: '',
    };

    const idrRes = await this.postRpc('Identification', undefined, identPayload);
    const idrData = idrRes?.dataSec?.data;
    if (!idrData || !idrData.challenge) {
      throw new Error('Échec de la phase d’identification Pronote.');
    }

    const challenge = idrData.challenge;
    let username = decryptedLogin;
    let password = decryptedJeton;
    if (idrData.modeCompLog) username = username.toLowerCase();
    if (idrData.modeCompMdp) password = password.toLowerCase();

    const alea = idrData.alea || '';
    const motdepasse = CryptoJS.SHA256(alea + password).toString(CryptoJS.enc.Hex).toUpperCase();
    const authKey = CryptoJS.MD5(username + motdepasse);

    // Save authKey temporarily into encryption
    this.encryption.setKey(authKey);

    // 6. Compute challenge response (supports old alea scheme and modern scheme)
    let solvedChallenge = '';
    try {
      const decChallenge = this.encryption.aesDecrypt(challenge);
      const decNoAlea = removeEverySecondChar(decChallenge);
      solvedChallenge = this.encryption.aesEncrypt(decNoAlea);
    } catch {
      // Fallback for migrated PRONOTE instances (raw challenge re-encrypted)
      solvedChallenge = this.encryption.aesEncrypt(challenge);
    }

    // 7. Send Authentification
    const authPayload = {
      connexion: 0,
      challenge: solvedChallenge.toLowerCase(),
      espace: parseInt(this.attributes.a, 10),
    };

    const authRes = await this.postRpc('Authentification', undefined, authPayload);
    const authData = authRes?.dataSec?.data;
    if (!authData || !authData.cle) {
      throw new Error('Échec de l’authentification. Vérifiez le code PIN ou regénérez un QR Code.');
    }

    // Key change: decrypt cle with authKey, then MD5(parsedBytes) becomes the session key!
    const decryptedCle = this.encryption.aesDecrypt(authData.cle);
    const sessionKeyWa = CryptoJS.MD5(parseCommaSeparatedBytesToWordArray(decryptedCle));
    this.encryption.setKey(sessionKeyWa);

    // Persist new mobile token if returned for long-term token_login
    if (authData.jetonConnexionAppliMobile) {
      await SecureStorage.saveCredentials({
        url: fixedUrl,
        username: decryptedLogin,
        password: authData.jetonConnexionAppliMobile,
        ent: 'PRONOTE_QR_CODE',
      });
    }

    // 8. Fetch ParametresUtilisateur
    const userParamsRes = await this.postRpc('ParametresUtilisateur');
    this.userRessource = userParamsRes?.dataSec?.data?.ressource;

    const studentName = this.userRessource?.L || decryptedLogin;
    const studentClass = this.userRessource?.classe?.L || 'Classe Pronote';
    const establishment = generalInfo?.NomEtablissement || 'Établissement Pronote';

    const user: PronoteUser = {
      id: `u-${studentName.toLowerCase().replace(/\s+/g, '-')}`,
      name: studentName,
      studentClass,
      establishment,
    };

    // 9. Fetch Grades & Averages (DernieresNotes on onglet 198)
    const currentPeriod = this.periods[this.periods.length - 1] || { id: 'A', name: 'Trimestre 1' };
    let grades: Grade[] = [];
    let averages: SubjectAverage[] = [];
    let generalAverage = 0;

    try {
      const notesRes = await this.postRpc('DernieresNotes', 198, {
        Periode: { N: currentPeriod.id, L: currentPeriod.name },
      });
      const notesData = notesRes?.dataSec?.data;

      // Parse overall average
      if (notesData?.moyGenerale?.V) {
        const parsedAvg = parseFloat(notesData.moyGenerale.V.replace(',', '.'));
        if (!isNaN(parsedAvg)) generalAverage = parsedAvg;
      }

      // Parse subject averages
      if (Array.isArray(notesData?.listeServices?.V)) {
        notesData.listeServices.V.forEach((s: any) => {
          const subject = s?.L || 'Matière';
          const avgStr = s?.moyEleve?.V?.replace(',', '.');
          const avgNum = parseFloat(avgStr);
          const classAvgStr = s?.moyClasse?.V?.replace(',', '.');
          const classAvgNum = parseFloat(classAvgStr);

          if (!isNaN(avgNum)) {
            averages.push({
              subject,
              average: avgNum,
              classAverage: !isNaN(classAvgNum) ? classAvgNum : undefined,
              color: s?.couleur || undefined,
            });
          }
        });
      }

      // Parse individual grades
      if (Array.isArray(notesData?.listeDevoirs?.V)) {
        notesData.listeDevoirs.V.forEach((g: any, idx: number) => {
          const valStr = g?.note?.V?.replace(',', '.');
          const valNum = parseFloat(valStr);
          const outOfStr = g?.bareme?.V?.replace(',', '.') || '20';
          const outOfNum = parseFloat(outOfStr) || 20;

          if (!isNaN(valNum)) {
            grades.push({
              id: `g-real-${g?.N || idx}`,
              subject: g?.service?.V?.L || 'Évaluation',
              value: valNum,
              outOf: outOfNum,
              coefficient: parseFloat(g?.coefficient?.replace(',', '.') || '1') || 1,
              date: g?.date?.V || new Date().toISOString().split('T')[0],
              description: g?.commentaire || g?.service?.V?.L || 'Note Pronote',
              classAverage: parseFloat(g?.moyenne?.V?.replace(',', '.') || '') || undefined,
            });
          }
        });
      }

      if (generalAverage === 0 && averages.length > 0) {
        const sum = averages.reduce((acc, a) => acc + a.average, 0);
        generalAverage = Math.round((sum / averages.length) * 100) / 100;
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des notes:', err);
    }

    // 10. Fetch Timetable (PageEmploiDuTemps on onglet 16)
    const timetable: TimetableLesson[] = [];
    try {
      const currentWeek = this.getWeek(new Date());
      const edtRes = await this.postRpc('PageEmploiDuTemps', 16, {
        ressource: this.userRessource,
        NumeroSemaine: currentWeek,
        numeroSemaine: currentWeek,
        avecAbsencesEleve: false,
        avecConseilDeClasse: true,
        estEDTPermanence: false,
        avecAbsencesRessource: true,
        avecDisponibilites: true,
        avecInfosPrefsGrille: true,
        Ressource: this.userRessource,
      });

      const coursList = edtRes?.dataSec?.data?.ListeCours;
      if (Array.isArray(coursList)) {
        coursList.forEach((c: any, idx: number) => {
          let startTime = '08:00';
          let endTime = '09:00';
          if (c?.DateDuCours?.V) {
            const timePart = c.DateDuCours.V.split(' ')[1];
            if (timePart) startTime = timePart.substring(0, 5);
          }

          timetable.push({
            id: `tt-real-${c?.N || idx}`,
            subject: c?.Matiere?.V?.L || c?.Matiere?.L || 'Cours',
            teacher: c?.Professeur?.V?.L || c?.Professeur?.L || c?.ListeProfesseurs?.V?.[0]?.L || 'Enseignant',
            room: c?.Salle?.V?.L || c?.Salle?.L || c?.ListeSalles?.V?.[0]?.L || 'Salle',
            startTime,
            endTime,
            status: c?.estAnnule ? 'cancelled' : 'normal',
            color: c?.CouleurFond,
          });
        });
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération de l’emploi du temps:', err);
    }

    // 11. Fetch Homework (PageCahierDeTexte on onglet 88)
    const homework: Homework[] = [];
    try {
      const currentWeek = this.getWeek(new Date());
      const hwRes = await this.postRpc('PageCahierDeTexte', 88, {
        domaine: {
          _T: 8,
          V: `[${currentWeek}..${currentWeek + 4}]`,
        },
      });

      const rawHwList = hwRes?.dataSec?.data?.ListeTravauxAFaire?.V;
      if (Array.isArray(rawHwList)) {
        rawHwList.forEach((h: any, idx: number) => {
          const desc = h?.descriptif?.V || 'Devoir Pronote';
          const title = desc.length > 40 ? desc.substring(0, 40) + '...' : desc;

          homework.push({
            id: `hw-real-${h?.N || idx}`,
            subject: h?.Matiere?.V?.L || h?.Matiere?.L || 'Matière',
            title,
            description: desc,
            dueDate: h?.PourLe?.V || 'Bientôt',
            isPersonal: false,
            completed: Boolean(h?.TAFFait),
            subtasks: [],
          });
        });
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des devoirs:', err);
    }

    return {
      user,
      grades,
      averages,
      generalAverage,
      homework,
      timetable,
    };
  }
}
