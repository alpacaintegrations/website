# Sprintsubsidie voorbeeld: de complete administratie van een zakelijke opleider automatiseren

Een zakelijke opleider die trainingen aanbiedt via verschillende leerportalen. Twee mensen die alles runnen. En "alles" betekent hier echt alles: boekingen verwerken die via vijf verschillende portalen binnenkomen, per deelnemer meerdere mails handmatig versturen, cursusinformatie op vijf plekken apart bijwerken, planning coordineren via eindeloze mailwisselingen met acht trainers, bijhouden hoeveel deelnemers er per training zijn, annuleringen regelen, certificaten aanmaken en facturen versturen. Allemaal handmatig. Elke keer opnieuw. Daar hadden ze beide een dagtaak aan.

Dit is het verhaal van hoe we dat volledig hebben geautomatiseerd. Zonder AI. Met bestaande software, slimme koppelingen en workflows die automatisch draaien. Dit soort project is precies waar de [Sprintsubsidie MKB](link) voor bedoeld is. Die Sprint subsidie is alleen voor MKB-bedrijven in Limburg en wordt betaald door de Provincie: tot 50% van de implementatiekosten vergoed.

## Het probleem

Het probleem was niet dat het bedrijf niet groeide. Het probleem was dat elke nieuwe deelnemer meer handwerk betekende. Meer mails knippen en plakken, meer portalen bijwerken, meer kans op fouten. Hoe harder ze groeiden, hoe meer tijd ze kwijt waren aan administratief werk dat niks oplevert maar wel moet gebeuren. Het bedrijf zat gevangen in zijn eigen processen. Er waren drie grote pijnpunten.

**Boekingen en communicatie.** Boekingen kwamen binnen via vijf verschillende leerportalen en de eigen website, en elk portaal werkte op zijn eigen manier. Dat betekende dat alles handmatig geknipt en geplakt moest worden naar een spreadsheet. Vervolgens moest elke deelnemer meerdere keren gemaild worden: welkom, praktische informatie, details naar de trainer, follow-up achteraf en een certificaat. Per deelnemer dus elke keer handmatig een mail opstellen en versturen. En dan moest je ook nog bijhouden wie welke mail al had gehad, want dubbel mailen is net zo erg als vergeten te mailen.

**Planning en cursusinfo.** De planning met acht trainers ging volledig via mail. Dat betekende heen en weer mailen tot iedereen het eens was over de data, wat soms dagen duurde. Ondertussen moest alle cursusinformatie, dus datums, prijzen, beschrijvingen en beschikbare plekken, op alle vijf de portalen apart handmatig worden bijgewerkt. Dat zorgde ervoor dat elke wijziging vijf keer doorgevoerd moest worden. En als dat niet overal tegelijk gebeurde, dan kreeg je de situatie dat datums niet overal gelijk waren waardoor deelnemers op de verkeerde dag opdoken, of dat een training al vol was maar op een ander portaal nog openstond waardoor je overboekingen kreeg.

**Administratie.** Om te weten hoeveel deelnemers er per training waren, moest iemand alle portalen langs om de boekingen bij elkaar te tellen. Als er minder dan drie deelnemers waren veertien dagen voor de training, dan moest de training geannuleerd worden. Dat betekende dat je deelnemers moest mailen met een compensatie-aanbod, de trainer apart moest informeren, en vervolgens de training op alle vijf de portalen handmatig moest dichtzetten. Weer vijf keer hetzelfde werk. En de facturatie ging op dezelfde manier: per training handmatig een factuur aanmaken en versturen.

*[Voor-diagram hier]*

## De aanpak

De eerste stap was het creeren van een centrale database. In plaats van informatie verspreid over vijf portalen, mailboxen en spreadsheets, moest alles op een plek staan. Daarvoor hebben we Airtable gekozen. Airtable is in de basis een slimme database die eruitziet als een spreadsheet maar zich gedraagt als een volwaardig systeem: je kunt er tabellen in koppelen, formules op loslaten, en er andere software aan verbinden via API's. Het werd de "single source of truth" voor alles: deelnemers, trainers, trainingen, boekingen en communicatie.

De tweede stap was het koppelen van alle bestaande systemen aan die centrale database. Daarvoor gebruiken we n8n, een automatiseringsplatform dat werkt als een vertaallaag tussen al die verschillende tools. n8n zorgt ervoor dat Airtable, Outlook, de leerportalen, Certifier, Exact en Edudex met elkaar kunnen praten. Als er iets verandert in Airtable, dan vertelt n8n de juiste systemen wat ze moeten doen. Dat gebeurt via workflows die dagelijks automatisch draaien.

## De oplossing

**Boekingen en communicatie.** Boekingen komen nu via API-koppelingen automatisch in Airtable terecht. Vanuit daar gaan alle mails automatisch en op het juiste moment de deur uit. Alles wordt gepersonaliseerd met de juiste namen, datums en trainers. Het systeem houdt zelf bij wie welke mail al heeft gehad, dus als een workflow halverwege crasht en herstart wordt, krijgt niemand een dubbele mail.

