import { create } from 'zustand';
import { Grade, Homework, TimetableLesson, PronoteMessage, SubjectAverage } from '@/types';

interface DataState {
  grades: Grade[];
  homework: Homework[];
  timetable: TimetableLesson[];
  messages: PronoteMessage[];
  averages: SubjectAverage[];
  generalAverage: number;
  toggleHomework: (id: string) => void;
  toggleSubtask: (homeworkId: string, subtaskId: string) => void;
  addPersonalHomework: (item: Omit<Homework, 'id' | 'isPersonal' | 'completed' | 'subtasks'>) => void;
  addTimetableEvent: (event: Omit<TimetableLesson, 'id' | 'isCustomEvent'>) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  generalAverage: 15.42,

  averages: [
    { subject: 'Mathématiques', average: 16.5, classAverage: 12.3, color: '#38BDF8' },
    { subject: 'Physique-Chimie', average: 14.8, classAverage: 13.1, color: '#818CF8' },
    { subject: 'Français', average: 13.9, classAverage: 12.0, color: '#F472B6' },
    { subject: 'Histoire-Géo', average: 17.2, classAverage: 14.2, color: '#FBBF24' },
    { subject: 'Anglais', average: 16.0, classAverage: 13.5, color: '#34D399' },
    { subject: 'SVT', average: 14.1, classAverage: 11.9, color: '#A78BFA' },
  ],

  grades: [
    {
      id: 'g-1',
      subject: 'Mathématiques',
      value: 18.0,
      outOf: 20,
      coefficient: 2,
      classAverage: 12.4,
      max: 20,
      min: 6,
      date: '2026-11-12',
      description: 'Devoir Surveillé - Équations différentielles',
    },
    {
      id: 'g-2',
      subject: 'Histoire-Géo',
      value: 17.5,
      outOf: 20,
      coefficient: 1.5,
      classAverage: 13.8,
      max: 19,
      min: 9,
      date: '2026-11-09',
      description: 'Composition - La Seconde Guerre Mondiale',
    },
    {
      id: 'g-3',
      subject: 'Anglais',
      value: 16.0,
      outOf: 20,
      coefficient: 1,
      classAverage: 14.0,
      max: 18.5,
      min: 8,
      date: '2026-11-04',
      description: 'Compréhension orale',
    },
  ],

  homework: [
    {
      id: 'hw-1',
      subject: 'Mathématiques',
      title: 'Exercices 42 et 45 page 188',
      description: 'Préparer la démonstration du théorème pour vendredi',
      dueDate: 'Demain',
      isPersonal: false,
      completed: false,
      estimatedMinutes: 30,
      subtasks: [
        { id: 'st-1', title: 'Faire exo 42', completed: true },
        { id: 'st-2', title: 'Faire exo 45', completed: false },
        { id: 'st-3', title: 'Relire le cours', completed: false },
      ],
    },
    {
      id: 'hw-2',
      subject: 'Physique-Chimie',
      title: 'Compte-rendu de TP n°4',
      description: 'Rédiger les conclusions sur l’absorbance',
      dueDate: 'Jeudi',
      isPersonal: false,
      completed: false,
      estimatedMinutes: 45,
      subtasks: [
        { id: 'st-4', title: 'Tracer le graphique', completed: false },
        { id: 'st-5', title: 'Rédiger analyse', completed: false },
      ],
    },
    {
      id: 'hw-3',
      subject: 'Personnel',
      title: 'Réviser le vocabulaire anglais',
      description: 'Fiche Quizlet 50 mots',
      dueDate: 'Ce soir',
      isPersonal: true,
      completed: true,
      estimatedMinutes: 20,
      subtasks: [],
    },
  ],

  timetable: [
    {
      id: 'tt-1',
      subject: 'Mathématiques',
      teacher: 'M. Dupont',
      room: 'B204',
      startTime: '08:00',
      endTime: '10:00',
      status: 'normal',
      color: '#38BDF8',
    },
    {
      id: 'tt-2',
      subject: 'Histoire-Géo',
      teacher: 'Mme Laurent',
      room: 'A102',
      startTime: '10:15',
      endTime: '11:15',
      status: 'normal',
      color: '#FBBF24',
    },
    {
      id: 'tt-3',
      subject: 'Physique-Chimie',
      teacher: 'M. Martin',
      room: 'Labo 1',
      startTime: '13:30',
      endTime: '15:30',
      status: 'modified',
      color: '#818CF8',
    },
    {
      id: 'tt-4',
      subject: 'Anglais',
      teacher: 'Mme Smith',
      room: 'B108',
      startTime: '15:45',
      endTime: '16:45',
      status: 'normal',
      color: '#34D399',
    },
  ],

  messages: [
    {
      id: 'msg-1',
      author: 'Vie Scolaire',
      subject: 'Absence justifiée',
      content: 'Le justificatif pour l’absence du 10/11 a été validé.',
      date: 'Hier',
      read: true,
    },
    {
      id: 'msg-2',
      author: 'M. Dupont (Maths)',
      subject: 'Information devoir surveillé',
      content: 'Calculatrices en mode examen obligatoires ce vendredi.',
      date: '14 Nov',
      read: false,
    },
  ],

  toggleHomework: (id: string) => {
    set((state) => ({
      homework: state.homework.map((hw) =>
        hw.id === id ? { ...hw, completed: !hw.completed } : hw
      ),
    }));
  },

  toggleSubtask: (homeworkId: string, subtaskId: string) => {
    set((state) => ({
      homework: state.homework.map((hw) => {
        if (hw.id !== homeworkId) return hw;
        return {
          ...hw,
          subtasks: hw.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }),
    }));
  },

  addPersonalHomework: (item) => {
    const newHw: Homework = {
      ...item,
      id: `hw-perso-${Date.now()}`,
      isPersonal: true,
      completed: false,
      subtasks: [],
    };
    set((state) => ({ homework: [newHw, ...state.homework] }));
  },

  addTimetableEvent: (event) => {
    const newLesson: TimetableLesson = {
      ...event,
      id: `tt-custom-${Date.now()}`,
      isCustomEvent: true,
    };
    set((state) => ({ timetable: [...state.timetable, newLesson] }));
  },
}));
