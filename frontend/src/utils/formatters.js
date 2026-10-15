// Utility functions for formatting currency, numbers, and dates

export function formatINR(val, compact = false) {
  if (val === undefined || val === null || isNaN(val)) return '₹ 0';
  const num = Number(val);

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹ ${(num / 100000).toFixed(1)}L`;
    }
    if (Math.abs(num) >= 1000) {
      return `₹ ${(num / 1000).toFixed(1)}k`;
    }
    return `₹ ${num.toLocaleString('en-IN')}`;
  }

  // Full Indian numbering system format (e.g., ₹ 48,75,320)
  return '₹ ' + Math.round(num).toLocaleString('en-IN');
}

export function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
}

export function formatPercent(val) {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${Number(val).toFixed(1)}%`;
}
