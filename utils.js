export function humanize(str) {
    return str
        .replace(/^[\s_]+|[\s_]+$/g, '')
        .replace(/[_\s]+/g, ' ')
        .replace(/^[a-z]/, function(m) { return m.toUpperCase(); });
  }

// Format number with commas (e.g., 500000 => "500,000")
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Convert number to words for Pakistani Rupees
export function numberToWords(num) {
  if (!num || num === 0) return "Zero Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", 
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const numToWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
    if (n < 1000000)
      return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "");
    if (n < 1000000000)
      return numToWords(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + numToWords(n % 1000000) : "");
    if (n < 1000000000000)
      return numToWords(Math.floor(n / 1000000000)) + " Billion" + (n % 1000000000 ? " " + numToWords(n % 1000000000) : "");
    return num.toString();
  };

  return numToWords(Math.floor(num)) + " Only";
}