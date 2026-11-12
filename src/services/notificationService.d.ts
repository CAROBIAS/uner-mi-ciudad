declare module '@/services/notificationService' {
  export function registerForPushNotificationsAsync(): Promise<boolean | null>;
  export function sendNotificationNow(title: string, body: string): Promise<void>;
}
