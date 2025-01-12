// Map of currency conversion rates to INR
const currencyConversionRates: Map<string, number> = new Map([
    ["INR", 1], // Indian Rupee
    ["USD", 86.17], // US Dollar
    ["EUR", 88.3], // Euro
    ["GBP", 105.29], // British Pound
    ["AUD", 53.218], // Australian Dollar
    ["CAD", 59.727], // Canadian Dollar
    ["CHF", 94.187], // Swiss Franc
    ["JPY", 0.543], // Japanese Yen
    ["CNY", 11.713], // Chinese Yuan Renminbi
    ["MYR", 19.074], // Malaysian Ringgit
    ["ZAR", 4.541], // South African Rand
    ["NZD", 48.042], // New Zealand Dollar
    ["RUB", 0.832], // Russian Ruble
    ["BRL", 14.061], // Brazilian Real
    ["MXN", 4.202], // Mexican Peso
    ["THB", 2.476], // Thai Baht
    ["SGD", 62.707], // Singapore Dollar
    ["AED", 23.41], // UAE Dirham
    ["SAR", 22.899], // Saudi Riyal
    ["KWD", 278.493], // Kuwaiti Dinar
    ["BHD", 221.243], // Bahraini Dinar
    ["OMR", 216.515], // Omani Rial
  ]);
  
  export function  getConversionRate(currencyCode: string): number | undefined {
      return currencyConversionRates.get(currencyCode);
  }