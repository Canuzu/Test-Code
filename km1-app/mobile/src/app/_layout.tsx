/* Die Wurzel der App: Schriften laden, Daten holen, dann erst zeigen.
   Bis dahin steht der Startbildschirm mit dem Logo. */
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCHRIFT, SCHRIFTDATEIEN, useThema } from '@/lib/thema';
import { start } from '@/daten/aktionen';
import { erinnerungAktualisieren } from '@/daten/erinnern';
import { setze, useZustand } from '@/daten/zustand';
import { Hinweis } from '@/ui/Bausteine';
import { OhneNetz } from '@/ui/Symbole';

SplashScreen.preventAutoHideAsync().catch(() => {});

/* Ohne Netz steht unten eine ruhige Leiste. Was schon geladen ist, geht
   weiter: Fortschritt, Merkliste und Pläne liegen auf dem Gerät. */
function NetzLeiste() {
  const { f } = useThema();
  const unten = useSafeAreaInsets().bottom;
  const offline = useZustand((z) => z.offline);
  if (!offline) return null;
  return (
    <View pointerEvents="none" accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 0, right: 0, bottom: unten + 70, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '88%', backgroundColor: f.ink,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99 }}>
        <OhneNetz farbe={f.canvas} groesse={16} />
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: f.canvas }}>Kein Netz. Videos laden gerade nicht.</Text>
      </View>
    </View>
  );
}

export default function Wurzel() {
  const [schriften, schriftFehler] = useFonts(SCHRIFTDATEIEN);
  const bereit = useZustand((z) => z.bereit);
  const { f, dunkel } = useThema();

  /* Nur ein klares „nicht verbunden" zählt. Die Prüfung, ob das Internet
     erreichbar ist, fragt einen fremden Server und irrt sich in manchen
     Netzen; dann soll ein Video es trotzdem versuchen dürfen. */
  useEffect(() => NetInfo.addEventListener((n) => { setze({ offline: n.isConnected === false }); }), []);
  // Im Browser meldet NetInfo die Rückkehr des Netzes nicht überall; die
  // Ereignisse des Fensters tun es.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const neu = () => setze({ offline: !navigator.onLine });
    window.addEventListener('online', neu); window.addEventListener('offline', neu);
    return () => { window.removeEventListener('online', neu); window.removeEventListener('offline', neu); };
  }, []);

  useEffect(() => {
    start();
    // Nie hängen bleiben: ist der Server nach sechs Sekunden nicht da,
    // geht es mit dem, was auf dem Gerät liegt, weiter.
    const t = setTimeout(() => setze({ bereit: true }), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { SystemUI.setBackgroundColorAsync(f.canvas).catch(() => {}); }, [f.canvas]);

  const fertig = (schriften || !!schriftFehler) && bereit;
  useEffect(() => {
    if (!fertig) return;
    SplashScreen.hideAsync().catch(() => {});
    // Die Erinnerung nennt das nächste Video, also beim Start neu planen.
    // Gefragt wird hier nicht; das tut erst die Seite „Erinnerung".
    erinnerungAktualisieren(false);
  }, [fertig]);
  if (!fertig) return null;

  const kopf = (titel: string) => ({ title: titel });
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: f.canvas }}>
        <StatusBar style={dunkel ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: f.canvas },
          headerTintColor: f.accentInk,
          headerTitleStyle: { fontFamily: SCHRIFT.fett, fontSize: 17, color: f.ink },
          headerShadowVisible: false,
          headerBackTitle: 'Zurück',
          headerBackButtonDisplayMode: 'default',
          contentStyle: { backgroundColor: f.canvas },
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Start' }} />
          <Stack.Screen name="video/[slug]" options={{ title: '' }} />
          <Stack.Screen name="anmelden" options={{ presentation: 'modal', ...kopf('Konto') }} />
          <Stack.Screen name="passwort" options={{ presentation: 'modal', ...kopf('Neues Passwort') }} />
          <Stack.Screen name="abo" options={{ presentation: 'modal', ...kopf('KM1 Pro') }} />
          <Stack.Screen name="ebene" options={{ presentation: 'formSheet', ...kopf('Ebene'), sheetAllowedDetents: [0.62, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="aufstieg" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="eltern" options={kopf('Für Eltern')} />
          <Stack.Screen name="datenschutz" options={kopf('Datenschutz')} />
          <Stack.Screen name="bedingungen" options={kopf('Nutzungsbedingungen')} />
          <Stack.Screen name="erinnerung" options={kopf('Erinnerung')} />
          <Stack.Screen name="merkliste" options={kopf('Merkliste')} />
          <Stack.Screen name="challenge" options={kopf('Challenge')} />
          <Stack.Screen name="camp" options={kopf('Camp')} />
          <Stack.Screen name="camp-buchen" options={{ presentation: 'modal', ...kopf('Platz buchen') }} />
          <Stack.Screen name="einstellungen" options={kopf('Einstellungen')} />
          <Stack.Screen name="plan/[id]" options={kopf('Trainingsplan')} />
          <Stack.Screen name="weg" options={kopf('Dein Weg')} />
          <Stack.Screen name="vergleich/[slug]" options={{ presentation: 'modal', ...kopf('Vergleichen') }} />
          <Stack.Screen name="willkommen" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        </Stack>
        <NetzLeiste />
        <Hinweis />
      </View>
    </SafeAreaProvider>
  );
}
