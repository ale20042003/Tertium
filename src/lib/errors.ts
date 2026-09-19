/** Traduce gli errori del database che possono capitare compilando un form. */
export function descriviErrore(message: string): string {
  if (message.includes('clients_email_key') || message.includes('staff_email_key')) {
    return 'Questa email è già presente in anagrafica.';
  }
  if (message.includes('row-level security')) {
    return 'Non hai i permessi per questa operazione.';
  }
  return message;
}
