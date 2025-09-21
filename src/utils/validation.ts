export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch (error) {
    return false;
  }
}

export function isPositiveInteger(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}
