const BACKUP_KEYS = [
  'gym_clients',
  'gym_exercises',
  'gym_staff',
  'gym_rooms',
  'gym_classes',
  'gym_class_bookings',
  'gym_settings',
  'gym_announcements',
] as const;

export function exportBackup() {
  const data: Record<string, unknown> = {};
  BACKUP_KEYS.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw !== null) data[key] = JSON.parse(raw);
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        if (!data || typeof data !== 'object') throw new Error('Formato file non valido');

        BACKUP_KEYS.forEach(key => {
          if (key in data) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        });
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Errore durante la lettura del file'));
      }
    };
    reader.onerror = () => reject(new Error('Errore durante la lettura del file'));
    reader.readAsText(file);
  });
}
