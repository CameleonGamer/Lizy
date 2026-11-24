import * as Notifications from 'expo-notifications';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const LocalNotifications = {
  /**
   * Requests permission to send local alerts
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Immediately alerts the student when a new grade appears
   */
  async notifyNewGrade(grade: {
    subject: string;
    value: number;
    outOf: number;
    description?: string;
    classAverage?: number;
  }): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const valStr = `${grade.value}/${grade.outOf}`;
      const bodyDetails = grade.description
        ? `${grade.description}${grade.classAverage ? ` • Moyenne classe : ${grade.classAverage}` : ''}`
        : `Nouvelle évaluation enregistrée sur Pronote : ${valStr}`;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎯 Nouvelle note : ${valStr} en ${grade.subject}`,
          body: bodyDetails,
          sound: true,
          data: { type: 'grade', subject: grade.subject },
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      console.warn('Could not schedule grade notification:', e);
      return null;
    }
  },

  /**
   * Immediately alerts the student when a new homework appears
   */
  async notifyNewHomework(hw: {
    subject: string;
    title: string;
    dueDate: string;
    description?: string;
  }): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `📚 Nouveau devoir en ${hw.subject}`,
          body: `${hw.title} • Pour le ${hw.dueDate}`,
          sound: true,
          data: { type: 'homework', subject: hw.subject },
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      console.warn('Could not schedule homework notification:', e);
      return null;
    }
  },

  /**
   * Immediately alerts the student for new school communications or surveys
   */
  async notifyNewMessage(msg: {
    author: string;
    subject: string;
    isSurvey?: boolean;
  }): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const prefix = msg.isSurvey ? '📊 Nouveau sondage' : '📢 Nouvelle information';
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prefix} : ${msg.author}`,
          body: msg.subject,
          sound: true,
          data: { type: 'message', isSurvey: Boolean(msg.isSurvey) },
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      console.warn('Could not schedule message notification:', e);
      return null;
    }
  },

  /**
   * Schedules a reminder for a specific homework ahead of time
   */
  async scheduleHomeworkReminder(params: {
    id: string;
    title: string;
    subject: string;
    secondsFromNow: number;
  }): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `📚 Rappel Devoir : ${params.subject}`,
        body: params.title,
        sound: true,
        data: { homeworkId: params.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(params.secondsFromNow, 1),
      },
    });
  },

  /**
   * Sends a test notification to verify on-device alert settings
   */
  async testNotification(): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Notifications Lizy actives !',
        body: 'Vous recevrez une alerte dès qu’une nouvelle note ou un nouveau devoir apparaîtra sur Pronote.',
        sound: true,
        data: { type: 'test' },
      },
      trigger: null,
    });
    return true;
  },

  /**
   * Cancels a scheduled local notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
