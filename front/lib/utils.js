export function sortByPaddedTitle(items, getValue = (item) => item.title) {
  const padNumbers = (str) =>
    str.replace(/\d+/g, (num) => num.padStart(5, "0")).toLowerCase();

  return items.slice().sort((a, b) => {
    const aStr = padNumbers(getValue(a));
    const bStr = padNumbers(getValue(b));
    return aStr.localeCompare(bStr);
  });
}
