# Sprintsubsidie voorbeeld: klantenservice automatiseren met AI voor een e-commerce verkoper

Een verkoper met meerdere merken en een eigen webshop. Klantvragen die binnenkomen via bol.com, via aparte mailadressen per merk en via de webshop. Elke inbox apart in de gaten houden. Elke vraag handmatig lezen, uitzoeken via welk kanaal de bestelling is gedaan, de orderstatus opzoeken in het juiste systeem, en dan een antwoord typen in de juiste toon voor dat specifieke merk. Bij een handvol vragen per dag is dat te doen. Bij tientallen vragen per dag, verspreid over meerdere merken en kanalen, wordt het een logistiek probleem.

Dit is het verhaal van hoe we dat hebben geautomatiseerd met AI. Dit is een situatie waar AI echt waarde toevoegt: de input is onvoorspelbaar, de vragen zijn ongestructureerd, en elke vraag moet in een andere toon beantwoord worden. Dit soort project is precies waar de [Sprintsubsidie MKB](link) voor bedoeld is. Die Sprint subsidie is alleen voor MKB-bedrijven in Limburg en wordt betaald door de Provincie: tot 50% van de implementatiekosten vergoed.

## Het probleem

Om te begrijpen waarom we hier AI voor nodig hadden, moet je eerst snappen hoe het proces eruitzag. De bottleneck was niet de complexiteit van de vragen. 80% van de klantvragen zijn standaard: waar is mijn pakket, hoe retourneer ik, product is beschadigd. Het probleem was de hoeveelheid handmatige stappen en het constant schakelen tussen systemen. Elke vraag kostte hetzelfde rondje: lezen waar het over gaat, uitzoeken via welk merk of kanaal de bestelling is gedaan, de orderstatus opzoeken in het bol-dashboard of het webshopsysteem, en dan een antwoord typen. En dat antwoord moest ook nog in de juiste toon, want merk A communiceert zakelijk en formeel terwijl merk B juist informeel en vlot is.

Daar kwam bij dat bol.com harde servicenormen hanteert: klantvragen moeten binnen 24 uur beantwoord worden en minimaal 90% moet binnen 8 kantooruren afgehandeld zijn. Mis je die normen, dan daalt je prestatiescore en daarmee je zichtbaarheid en verkooppositie op het platform. Dat betekent dat je niet alleen snel moet antwoorden, maar ook consistent snel, ook in drukke periodes en in het weekend.

En hoe harder het bedrijf groeit, hoe meer vragen er binnenkomen. Elke nieuwe klant, elk nieuw merk, elk nieuw kanaal betekent meer handwerk. Op een gegeven moment moet je kiezen: extra mensen aannemen of het proces slimmer inrichten.

*[Voor-diagram hier]*

## De aanpak

Net als bij elk automatiseringsproject begonnen we met het samenvoegen van alles op een plek. Alle inboxen, of ze nu van bol.com komen, van de verschillende merkmailddressen of van de webshop, worden samengebracht in Zendesk als centraal ticketsysteem. Dat lost het eerste probleem op: niemand hoeft meer vijf inboxen in de gaten te houden. Alles staat op een plek, automatisch getagd per merk en kanaal.

De tweede laag is n8n als workflow-engine. Zodra er een nieuw ticket binnenkomt in Zendesk, pakt n8n het op en stuurt het door de juiste stappen. n8n werkt hier als de vertaallaag die alle systemen aan elkaar knoopt: Zendesk, de bol.com API, het webshopsysteem, en de AI-laag.

De derde stap was het centraliseren van alle kennis die een medewerker normaal gebruikt om vragen te beantwoorden. Producthandleidingen, retourbeleid, veelgestelde vragen, merk-specifieke informatie, alles wat verspreid zat over documenten, mails en het hoofd van de medewerker. Die kennis hebben we gebundeld in doorzoekbare databases zodat de AI er direct in kan zoeken om het juiste antwoord te vinden.

En hier komt AI in het spel. Bij veel automatiseringsprojecten is de input voorspelbaar en de stappen vast, waardoor vaste logica voldoende is. Maar bij klantenservice is de input per definitie onvoorspelbaar: klanten stellen vragen in hun eigen woorden, combineren onderwerpen, en sturen soms een halve roman. Dat is precies waar AI waarde toevoegt, het interpreteren van ongestructureerde tekst en het genereren van een passend antwoord op basis van de juiste kennisbron.

## De oplossing

**Stap 1: Alles op een plek.** Alle kanalen komen samen in Zendesk. Bol.com, de merkmailddressen, de webshop. Elk ticket wordt automatisch getagd met het juiste merk en kanaal. De medewerker hoeft geen enkele inbox meer te checken.

