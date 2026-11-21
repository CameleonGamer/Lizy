import { SubjectAverage, Grade } from '@/types';

export interface SubjectInsight {
  subject: string;
  average: number;
  classAverage?: number;
  delta: number; // average - classAverage
  coefficient: number;
  status: 'excellence' | 'solid' | 'priority' | 'critical';
  impactPotential: number; // Potential general average increase if boosted by 2 points
  strategicRank: number; // 1 to N
  advice: string;
  actionItems: string[];
}

export interface AcademicDiagnosis {
  strengths: SubjectInsight[];
  solidSubjects: SubjectInsight[];
  improvementPriorities: SubjectInsight[];
  top3StrategicLevers: SubjectInsight[];
  overallSummary: string;
}

const SUBJECT_ADVICE_DATABASE: Record<
  string,
  {
    low: { advice: string; actions: string[] };
    mid: { advice: string; actions: string[] };
    high: { advice: string; actions: string[] };
  }
> = {
  math: {
    low: {
      advice: 'Revois les automatismes fondamentaux et les définitions de cours avant de t’attaquer aux problèmes.',
      actions: ['Refaire les exercices d’application directe', 'Créer une fiche avec 1 exemple par formule clé', 'Travailler par blocs de 25 min sans calculatrice'],
    },
    mid: {
      advice: 'La compréhension globale est là, mais les erreurs d’inattention ou de rigueur te coûtent des points précieux.',
      actions: ['Soigner la rédaction des démonstrations', 'Prendre 5 minutes à la fin de chaque devoir pour recalculer les valeurs limites', 'Repérer les questions types qui tombent à chaque DS'],
    },
    high: {
      advice: 'Excellente maîtrise. Vise la perfection en t’entraînant sur des exercices d’approfondissement et des annales.',
      actions: ['Tester des problèmes de concours ou défis', 'Aider un camarade pour consolider la clarté de tes explications', 'Optimiser ta rapidité de calcul'],
    },
  },
  phys: {
    low: {
      advice: 'Assure-toi de bien relier les formules mathématiques aux phénomènes physiques concrets.',
      actions: ['Toujours vérifier les unités et les ordres de grandeur', 'Mémoriser le protocole des TP types', 'Apprendre par cœur les définitions de grandeurs'],
    },
    mid: {
      advice: 'Tu maîtrises le cours théorique, mais l’application aux protocoles expérimentaux ou problèmes complexes peut progresser.',
      actions: ['Analyser systématiquement la consigne par mots-clés', 'Détailler les étapes de calcul littéral avant l’application numérique', 'Revoir les graphiques et coefficients directeurs'],
    },
    high: {
      advice: 'Très bon niveau. Renforce l’esprit critique et la finesse d’analyse sur les incertitudes de mesure.',
      actions: ['Approfondir la physique ondulatoire et quantique', 'Soigner les schémas légendés avec couleurs', 'Conserver une rigueur maximale sur les chiffres significatifs'],
    },
  },
  french: {
    low: {
      advice: 'Structure tes idées : une copie organisée avec des transitions claires gagne immédiatement 3 à 4 points.',
      actions: ['Schématiser chaque plan en 3 axes et 3 sous-parties', 'Mémoriser 5 figures de style indispensables', 'Relire pour corriger accords et ponctuation'],
    },
    mid: {
      advice: 'La méthode du commentaire ou de la dissertation est acquise, il te reste à enrichir le vocabulaire critique.',
      actions: ['Varier les verbes d’analyse (suggère, dépeint, souligne)', 'Citer le texte précisément et commenter chaque mot-clé', 'Créer un carnet de citations littéraires marquantes'],
    },
    high: {
      advice: 'Style remarquable et finesse d’analyse. Travaille la problématique pour la rendre encore plus percutante.',
      actions: ['Ouvrir la conclusion sur d’autres œuvres ou mouvements artistiques', 'Affiner les nuances de registre', 'Partager tes analyses avec ton enseignant'],
    },
  },
  history: {
    low: {
      advice: 'Repère les grands repères chronologiques et le vocabulaire spécifique de chaque chapitre.',
      actions: ['Construire une frise chronologique murale avec 10 dates clés', 'Maîtriser les notions du programme', 'S’entraîner à lire les légendes des cartes de géo'],
    },
    mid: {
      advice: 'Les faits sont connus, mais il faut mieux articuler causes, déroulement et conséquences.',
      actions: ['Introduire chaque paragraphe par une phrase directrice', 'Équilibrer l’histoire et la géographie dans tes révisions', 'Illustrer chaque argument par un exemple historique précis'],
    },
    high: {
      advice: 'Culture historique solide et esprit de synthèse aiguisé. Approfondis l’historiographie.',
      actions: ['Croiser les sources et points de vue d’historiens', 'Réaliser des croquis de géographie d’une propreté exemplaire', 'Anticiper les sujets transversaux'],
    },
  },
  languages: {
    low: {
      advice: 'La clé est la régularité quotidienne plutôt que des sessions intensives rares.',
      actions: ['10 minutes de vocabulaire tous les jours avec répétition espacée', 'Mémoriser les verbes irréguliers et connecteurs logiques de base', 'Passer son téléphone ou ses séries en VO sous-titrée VO'],
    },
    mid: {
      advice: 'Bonne compréhension globale. Libère-toi à l’écrit et à l’oral avec des tournures idiomatiques plus riches.',
      actions: ['Utiliser au moins 3 connecteurs logiques variés par paragraphe', 'Écouter un podcast de 10 min en langue cible chaque matin', 'Relever les expressions idiomatiques courantes'],
    },
    high: {
      advice: 'Niveau d’aisance remarquable. Vise le bilinguisme académique.',
      actions: ['Lire des articles de presse internationale (BBC, El País, Der Spiegel)', 'Rédiger des synthèses complètes sans dictionnaire', 'Participer activement à chaque cours pour booster l’oral'],
    },
  },
  default: {
    low: {
      advice: 'Consolide les bases du cours en reprenant systématiquement les corrections des devoirs précédents.',
      actions: ['Repérer les erreurs récurrentes dans les copies', 'Poser des questions dès qu’une notion reste floue', 'Faire des fiches résumées en fin de chaque semaine'],
    },
    mid: {
      advice: 'Niveau satisfaisant avec une bonne marge de progression pour basculer vers les mentions.',
      actions: ['Approfondir la méthodologie d’examen', 'Travailler la gestion du temps pendant les contrôles', 'Anticiper les devoirs 3 jours à l’avance'],
    },
    high: {
      advice: 'Excellents résultats, matière pilier de ton bulletin. Maintiens cette dynamique.',
      actions: ['Maintenir la régularité sans relâcher l’effort', 'Explorer des lectures complémentaires', 'Partager tes méthodes avec ta classe'],
    },
  },
};

