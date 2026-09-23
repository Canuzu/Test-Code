/* Die Verbindung zum Server. Ohne die beiden Umgebungsvariablen gibt es
   keinen Server, und die App läuft im Vorschau-Modus: alles bleibt auf
   dem Gerät, wie im Prototyp.

   EXPO_PUBLIC_SUPABASE_URL              Projekt-Adresse aus Supabase
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY  der öffentliche Schlüssel
                                         (heißt in älteren Projekten „anon key")

   Beide sind öffentlich: sie stecken in jeder ausgelieferten App. Was sie
   dürfen, regeln die Regeln in der Datenbank, nicht die App. */
import 'expo-sqlite/localStorage/install';
import { AppState, Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const schluessel = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && schluessel
  ? createClient(url, schluessel, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

export const mitServer = supabase !== null;

/* Die Anmeldung wird nur erneuert, solange die App vorn ist. */
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => {
    if (s === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