**Stap 2: AI leest en classificeert.** Het systeem leest de klantvraag en bepaalt automatisch waar het over gaat. Levertijd (35% van de vragen), retour (20%), schade (12%), annulering (8%), productinformatie (8%), of iets anders (17%). Die laatste categorie gaat direct naar een medewerker, want dat zijn de vragen die te divers zijn om te automatiseren. Bij levertijdvragen haalt het systeem meteen de track & trace informatie op bij de vervoerder.

**Stap 3: Context ophalen.** Bij bol-orders haalt het systeem automatisch de relevante orderdata op via de bol.com Retailer API: orderstatus, track & trace, retourstatus, productgegevens. Bij webshoporders wordt dezelfde informatie uit het eigen systeem gehaald. Geen handmatig opzoeken meer in dashboards.

**Stap 4: Antwoord genereren in de juiste toon.** Per vraagcategorie volgt het systeem een voorgedefinieerde beslisboom. "Klant vraagt waar het pakket blijft" volgt een andere route dan "klant wil retourneren." Elke route combineert de opgehaalde data met de juiste antwoordlogica. En het antwoord wordt gegenereerd in de tone-of-voice van het specifieke merk: zakelijk voor merk A, informeel voor merk B, premium voor merk C. Dat hoeft niemand meer handmatig te onthouden.

**Stap 5: Vertrouwensscore.** Elk antwoord krijgt een betrouwbaarheidsscore. Bij een hoge score op een routinevraag wordt het antwoord automatisch verstuurd. Bij een lagere score of een gevoelige categorie wordt het antwoord als concept klaargezet in Zendesk zodat een medewerker het kan reviewen en met een klik versturen. Zo houd je controle zonder dat je elk antwoord handmatig hoeft te schrijven.

**Stap 6: Het systeem wordt beter.** Na elke afgehandelde vraag vergelijkt het systeem automatisch het AI-concept met wat er daadwerkelijk is verstuurd. Als het antwoord ongewijzigd is verstuurd, is dat een positief signaal. Als een medewerker het heeft aangepast, weet het systeem dat die categorie nog niet goed genoeg zit. Zo wordt het systeem beter naarmate het langer draait, per merk en per vraagtype, zonder dat iemand het handmatig hoeft bij te sturen.

*[Na-diagram hier]*

Het resultaat is dat de medewerker verschuift van "elke vraag zelf afhandelen" naar "uitzonderingen reviewen." Meer vragen afhandelen zonder extra mensen, snellere responstijden, en consistente antwoorden per merk. En het systeem schaalt mee: twee keer zoveel vragen betekent niet twee keer zoveel werk.

## Waarom hier wel AI?

In ons [ander voorbeeldproject](link) lieten we zien dat je geen AI nodig hebt om te automatiseren. Maar bij klantenservice is de situatie anders. De input is ongestructureerd: klanten typen hun vraag in hun eigen woorden. De context wisselt per vraag: elk merk, elk kanaal, elke orderstatus is anders. En het antwoord moet aangepast worden aan de toon van het specifieke merk. Dat zijn precies de situaties waar AI waarde toevoegt en vaste regels tekortschieten.

Maar ook hier geldt: AI doet niet alles. De classificatie en het antwoord zijn AI, maar het ophalen van orderdata is een simpele API-koppeling. De routing door de beslisbomen is vaste logica. En de vertrouwensscore is een berekening, geen AI. Het is de combinatie van AI waar het nodig is en automatisering waar het kan die het systeem sterk maakt. Lees meer over dat onderscheid in onze blog over [AI implementeren met de Sprintsubsidie](link).

## Past dit bij de Sprintsubsidie?

Dit project past bij de [Sprintsubsidie MKB](link) omdat het gaat om de implementatie van bestaande, bewezen technologie. Zendesk, n8n, OpenAI en de bol.com API zijn allemaal tools die al breed worden ingezet. De regeling noemt zelflerende software en machine learning letterlijk als subsidiabele toepassing onder het thema digitalisering. En het leidt tot een aantoonbare en meetbare verbetering: snellere responstijd, hogere first-time-right, minder handmatige triage.

De Sprint subsidie vergoedt tot 50% van de implementatiekosten, met een maximum van 24.500 euro per MKB-bedrijf in Limburg. De kosten die je opvoert zijn de uren van de externe specialist die het systeem configureert, de eenmalige softwarekosten, en de training van het team. Lees onze blog over [wat wel en niet in aanmerking komt](link) voor de details, of bekijk het [complete stappenplan voor het aanvragen](link).

Herken je dit soort situatie in jouw bedrijf? Stel je vraag aan onze [subsidie-assistent](link) of [plan een vrijblijvend gesprek](link). Alpaca Integrations helpt je met het identificeren van het juiste proces en neemt de implementatie over.
