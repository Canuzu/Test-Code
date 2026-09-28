/* Trainingspläne im Vorschau-Modus: Stand, freie Wochen, Abhaken,
   Wechseln und Beenden. */
import { lies, setze, type Konto } from '@/daten/zustand';
import { PLAENE, planStand, planWocheFrei } from '@/daten/plaene';
import { planBeenden, planHaken, planStarten } from '@/daten/aktionen';

const konto: Konto = { id: 'x', vorname: 'Luis', email: null, ebene: 1, rolle: 'spieler', seit: 0, geburtsjahr: 2014, eltern: true, lokal: true };

beforeEach(() => setze({ konto, pro: false, plan: null }));

test('Die Pläne kommen vollständig aus der App im Browser', () => {
  expect(PLAENE.map((p) => p.id)).toEqual(['grundlagen', 'dribbling', 'flanke']);
  for (const p of PLAENE) {
    expect(p.wochen).toHaveLength(6);
    for (const w of p.wochen) expect(w).toHaveLength(3);
    for (const w of p.wochen) for (const e of w) expect(lies().katalog.some((v) => v.slug === e.slug)).toBe(true);
  }
});

test('Die erste Woche ist mit Konto frei, der Rest mit Pro', () => {
  expect(planWocheFrei(0, lies())).toBe(true);
  expect(planWocheFrei(1, lies())).toBe(false);
  setze({ pro: true });
  expect(planWocheFrei(5, lies())).toBe(true);
  setze({ pro: false, konto: null });
  expect(planWocheFrei(0, lies())).toBe(false);
  setze({ konto: { ...konto, rolle: 'km1' } });
  expect(planWocheFrei(5, lies())).toBe(true);
});

test('Abhaken zählt, die nächste Einheit wandert weiter', async () => {
  await planStarten('grundlagen');
  let st = planStand(lies())!;
  expect(st).toMatchObject({ fertig: 0, gesamt: 18, woche: 0, dieseWoche: 0 });
  expect(st.naechste).toMatchObject({ w: 0, e: 0 });
  await planHaken(0, 0);
  await planHaken(0, 2);
  st = planStand(lies())!;
  expect(st).toMatchObject({ fertig: 2, dieseWoche: 2 });
  expect(st.naechste).toMatchObject({ w: 0, e: 1 });
  expect((await planHaken(0, 2)).an).toBe(false);          // zurücknehmen
  expect(planStand(lies())!.fertig).toBe(1);
});

test('Gesperrte Wochen lassen sich nicht abhaken, mit Pro schon', async () => {
  await planStarten('dribbling');
  await expect(planHaken(1, 0)).rejects.toThrow(/KM1 Pro/);
  setze({ pro: true });
  for (let w = 0; w < 6; w++) for (let e = 0; e < 3; e++) {
    const r = await planHaken(w, e);
    expect(r.geschafft).toBe(w === 5 && e === 2);
  }
  expect(planStand(lies())!.naechste).toBeNull();
});

test('Ein neuer Start fängt von vorn an, Beenden räumt auf', async () => {
  await planStarten('grundlagen');
  await planHaken(0, 0);
  await planStarten('flanke');
  expect(lies().plan).toMatchObject({ id: 'flanke', done: {} });
  await planBeenden();
  expect(lies().plan).toBeNull();
  expect(planStand(lies())).toBeNull();
});
