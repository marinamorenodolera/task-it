// Natural Language Processing para fechas (igual que MVP)
export const parseNaturalLanguage = (text) => {
  const datePatterns = {
    'hoy': 0,
    'mañana': 1, 
    'pasado mañana': 2,
    'lunes': getNextWeekday(1),
    'martes': getNextWeekday(2),
    'miércoles': getNextWeekday(3),
    'jueves': getNextWeekday(4),
    'viernes': getNextWeekday(5),
    'sábado': getNextWeekday(6),
    'domingo': getNextWeekday(0)
  };

  // Detectar tiempo (formato 24h o 12h)
  const timePattern = /(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm)/gi;
  const timeMatch = text.match(timePattern);

  // Detectar fecha
  let deadline = null;
  for (const [phrase, daysToAdd] of Object.entries(datePatterns)) {
    if (text.toLowerCase().includes(phrase)) {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + daysToAdd);
      
      // Si hay hora, añadirla
      if (timeMatch) {
        const timeStr = timeMatch[0];
        if (timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':');
          deadline.setHours(parseInt(hours), parseInt(minutes));
        }
      }
      break;
    }
  }

  // Detectar importes
  const amountPattern = /(\d+)\s*€/g;
  const amountMatch = text.match(amountPattern);
  const amount = amountMatch ? parseInt(amountMatch[0].replace('€', '')) : null;

  return { deadline, amount };
};

function getNextWeekday(targetDay) {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7;
  return daysUntilTarget === 0 ? 7 : daysUntilTarget; // Si es hoy, programar para la próxima semana
}

export const formatDeadline = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const date = new Date(deadline);
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '🔴 Hoy';
  if (diffDays === 1) return '🟡 Mañana';
  if (diffDays < 7) return `🟢 ${diffDays} días`;
  return `📅 ${date.toLocaleDateString()}`;
};

export const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  return compareDate.toDateString() === today.toDateString();
};