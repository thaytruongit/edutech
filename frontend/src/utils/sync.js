// Đồng bộ trạng thái Realtime giữa Màn hình Tivi và Máy tính học sinh (BroadcastChannel + LocalStorage)
const CHANNEL_NAME = 'edusmart_live_arena_sync';

class SyncEngine {
  constructor() {
    this.channel = null;
    this.listeners = new Set();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.emit(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, falling back to storage:', e);
      }
    }

    // Storage fallback for cross-tab events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'edusmart_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.emit(data);
          } catch (err) {}
        }
      });
    }
  }

  send(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('edusmart_sync_event', JSON.stringify({ ...data, _ts: Date.now() }));
      } catch (e) {}
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(data) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  }
}

export const sync = new SyncEngine();