**Planning en cursusinfo.** Trainers vullen nu zelf hun beschikbaarheid in via een planner tool in plaats van eindeloos te mailen. Na goedkeuring gaat alles automatisch naar Airtable. En voor de cursusinformatie hebben we Edudex gekoppeld: dat is een platform dat aansluit op alle leerportalen. Dat betekent dat je cursusinformatie maar op een plek hoeft aan te passen, in Airtable, en Edudex pusht het automatisch door naar alle vijf de portalen tegelijk. Een datum wijzigen is nu een handeling van dertig seconden in plaats van vijf keer inloggen en overtypen.

**Administratie.** Airtable telt nu automatisch het aantal deelnemers per training. Veertien dagen voor de training krijgen de eigenaren automatisch een notificatie als er minder dan drie deelnemers zijn, inclusief de deelnemerslijst zodat ze meteen een beslissing kunnen nemen. Als een training niet doorgaat, gaan de annuleringsmails automatisch de deur uit: deelnemers krijgen een nette mail met compensatie-aanbod en de trainer krijgt een apart bericht. Facturatie wordt automatisch doorgezet naar Exact na afronding van de training. En elke nacht maakt het systeem een automatische backup van alle data naar OneDrive.

*[Na-diagram hier]*

Het belangrijkste verschil is niet alleen de tijdsbesparing. Ze hebben nu een systeem dat meegroeit. Twee keer zoveel boekingen? Geen probleem, dat gaat allemaal vanzelf. Het systeem schaalt mee zonder dat er extra handjes bij moeten.

## Geen AI nodig

Dit hele systeem draait op vaste logica: als dit, dan dat. Geen machine learning, geen ChatGPT, geen slimme algoritmes. Gewoon bestaande software die slim aan elkaar gekoppeld is. Dat is een belangrijk punt, want veel bedrijven denken dat ze AI nodig hebben om te automatiseren. Dat is lang niet altijd zo. De meeste bedrijfsprocessen volgen vaste patronen en zijn perfect te automatiseren met regelgebaseerde workflows.

AI voegt pas waarde toe als de input onvoorspelbaar is, zoals mails die geinterpreteerd moeten worden of documenten die er elke keer anders uitzien. Bij dit project was de input voorspelbaar en de stappen vast, waardoor een simpele automatisering sneller, goedkoper en betrouwbaarder is. Lees meer over wanneer AI wel de juiste keuze is in onze blog over [AI implementeren met de Sprintsubsidie](link), of lees hoe je [de beste processen vindt om te automatiseren](link).

## Het resultaat

| Aspect | Voor | Na |
|---|---|---|
| Mails versturen | Handmatig per deelnemer | Automatisch en op tijd |
| Deelnemers bijhouden | Handmatig vinkjes zetten | Automatische tracking |
| Trainer notificeren | Handmatig deelnemerslijst samenstellen | Automatisch gegroepeerd en verstuurd |
| Cursusinfo updaten | 5x apart handmatig | 1x in Airtable, via Edudex overal bijgewerkt |
| Deelnemerscheck | Handmatig tellen over alle portalen | 14 dagen vooruit automatische check |
| Planning trainers | Mailen heen en weer | Planner tool, zelf invullen |
| Certificaten | Per deelnemer handmatig | Automatisch via API |
| Facturatie | Per training handmatig | Automatisch naar Exact |
| Tijdsinvestering | Beide een dagtaak | Paar uur per week, alleen uitzonderingen |

## Past dit bij de Sprintsubsidie?

Dit soort project is precies waar de [Sprintsubsidie MKB](link) voor bedoeld is. Je implementeert bestaande, bewezen software die nieuw is voor de onderneming, en het leidt tot een aantoonbare en meetbare verbetering van de bedrijfsvoering. Alle tools die we hebben gebruikt bestaan al en worden al bij andere bedrijven ingezet. De Sprint subsidie vergoedt tot 50% van de implementatiekosten, met een maximum van 24.500 euro per MKB-bedrijf in Limburg.

De kosten die je opvoert bij de aanvraag zijn de uren van de externe specialist die de workflows configureert en de koppelingen bouwt, de eenmalige softwarekosten, de training van het team om met het nieuwe systeem te werken, en de interne uren die het bedrijf zelf besteedt aan de implementatie. Lees onze blog over [wat wel en niet in aanmerking komt](link) voor de details, of bekijk het [complete stappenplan voor het aanvragen](link).

Herken je dit soort handmatig werk in jouw bedrijf? Stel je vraag aan onze [subsidie-assistent](link) of [plan een vrijblijvend gesprek](link). Alpaca Integrations helpt je met het identificeren van het juiste proces en neemt de implementatie over.
