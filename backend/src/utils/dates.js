function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function rangeFromPreset(preset, from, to) {
  const now = new Date();
  if (from && to) return { from: new Date(from), to: new Date(to) };
  if (preset === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }
  if (preset === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start, to: now };
  }
  const start = startOfDay(now);
  return { from: start, to: now };
}

function minutesBetween(start, end) {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
}

module.exports = { todayKey, startOfDay, endOfDay, rangeFromPreset, minutesBetween };
