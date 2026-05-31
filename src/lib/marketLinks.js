// Builds marketplace links for a card.
//
// Cardmarket and PSA both catalogue cards under their ENGLISH names, so search
// queries are built from the English name (`nameEn`/`baseName`) — using the
// localized German name returns no results and bounces to the site's home page.
// We also narrow by the (English) set name so the result lands on the exact
// card instead of "all Pikachus".
//
// For the exact Cardmarket product page we prefer, in order:
//   1. a real cardmarket.com URL (official MKM API supplies one), else
//   2. the pokemontcg.io per-card redirect `prices.pokemontcg.io/cardmarket/<id>`,
//      which 302-redirects to the EXACT Cardmarket product for that card, else
//   3. a precise Cardmarket search as a last resort.
// Use `cmUrl(card)` everywhere the UI links out.

const cleanName = (name) =>
  (name || '')
    .replace(/\s*#?\s*\d+\s*\/\s*\d+\s*[A-Z]{0,4}\b/g, ' ') // strip "199/165 SAR"
    .replace(/\s*\([^)]*\)\s*/g, ' ') // strip parentheticals like "(Alt Art)"
    .replace(/\s+/g, ' ')
    .trim();

// English, search-friendly card name (Cardmarket/PSA catalogues are English).
const englishName = (card) => cleanName(card?.nameEn || card?.baseName || card?.name);

export const marketLinks = (card) => {
  const name = englishName(card);
  if (!name) return {};
  const set = (card?.set || '').trim();
  const number = (card?.number || '').trim();

  const nameSet = `${name} ${set}`.trim();                 // narrow by set
  const ebayTerms = [name, set, number, 'pokemon card'].filter(Boolean).join(' ');

  const enc = encodeURIComponent;
  return {
    cardmarket: `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${enc(nameSet)}&perSite=20`,
    ebay: `https://www.ebay.de/sch/i.html?_nkw=${enc(ebayTerms)}&_sacat=0`,
    tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${enc(nameSet)}&view=grid`,
    psa: `https://www.psacard.com/pop/search?q=${enc(nameSet)}`,
  };
};

// Exact Cardmarket product page for a card. Prefers a real cardmarket.com URL,
// then the pokemontcg.io per-card redirect (lands on the exact product), and
// only falls back to a name+set search when neither is available.
export const cmUrl = (card) => {
  const url = card?.cardmarketUrl;
  if (url && /cardmarket\.com/i.test(url)) return url;
  if (url && /prices\.pokemontcg\.io\/cardmarket\//i.test(url)) return url;
  return marketLinks(card).cardmarket;
};
