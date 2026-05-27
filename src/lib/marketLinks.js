// Builds marketplace links for a card.
//
// IMPORTANT: In LIVE mode the app prefers `card.cardmarketUrl` (the exact
// product page returned by the API). These helpers are the fallback used for
// the demo data and for marketplaces (eBay/PriceCharting) that have no stable
// per-card page. We narrow the search by SET (and card number on eBay) so the
// result lands as close to the exact card as possible instead of "all Pikachus".

const cleanName = (name) =>
  (name || '')
    .replace(/\s*#?\s*\d+\s*\/\s*\d+\s*[A-Z]{0,4}\b/g, ' ') // strip "199/165 SAR"
    .replace(/\s*\([^)]*\)\s*/g, ' ') // strip parentheticals like "(Alt Art)"
    .replace(/\s+/g, ' ')
    .trim();

export const marketLinks = (card) => {
  const name = cleanName(card?.name);
  if (!name) return {};
  const set = (card?.set || '').trim();
  const number = (card?.number || '').trim();

  const nameSet = `${name} ${set}`.trim();                 // narrow by set
  const ebayTerms = [name, set, number, 'pokemon karte'].filter(Boolean).join(' ');

  const enc = encodeURIComponent;
  return {
    cardmarket: `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${enc(nameSet)}&perSite=20`,
    ebay: `https://www.ebay.de/sch/i.html?_nkw=${enc(ebayTerms)}&_sacat=0`,
    tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${enc(nameSet)}&view=grid`,
    priceCharting: `https://www.pricecharting.com/search-products?q=${enc(nameSet)}&type=prices`,
    psa: `https://www.psacard.com/pop/search?q=${enc(nameSet)}`,
  };
};