function matchSubjectKey(subject: string): string {
  const norm = subject.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('math')) return 'math';
  if (norm.includes('phys') || norm.includes('chim')) return 'phys';
  if (norm.includes('franc') || norm.includes('lettr') || norm.includes('litt')) return 'french';
  if (norm.includes('hist') || norm.includes('geo') || norm.includes('hggsp') || norm.includes('ses')) return 'history';
  if (norm.includes('angl') || norm.includes('espag') || norm.includes('allem') || norm.includes('ital') || norm.includes('llce')) return 'languages';
  return 'default';
}

export const PerformanceAnalyzer = {
  /**
   * Generates complete academic diagnosis and strategic levers
   */
  diagnose(averages: SubjectAverage[], grades: Grade[]): AcademicDiagnosis {
    if (!averages || averages.length === 0) {
      return {
        strengths: [],
        solidSubjects: [],
        improvementPriorities: [],
        top3StrategicLevers: [],
        overallSummary: 'Aucune donnée disponible pour le moment.',
      };
    }

    // Estimate coefficients from grades if available, default to 1.5
    const coeffMap: Record<string, number> = {};
    for (const g of grades) {
      if (g.coefficient && (!coeffMap[g.subject] || g.coefficient > coeffMap[g.subject])) {
        coeffMap[g.subject] = g.coefficient;
      }
    }

    const totalCoeff = averages.reduce((sum, a) => sum + (coeffMap[a.subject] || 1.5), 0) || 1;

    const insights: SubjectInsight[] = averages.map((a) => {
      const coeff = coeffMap[a.subject] || 1.5;
      const classAvg = a.classAverage ?? a.average;
      const delta = a.average - classAvg;

      // Status
      let status: SubjectInsight['status'] = 'solid';
      if (a.average >= 15) status = 'excellence';
      else if (a.average >= 13) status = 'solid';
      else if (a.average >= 10) status = 'priority';
      else status = 'critical';

      // Impact potential: gain on general average if this subject increases by +2 points
      const potentialPoints = Math.min(20 - a.average, 2.0);
      const impactPotential = (potentialPoints * coeff) / totalCoeff;

      // Matching advice
      const subKey = matchSubjectKey(a.subject);
      const subCategory = SUBJECT_ADVICE_DATABASE[subKey] || SUBJECT_ADVICE_DATABASE.default;
      const tier = a.average >= 14 ? subCategory.high : a.average >= 10 ? subCategory.mid : subCategory.low;

      return {
        subject: a.subject,
        average: a.average,
        classAverage: a.classAverage,
        delta,
        coefficient: coeff,
        status,
        impactPotential,
        strategicRank: 0,
        advice: tier.advice,
        actionItems: tier.actions,
      };
    });

    // Rank strategic levers: prioritize by highest impact potential + lower current average
    const sortedByStrategy = [...insights].sort((x, y) => {
      // Priority to subjects with high impact and room for improvement
      return y.impactPotential - x.impactPotential;
    });

    sortedByStrategy.forEach((item, idx) => {
      item.strategicRank = idx + 1;
    });

    const strengths = insights.filter((i) => i.status === 'excellence');
    const solidSubjects = insights.filter((i) => i.status === 'solid');
    const improvementPriorities = insights.filter((i) => i.status === 'priority' || i.status === 'critical');

    // Top 3 strategic levers
    const top3StrategicLevers = sortedByStrategy.slice(0, 3);

    // Dynamic Summary
    let overallSummary = '';
    if (strengths.length >= 3) {
      overallSummary = `Profil très solide soutenu par ${strengths.length} matières d'excellence. Concentre tes efforts sur ${top3StrategicLevers[0]?.subject || 'les matières clés'} pour débloquer la mention supérieure.`;
    } else if (improvementPriorities.length >= 2) {
      overallSummary = `Plusieurs leviers de progression identifiés. Un gain de +2 pts sur ${top3StrategicLevers[0]?.subject || 'tes priorités'} fera bondir ta moyenne générale de +${(top3StrategicLevers[0]?.impactPotential || 0.4).toFixed(2)} pt.`;
    } else {
      overallSummary = `Performances régulières et équilibrées. Travaille la rigueur et l'anticipation pour stabiliser tes notes au-dessus de la moyenne de classe.`;
    }

    return {
      strengths,
      solidSubjects,
      improvementPriorities,
      top3StrategicLevers,
      overallSummary,
    };
  },

  /**
   * Simulates the new general average if a given subject grade changes
   */
  simulateNewAverage(
    averages: SubjectAverage[],
    targetSubject: string,
    simulatedScore: number,
    grades: Grade[] = []
  ): { currentAverage: number; simulatedAverage: number; diff: number } {
    if (!averages || averages.length === 0) {
      return { currentAverage: 0, simulatedAverage: 0, diff: 0 };
    }

    const coeffMap: Record<string, number> = {};
    for (const g of grades) {
      if (g.coefficient && (!coeffMap[g.subject] || g.coefficient > coeffMap[g.subject])) {
        coeffMap[g.subject] = g.coefficient;
      }
    }

    let currentTotal = 0;
    let simulatedTotal = 0;
    let totalCoeff = 0;

    for (const a of averages) {
      const coeff = coeffMap[a.subject] || 1.5;
      totalCoeff += coeff;
      currentTotal += a.average * coeff;

      if (a.subject === targetSubject) {
        simulatedTotal += simulatedScore * coeff;
      } else {
        simulatedTotal += a.average * coeff;
      }
    }

    const currentAverage = Number((currentTotal / (totalCoeff || 1)).toFixed(2));
    const simulatedAverage = Number((simulatedTotal / (totalCoeff || 1)).toFixed(2));
    const diff = Number((simulatedAverage - currentAverage).toFixed(2));

    return {
      currentAverage,
      simulatedAverage,
      diff,
    };
  },
};
