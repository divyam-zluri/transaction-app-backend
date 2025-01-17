import { currencyConversionRates } from "../globals/currencyConversionRates";

export function formatDate(dateString: string): Date | null {
  if (typeof dateString !== "string") {
    return null;
  }
  const [day, month, year] = dateString.split("-");
  if (!day || !month || !year) {
    return null;
  }
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? null : date;
}
export function getConversionRate(currencyCode: string): number | undefined {
  return currencyConversionRates.get(currencyCode);
}