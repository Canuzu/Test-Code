/* Die Merkliste: was man sich für später aufgehoben hat. */
import { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useThema } from '@/lib/thema';
import { useZustand } from '@/daten/zustand';
import { Titel, Ueberzeile } from '@/ui/Schrift';
import { Leer, Seite, VideoKarte } from '@/ui/Bausteine';
import { Herz } from '@/ui/Symbole';

export default function Merkliste() {
  const { f } = useThema();
  const katalog = useZustand((z) => z.katalog);
  const merk = useZustand((z) => z.merk);
  const breit = useWindowDimensions().width;
  const spalten = breit < 360 ? 1 : 2;
  const liste = useMemo(() => katalog.filter((v) => merk[v.slug]), [katalog, merk]);
  const zeilen = [];
  for (let i = 0; i < liste.length; i += spalten) zeilen.push(liste.slice(i, i + spalten));
  return (
    <Seite>
      <View><Ueberzeile>Für später</Ueberzeile><Titel>Merkliste</Titel></View>
      {liste.length ? zeilen.map((z, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
          {z.map((v) => <VideoKarte key={v.slug} v={v} />)}
          {z.length < spalten && <View style={{ flex: 1 }} />}
        </View>
      )) : (
        <Leer symbol={<Herz farbe={f.ink3} groesse={34} />}
          text="Noch nichts gemerkt. Tipp bei einem Video auf das Herz, dann landet es hier." />
      )}
    </Seite>
  );
}
