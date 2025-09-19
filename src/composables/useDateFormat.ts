import { computed } from "vue";
import { formatDate, getExpiryStatus, getExpiryText } from "@/utils/date";

export function useDateFormat() {
  const formatDateTime = (date: string | Date) => formatDate(date, true);
  const formatDateOnly = (date: string | Date) => formatDate(date, false);

  return {
    formatDate: formatDateTime,
    formatDateOnly,
    getExpiryStatus,
    getExpiryText,
  };
}

export function useRelativeTime(date: string | Date) {
  return computed(() => {
    const current = Date.now();
    const target = new Date(date).getTime();
    const diff = current - target;
    const day = 1000 * 60 * 60 * 24;
    if (diff < day) {
      const hour = Math.floor(diff / (1000 * 60 * 60));
      if (hour <= 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 0 ? "刚刚" : `${minutes} 分钟前`;
      }
      return `${hour} 小时前`;
    }
    const days = Math.floor(diff / day);
    if (days < 30) return `${days} 天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 个月前`;
    const years = Math.floor(months / 12);
    return `${years} 年前`;
  });
}
