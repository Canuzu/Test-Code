/* Die Kreidezeichnungen aus dem Prototyp: Struktur in Kreide, die Aktion
   in der Farbe der Ebene. Bis es echte Standbilder aus den Videos gibt,
   sind sie das Vorschaubild. Erzeugt aus app/index.html, die Pfade sind
   dieselben. */
import { SvgXml } from 'react-native-svg';
import { useThema } from '@/lib/thema';
import type { Kategorie } from '@/daten/katalog';

const ZEICHNUNG: Record<Kategorie, string> = {
  "flanken": "<path class=\"c\" d=\"M112 12V88\"/><path class=\"c\" d=\"M112 26h40v48h-40\"/><path class=\"c\" d=\"M152 40v20\"/><path class=\"a\" d=\"M22 82C54 40 96 30 128 44\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M120 40l9 4-7 6\"/><circle class=\"f\" cx=\"22\" cy=\"82\" r=\"3.4\"/><circle class=\"f\" cx=\"130\" cy=\"45\" r=\"3.4\"/>",
  "dribbling": "<path class=\"a\" d=\"M10 50c10-24 26-24 33 0s23 24 30 0 26-24 33 0 23 24 30 0\"/><g class=\"c\"><path d=\"M25 44l6 12H19z\"/><path d=\"M55 44l6 12H49z\"/><path d=\"M85 44l6 12H79z\"/><path d=\"M115 44l6 12h-12z\"/></g>",
  "passen": "<circle class=\"f\" cx=\"28\" cy=\"78\" r=\"3.6\"/><circle class=\"f\" cx=\"80\" cy=\"24\" r=\"3.6\"/><circle class=\"f\" cx=\"134\" cy=\"72\" r=\"3.6\"/><path class=\"a\" d=\"M33 74L74 29\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M68 31l8-4 1 8\"/><path class=\"a\" d=\"M86 28l42 40\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M122 66l8 4-2-8\"/>",
  "schuss": "<path class=\"c\" d=\"M40 30V14h80v16\"/><path class=\"c\" d=\"M40 14v16M120 14v16\"/><g class=\"c\" opacity=\".5\"><path d=\"M52 14v16M64 14v16M76 14v16M88 14v16M100 14v16M108 14v16\"/></g><circle class=\"f\" cx=\"80\" cy=\"84\" r=\"3.6\"/><path class=\"a\" d=\"M77 80L48 32\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M83 80l29-48\" stroke-dasharray=\"5 4\"/>",
  "annahme": "<path class=\"a\" d=\"M14 14l52 36\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M58 48l9 3-3-8\"/><circle class=\"f\" cx=\"70\" cy=\"52\" r=\"4\"/><path class=\"c\" d=\"M70 40v-8M70 64v8\"/><path class=\"a\" d=\"M76 56l52 22\"/><path class=\"a\" d=\"M120 72l9 6-9 3\"/>",
  "athletik": "<path class=\"c\" d=\"M50 94L66 18M110 94L94 18\"/><g class=\"a\"><path d=\"M52 84h56M56 70h48M60 57h40M64 45h32M68 34h24M71 25h18\"/></g>",
  "torwart": "<path class=\"c\" d=\"M40 26V12h80v14\"/><path class=\"c\" d=\"M40 12v14M120 12v14\"/><path class=\"c\" d=\"M28 26h104v34H28z\" opacity=\".55\"/><circle class=\"f\" cx=\"80\" cy=\"36\" r=\"3.6\"/><path class=\"a\" d=\"M80 82L44 28\" stroke-dasharray=\"5 4\"/><path class=\"a\" d=\"M80 82l36-54\" stroke-dasharray=\"5 4\"/><circle class=\"f\" cx=\"80\" cy=\"84\" r=\"3\"/>",
  "taktik": "<path class=\"c\" d=\"M56 8v84M104 8v84\" opacity=\".55\"/><circle class=\"f\" cx=\"30\" cy=\"50\" r=\"3.6\"/><circle class=\"f\" cx=\"80\" cy=\"26\" r=\"3.6\"/><circle class=\"f\" cx=\"80\" cy=\"74\" r=\"3.6\"/><path class=\"a\" d=\"M36 48c18-10 30-14 40-18\"/><path class=\"a\" d=\"M70 28l9-2-4 8\"/><path class=\"a\" d=\"M36 54c18 10 30 14 40 18\"/><path class=\"a\" d=\"M70 72l9 2-4-8\"/><path class=\"a\" d=\"M110 50h26\"/><path class=\"a\" d=\"M130 45l8 5-8 5\"/>"
};

export function Kreide({ kategorie, ebene }: { kategorie: Kategorie; ebene?: number }) {
  const { f } = useThema();
  const akzent = ebene ? f.lv[ebene - 1] : '#E8433A';
  const innen = (ZEICHNUNG[kategorie] ?? '')
    .replace(/class="c"/g, `fill="none" stroke="${f.diaLine}" stroke-width="1.5"`)
    .replace(/class="a"/g, `fill="none" stroke="${akzent}" stroke-width="2"`)
    .replace(/class="f"/g, `fill="${f.diaDot}" stroke="none"`);
  const xml = `<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="160" height="100" fill="${f.diaBg}"/>` +
    `<g stroke-linecap="round" stroke-linejoin="round">${innen}</g></svg>`;
  return <SvgXml xml={xml} width="100%" height="100%" />;
}
