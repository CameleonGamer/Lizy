import { Grade, Homework, TimetableLesson, SubjectAverage, PronoteMessage } from '@/types';
import { cleanPronoteHtml } from '../utils/htmlSanitizer';
import { sortHomeworkByDueDate } from '../utils/dateUtils';

export { cleanPronoteHtml };

/**
 * Universal parser for Pronote raw JSON-RPC responses
 * Pronote encodes collections with { _T: number, V: Array | Object | string }
 */
export const PronoteParser = {
  /**
   * Unwraps Pronote custom { _T, V } wrappers
   */
  unwrap(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object' && 'V' in obj) {
      return this.unwrap(obj.V);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.unwrap(item));
    }
    return obj;
  },

  /**
   * Parses student identity from Pronote session or identification response
   */
  parseUser(raw: any): { name: string; studentClass: string; establishment: string } | null {
    try {
      const data = this.unwrap(raw);
      const res = {
        name: '',
        studentClass: '',
        establishment: '',
      };

      if (data?.donneesSecurite?.nomUtilisateur) {
        res.name = data.donneesSecurite.nomUtilisateur;
      }
      if (data?.donneesSecurite?.libelleClasse) {
        res.studentClass = data.donneesSecurite.libelleClasse;
      }
      if (data?.donneesSecurite?.libelleEtablissement) {
        res.establishment = data.donneesSecurite.libelleEtablissement;
      }

      // Check alternative paths
      if (!res.name && data?.ressource?.L) {
        res.name = data.ressource.L;
      }

      return res.name ? res : null;
    } catch {
      return null;
    }
  },

  /**
   * Parses notes and averages from Pronote JSON
   */
  parseGrades(raw: any): {
    grades: Grade[];
    averages: SubjectAverage[];
    generalAverage: number;
  } {
    const grades: Grade[] = [];
    const averages: SubjectAverage[] = [];
    let generalAverage = 0;

    try {
      const unwrapped = this.unwrap(raw);
      const donnees = unwrapped?.donnees || unwrapped;

      // Extract General Average
      const rawGenAvg = donnees?.moyenneGenerale || donnees?.moyGenerale;
      if (rawGenAvg) {
        const valStr = String(rawGenAvg).replace(',', '.');
        const num = parseFloat(valStr);
        if (!isNaN(num) && num > 0) generalAverage = num;
      }

      // Extract Subject Averages (listeServices)
      const services = donnees?.listeServices || donnees?.services;
      if (Array.isArray(services)) {
        services.forEach((s: any, idx: number) => {
          const subject = s?.L || s?.libelle || `Matière ${idx + 1}`;
          const rawAvg = s?.moyEleve !== undefined ? s.moyEleve : (s?.moyenne || s?.moyenneEleve);
          const avgStr = String(rawAvg || '').replace(',', '.');
          const avgNum = parseFloat(avgStr);

          const rawClassAvg = s?.moyClasse !== undefined ? s.moyClasse : s?.moyenneClasse;
          const classAvgStr = String(rawClassAvg || '').replace(',', '.');
          const classAvgNum = parseFloat(classAvgStr);

          if (!isNaN(avgNum)) {
            averages.push({
              id: `avg-${s?.N || s?.id || idx}-${subject}`,
              subject,
              average: avgNum,
              classAverage: !isNaN(classAvgNum) ? classAvgNum : undefined,
              color: s?.couleur ? (String(s.couleur).startsWith('#') ? s.couleur : `#${s.couleur}`) : undefined,
            });
          }
        });
      }

      // Extract individual Grades (listeDevoirs / listeNotes)
      const rawNotes = donnees?.listeDevoirs || donnees?.listeNotes || donnees?.notes;
      if (Array.isArray(rawNotes)) {
        rawNotes.forEach((n: any, idx: number) => {
          const rawVal = n?.note !== undefined ? n.note : (n?.valeur || n?.V);
          const valStr = String(rawVal || '').replace(',', '.');
          if (valStr.startsWith('|') || isNaN(parseFloat(valStr))) return;
          const val = parseFloat(valStr);

          const rawBareme = n?.bareme !== undefined ? n.bareme : (n?.noteSur || '20');
          const outOfStr = String(rawBareme || '20').replace(',', '.');
          const outOf = parseFloat(outOfStr) || 20;

          const rawCoeff = n?.coefficient !== undefined ? n.coefficient : '1';
          const coeff = parseFloat(String(rawCoeff || '1').replace(',', '.')) || 1;

          const rawComment = n?.commentaire || n?.titre || n?.service?.L || 'Évaluation';
          const description = cleanPronoteHtml(rawComment) || 'Évaluation';

          const rawClassAvg = n?.moyenne !== undefined ? n.moyenne : undefined;
          const classAvg = rawClassAvg ? parseFloat(String(rawClassAvg).replace(',', '.')) : undefined;

          grades.push({
            id: `g-real-${n?.id || n?.N || idx}`,
            subject: n?.service?.L || n?.matiere || 'Évaluation',
            value: val,
            outOf,
            coefficient: coeff,
            date: n?.date || new Date().toISOString().split('T')[0],
            description,
            classAverage: !isNaN(classAvg as number) ? classAvg : undefined,
          });
        });
      }

      // Compute general average if omitted
      if (generalAverage === 0) {
        if (averages.length > 0) {
          const sum = averages.reduce((acc, a) => acc + a.average, 0);
          generalAverage = Math.round((sum / averages.length) * 100) / 100;
        } else if (grades.length > 0) {
          let totalPts = 0;
          let totalCoeffs = 0;
          for (const gr of grades) {
            totalPts += (gr.value / gr.outOf) * 20 * gr.coefficient;
            totalCoeffs += gr.coefficient;
          }
          if (totalCoeffs > 0) {
            generalAverage = Math.round((totalPts / totalCoeffs) * 100) / 100;
          }
        }
      }
    } catch {}

    return { grades, averages, generalAverage };
  },

  /**
   * Parses homework list from Pronote JSON
   */
  parseHomework(raw: any): Homework[] {
    const list: Homework[] = [];
    try {
      const unwrapped = this.unwrap(raw);
      const donnees = unwrapped?.donnees || unwrapped;
      const rawHw = donnees?.listeDevoirs || donnees?.listeTravauxAFaire || donnees;

      if (Array.isArray(rawHw)) {
        rawHw.forEach((h: any, idx: number) => {
          const rawDesc = h?.descriptif || h?.L || h?.titre || 'Devoir Pronote';
          const cleanDesc = cleanPronoteHtml(rawDesc);

          const firstLine = cleanDesc.split('\n')[0] || cleanDesc;
          const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;

          const subject = h?.Matiere?.L || h?.matiere || h?.service?.L || 'Matière';
          let dueDate = h?.PourLe?.V || h?.dateEcheance || h?.date || 'Bientôt';
          if (typeof dueDate === 'string' && dueDate.includes(' ')) {
            dueDate = dueDate.split(' ')[0];
          }

          list.push({
            id: `hw-real-${h?.id || h?.N || idx}`,
            subject,
            title: title || 'Devoir Pronote',
            description: cleanDesc,
            dueDate,
            isPersonal: false,
            completed: Boolean(h?.effectue || h?.fait || h?.TAFFait),
            subtasks: [],
          });
        });
      }
    } catch {}
    return sortHomeworkByDueDate(list);
  },

  /**
   * Parses timetable from Pronote JSON
   */
  parseTimetable(raw: any): TimetableLesson[] {
    const list: TimetableLesson[] = [];
    try {
      const unwrapped = this.unwrap(raw);
      const donnees = unwrapped?.donnees || unwrapped;
      const rawLessons = donnees?.listeCours || donnees?.cours;

      if (Array.isArray(rawLessons)) {
        rawLessons.forEach((c: any, idx: number) => {
          let subject = '';
          let teacher = '';
          let room = '';

          // Parse Pronote ListeContenus (G: 16 Subject, G: 3 Teacher, G: 17 Room)
          const contents = c?.ListeContenus;
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

          if (!subject) subject = c?.Matiere?.L || c?.matiere || c?.service?.L || 'Cours';
          if (!teacher) teacher = c?.Professeur?.L || c?.professeur || 'Enseignant';
          if (!room) room = c?.Salle?.L || c?.salle || 'Salle';

          let startTime = c?.heureDebut || '08:00';
          let endTime = c?.heureFin || '09:00';
          let dateStr = c?.date || '';

          if (c?.DateDuCours) {
            const parts = String(c.DateDuCours).trim().split(' ');
            if (parts[0] && parts[0].includes('/')) {
              const [d, m, y] = parts[0].split('/').map(Number);
              if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              }
            }
            if (parts[1]) {
              startTime = parts[1].substring(0, 5);
            }
          }

          list.push({
            id: `tt-real-${c?.id || c?.N || idx}`,
            subject,
            teacher,
            room,
            startTime,
            endTime,
            date: dateStr,
            status: c?.annule || c?.estAnnule ? 'cancelled' : 'normal',
            color: c?.couleur || c?.CouleurFond,
          });
        });

        // Sort chronologically
        list.sort((a, b) => {
          if (a.date && b.date && a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
        });
      }
    } catch {}
    return list;
  },

  /**
   * Parses official communications, announcements, and messages from Pronote JSON
   */
  parseMessages(raw: any): PronoteMessage[] {
    const list: PronoteMessage[] = [];
    try {
      const unwrapped = this.unwrap(raw);
      const donnees = unwrapped?.donnees || unwrapped?.data || unwrapped;

      // 1. Check for listeActualites / listeInformations / listeSondages
      const rawActs =
        donnees?.listeActualites ||
        donnees?.listeInformations ||
        donnees?.actualites ||
        donnees?.informations ||
        [];

      if (Array.isArray(rawActs)) {
        rawActs.forEach((act: any, idx: number) => {
          const author = act?.auteur?.L || act?.auteur || act?.emetteur || act?.service || 'Vie Scolaire';
          const subject = act?.L || act?.titre || act?.objet || 'Information établissement';
          const rawContent = act?.texte || act?.descriptif || act?.contenu || '';
          const content = cleanPronoteHtml(rawContent) || 'Information de votre établissement.';

          let date = act?.dateCreation || act?.date || act?.dateDebut || 'Récemment';
          if (typeof date === 'string' && date.includes(' ')) {
            date = date.split(' ')[0];
          }

          let category = 'Vie Scolaire';
          let avatarColor = '#10B981';
          const lowerAuth = String(author).toLowerCase();
          if (lowerAuth.includes('prof') || lowerAuth.includes('m.') || lowerAuth.includes('mme')) {
            category = 'Professeur';
            avatarColor = '#38BDF8';
          } else if (lowerAuth.includes('direct') || lowerAuth.includes('proviseur') || lowerAuth.includes('principal')) {
            category = 'Direction';
            avatarColor = '#F59E0B';
          }

          list.push({
            id: `msg-act-${act?.N || act?.id || idx}`,
            author: String(author),
            subject: String(subject),
            content,
            date: String(date),
            read: Boolean(act?.lue ?? act?.estLu ?? false),
            category,
            avatarColor,
          });
        });
      }

      // 2. Check for listeDiscussions / listeMessagerie / listeMessages
      const rawDiscussions =
        donnees?.listeDiscussions ||
        donnees?.discussions ||
        donnees?.listeMessages ||
        [];

      if (Array.isArray(rawDiscussions)) {
        rawDiscussions.forEach((disc: any, idx: number) => {
          const author = disc?.intervenant?.L || disc?.intervenants || disc?.auteur || disc?.destinataire || 'Enseignant';
          const subject = disc?.L || disc?.objet || disc?.theme || 'Discussion Pronote';
          const lastMsg = Array.isArray(disc?.listeMessages) && disc.listeMessages.length > 0
            ? disc.listeMessages[disc.listeMessages.length - 1]
            : null;

          const rawContent = lastMsg?.texte || disc?.dernierMessage || disc?.texte || '';
          const content = cleanPronoteHtml(rawContent) || 'Message Pronote';

          let date = lastMsg?.date || disc?.date || disc?.dateDernierMessage || 'Récemment';
          if (typeof date === 'string' && date.includes(' ')) {
            date = date.split(' ')[0];
          }

          list.push({
            id: `msg-disc-${disc?.N || disc?.id || idx}`,
            author: String(author),
            subject: String(subject),
            content,
            date: String(date),
            read: Boolean(disc?.lu ?? (disc?.nbNonLus === 0)),
            category: 'Discussion',
            avatarColor: '#818CF8',
          });
        });
      }
    } catch {}
    return list;
  },
};
