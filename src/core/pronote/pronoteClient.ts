/**
 * Pronote Mobile RPC Client & Cryptographic Handshake
 *
 * Sources & References:
 * - delphiki/hass-pronote: https://github.com/delphiki/hass-pronote
 * - bain3/pronotepy: https://github.com/bain3/pronotepy
 * - Index Education Pronote Protocol (QR Code Mobile Handshake)
 */

import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import pako from 'pako';
import { PRONOTE_APP_USER_AGENT } from './constants';
import { Grade, Homework, TimetableLesson, SubjectAverage, PronoteUser, PronoteMessage } from '@/types';
import { SecureStorage } from '../security/secureStorage';
import { cleanPronoteHtml } from '../utils/htmlSanitizer';
import { sortHomeworkByDueDate } from '../utils/dateUtils';

export interface PronoteQrPayload {
  url: string;
  login: string;
  jeton: string;
  version?: number[];
  avecPageConnexion?: boolean;
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
 * Parses comma-separated byte string (e.g. "54,23,101...") into CryptoJS WordArray
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
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
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
  private rawPeriods: any[] = [];
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
   * Normalizes any Pronote URL into the official mobile URL
   */
  static normalizePronoteUrl(rawUrl: string): { fixedUrl: string; rootSite: string; htmlPage: string } {
    const urlObj = new URL(rawUrl.trim());
    let pathname = urlObj.pathname.replace(/\/+$/, '');
    const pathParts = pathname.split('/');
    let last = pathParts[pathParts.length - 1] || '';

    if (!last.endsWith('.html')) {
      last = 'eleve.html';
      pathParts.push(last);
    }

    if (!last.startsWith('mobile.')) {
      pathParts[pathParts.length - 1] = 'mobile.' + last;
    }

    urlObj.pathname = pathParts.join('/');
    urlObj.search = 'fd=1&bydlg=A6ABB224-12DD-4E31-AD3E-8A39A1C2C335&login=true';

    const fixedUrl = urlObj.toString();
    const rootSite = fixedUrl.substring(0, fixedUrl.lastIndexOf('/'));
    const htmlPage = fixedUrl.substring(fixedUrl.lastIndexOf('/') + 1);
    return { fixedUrl, rootSite, htmlPage };
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
   * Resolves current active period from Pronote user settings, date, or defaults
   */
  private resolveActivePeriod(): { id: string; name: string } {
    // 1. From ParametresUtilisateur: listeOngletsPourPeriodes for onglet 198 (Notes)
    const onglets = this.userRessource?.listeOngletsPourPeriodes?.V || this.userRessource?.listeOngletsPourPeriodes;
    if (Array.isArray(onglets)) {
      const notesTab = onglets.find((o: any) => o?.G === 198);
      const defPeriod = notesTab?.periodeParDefaut?.V || notesTab?.periodeParDefaut;
      if (defPeriod && (defPeriod.N || defPeriod.id)) {
        return {
          id: defPeriod.N || defPeriod.id,
          name: defPeriod.L || defPeriod.name || 'Période active',
        };
      }
    }

    // 2. Date-based matching against ListePeriodes (dateDebut / dateFin)
    const now = new Date();
    if (Array.isArray(this.rawPeriods)) {
      for (const p of this.rawPeriods) {
        const dDebut = p?.dateDebut?.V || p?.dateDebut;
        const dFin = p?.dateFin?.V || p?.dateFin;
        if (dDebut && dFin && typeof dDebut === 'string' && typeof dFin === 'string') {
          const [d1, m1, y1] = dDebut.split('/').map(Number);
          const [d2, m2, y2] = dFin.split('/').map(Number);
          if (!isNaN(d1) && !isNaN(d2)) {
            const start = new Date(y1, m1 - 1, d1);
            const end = new Date(y2, m2 - 1, d2, 23, 59, 59);
            if (now >= start && now <= end) {
              return { id: p.N, name: p.L };
            }
          }
        }
      }
    }

    // 3. Fallback: Look for "Trimestre 1" or "Semestre 1"
    if (this.periods.length > 0) {
      const firstTerm = this.periods.find((p) => /trimestre\s*1|1er\s*trimestre|semestre\s*1/i.test(p.name));
      if (firstTerm) return firstTerm;
      return this.periods[0];
    }

    return { id: 'A', name: 'Trimestre 1' };
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
        encodedDataSec = this.encryption.aesEncrypt(JSON.stringify(encodedDataSec)).toUpperCase();
      } else {
        encodedDataSec = this.encryption.aesEncrypt(encodedDataSec).toUpperCase();
      }
    }

