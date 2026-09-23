/* Eine waagerechte Reihe von Videokarten und der Kopf über einem Block. */
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { SCHRIFT, useThema } from '@/lib/thema';
import type { Video } from '@/daten/katalog';
import { VideoKarte } from './Bausteine';
import { Abschnitt } from './Schrift';

/* Eine Reihe zum Wischen. Die erste Karte rastet am Seitenrand ein,
   nicht am Bildschirmrand. */
export function Reihe({ videos }: { videos: Video[] }) {
  const breit = useWindowDimensions().width >= 700;
  if (breit) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        {videos.map((v) => <VideoKarte key={v.slug} v={v} breite={232} />)}
      </View>
    );
  }
  return (
    <FlatList horizontal data={videos} keyExtractor={(v) => v.slug} showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 4, gap: 14 }}
      snapToInterval={214} decelerationRate="fast" snapToAlignment="start"
      renderItem={({ item }) => <VideoKarte v={item} breite={200} />} />
  );
}

export function BlockKopf({ titel, angabe }: { titel: string; angabe?: string }) {
  const { f } = useThema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Abschnitt>{titel}</Abschnitt>
      {angabe ? <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{angabe}</Text> : null}
    </View>
  );
}
