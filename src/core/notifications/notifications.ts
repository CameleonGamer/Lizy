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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  /**
   * Schedules a reminder for a specific homework
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
   * Cancels a scheduled local notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
