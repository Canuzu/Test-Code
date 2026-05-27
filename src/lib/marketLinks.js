// Builds marketplace search links for a card. We use search URLs (not product
// IDs) so they keep working regardless of the marketplace's internal catalogue.

const cleanName = (name) =>
  (name || '')
    .replace(/\s*#?\s*\d+\s*\/\s*\d+\s*[A-Z]{0,4}\b/g, ' ') // strip "199/165 SAR"
    .replace(/\s*\([^)]*\)\s*/g, ' ') // strip parentheticals
    .replace(/\s+/g, ' ')
    .trim();

export const marketLinks = (card) => {
  const name = cleanName(card?.name);
  if (!name) return {};
  const q = encodeURIComponent(name);
  const qPok = encodeURIComponent(`${name} pokemon`);
  const qSet = encodeURIComponent(`${name} ${card?.set || ''}`.trim());
  return {
    cardmarket: `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${q}&perSite=20`,
    ebay: `https://www.ebay.de/sch/i.html?_nkw=${qPok}+karte&_sacat=0`,
    tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${q}&view=grid`,
    priceCharting: `https://www.pricecharting.com/search-products?q=${qSet}&type=prices`,
    psa: `https://www.psacard.com/pop/search?q=${q}`,
  };
};