    // Encrypt request number with current communication key and IV
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
      const errMsg = resJson.Erreur.Titre || resJson.Erreur.Message || `Erreur Pronote code ${errCode}`;
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
    messages: PronoteMessage[];
  }> {
    // 1. Decrypt credentials from QR Code
    const decryptedLogin = PronoteClient.decryptQrField(payload.login, pin);
    const decryptedJeton = PronoteClient.decryptQrField(payload.jeton, pin);

    // 2. Normalize Pronote URL
    const { fixedUrl, rootSite, htmlPage } = PronoteClient.normalizePronoteUrl(payload.url);
    this.rootSite = rootSite;
    this.htmlPage = htmlPage;

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
      Uuid: ivBase64,
      identifiantNav: this.clientIdentifier,
    };

    const funcParamsRes = await this.postRpc('FonctionParametres', undefined, initPayload);
    // Update IV to MD5(aesIvTemp) as required by Pronote protocol
    this.encryption.setIvFromTemp();

    const generalInfo = funcParamsRes?.dataSec?.data?.General;
    if (generalInfo?.PremierLundi?.V) {
      const [d, m, y] = generalInfo.PremierLundi.V.split('/').map(Number);
      this.startDay = new Date(y, m - 1, d);
    }
    const rawPeriodList = generalInfo?.ListePeriodes?.V || generalInfo?.ListePeriodes;
    if (Array.isArray(rawPeriodList)) {
      this.rawPeriods = rawPeriodList;
      this.periods = rawPeriodList.map((p: any) => ({
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

    // 6. Compute challenge response
    // Modern instances (2024-2026): encrypt raw challenge directly with authKey and current IV
    // Legacy instances: decrypt hex bytes, strip odd chars, re-encrypt
    let solvedChallenge = '';
    try {
      const ciphertext = CryptoJS.enc.Hex.parse(challenge);
      const decChallenge = CryptoJS.AES.decrypt({ ciphertext } as any, authKey, {
        iv: this.encryption.aesIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8);

      if (decChallenge && /^[\x20-\x7E]+$/.test(decChallenge)) {
        const decNoAlea = decChallenge.split('').filter((_, i) => i % 2 === 0).join('');
        const enc = CryptoJS.AES.encrypt(decNoAlea, authKey, {
          iv: this.encryption.aesIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        solvedChallenge = enc.ciphertext.toString(CryptoJS.enc.Hex);
      } else {
        const enc = CryptoJS.AES.encrypt(challenge, authKey, {
          iv: this.encryption.aesIv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        solvedChallenge = enc.ciphertext.toString(CryptoJS.enc.Hex);
      }
    } catch {
      const enc = CryptoJS.AES.encrypt(challenge, authKey, {
        iv: this.encryption.aesIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      solvedChallenge = enc.ciphertext.toString(CryptoJS.enc.Hex);
    }

    // 7. Send Authentification
    // NOTE: request_number order (rNumber) MUST still be encrypted with initial communication key MD5('')!
    // Do NOT change this.encryption.aesKey before sending Authentification.
    const authPayload = {
      connexion: 0,
      challenge: solvedChallenge.toLowerCase(),
      espace: parseInt(this.attributes.a, 10),
    };

    const authRes = await this.postRpc('Authentification', undefined, authPayload);
    const authData = authRes?.dataSec?.data;
    if (!authData || !authData.cle) {
      throw new Error('Échec de l’authentification. Vérifiez le code PIN ou regénérez un QR Code (validité 10 min).');
    }

    // Key change: decrypt cle with authKey, then MD5(parsedBytes) becomes the session key for all subsequent calls!
    const cleCiphertext = CryptoJS.enc.Hex.parse(authData.cle);
    const decryptedCle = CryptoJS.AES.decrypt({ ciphertext: cleCiphertext } as any, authKey, {
      iv: this.encryption.aesIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);

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
    const primaryPeriod = this.resolveActivePeriod();
    const periodsToTry = [primaryPeriod];
    for (const p of this.periods) {
      if (p.id !== primaryPeriod.id && !periodsToTry.some((x) => x.id === p.id)) {
        periodsToTry.push(p);
      }
    }

    let grades: Grade[] = [];
    let averages: SubjectAverage[] = [];
    let generalAverage = 0;

    for (const period of periodsToTry) {
      try {
        const notesRes = await this.postRpc('DernieresNotes', 198, {
          Periode: { N: period.id, L: period.name },
        });
        const notesData = notesRes?.dataSec?.data;
        if (!notesData) continue;

        let curGeneralAvg = 0;
        const rawMoyGen = notesData?.moyGenerale?.V || notesData?.moyGenerale;
        if (rawMoyGen && typeof rawMoyGen === 'string') {
          const parsedAvg = parseFloat(rawMoyGen.replace(',', '.'));
          if (!isNaN(parsedAvg) && parsedAvg > 0) curGeneralAvg = parsedAvg;
        } else if (typeof rawMoyGen === 'number' && rawMoyGen > 0) {
          curGeneralAvg = rawMoyGen;
        }

        const curAverages: SubjectAverage[] = [];
        const rawServices = notesData?.listeServices?.V || notesData?.listeServices || [];
        if (Array.isArray(rawServices)) {
          rawServices.forEach((s: any, idx: number) => {
            const subject = s?.L || s?.libelle || 'Matière';
            const rawAvg = s?.moyEleve?.V !== undefined ? s.moyEleve.V : s?.moyEleve;
            const avgStr = String(rawAvg || '').replace(',', '.');
            const avgNum = parseFloat(avgStr);

            const rawClassAvg = s?.moyClasse?.V !== undefined ? s.moyClasse.V : s?.moyClasse;
            const classAvgStr = String(rawClassAvg || '').replace(',', '.');
            const classAvgNum = parseFloat(classAvgStr);

            if (!isNaN(avgNum)) {
              curAverages.push({
                id: `avg-${s?.N || s?.id || idx}-${subject}`,
                subject,
                average: avgNum,
                classAverage: !isNaN(classAvgNum) ? classAvgNum : undefined,
                color: s?.couleur ? (String(s.couleur).startsWith('#') ? s.couleur : `#${s.couleur}`) : undefined,
              });
            }
          });
        }

        const curGrades: Grade[] = [];
        const rawNotes = notesData?.listeDevoirs?.V || notesData?.listeDevoirs || [];
        if (Array.isArray(rawNotes)) {
          rawNotes.forEach((g: any, idx: number) => {
            const rawVal = g?.note?.V !== undefined ? g.note.V : g?.note;
            const valStr = String(rawVal || '').replace(',', '.');
            if (valStr.startsWith('|') || isNaN(parseFloat(valStr))) return;
            const valNum = parseFloat(valStr);

            const rawBareme = g?.bareme?.V !== undefined ? g.bareme.V : g?.bareme;
            const outOfStr = String(rawBareme || '20').replace(',', '.');
            const outOfNum = parseFloat(outOfStr) || 20;

            const rawCoeff = g?.coefficient?.V !== undefined ? g.coefficient.V : g?.coefficient;
            const coeffNum = parseFloat(String(rawCoeff || '1').replace(',', '.')) || 1;

            const rawDate = g?.date?.V || g?.date || new Date().toISOString().split('T')[0];
            let formattedDate = String(rawDate);
            if (formattedDate.includes('/')) {
              const [d, m, y] = formattedDate.split(' ')[0].split('/');
              if (d && m && y) formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }

            const rawComment = g?.commentaire?.V || g?.commentaire || g?.titre || g?.service?.V?.L || 'Évaluation';
            const description = cleanPronoteHtml(rawComment) || 'Évaluation';

            const rawClassAvg = g?.moyenne?.V !== undefined ? g.moyenne.V : g?.moyenne;
            const classAvg = parseFloat(String(rawClassAvg || '').replace(',', '.')) || undefined;

            curGrades.push({
              id: `g-real-${g?.N || g?.id || idx}`,
              subject: g?.service?.V?.L || g?.service?.L || g?.matiere || 'Évaluation',
              value: valNum,
              outOf: outOfNum,
              coefficient: coeffNum,
              date: formattedDate,
              description,
              classAverage: classAvg,
            });
          });
        }

        // Calculate general average if missing from server
        if (curGeneralAvg === 0) {
          if (curAverages.length > 0) {
            const sum = curAverages.reduce((acc, a) => acc + a.average, 0);
            curGeneralAvg = Math.round((sum / curAverages.length) * 100) / 100;
          } else if (curGrades.length > 0) {
            let totalWeighted = 0;
            let totalCoeffs = 0;
            for (const gr of curGrades) {
              const normalized = (gr.value / gr.outOf) * 20;
              totalWeighted += normalized * gr.coefficient;
              totalCoeffs += gr.coefficient;
            }
            if (totalCoeffs > 0) {
              curGeneralAvg = Math.round((totalWeighted / totalCoeffs) * 100) / 100;
            }
          }
        }

        if (curGrades.length > 0 || curAverages.length > 0) {
          grades = curGrades;
          averages = curAverages;
          generalAverage = curGeneralAvg;
          break; // Found period with grades!
        }
      } catch (err) {
        console.warn(`Erreur lors de la récupération des notes pour période ${period.name}:`, err);
      }
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

      const coursList = edtRes?.dataSec?.data?.ListeCours?.V || edtRes?.dataSec?.data?.ListeCours || [];
      if (Array.isArray(coursList)) {
        coursList.forEach((c: any, idx: number) => {
          let subject = '';
          let teacher = '';
          let room = '';

          // Pronote stores subject (G: 16), teacher (G: 3), room (G: 17) in ListeContenus
          const contents = c?.ListeContenus?.V || c?.ListeContenus;
          if (Array.isArray(contents)) {
            for (const item of contents) {
              if (item?.G === 16 && item?.L) {
                subject = subject ? `${subject} / ${item.L}` : item.L;
              } else if (item?.G === 3 && item?.L) {
                teacher = teacher ? `${teacher}, ${item.L}` : item.L;
              } else if (item?.G === 17 && item?.L) {
                room = room ? `${room}, ${item.L}` : item.L;
              }
            }
          }

          // Fallbacks for alternative formats
          if (!subject) {
            subject = c?.Matiere?.V?.L || c?.Matiere?.L || c?.service?.V?.L || c?.service?.L || c?.matiere || 'Cours';
          }
          if (!teacher) {
            teacher = c?.Professeur?.V?.L || c?.Professeur?.L || c?.ListeProfesseurs?.V?.[0]?.L || c?.professeur || 'Enseignant';
          }
          if (!room) {
            room = c?.Salle?.V?.L || c?.Salle?.L || c?.ListeSalles?.V?.[0]?.L || c?.salle || 'Salle';
          }

          let startTime = '08:00';
          let endTime = '09:00';
          let isoDate = '';

          if (c?.DateDuCours?.V) {
            const parts = String(c.DateDuCours.V).trim().split(' ');
            const datePart = parts[0]; // "21/11/2026"
            const timePart = parts[1] || '08:00:00';
            const [d, m, y] = datePart.split('/').map(Number);
            const [hh, mm] = timePart.split(':').map(Number);

            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
              isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
            if (!isNaN(hh) && !isNaN(mm)) {
              startTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
              const dt = new Date(y, m - 1, d, hh, mm);

              const endStr = c?.DateFinDuCours?.V || c?.DateDuCoursFin?.V || c?.DateFin?.V;
              if (endStr) {
                const endParts = String(endStr).trim().split(' ');
                const endT = endParts[1] || endParts[0];
                if (endT && endT.includes(':')) {
                  endTime = endT.substring(0, 5);
                }
              } else {
                let durMinutes = 60;
                if (typeof c?.duree === 'number') {
                  if (c.duree >= 15) {
                    durMinutes = c.duree;
                  } else if (c.duree > 0) {
                    durMinutes = c.duree <= 4 ? c.duree * 60 : c.duree;
                  }
                }
                const endDt = new Date(dt.getTime() + durMinutes * 60 * 1000);
                endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;
              }
            }
          }

          let color = c?.CouleurFond;
          if (color && typeof color === 'string' && !color.startsWith('#')) {
            color = `#${color}`;
          }

          let status: 'normal' | 'cancelled' | 'modified' = 'normal';
          const statText = String(c?.Statut || '');
          if (c?.estAnnule || c?.dispense || /annul|absent/i.test(statText)) {
            status = 'cancelled';
          } else if (c?.estModifie || /modifi|d[eé]plac/i.test(statText)) {
            status = 'modified';
          }

          timetable.push({
            id: `tt-real-${c?.N || c?.id || idx}`,
            subject,
            teacher,
            room,
            startTime,
            endTime,
            date: isoDate,
            status,
            color,
          });
        });

        // Sort chronologically by date then startTime
        timetable.sort((a, b) => {
          if (a.date && b.date && a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
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

      const rawHwList = hwRes?.dataSec?.data?.ListeTravauxAFaire?.V || hwRes?.dataSec?.data?.ListeTravauxAFaire || [];
      if (Array.isArray(rawHwList)) {
        rawHwList.forEach((h: any, idx: number) => {
          const rawDesc = h?.descriptif?.V || h?.descriptif || 'Devoir Pronote';
          const cleanDesc = cleanPronoteHtml(rawDesc);

          const firstLine = cleanDesc.split('\n')[0] || cleanDesc;
          const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;

          const subject = h?.Matiere?.V?.L || h?.Matiere?.L || h?.service?.V?.L || h?.service?.L || 'Matière';

          let dueDate = h?.PourLe?.V || h?.PourLe || 'Bientôt';
          if (typeof dueDate === 'string' && dueDate.includes(' ')) {
            dueDate = dueDate.split(' ')[0];
          }

          homework.push({
            id: `hw-real-${h?.N || h?.id || idx}`,
            subject,
            title: title || 'Devoir Pronote',
            description: cleanDesc,
            dueDate,
            isPersonal: false,
            completed: Boolean(h?.TAFFait),
            subtasks: [],
          });
        });
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des devoirs:', err);
    }

    // 12. Fetch Announcements & Messages (PageActualites on onglet 8)
    const messages: PronoteMessage[] = [];
    try {
      const actRes = await this.postRpc('PageActualites', 8, {
        domaine: { _T: 8, V: '[0..15]' },
      });
      const actData = actRes?.dataSec?.data;
      if (actData) {
        const rawActs =
          actData?.listeActualites?.V ||
          actData?.listeActualites ||
          actData?.listeInformations?.V ||
          actData?.listeInformations ||
          [];

        if (Array.isArray(rawActs)) {
          rawActs.forEach((act: any, idx: number) => {
            const author = act?.auteur?.V || act?.auteur?.L || act?.auteur || act?.emetteur || 'Vie Scolaire';
            const subject = act?.L?.V || act?.L || act?.titre || 'Information établissement';
            const rawContent = act?.texte?.V || act?.texte || act?.descriptif || '';
            const content = cleanPronoteHtml(rawContent) || subject;
            let date = act?.dateCreation?.V || act?.dateCreation || act?.date?.V || act?.date || 'Récemment';
            if (typeof date === 'string' && date.includes(' ')) {
              date = date.split(' ')[0];
            }

            let category = 'Vie Scolaire';
            let avatarColor = '#10B981';
            const lowerAuth = String(author).toLowerCase();
            if (lowerAuth.includes('prof') || lowerAuth.includes('m.') || lowerAuth.includes('mme')) {
              category = 'Professeur';
              avatarColor = '#38BDF8';
            } else if (lowerAuth.includes('direct') || lowerAuth.includes('proviseur')) {
              category = 'Direction';
              avatarColor = '#F59E0B';
            }

            messages.push({
              id: `msg-qr-${act?.N || act?.id || idx}`,
              author: String(author),
              subject: String(subject),
              content,
              date: String(date),
              read: Boolean(act?.lue?.V ?? act?.lue ?? true),
              category,
              avatarColor,
            });
          });
        }
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des actualités Pronote:', err);
    }

    return {
      user,
      grades,
      averages,
      generalAverage,
      homework: sortHomeworkByDueDate(homework),
      timetable,
      messages,
    };
  }
}
