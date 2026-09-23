/* Die Wurzel der App: Schriften laden, Daten holen, dann erst zeigen.
   Bis dahin steht der Startbildschirm mit dem Logo. */
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SCHRIFT, SCHRIFTDATEIEN, useThema } from '@/lib/thema';
import { start } from '@/daten/aktionen';
import { erinnerungAktualisieren } from '@/daten/erinnern';
import { setze, useZustand } from '@/daten/zustand';
import { Hinweis } from '@/ui/Bausteine';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Wurzel() {
  const [schriften, schriftFehler] = useFonts(SCHRIFTDATEIEN);
  const bereit = useZustand((z) => z.bereit);
  const { f, dunkel } = useThema();

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

  const kopf = (titel: string) => ({ title: titel.toUpperCase() });
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: f.canvas }}>
        <StatusBar style={dunkel ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: f.canvas },
          headerTintColor: f.ink,
          headerTitleStyle: { fontFamily: SCHRIFT.monoFett, fontSize: 12 },
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
        </Stack>
        <Hinweis />
      </View>
    </SafeAreaProvider>
  );
}
