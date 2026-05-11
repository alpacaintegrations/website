// Mock voor lokale UI-tests zonder n8n. Zet ENABLE_MOCK=true in config.js.

const FAKE_RESPONSES = [
  "Goeie vraag! De Sprintsubsidie is minimaal 5.000 en maximaal 24.500 euro, met 50% van je projectkosten.",
  "Voor MKB-bedrijven in Limburg. Niet voor zzp'ers of agrarische bedrijven met SBI-code A.",
  "De eerstvolgende tranche loopt van 11 mei tot 11 juni 2026.",
  "Dat klinkt als een typisch automatiseringsproject. Vertel iets meer over hoe het nu loopt — handmatig in Excel? Of via een ander systeem?"
];

let callIdx = 0;

export async function mockSendMessage() {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  const reply = FAKE_RESPONSES[callIdx % FAKE_RESPONSES.length];
  callIdx++;
  return { assistant_message: reply, tool_results: [] };
}
