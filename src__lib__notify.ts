export type NType = 'location' | 'trip' | 'route';
export interface Notif { id: number; type: NType; title: string; body: string; ts: number }
export const getNotifs = (): Notif[] => { try { return JSON.parse(localStorage.getItem('waymark_notifs') ?? '[]'); } catch { return []; } };
export function notify(type: NType, title: string, body: string) {
  const l = getNotifs(); l.unshift({ id: Date.now(), type, title, body, ts: Date.now() });
  localStorage.setItem('waymark_notifs', JSON.stringify(l.slice(0, 50)));
  if (localStorage.getItem('waymark_notif_off') !== '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted') { try { new Notification(title, { body }); } catch {} }
}
