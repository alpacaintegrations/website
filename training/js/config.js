// ============================================
// TRAINING PAGINA - ALLE CONTENT
// Pas alleen dit bestand aan om teksten,
// prijzen, FAQ's etc. te wijzigen.
// ============================================

const CONFIG = {

  // --- ALGEMEEN ---
  bookingUrl: "https://outlook.office365.com/book/Alpacaintegrations1@alpacaintegrations.ai/",
  homepageUrl: "https://alpacaintegrations.ai",

  // --- HERO ---
  hero: {
    title: "AI theorie heeft iedereen.<br>Garantie dat het ook echt wat oplevert, niet.",
    subtitle: "Wij wel. Voor jou en je team."
  },

  // --- WAAROM WIJ ---
  waarom: {
    intro: "AI en automatiseringen is onze business. Je leert niet uit een boek, maar uit ervaring.",
    punten: [
      "Geen standaard verhaal, maar aangemeten op jouw bedrijf",
      "Wij doen ons huiswerk en zorgen dat jij dat ook doet",
      "Je bouwt zelf AI-assistenten die de volgende dag al tijd besparen"
    ]
  },

  // --- PAKKETTEN ---
  pakketten: [
    {
      id: "ninja",
      naam: "AI Ninja in een Dag",
      punten: [
        "Iedereen kent de theorie, maar veel belangrijker, iedereen gebruikt het",
        "Werkende tools die direct winst opleveren op jullie afdelingen",
        "Omdat we weken van tevoren beginnen, niet op de dag zelf",
        "Blijvend effect door persoonlijke follow-up na 2 weken"
      ],
      closer: "Informatie die niet wordt toegepast is entertainment. Wij zijn geen Netflix.",
      details: [
        { label: "Format", waarde: "Dagtraining, op locatie of digitaal" },
        { label: "Deelnemers", waarde: "Ideaal 10-15 (ander aantal mogelijk)" },
        { label: "Modulair", waarde: "Programma aangepast op niveau en behoefte" },
        { label: "Voorbereiding", waarde: "Ideaal programma samenstellen in overleg" },
        { label: "Resultaat", waarde: "Bruikbare AI-kennis, zelf werkende AI-assistenten gebouwd, direct inzetbaar" },
        { label: "Na afloop", waarde: "Implementatieplan + huiswerkopdracht + follow-up met alle deelnemers" },
        { label: "Inclusief", waarde: "Presentatie, resources, universele en persoonlijke AI-assistenten, AI-assistent die de hele training heeft bijgewoond" }
      ],
      prijs: "3.500",
      garantie: "100% tevredenheidsgarantie"
    },
    {
      id: "ceo",
      naam: "CEO Pakket",
      punten: [
        "Intensief 1-op-1 met een aangemeten programma dat past als een maatpak",
        "Niet alleen gebruiken, maar ook het grote plaatje: AI strategisch denken",
        "Zodat je een leger van AI ninjas kan aanvoeren, want je team is inbegrepen"
      ],
      closer: null,
      details: [
        { label: "Format", waarde: "10x 90 min wekelijkse 1-op-1 sessies, digitaal" },
        { label: "Programma", waarde: "Volledig aangemeten naar jouw behoefte" },
        { label: "Kern", waarde: "AI echt beheersen en oplossingen voor jou als CEO en je bedrijf implementeren" },
        { label: "Strategie", waarde: "AI strategisch denken voor mogelijkheden en toepassingen in het grote plaatje" },
        { label: "Je team", waarde: "Alles uit AI Ninja in een Dag inbegrepen, zodat iedereen mee is" },
        { label: "Resultaat", waarde: "Jij hebt het AI-overzicht en je team kan het uitvoeren" }
      ],
      prijs: "7.500",
      garantie: "100% tevredenheidsgarantie"
    }
  ],

  // --- CTA ---
  cta: {
    titel: "Plan een gesprek",
    tekst: "Vertel ons waar je staat, dan kijken we wat je nodig hebt.",
    knopTekst: "Plan een gesprek",
    vraag: "Om welke training gaat het?",
    opties: [
      { label: "AI Ninja in een Dag", url: "https://outlook.office.com/bookwithme/user/d52fd36296834a36a6f3a1f9f548233f@alpacaintegrations.ai/meetingtype/3EpGXjGZTUullkdi9aIVxw2?anonymous&ismsaljsauthenabled" },
      { label: "CEO Pakket", url: "https://outlook.office.com/bookwithme/user/d52fd36296834a36a6f3a1f9f548233f@alpacaintegrations.ai/meetingtype/YZerlhkjDEq5m2dAZZnfzQ2?anonymous&ismsaljsauthenabled" },
      { label: "Weet ik nog niet", url: "https://outlook.office.com/bookwithme/user/d52fd36296834a36a6f3a1f9f548233f@alpacaintegrations.ai/meetingtype/GFZdRZMwBkGxLnKg-iEV4w2?anonymous&ismsaljsauthenabled" }
    ]
  },

  // --- FAQ ---
  faq: [
    {
      vraag: "Hoe werkt de tevredenheidsgarantie?",
      antwoord: "We factureren achteraf. Ben je niet tevreden? Dan hoef je niet te betalen. Bij het CEO Pakket betaal je achteraf per 4 weken. Stop je binnen die tijd, dan betaal je niet. In beide gevallen, no questions asked."
    },
    {
      vraag: "Wat zit er allemaal in de training?",
      antwoord: "We hebben verschillende modules van beginner en compliance tot complete automatiseringen bouwen. Maar het grootste deel van de dag focussen we ons op specifieke toepassingen voor jouw bedrijf en leren we je team deze zelf te implementeren. Daarom hebben we vooraf contact over de details."
    },
    {
      vraag: "Voldoet mijn team daarna aan de AI Act? (AI compliance / AI-geletterdheid)",
      antwoord: "Ja. AI compliance is onderdeel van de training. Iedereen ontvangt een certificaat."
    },
    {
      vraag: "Wat is het verschil tussen AI Ninja in een Dag en het CEO Pakket?",
      antwoord: "AI Ninja in een Dag is voor je team: na een dag kan iedereen werken met AI. Het CEO Pakket gaat verder — intensieve 1-op-1 sessies, volledig op maat, zodat jij kunt denken en handelen als een AI-gedreven leider. De teamtraining zit inbegrepen. Zodat jij en je team dezelfde koers varen."
    },
    {
      vraag: "Wat als mijn team nog nooit met AI heeft gewerkt?",
      antwoord: "Dan is een AI training net aan te raden. We beginnen bij de basis."
    },
    {
      vraag: "Wat als sommige teamleden al verder zijn dan anderen?",
      antwoord: "Het ligt aan de verdeling. Bij de intake komen we daar achter en passen we de opdrachten daarop aan."
    },
    {
      vraag: "Kan dit uit ons opleidingsbudget?",
      antwoord: "Normaal wel. De training valt onder scholing en digitale vaardigheden en komt mogelijk in aanmerking voor de SLIM-subsidie."
    },
    {
      vraag: "Wat als ik meer dan 15 deelnemers heb?",
      antwoord: "Dat kan zeker, maar dan werken we bijvoorbeeld per afdeling. We bespreken in het gesprek wat het beste werkt."
    },
    {
      vraag: "Hoe werkt de voorbereiding?",
      antwoord: "Iedereen vult een vragenlijst in. Aan de hand daarvan vragen we verdere details voor het bouwen van de tools op maat."
    },
    {
      vraag: "Wat hebben deelnemers nodig?",
      antwoord: "Een laptop en een AI-account. Welke tool we gebruiken bepalen we in het gesprek. Op locatie een beamer of scherm."
    },
    {
      vraag: "Hoe snel kan ik starten?",
      antwoord: "Minimaal 3 weken vanwege de voorbereiding, verder hangt het af van de planning."
    },
    {
      vraag: "Kan de training ook digitaal?",
      antwoord: "Ja, zowel op locatie als digitaal."
    }
  ]
};
