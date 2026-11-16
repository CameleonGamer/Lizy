import { Grade, Homework, TimetableLesson, SubjectAverage } from '@/types';

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
      if (donnees?.moyenneGenerale) {
        const valStr = String(donnees.moyenneGenerale).replace(',', '.');
        const num = parseFloat(valStr);
        if (!isNaN(num)) generalAverage = num;
      }

      // Extract Subject Averages (listeServices)
      const services = donnees?.listeServices || donnees?.services;
      if (Array.isArray(services)) {
        services.forEach((s: any, idx: number) => {
          const subject = s?.L || s?.libelle || `Matière ${idx + 1}`;
          const avgStr = String(s?.moyenne || s?.moyenneEleve || s?.moyenneClasse || '0').replace(',', '.');
          const avgNum = parseFloat(avgStr);
          const classAvgStr = String(s?.moyenneClasse || '0').replace(',', '.');
          const classAvgNum = parseFloat(classAvgStr);

          if (!isNaN(avgNum) && avgNum > 0) {
            averages.push({
              subject,
              average: avgNum,
              classAverage: !isNaN(classAvgNum) ? classAvgNum : undefined,
              color: s?.couleur || undefined,
            });
          }
        });
      }

      // Extract individual Grades (listeNotes)
      const rawNotes = donnees?.listeDevoirs || donnees?.listeNotes || donnees?.notes;
      if (Array.isArray(rawNotes)) {
        rawNotes.forEach((n: any, idx: number) => {
          const valStr = String(n?.note || n?.valeur || n?.V || '').replace(',', '.');
          const val = parseFloat(valStr);
          if (!isNaN(val) && val <= 20) {
            const outOfStr = String(n?.bareme || n?.noteSur || '20').replace(',', '.');
            const outOf = parseFloat(outOfStr) || 20;

            grades.push({
              id: `g-real-${n?.id || idx}`,
              subject: n?.service?.L || n?.matiere || 'Évaluation',
              value: val,
              outOf,
              coefficient: parseFloat(String(n?.coefficient || '1').replace(',', '.')) || 1,
              date: n?.date || new Date().toISOString().split('T')[0],
              description: n?.commentaire || n?.titre || 'Évaluation',
              classAverage: parseFloat(String(n?.moyenne || '').replace(',', '.')) || undefined,
            });
          }
        });
      }

      if (generalAverage === 0 && averages.length > 0) {
        const sum = averages.reduce((acc, a) => acc + a.average, 0);
        generalAverage = Math.round((sum / averages.length) * 100) / 100;
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
          const title = h?.descriptif || h?.L || h?.titre || 'Devoir Pronote';
          const subject = h?.Matiere?.L || h?.matiere || h?.service?.L || 'Matière';
          const dueDate = h?.PourLe?.V || h?.dateEcheance || h?.date || 'Bientôt';

          list.push({
            id: `hw-real-${h?.id || idx}`,
            subject,
            title,
            description: h?.descriptif || title,
            dueDate,
            isPersonal: false,
            completed: Boolean(h?.effectue || h?.fait),
            subtasks: [],
          });
        });
      }
    } catch {}
    return list;
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
          list.push({
            id: `tt-real-${c?.id || idx}`,
            subject: c?.Matiere?.L || c?.matiere || 'Cours',
            teacher: c?.Professeur?.L || c?.professeur || 'Enseignant',
            room: c?.Salle?.L || c?.salle || 'Salle',
            startTime: c?.heureDebut || '08:00',
            endTime: c?.heureFin || '09:00',
            status: c?.annule ? 'cancelled' : 'normal',
            color: c?.couleur,
          });
        });
      }
    } catch {}
    return list;
  },
};
