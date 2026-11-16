import { create } from 'zustand';
import { Grade, Homework, TimetableLesson, PronoteMessage, SubjectAverage } from '@/types';

const MOCK_DATA = {
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
      id: 'g-demo-1',
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
      id: 'g-demo-2',
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
      id: 'g-demo-3',
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
      id: 'hw-demo-1',
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
      ],
    },
    {
      id: 'hw-demo-2',
      subject: 'Physique-Chimie',
      title: 'Compte-rendu de TP n°4',
      description: 'Rédiger les conclusions sur l’absorbance',
      dueDate: 'Jeudi',
      isPersonal: false,
      completed: false,
      estimatedMinutes: 45,
      subtasks: [],
    },
  ],
  timetable: [
    {
      id: 'tt-demo-1',
      subject: 'Mathématiques',
      teacher: 'M. Dupont',
      room: 'B204',
      startTime: '08:00',
      endTime: '10:00',
      status: 'normal' as const,
      color: '#38BDF8',
    },
    {
      id: 'tt-demo-2',
      subject: 'Histoire-Géo',
      teacher: 'Mme Laurent',
      room: 'A102',
      startTime: '10:15',
      endTime: '11:15',
      status: 'normal' as const,
      color: '#FBBF24',
    },
  ],
  messages: [
    {
      id: 'msg-demo-1',
      author: 'Vie Scolaire',
      subject: 'Absence justifiée',
      content: 'Le justificatif a été validé.',
      date: 'Hier',
      read: true,
    },
  ],
};

interface DataState {
  grades: Grade[];
  homework: Homework[];
  timetable: TimetableLesson[];
  messages: PronoteMessage[];
  averages: SubjectAverage[];
  generalAverage: number;
  isLoading: boolean;
  clearDataForRealUser: () => void;
  loadDemoData: () => void;
  syncRealData: (payload: {
    grades?: Grade[];
    homework?: Homework[];
    timetable?: TimetableLesson[];
    messages?: PronoteMessage[];
    averages?: SubjectAverage[];
    generalAverage?: number;
  }) => void;
  toggleHomework: (id: string) => void;
  toggleSubtask: (homeworkId: string, subtaskId: string) => void;
  addPersonalHomework: (item: Omit<Homework, 'id' | 'isPersonal' | 'completed' | 'subtasks'>) => void;
  addTimetableEvent: (event: Omit<TimetableLesson, 'id' | 'isCustomEvent'>) => void;
}

export const useDataStore = create<DataState>((set) => ({
  // Real initial state starts EMPTY to avoid displaying fake dummy info
  grades: [],
  homework: [],
  timetable: [],
  messages: [],
  averages: [],
  generalAverage: 0,
  isLoading: false,

  clearDataForRealUser: () => {
    set({
      grades: [],
      homework: [],
      timetable: [],
      messages: [],
      averages: [],
      generalAverage: 0,
      isLoading: true,
    });
  },

  loadDemoData: () => {
    set({
      ...MOCK_DATA,
      isLoading: false,
    });
  },

  syncRealData: (payload) => {
    set((state) => ({
      ...state,
      ...payload,
      grades: payload.grades !== undefined ? payload.grades : state.grades,
      homework: payload.homework !== undefined ? payload.homework : state.homework,
      timetable: payload.timetable !== undefined ? payload.timetable : state.timetable,
      messages: payload.messages !== undefined ? payload.messages : state.messages,
      averages: payload.averages !== undefined ? payload.averages : state.averages,
      generalAverage: payload.generalAverage !== undefined ? payload.generalAverage : state.generalAverage,
      isLoading: false,
    }));
  },

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
