export function formatDate(date: string | Date, withTime = true) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  }).format(dateObj);
}

export function calculateExpiryDate(days: number) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

export function getExpiryStatus(expiryDate?: string) {
  if (!expiryDate) return "safe";
  const now = new Date();
  const target = new Date(expiryDate);
  const diff = target.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  if (Number.isNaN(days)) return "safe";
  if (days < 0) return "danger";
  if (days <= 3) return "danger";
  if (days <= 7) return "warning";
  return "safe";
}

export function getExpiryText(expiryDate?: string) {
  if (!expiryDate) return "长期有效";
  const target = new Date(expiryDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (Number.isNaN(days)) return "--";
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return "今日到期";
  return `剩余 ${days} 天`;
}
