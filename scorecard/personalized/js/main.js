
    const PERSONALIZED_WEBHOOK = 'https://hjemj85.app.n8n.cloud/webhook/1178c22d-93c1-4b0e-a52f-0a5ab8f9fbbf';
        // Wait for everything to load
        let supabaseClient = null;
        
        window.addEventListener('DOMContentLoaded', function() {
            // Initialize after page loads
            setTimeout(() => {
    initializeSupabase();
    initializeSession();
    
        checkPersonalizedLink();
    showQuestion(0);
}, 1);
        });
        async function checkPersonalizedLink() {
    console.log('🔍 START checkPersonalizedLink');
    console.log('URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('Code gevonden?:', code);
    
    if (!code) {
        console.log('❌ Geen code in URL');
        return;
    }
    
    try {
        console.log('📡 Zoek in Supabase voor code:', code);
        
        const { data, error } = await supabaseClient
            .from('clients')
            .select('first_name, contact_email')
            .eq('personalized_link_code', code)
            .single();
        
        console.log('Supabase response:', { data, error });
        
        if (data) {
            console.log('✅ Klant gevonden:', data);
            
            sessionStorage.setItem('is_personalized', 'true');
            sessionStorage.setItem('personalized_name', data.first_name);
            sessionStorage.setItem('personalized_email', data.contact_email);
            
            const titel = document.querySelector('.main-title');
            console.log('Titel element gevonden?:', !!titel);
            
            if (titel) {
                titel.innerHTML = `Hallo ${data.first_name},<br>${titel.textContent}`;
                console.log('✅ Titel aangepast');
            }
        } else {
            console.log('❌ Geen data gevonden voor deze code');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}
        function initializeSupabase() {
            const SUPABASE_URL = 'https://cxerydabgamthgjkbrao.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZXJ5ZGFiZ2FtdGhnamticmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjI0ODIsImV4cCI6MjA2ODQzODQ4Mn0.W0p3O2fFgjQR9QJm6f7zIUKpnGAzqu3HwJGyJ35qDdA';
            
            // Check if Supabase is loaded
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
            } else {
                console.warn('Supabase not loaded - running in offline mode');
                // Create mock client for testing
                supabaseClient = {
                    from: () => ({
                        insert: () => ({ 
                            select: () => Promise.resolve({ 
                                data: { id: 'mock-' + Date.now() }, 
                                error: null 
                            })
                        }),
                        select: () => ({ 
                            eq: () => ({ 
                                single: () => Promise.resolve({ data: null, error: null })
                            }),
                            single: () => Promise.resolve({ data: null, error: null })
                        }),
                        update: () => ({ 
                            eq: () => Promise.resolve({ data: null, error: null })
                        })
                    })
                };
            }
        }

        // State
        let currentQuestion = 0;
        let answers = {};
        let selectedTasks = [];
        let andersTasks = [];
        let selectedErgernissen = [];
        let andersErgernissen = [];
        let selectedObstacles = [];
        let andersObstacles = [];
        let currentSubmissionId = null;
        let sessionId = null;
        
        // Initialize session
        function initializeSession() {
            sessionId = crypto.randomUUID ? crypto.randomUUID() : 
                        'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
                            const r = Math.random() * 16 | 0;
                            const v = c == 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
            sessionStorage.setItem('session_id', sessionId);
        }

        // Detect source type
        function detectSourceType() {
            const urlParams = new URLSearchParams(window.location.search);
            const pathname = window.location.pathname;
            
            // Check voor verschillende source types
            if (urlParams.get('source') === 'email' || urlParams.get('utm_source') === 'email') {
                return 'email';
            }
            
            if (urlParams.get('source') === 'linkedin' || urlParams.get('utm_source') === 'linkedin') {
                return 'linkedin';
            }
            
            // Check voor persoonlijke link (bijvoorbeeld /scorecard/[unique-id])
            if (pathname.includes('/scorecard/') && pathname.split('/').length > 2) {
                return 'personal_link';
            }
            
            // Check voor campaign
            if (urlParams.get('utm_campaign') || urlParams.get('campaign')) {
                return 'campaign';
            }
            
            // Default is website
            return 'website';
        }

        // Send data to N8N (no Supabase insert)
        async function sendToSupabase(data) {
            const submissionData = {
                session_id: sessionId,
    
                // Bedrijfsinfo
                bedrijfsnaam: data.bedrijfsnaam,
                branche: data.branche,
                bedrijfs_omschrijving: data.bedrijfs_omschrijving,
                team_size: data.teamSize.toString(),
                
                // Source tracking
                source_type: data.sourceType,
                
                // Taken data (JSON)
                tasks: data.tasks,
                priority_task: data.priorityTask,
                priority_reason: data.priorityReason,
                total_hours: data.tasks.reduce((sum, task) => sum + (task.hours || 0), 0),
                
                // Systemen & pijn
                systems_count: data.systems,
                ergernissen: data.ergernissen,
                obstacles: data.obstacles,
                is_zen: data.isZen,
                is_orientering: data.isOrientering,
                
                // Impact metrics
                fire_percentage: parseInt(data.firePercentage) || 0,
                missed_revenue: parseInt(data.missedRevenue) || 0,
                
                // Anders opties
                anders_tasks: data.andersTasks || [],
                anders_ergernissen: data.andersErgernissen || [],
                anders_obstacles: data.andersObstacles || [],
                
                // Status
        has_email: false,
        created_at: new Date().toISOString()
    };

    // Voor gepersonaliseerde links: voeg naam en email direct toe
    const isPersonalized = sessionStorage.getItem('is_personalized') === 'true';
    if (isPersonalized) {
        submissionData.contact_name = sessionStorage.getItem('personalized_name');
        submissionData.contact_email = sessionStorage.getItem('personalized_email');
        submissionData.has_email = true;
        console.log('🔍 DEBUG sessionStorage:');
    console.log('- personalized_name:', sessionStorage.getItem('personalized_name'));
    console.log('- contact_name in data:', submissionData.contact_name);
    console.log('- typeof:', typeof submissionData.contact_name);
    }

            // Only trigger N8N webhook (N8N will create Supabase record)
            try {
                console.log('Triggering N8N webhook with session_id:', sessionId);
                const n8nResponse = await fetch('https://hjemj85.app.n8n.cloud/webhook/aad217b2-84d5-4705-862d-b62c7b763c1c', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'scorecard_submitted',
                        session_id: sessionId,
                        data: submissionData,
                        timestamp: new Date().toISOString()
                    })
                });
                
                console.log('N8N Response:', n8nResponse.status);
                // Voor gepersonaliseerde links: update Supabase direct
if (isPersonalized) {
    const naam = sessionStorage.getItem('personalized_name');
    
    console.log('📝 Update contact_name na 8 seconden met:', naam);
    
    setTimeout(async () => {
        console.log('⏰ Nu updaten voor session:', sessionId);
        
        // EERST checken wat er in staat
        const { data: before } = await supabaseClient
            .from('scorecard_submissions')
            .select('contact_name')
            .eq('session_id', sessionId)
            .single();
        
        console.log('VOOR update:', before);
        
        // DAN updaten
        const { error } = await supabaseClient
            .from('scorecard_submissions')
            .update({ contact_name: naam })
            .eq('session_id', sessionId);
        
        if (error) {
            console.error('❌ Update failed:', error);
        }
        
        // DAN weer checken
        const { data: after } = await supabaseClient
            .from('scorecard_submissions')
            .select('contact_name')
            .eq('session_id', sessionId)
            .single();
        
        console.log('NA update:', after);
        console.log('Is het veranderd?', before?.contact_name !== after?.contact_name);
        
    }, 8000);
}
                if (!n8nResponse.ok) {
                    console.error('N8N webhook failed:', n8nResponse.status);
                    return { id: null };
                    // Voor gepersonaliseerde links: update Supabase direct met contact_name


// Return session_id for polling
return { id: sessionId, isSessionId: true };
                }
                
                // Return session_id for polling
                return { id: sessionId, isSessionId: true };
                
            } catch (err) {
                console.error('Failed to trigger N8N:', err);
                return { id: null };
            }
        }

        // Wait for complete results from n8n
        async function waitForCompleteResults(sessionIdForPolling, startTime, minWaitTime) {
            // Get the actual session_id from sessionStorage
            const sessionId = sessionStorage.getItem('session_id');
            
            if (!sessionId) {
                // No session ID - show error
                setTimeout(() => {
                    document.querySelector('.results-container').innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <h2 style="color: var(--text-white);">Er ging iets mis</h2>
                            <p style="color: var(--text-light);">Geen sessie gevonden. Probeer opnieuw.</p>
                            <button class="cta-button" onclick="location.reload()">
                                Probeer opnieuw
                            </button>
                        </div>
                    `;
                }, 2000);
                return;
            }

            let attempts = 0;
            const maxAttempts = 20; // Meer pogingen voor zekerheid
            const initialDelay = 3000; // 3 sec eerste keer wachten
            const pollInterval = 2000; // 2 sec tussen pogingen
            
            
            
            // Start polling na initial delay
            setTimeout(() => {
                const checkResults = setInterval(async () => {
                    attempts++;
                    console.log(`Polling attempt ${attempts}/${maxAttempts} for session_id: ${sessionId}`);
                    
                    try {
                        const { data, error } = await supabaseClient
                            .from('scorecard_submissions')
                            .select('*')
                            .eq('session_id', sessionId)  // Poll op session_id!
                            .single();
                        
                        console.log('Poll result:', { found: !!data, hasAutomationPotential: data?.automation_potential, error });
                        
                        // Check of n8n klaar is (automation_potential moet gevuld zijn)
                        if (data && data.automation_potential) {
                            clearInterval(checkResults);
                            console.log('Results received:', data);
                            
                            // Update currentSubmissionId met het echte ID van Supabase
                            currentSubmissionId = data.id;
                            sessionStorage.setItem('submission_id', data.id);
                            
                            // Check minimum wachttijd (30-60 sec totaal)
                            const elapsedTime = Date.now() - startTime;
                            const remainingWait = Math.max(0, minWaitTime - elapsedTime);
                            
                            setTimeout(() => {
                                displayResultsPreview(data);
                            }, remainingWait);
                            
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkResults);
                            console.log('Timeout na 20 pogingen');
                            
                            // Timeout - toon error met meer info
                            document.querySelector('.results-container').innerHTML = `
                                <div style="text-align: center; padding: 40px;">
                                    <h2 style="color: var(--text-white);">Dit duurt langer dan verwacht</h2>
                                    <p style="color: var(--text-light); margin-bottom: 30px;">
                                        De AI heeft wat meer tijd nodig. Je antwoorden zijn veilig opgeslagen. 
                                    </p>
                                    <p style="color: var(--text-light); margin-bottom: 30px; font-size: 14px;">
                                        Session ID: ${sessionId.substring(0, 8)}...
                                    </p>
                                    <button class="cta-button" onclick="location.reload()">
                                        Probeer opnieuw
                                    </button>
                                </div>
                            `;
                        } else {
                            if (data) {
                                console.log('Record gevonden maar nog geen automation_potential');
                            } else {
                                console.log('Nog geen record gevonden voor session_id');
                            }
                        }
                    } catch (error) {
                        console.error('Error polling for results:', error);
                    }
                }, pollInterval);
            }, initialDelay); // Start polling na 15 seconden
        }

        // Submit email
        async function submitEmail(event) {
    event.preventDefault();
    
    const voornaamInput = event.target.querySelector('input[name="voornaam"]');
    const emailInput = event.target.querySelector('input[type="email"]');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const voornaam = voornaamInput.value;
    const email = emailInput.value;
    const sessionId = sessionStorage.getItem('session_id');
    
    // Disable form
voornaamInput.disabled = true;
emailInput.disabled = true;
submitButton.disabled = true;
submitButton.innerHTML = `<span>Versturen...</span>`;

try {
    let clientId = null;
    
    // Check if client exists - HAAL OOK session_ids OP!
const { data: existingClient } = await supabaseClient
    .from('clients')
    .select('id, session_ids')  // Haal ook session_ids op
    .eq('contact_email', email)
    .single();

if (!existingClient) {
    // Create new client
    const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
            first_name: voornaam,
            contact_email: email,
            company_name: '', // Leeg laten
            industry: answers[4]?.branche || '',
            company_size: parseInt(answers[5]) || null,
            is_active: true,
            slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
            last_activity: new Date().toISOString(),
            session_ids: [sessionId]  // ARRAY met eerste session_id!
        })
        .select()
        .single();
    
    if (!clientError && newClient) {
        clientId = newClient.id;
        console.log('New client created:', clientId);
    }
} else {
    clientId = existingClient.id;
    console.log('Existing client found:', clientId);
    
    // Check of session_id al in de array zit
    const currentSessionIds = existingClient.session_ids || [];
    if (!currentSessionIds.includes(sessionId)) {
        // Voeg toe aan array
        await supabaseClient
            .from('clients')
            .update({
                last_activity: new Date().toISOString(),
                session_ids: [...currentSessionIds, sessionId]  // VOEG TOE aan bestaande array!
            })
            .eq('id', clientId);
    }
}
        
        
       // Update submission met contact_name en mogelijk client_id
const updateData = {
    contact_name: voornaam,
    has_email: true,
    email_provided_at: new Date().toISOString()
};

// Als scorecard_submissions een client_id kolom heeft
if (clientId) {
    updateData.client_id = clientId;
}

await supabaseClient
    .from('scorecard_submissions')
    .update(updateData)
    .eq('session_id', sessionId);

// Trigger N8N webhook voor email/PDF generatie
try {
    const n8nEmailResponse = await fetch('https://hjemj85.app.n8n.cloud/webhook/f4fae942-fbde-4c92-aef4-49518936d507', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'generate_report',
            session_id: sessionId,
            voornaam: voornaam,
            email: email,
            client_id: clientId || null,
            timestamp: new Date().toISOString()
        })
    });
    
    if (!n8nEmailResponse.ok) {
        console.error('N8N email webhook failed:', n8nEmailResponse.status);
    }
} catch (err) {
    console.error('N8N webhook error:', err);
}

// Show success
event.target.parentElement.innerHTML = `
    <div style="text-align: center; padding: 40px; background: rgba(34, 197, 94, 0.1); 
                border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 1rem;">
        <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
        <h3 style="font-size: 24px; margin-bottom: 10px; color: var(--text-white);">
            Gelukt!
        </h3>
        <p style="font-size: 18px; color: var(--text-light);">
            Je ontvangt binnen enkele minuten je persoonlijke automatiseringsrapport op 
            <strong>${email}</strong>
        </p>
    </div>
`;

    } catch (error) {
        console.error('Error submitting email:', error);
        
        // Re-enable form on error
        voornaamInput.disabled = false;
        emailInput.disabled = false;
        submitButton.disabled = false;
        submitButton.innerHTML = `
            <span>Probeer opnieuw</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
}

        // Questions configuration
        const questions = [
            {
                id: 1,
                text: "Besteed je veel tijd aan taken die elke keer volgens hetzelfde recept gaan?",
                type: "checkbox",
                options: [
                    "Data invoeren/overzetten",
                    "Data analyse",
                    "Gegevens opzoeken",
                    "Rapporten maken",
                    "Emails/offertes versturen",
                    "Planning/roosters maken",
                    "Herhalende administratieve klussen",
                    "Werken met Excel bestanden",
                    "Klantgegevens bijwerken/opzoeken",
                    "Documenten archiveren/opslaan",
                    "Status updates geven",
                    "Contracten/documenten opstellen",
                    "KPI's/cijfers verzamelen",
                    "Agenda's/afspraken beheren"
                ]
            },
            {
                id: 2,
                text: "Hoeveel tijd kost dit per maand?",
                type: "task-details"
            },
            {
                id: 3,
                text: "Met automatiseren van welk proces valt er voor jou het meeste te winnen?",
                type: "radio-with-text"
            },
            {
                id: 4,
                text: "Gebruik je veel verschillende systemen of software?",
                type: "multiple-choice",
                options: [
                    "1-2 systemen",
                    "3-5 systemen",
                    "Meer dan 5 systemen",
                    "Te veel om te tellen"
                ]
            },
            {
                id: 5,
                text: "Hoe heet je bedrijf?",
                secondText: "In welke branche zit je?",
                thirdText: "Wat doen jullie?",
                type: "triple-text-input",
                placeholder1: "Bijv. Van der Berg Installaties",
                placeholder2: "Bijv. E-commerce, Consultancy, Zorg, etc.",
                placeholder3: "Beschrijf jullie diensten/producten"
            },
            {
                id: 6,
                text: "Hoe groot is je team?",
                type: "number-input",
                placeholder: "Aantal teamleden"
            },
            {
                id: 7,
                text: "Wat zijn je grootste ergernissen?",
                type: "checkbox-multi",
                options: [
                    "Dubbel werk",
                    "Fouten door handmatig werk",
                    "Geen overzicht",
                    "Wisselende resultaten",
                    "Alles kost te veel tijd",
                    "Gegevens niet centraal op 1 plek",
                    "Niks, ik ben zen"
                ]
            },
            {
                id: 8,
                text: "Wat houdt je tegen om te automatiseren?",
                type: "checkbox-obstacles",
                options: [
                    "Geen tijd om het uit te zoeken",
                    "Weet niet waar te beginnen",
                    "Bang dat het te complex wordt",
                    "Budget onzekerheid",
                    "Niks, ik oriënteer me"
                ]
            },
            {
                id: 9,
                text: "Hoeveel % van je werk is 'brandjes blussen'?",
                type: "slider-fire"
            },
            {
                id: 10,
                text: "Hoeveel potentiële omzet mis je door capaciteitsproblemen?",
                type: "slider-money"
            }
        ];

        function startAssessment() {
            document.getElementById('landingSection').style.display = 'none';
            document.getElementById('questionSection').style.display = 'block';
            showQuestion(0);
        }

        function showQuestion(index) {
            const question = questions[index];
            const progressPercentage = ((index + 1) / questions.length) * 100;
            document.getElementById('progressFill').style.width = progressPercentage + '%';

            // Reset states for question 1 if no saved answer
            if (index === 0 && !answers[0]) {
                selectedTasks = [];
                andersTasks = [];
            }
            
            // Reset states for question 7 (ergernissen) if no saved answer
            if (index === 6 && !answers[6]) {
                selectedErgernissen = [];
                andersErgernissen = [];
            }
            
            // Reset states for question 8 (obstacles) if no saved answer
            if (index === 7 && !answers[7]) {
                selectedObstacles = [];
                andersObstacles = [];
            }
            
            // Make sure sliders start at 0 if no saved answer
            if (index === 8 && !answers[8]) {
                answers[8] = 0;
            }
            if (index === 9 && !answers[9]) {
                answers[9] = 0;
            }

            let questionHTML = `
                <div class="question-number">Vraag ${index + 1} van 10</div>
                <h2 class="question-text">${question.text}</h2>
            `;

            // Special handling for double-text-input questions
            if (question.type === 'triple-text-input' && question.secondText && question.thirdText) {
                questionHTML += `
                    <div style="max-width: 500px; margin: 0 auto;">
                        <input type="text" 
                            class="text-input-field" 
                            id="text-input-1" 
                            placeholder="${question.placeholder1 || 'Bedrijfsnaam...'}"
                            style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                                   border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                                   color: var(--text-white); font-size: 18px; text-align: center;
                                   transition: all 0.3s ease; margin-bottom: 30px;"
                            onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                            onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                            oninput="enableNextIfTripleFilled()"
                        >
                    </div>
                    <h2 class="question-text" style="margin-top: 40px; margin-bottom: 30px;">${question.secondText}</h2>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <input type="text" 
                            class="text-input-field" 
                            id="text-input-2" 
                            placeholder="${question.placeholder2 || 'Branche...'}"
                            style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                                   border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                                   color: var(--text-white); font-size: 18px; text-align: center;
                                   transition: all 0.3s ease; margin-bottom: 30px;"
                            onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                            onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                            oninput="enableNextIfTripleFilled()"
                        >
                    </div>
                    <h2 class="question-text" style="margin-top: 40px; margin-bottom: 30px;">${question.thirdText}</h2>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <input type="text" 
                            class="text-input-field" 
                            id="text-input-3" 
                            placeholder="${question.placeholder3 || 'Beschrijving...'}"
                            style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                                   border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                                   color: var(--text-white); font-size: 18px; text-align: center;
                                   transition: all 0.3s ease;"
                            onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                            onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                            oninput="enableNextIfTripleFilled()"
                        >
                    </div>
                `;
            } else {
                // Generate question content based on type
                switch(question.type) {
                    case 'checkbox':
                        questionHTML += generateCheckboxQuestion(question);
                        break;
                    case 'checkbox-multi':
                        questionHTML += generateCheckboxMultiQuestion(question, index);
                        break;
                    case 'checkbox-obstacles':
                        questionHTML += generateCheckboxObstaclesQuestion(question, index);
                        break;
                    case 'task-details':
                        questionHTML += generateTaskDetailsQuestion();
                        break;
                    case 'radio-with-text':
                        questionHTML += generateRadioWithTextQuestion();
                        break;
                    case 'multiple-choice':
                        questionHTML += generateMultipleChoiceQuestion(question);
                        break;
                    case 'slider':
                        questionHTML += generateSliderQuestion();
                        break;
                    case 'slider-fire':
                        questionHTML += generateFireSliderQuestion();
                        break;
                    case 'slider-money':
                        questionHTML += generateMoneySliderQuestion();
                        break;
                    case 'text-input':
                        questionHTML += generateTextInputQuestion(question);
                        break;
                    case 'double-text-input':
                        questionHTML += generateDoubleTextInputQuestion(question);
                        break;
                    case 'number-input':
                        questionHTML += generateNumberInputQuestion(question);
                        break;
                }
            }

            document.getElementById('questionContent').innerHTML = questionHTML;
            updateNavigationButtons(index);
            
            // Restore answers if going back - with small delay to ensure DOM is ready
            setTimeout(() => {
                if (answers[index]) {
                    restoreAnswer(index);
                }
                
                // Add event listeners for checkboxes
                if (index === 0) {
                    setupCheckboxListeners();
                } else if (index === 1) { // Question 2 (task details)
                    // Check if fields are complete after a short delay
                    setTimeout(() => {
                        checkTaskDetailsComplete();
                    }, 100);
                } else if (index === 2) { // Question 3 (radio with text)
                    setTimeout(() => {
                        checkRadioWithTextComplete();
                    }, 100);
                } else if (index === 6) { // Question 7 (ergernissen)
                    setupCheckboxMultiListeners();
                } else if (index === 7) { // Question 8 (obstacles)
                    setupCheckboxObstaclesListeners();
                }
            }, 10);
        }

        function generateCheckboxObstaclesQuestion(question, questionIndex) {
            let html = '<div class="checkbox-grid">';
            
            question.options.forEach((option, i) => {
                html += `
                    <div class="selectable-option" id="checkbox-obstacle-item-${i}" onclick="toggleObstacle(${i})">
                        <input type="checkbox" id="checkbox-obstacle-${i}" name="obstacles" value="${option}">
                        ${option}
                    </div>
                `;
            });
            
            html += `
                </div>
                <div class="andere-taken-container" id="andereObstaclesContainer">
                    <button type="button" class="add-anders-btn" onclick="addAndersObstacleField()">
                        + Ander obstakel toevoegen
                    </button>
                </div>
            `;
            
            return html;
        }

        function toggleObstacle(index) {
            const option = document.getElementById(`checkbox-obstacle-item-${index}`);
            const checkbox = document.getElementById(`checkbox-obstacle-${index}`);
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
            
            updateSelectedObstacles();
        }

        function addAndersObstacleField() {
            const container = document.getElementById('andereObstaclesContainer');
            const newFieldId = `anders-obstacle-${Date.now()}`;
            
            const newField = document.createElement('div');
            newField.className = 'anders-input-container';
            newField.innerHTML = `
                <input type="text" 
                    class="anders-input" 
                    id="${newFieldId}"
                    placeholder="Ander obstakel..." 
                    onblur="handleAndersObstacleInput('${newFieldId}')"
                    onkeypress="if(event.key==='Enter') handleAndersObstacleInput('${newFieldId}')"
                >
            `;
            
            container.insertBefore(newField, container.querySelector('.add-anders-btn'));
        }

        function handleAndersObstacleInput(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.value.trim();
            
            if (value) {
                const isEdit = input.classList.contains('saved');
                const oldValue = input.dataset.savedValue;
                
                if (isEdit && oldValue) {
                    andersObstacles = andersObstacles.filter(task => task !== oldValue);
                }
                
                andersObstacles = andersObstacles.filter(task => task !== value);
                andersObstacles.push(value);
                
                input.classList.add('saved');
                input.dataset.savedValue = value;
                
                const container = input.closest('.anders-input-container');
                if (!container.querySelector('.edit-anders-btn')) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-anders-btn';
                    editBtn.textContent = 'Wijzig';
                    editBtn.onclick = () => editAndersObstacleField(fieldId);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-anders-btn';
                    deleteBtn.textContent = 'X';
                    deleteBtn.onclick = () => deleteAndersObstacleField(fieldId);
                    
                    container.appendChild(editBtn);
                    container.appendChild(deleteBtn);
                }
                
                input.readOnly = true;
                updateSelectedObstacles();
            }
        }

        function editAndersObstacleField(fieldId) {
            const input = document.getElementById(fieldId);
            input.readOnly = false;
            input.focus();
            input.select();
        }

        function deleteAndersObstacleField(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.dataset.savedValue;
            
            andersObstacles = andersObstacles.filter(task => task !== value);
            input.closest('.anders-input-container').remove();
            updateSelectedObstacles();
        }

        function updateSelectedObstacles() {
            selectedObstacles = [];
            
            const checkboxes = document.querySelectorAll('input[name="obstacles"]:checked');
            checkboxes.forEach(cb => {
                selectedObstacles.push(cb.value);
            });
            
            selectedObstacles = selectedObstacles.concat(andersObstacles);
            
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn) {
                nextBtn.disabled = selectedObstacles.length === 0;
            }
        }

        function generateCheckboxMultiQuestion(question, questionIndex) {
            let html = '<div class="checkbox-grid">';
            
            question.options.forEach((option, i) => {
                html += `
                    <div class="selectable-option" id="checkbox-multi-item-${i}" onclick="toggleErgernis(${i})">
                        <input type="checkbox" id="checkbox-multi-${i}" name="ergernissen" value="${option}">
                        ${option}
                    </div>
                `;
            });
            
            html += `
                </div>
                <div class="andere-taken-container" id="andereErgernissenContainer">
                    <button type="button" class="add-anders-btn" onclick="addAndersErgernisField()">
                        + Andere ergernis toevoegen
                    </button>
                </div>
            `;
            
            return html;
        }

        function toggleErgernis(index) {
            const option = document.getElementById(`checkbox-multi-item-${index}`);
            const checkbox = document.getElementById(`checkbox-multi-${index}`);
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
            
            updateSelectedErgernissen();
        }

        function addAndersErgernisField() {
            const container = document.getElementById('andereErgernissenContainer');
            const newFieldId = `anders-ergernis-${Date.now()}`;
            
            const newField = document.createElement('div');
            newField.className = 'anders-input-container';
            newField.innerHTML = `
                <input type="text" 
                    class="anders-input" 
                    id="${newFieldId}"
                    placeholder="Andere ergernis..." 
                    onblur="handleAndersErgernisInput('${newFieldId}')"
                    onkeypress="if(event.key==='Enter') handleAndersErgernisInput('${newFieldId}')"
                >
            `;
            
            container.insertBefore(newField, container.querySelector('.add-anders-btn'));
        }

        function handleAndersErgernisInput(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.value.trim();
            
            if (value) {
                // Check if this is an edit
                const isEdit = input.classList.contains('saved');
                const oldValue = input.dataset.savedValue;
                
                if (isEdit && oldValue) {
                    andersErgernissen = andersErgernissen.filter(task => task !== oldValue);
                }
                
                // Remove duplicates
                andersErgernissen = andersErgernissen.filter(task => task !== value);
                
                // Add to anders tasks
                andersErgernissen.push(value);
                
                // Update input state
                input.classList.add('saved');
                input.dataset.savedValue = value;
                
                // Add edit and delete buttons if they don't exist
                const container = input.closest('.anders-input-container');
                if (!container.querySelector('.edit-anders-btn')) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-anders-btn';
                    editBtn.textContent = 'Wijzig';
                    editBtn.onclick = () => editAndersErgernisField(fieldId);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-anders-btn';
                    deleteBtn.textContent = 'X';
                    deleteBtn.onclick = () => deleteAndersErgernisField(fieldId);
                    
                    container.appendChild(editBtn);
                    container.appendChild(deleteBtn);
                }
                
                // Make field readonly
                input.readOnly = true;
                
                // Update selected ergernissen
                updateSelectedErgernissen();
            }
        }

        function editAndersErgernisField(fieldId) {
            const input = document.getElementById(fieldId);
            input.readOnly = false;
            input.focus();
            input.select();
        }

        function deleteAndersErgernisField(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.dataset.savedValue;
            
            // Remove from andersErgernissen
            andersErgernissen = andersErgernissen.filter(task => task !== value);
            
            // Remove the entire container
            input.closest('.anders-input-container').remove();
            
            // Update selected ergernissen
            updateSelectedErgernissen();
        }

        function updateSelectedErgernissen() {
            selectedErgernissen = [];
            
            // Get checked standard ergernissen
            const checkboxes = document.querySelectorAll('input[name="ergernissen"]:checked');
            checkboxes.forEach(cb => {
                selectedErgernissen.push(cb.value);
            });
            
            // Add anders ergernissen
            selectedErgernissen = selectedErgernissen.concat(andersErgernissen);
            
            // Update next button state
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn) {
                nextBtn.disabled = selectedErgernissen.length === 0;
            }
        }

        function generateCheckboxQuestion(question) {
            let html = '<div class="checkbox-grid">';
            
            question.options.forEach((option, i) => {
                html += `
                    <div class="selectable-option" id="checkbox-item-${i}" onclick="toggleTask(${i})">
                        <input type="checkbox" id="checkbox-${i}" name="tasks" value="${option}">
                        ${option}
                    </div>
                `;
            });
            
            html += `
                </div>
                <div class="andere-taken-container" id="andereTakenContainer">
                    <button type="button" class="add-anders-btn" onclick="addAndersField()">
                        + Andere taak toevoegen
                    </button>
                </div>
            `;
            
            return html;
        }

        function toggleTask(index) {
            const option = document.getElementById(`checkbox-item-${index}`);
            const checkbox = document.getElementById(`checkbox-${index}`);
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
            
            updateSelectedTasks();
        }

        function setupCheckboxMultiListeners() {
            // Event listeners are handled by onclick in the HTML
        }

        function setupCheckboxObstaclesListeners() {
            // Event listeners are handled by onclick in the HTML
        }

        function setupCheckboxListeners() {
            // Event listeners are handled by onclick in the HTML
        }

        function addAndersField() {
            const container = document.getElementById('andereTakenContainer');
            const newFieldId = `anders-${Date.now()}`;
            
            const newField = document.createElement('div');
            newField.className = 'anders-input-container';
            newField.innerHTML = `
                <input type="text" 
                    class="anders-input" 
                    id="${newFieldId}"
                    placeholder="Andere taak..." 
                    onblur="handleAndersInput('${newFieldId}')"
                    onkeypress="if(event.key==='Enter') handleAndersInput('${newFieldId}')"
                >
            `;
            
            container.insertBefore(newField, container.querySelector('.add-anders-btn'));
        }

        function handleAndersInput(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.value.trim();
            
            if (value) {
                // Check if this is an edit (input already has saved class)
                const isEdit = input.classList.contains('saved');
                const oldValue = input.dataset.savedValue;
                
                if (isEdit && oldValue) {
                    // Remove old value from andersTasks
                    andersTasks = andersTasks.filter(task => task !== oldValue);
                }
                
                // Remove from andersTasks if it already exists (to avoid duplicates)
                andersTasks = andersTasks.filter(task => task !== value);
                
                // Add to anders tasks
                andersTasks.push(value);
                
                // Update input state
                input.classList.add('saved');
                input.dataset.savedValue = value;
                
                // Add edit and delete buttons if they don't exist
                const container = input.closest('.anders-input-container');
                if (!container.querySelector('.edit-anders-btn')) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-anders-btn';
                    editBtn.textContent = 'Wijzig';
                    editBtn.onclick = () => editAndersField(fieldId);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-anders-btn';
                    deleteBtn.textContent = 'X';
                    deleteBtn.onclick = () => deleteAndersField(fieldId);
                    
                    container.appendChild(editBtn);
                    container.appendChild(deleteBtn);
                }
                
                // Make field readonly
                input.readOnly = true;
                
                // Force update of all checkbox items to ensure correct styling
                updateSelectedTasks();
            }
        }

        function editAndersField(fieldId) {
            const input = document.getElementById(fieldId);
            input.readOnly = false;
            input.focus();
            input.select();
        }

        function deleteAndersField(fieldId) {
            const input = document.getElementById(fieldId);
            const value = input.dataset.savedValue;
            
            // Remove from andersTasks
            andersTasks = andersTasks.filter(task => task !== value);
            
            // Remove the entire container
            input.closest('.anders-input-container').remove();
            
            // Update selected tasks
            updateSelectedTasks();
        }

        function updateSelectedTasks() {
            selectedTasks = [];
            
            // Get checked standard tasks
            const checkboxes = document.querySelectorAll('input[name="tasks"]:checked');
            checkboxes.forEach(cb => {
                selectedTasks.push(cb.value);
            });
            
            // Add anders tasks
            selectedTasks = selectedTasks.concat(andersTasks);
            
            // Update next button state
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn) {
                nextBtn.disabled = selectedTasks.length === 0;
            }
        }

        function generateTaskDetailsQuestion() {
            if (selectedTasks.length === 0) {
                return '<p>Geen taken geselecteerd. Ga terug naar de vorige vraag.</p>';
            }
            
            let html = `
                <p style="font-size: 20px; margin-bottom: 40px;">Hoeveel tijd per maand kost dit?</p>
                <div class="task-details-container">
            `;
            
            selectedTasks.forEach((task, i) => {
                html += `
                    <div class="task-detail-row">
                        <div class="task-name-box">
                            <div class="task-name">${task}</div>
                        </div>
                        <div class="detail-input-group">
                            <label><strong>Uren per maand</strong></label>
                            <input type="number" 
                                class="detail-input" 
                                id="hours-${i}" 
                                placeholder="0"
                                min="0"
                                oninput="checkTaskDetailsComplete()"
                            >
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        }

        function generateRadioWithTextQuestion() {
            if (selectedTasks.length === 0) {
                return '<p>Geen taken geselecteerd. Ga terug naar vraag 1.</p>';
            }
            
            let html = '<div class="radio-container">';
            
            selectedTasks.forEach((task, i) => {
                html += `
                    <div class="selectable-option" onclick="selectRadio(${i})">
                        <input type="radio" id="radio-${i}" name="priority" value="${task}">
                        ${task}
                    </div>
                `;
            });
            
            html += `
                </div>
                <textarea class="waarom-textarea" 
                    id="waarom-text" 
                    placeholder="Waarom heeft deze taak het meeste potentieel?"
                    oninput="checkRadioWithTextComplete()"
                ></textarea>
            `;
            
            return html;
        }

        function selectRadio(index) {
            // Clear all selections
            document.querySelectorAll('.selectable-option').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Select clicked item
            const radio = document.getElementById(`radio-${index}`);
            const option = radio.closest('.selectable-option');
            radio.checked = true;
            option.classList.add('selected');
            
            // Check if we can enable next button
            checkRadioWithTextComplete();
        }
        
        function checkRadioWithTextComplete() {
            const selectedRadio = document.querySelector('input[name="priority"]:checked');
            const textArea = document.getElementById('waarom-text');
            const nextBtn = document.querySelector('.nav-button.next');
            
            if (nextBtn && textArea) {
                nextBtn.disabled = !selectedRadio || textArea.value.trim().length === 0;
            }
        }

        function generateMultipleChoiceQuestion(question) {
            let html = '<div class="answer-options">';
            
            question.options.forEach((option, i) => {
                html += `
                    <div class="selectable-option" onclick="selectAnswer(${currentQuestion}, ${i})">
                        ${option}
                    </div>
                `;
            });
            
            html += '</div>';
            return html;
        }

        function generateFireSliderQuestion() {
            return `
                <div class="slider-container">
                    <div class="slider-labels" style="font-size: 20px;">
                        <span>😎 Niks aan de hand</span>
                        <span>🔥🚒 ALLES STAAT IN DE FIK!</span>
                    </div>
                    <input type="range" 
                        class="slider" 
                        id="fire-slider" 
                        min="0" 
                        max="100" 
                        value="0"
                        oninput="updateFireSliderValue(this.value)"
                    >
                    <div class="slider-value" id="fireSliderValue">0%</div>
                </div>
            `;
        }
        
        function generateMoneySliderQuestion() {
            return `
                <div class="slider-container">
                    <div class="slider-labels" style="font-size: 20px;">
                        <span>Niks</span>
                        <span>💰💰 Dagobert Duck achtig fortuin</span>
                    </div>
                    <input type="range" 
                        class="slider" 
                        id="money-slider" 
                        min="0" 
                        max="100" 
                        value="0"
                        oninput="updateMoneySliderValue(this.value)"
                    >
                    <div class="slider-value" id="moneySliderValue" style="font-size: 36px; min-height: 50px;">-</div>
                </div>
            `;
        }
        
        function generateTextInputQuestion(question) {
            return `
                <div style="max-width: 500px; margin: 0 auto;">
                    <input type="text" 
                        class="text-input-field" 
                        id="text-input" 
                        placeholder="${question.placeholder || 'Type je antwoord hier...'}"
                        style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                               border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                               color: var(--text-white); font-size: 18px; text-align: center;
                               transition: all 0.3s ease;"
                        onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                        onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                        oninput="enableNextIfFilled()"
                    >
                </div>
            `;
        }
        
        function generateDoubleTextInputQuestion(question) {
            return `
                <div style="max-width: 500px; margin: 0 auto;">
                    <input type="text" 
                        class="text-input-field" 
                        id="text-input-1" 
                        placeholder="${question.placeholder1 || 'Type je antwoord hier...'}"
                        style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                               border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                               color: var(--text-white); font-size: 18px; text-align: center;
                               transition: all 0.3s ease; margin-bottom: 60px;"
                        onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                        onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                        oninput="enableNextIfDoubleFilled()"
                    >
                    <input type="text" 
                        class="text-input-field" 
                        id="text-input-2" 
                        placeholder="${question.placeholder2 || 'Type je antwoord hier...'}"
                        style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                               border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                               color: var(--text-white); font-size: 18px; text-align: center;
                               transition: all 0.3s ease;"
                        onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                        onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                        oninput="enableNextIfDoubleFilled()"
                    >
                </div>
            `;
        }
        
        function generateNumberInputQuestion(question) {
            return `
                <div style="max-width: 500px; margin: 0 auto;">
                    <input type="number" 
                        class="text-input-field" 
                        id="number-input" 
                        placeholder="${question.placeholder || 'Vul een getal in...'}"
                        min="1"
                        style="width: 100%; padding: 20px 30px; background: rgba(168, 85, 247, 0.1); 
                               border: 3px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; 
                               color: var(--text-white); font-size: 18px; text-align: center;
                               transition: all 0.3s ease;"
                        onfocus="this.style.borderColor='#a855f7'; this.style.background='rgba(168, 85, 247, 0.15)';"
                        onblur="this.style.borderColor='rgba(168, 85, 247, 0.2)'; this.style.background='rgba(168, 85, 247, 0.1)';"
                        oninput="enableNextIfNumberFilled()"
                    >
                </div>
            `;
        }
        
        function updateFireSliderValue(value) {
            document.getElementById('fireSliderValue').textContent = value + '%';
        }
        
        function updateMoneySliderValue(value) {
            const moneyBags = Math.floor(value / 10);
            let display = '';
            for (let i = 0; i < moneyBags; i++) {
                display += '💰';
            }
            if (moneyBags === 0 && value > 0) {
                display = '💸'; // Kleine hoeveelheid
            }
            document.getElementById('moneySliderValue').innerHTML = display || '-';
        }
        
        function checkTaskDetailsComplete() {
            let allFilled = true;
            selectedTasks.forEach((task, i) => {
                const hoursInput = document.getElementById(`hours-${i}`);
                if (!hoursInput || !hoursInput.value || parseInt(hoursInput.value) <= 0) {
                    allFilled = false;
                }
            });
            
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn) {
                nextBtn.disabled = !allFilled;
            }
        }

        function enableNextIfFilled() {
            const input = document.getElementById('text-input');
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn && input) {
                nextBtn.disabled = input.value.trim().length === 0;
            }
        }
        
        function enableNextIfDoubleFilled() {
            const input1 = document.getElementById('text-input-1');
            const input2 = document.getElementById('text-input-2');
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn && input1 && input2) {
                nextBtn.disabled = input1.value.trim().length === 0 || input2.value.trim().length === 0;
            }
        }
        function enableNextIfTripleFilled() {
            const input1 = document.getElementById('text-input-1');
            const input2 = document.getElementById('text-input-2');
            const input3 = document.getElementById('text-input-3');
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn && input1 && input2 && input3) {
                nextBtn.disabled = input1.value.trim().length === 0 || input2.value.trim().length === 0 || input3.value.trim().length === 0;
            }
        }
        
        function enableNextIfNumberFilled() {
            const input = document.getElementById('number-input');
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn && input) {
                nextBtn.disabled = !input.value || parseInt(input.value) < 1;
            }
        }

        function generateSliderQuestion() {
            return `
                <div class="slider-container">
                    <div class="slider-labels">
                        <span>Niks</span>
                        <span>Een Dagobert Duck fortuin</span>
                    </div>
                    <input type="range" 
                        class="slider" 
                        id="omzet-slider" 
                        min="0" 
                        max="100" 
                        value="50"
                        oninput="updateSliderValue(this.value)"
                    >
                    <div class="slider-value" id="sliderValue">50%</div>
                </div>
            `;
        }

        function updateSliderValue(value) {
            document.getElementById('sliderValue').textContent = value + '%';
        }

        function selectAnswer(questionIndex, optionIndex) {
            // Remove previous selection
            document.querySelectorAll('.selectable-option').forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            document.querySelectorAll('.selectable-option')[optionIndex].classList.add('selected');
            
            // Store the selection
            answers[questionIndex] = document.querySelectorAll('.selectable-option')[optionIndex].textContent.trim();
            
            // Enable next button
            const nextBtn = document.querySelector('.nav-button.next');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }

        function updateNavigationButtons(index) {
            let navHTML = '';
            
            // Previous button
            if (index > 0) {
                navHTML += `
                    <button class="nav-button" onclick="previousQuestion()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Vraag ${index}</span>
                    </button>
                `;
            } else {
                navHTML += '<div></div>'; // Empty div for spacing
            }
            
            // Next button
            if (index < questions.length - 1) {
                navHTML += `
                    <button class="nav-button next" onclick="nextQuestion()" ${shouldDisableNext(index) ? 'disabled' : ''}>
                        <span>Vraag ${index + 2}</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                `;
            } else {
                navHTML += `
                    <button class="nav-button next" onclick="showResults()">
                        <span>Bekijk resultaat</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                `;
            }
            
            document.getElementById('navigationButtons').innerHTML = navHTML;
        }

        function shouldDisableNext(index) {
            // For question 1, check if any tasks are selected
            if (index === 0) {
                return true; // Will be updated by updateSelectedTasks()
            }
            // For question 2 (task details), check if all fields are filled
            if (index === 1) {
                return true; // Start disabled, will be checked dynamically
            }
            // For question 3 (radio with text), check if option selected and text filled
            if (index === 2) {
                return true; // Start disabled
            }
            // For question 4 (multiple choice), check if option selected
            if (index === 3) {
                return true; // Start disabled
            }
            // For question 5 (double text input), check if both filled
            if (index === 4) {
                return true; // Will be updated by enableNextIfDoubleFilled()
            }
            // For question 6 (number input), check if filled
            if (index === 5) {
                return true; // Will be updated by enableNextIfNumberFilled()
            }
            // For question 7 (ergernissen), check if any are selected
            if (index === 6) {
                return true; // Will be updated by updateSelectedErgernissen()
            }
            // For question 8 (obstacles), check if any are selected
            if (index === 7) {
                return true; // Will be updated by updateSelectedObstacles()
            }
            return false;
        }

        function saveCurrentAnswer() {
            const question = questions[currentQuestion];
            
            switch(question.type) {
                case 'checkbox':
                    answers[currentQuestion] = {
                        selectedTasks: [...selectedTasks],
                        andersTasks: [...andersTasks]
                    };
                    break;
                case 'task-details':
                    const details = {};
                    selectedTasks.forEach((task, i) => {
                        details[task] = {
                            hours: document.getElementById(`hours-${i}`).value || 0
                        };
                    });
                    answers[currentQuestion] = details;
                    break;
                case 'radio-with-text':
                    const selectedRadio = document.querySelector('input[name="priority"]:checked');
                    answers[currentQuestion] = {
                        priority: selectedRadio ? selectedRadio.value : null,
                        reason: document.getElementById('waarom-text').value
                    };
                    break;
                case 'multiple-choice':
                    const selected = document.querySelector('.selectable-option.selected');
                    answers[currentQuestion] = selected ? selected.textContent.trim() : null;
                    break;
                case 'checkbox-multi':
                    answers[currentQuestion] = {
                        selectedErgernissen: [...selectedErgernissen],
                        andersErgernissen: [...andersErgernissen]
                    };
                    break;
                case 'slider':
                    answers[currentQuestion] = document.getElementById('omzet-slider').value;
                    break;
                case 'slider-fire':
                    answers[currentQuestion] = document.getElementById('fire-slider').value;
                    break;
                case 'slider-money':
                    answers[currentQuestion] = document.getElementById('money-slider').value;
                    break;
                case 'checkbox-obstacles':
                    answers[currentQuestion] = {
                        selectedObstacles: [...selectedObstacles],
                        andersObstacles: [...andersObstacles]
                    };
                    break;
                case 'text-input':
                    answers[currentQuestion] = document.getElementById('text-input').value;
                    break;
                case 'triple-text-input':
                    answers[currentQuestion] = {
                        bedrijfsnaam: document.getElementById('text-input-1').value,
                        branche: document.getElementById('text-input-2').value,
                        description: document.getElementById('text-input-3').value
                    };
                    break;  
                case 'number-input':
                    answers[currentQuestion] = parseInt(document.getElementById('number-input').value) || 0;
                    break;
            }
        }

        function restoreAnswer(index) {
            const question = questions[index];
            const answer = answers[index];
            
            if (!answer) return;
            
            switch(question.type) {
                case 'checkbox':
                    // Restore selected tasks and anders tasks
                    if (answer.selectedTasks) {
                        selectedTasks = [...answer.selectedTasks];
                        andersTasks = [...(answer.andersTasks || [])];
                        
                        // Wait for DOM to be ready
                        setTimeout(() => {
                            // Restore standard checkboxes
                            document.querySelectorAll('input[name="tasks"]').forEach(checkbox => {
                                const isSelected = selectedTasks.includes(checkbox.value) && !andersTasks.includes(checkbox.value);
                                checkbox.checked = isSelected;
                                const option = checkbox.closest('.selectable-option');
                                if (isSelected) {
                                    option.classList.add('selected');
                                } else {
                                    option.classList.remove('selected');
                                }
                            });
                            
                            // Restore anders fields
                            const container = document.getElementById('andereTakenContainer');
                            if (container && andersTasks.length > 0) {
                                // Remove any existing anders inputs first
                                container.querySelectorAll('.anders-input').forEach(input => {
                                    input.parentElement.remove();
                                });
                                
                                // Add back the saved anders tasks
                                andersTasks.forEach(task => {
                                    const newFieldId = `anders-restored-${Date.now()}-${Math.random()}`;
                                    const newField = document.createElement('div');
                                    newField.className = 'anders-input-container';
                                    newField.innerHTML = `
                                        <input type="text" 
                                            class="anders-input saved" 
                                            id="${newFieldId}"
                                            value="${task}"
                                            data-saved-value="${task}"
                                            readonly
                                            onblur="handleAndersInput('${newFieldId}')"
                                            onkeypress="if(event.key==='Enter') handleAndersInput('${newFieldId}')"
                                        >
                                        <button class="edit-anders-btn" onclick="editAndersField('${newFieldId}')">Wijzig</button>
                                        <button class="delete-anders-btn" onclick="deleteAndersField('${newFieldId}')">X</button>
                                    `;
                                    container.insertBefore(newField, container.querySelector('.add-anders-btn'));
                                });
                            }
                            
                            // Update button state
                            updateSelectedTasks();
                        }, 20);
                    }
                    break;
                case 'task-details':
                    // Restore hours
                    setTimeout(() => {
                        selectedTasks.forEach((task, i) => {
                            if (answer[task]) {
                                const hoursInput = document.getElementById(`hours-${i}`);
                                if (hoursInput) hoursInput.value = answer[task].hours || '';
                            }
                        });
                        // Check if all filled
                        checkTaskDetailsComplete();
                    }, 50);
                    break;
                case 'radio-with-text':
                    if (answer.priority) {
                        const radio = document.querySelector(`input[value="${answer.priority}"]`);
                        if (radio) {
                            radio.checked = true;
                            radio.closest('.selectable-option').classList.add('selected');
                        }
                    }
                    if (answer.reason) {
                        const textarea = document.getElementById('waarom-text');
                        if (textarea) textarea.value = answer.reason;
                    }
                    setTimeout(() => {
                        checkRadioWithTextComplete();
                    }, 50);
                    break;
                case 'multiple-choice':
                    const options = document.querySelectorAll('.selectable-option');
                    options.forEach(option => {
                        if (option.textContent.trim() === answer) {
                            option.classList.add('selected');
                        }
                    });
                    // Enable next button if we have a selection
                    const nextBtn = document.querySelector('.nav-button.next');
                    if (nextBtn && answer) {
                        nextBtn.disabled = false;
                    }
                    break;
                case 'checkbox-multi':
                    // Restore selected ergernissen
                    if (answer.selectedErgernissen) {
                        selectedErgernissen = [...answer.selectedErgernissen];
                        andersErgernissen = [...(answer.andersErgernissen || [])];
                        
                        setTimeout(() => {
                            // Restore standard checkboxes
                            document.querySelectorAll('input[name="ergernissen"]').forEach(checkbox => {
                                const isSelected = selectedErgernissen.includes(checkbox.value) && !andersErgernissen.includes(checkbox.value);
                                checkbox.checked = isSelected;
                                const option = checkbox.closest('.selectable-option');
                                if (isSelected) {
                                    option.classList.add('selected');
                                } else {
                                    option.classList.remove('selected');
                                }
                            });
                            
                            // Restore anders fields
                            const container = document.getElementById('andereErgernissenContainer');
                            if (container && andersErgernissen.length > 0) {
                                // Remove any existing anders inputs first
                                container.querySelectorAll('.anders-input').forEach(input => {
                                    input.parentElement.remove();
                                });
                                
                                // Add back the saved anders ergernissen
                                andersErgernissen.forEach(ergernis => {
                                    const newFieldId = `anders-ergernis-restored-${Date.now()}-${Math.random()}`;
                                    const newField = document.createElement('div');
                                    newField.className = 'anders-input-container';
                                    newField.innerHTML = `
                                        <input type="text" 
                                            class="anders-input saved" 
                                            id="${newFieldId}"
                                            value="${ergernis}"
                                            data-saved-value="${ergernis}"
                                            readonly
                                            onblur="handleAndersErgernisInput('${newFieldId}')"
                                            onkeypress="if(event.key==='Enter') handleAndersErgernisInput('${newFieldId}')"
                                        >
                                        <button class="edit-anders-btn" onclick="editAndersErgernisField('${newFieldId}')">Wijzig</button>
                                        <button class="delete-anders-btn" onclick="deleteAndersErgernisField('${newFieldId}')">X</button>
                                    `;
                                    container.insertBefore(newField, container.querySelector('.add-anders-btn'));
                                });
                            }
                            
                            // Update button state
                            updateSelectedErgernissen();
                        }, 20);
                    }
                    break;
                case 'slider':
                    const slider = document.getElementById('omzet-slider');
                    if (slider) {
                        slider.value = answer;
                        updateSliderValue(answer);
                    }
                    break;
                case 'slider-fire':
                    const fireSlider = document.getElementById('fire-slider');
                    if (fireSlider) {
                        fireSlider.value = answer || 0;
                        updateFireSliderValue(answer || 0);
                    }
                    break;
                case 'slider-money':
                    const moneySlider = document.getElementById('money-slider');
                    if (moneySlider) {
                        moneySlider.value = answer || 0;
                        updateMoneySliderValue(answer || 0);
                    }
                    break;
                case 'checkbox-obstacles':
                    if (answer.selectedObstacles) {
                        selectedObstacles = [...answer.selectedObstacles];
                        andersObstacles = [...(answer.andersObstacles || [])];
                        
                        setTimeout(() => {
                            document.querySelectorAll('input[name="obstacles"]').forEach(checkbox => {
                                const isSelected = selectedObstacles.includes(checkbox.value) && !andersObstacles.includes(checkbox.value);
                                checkbox.checked = isSelected;
                                const option = checkbox.closest('.selectable-option');
                                if (isSelected) {
                                    option.classList.add('selected');
                                } else {
                                    option.classList.remove('selected');
                                }
                            });
                            
                            const container = document.getElementById('andereObstaclesContainer');
                            if (container && andersObstacles.length > 0) {
                                container.querySelectorAll('.anders-input').forEach(input => {
                                    input.parentElement.remove();
                                });
                                
                                andersObstacles.forEach(obstacle => {
                                    const newFieldId = `anders-obstacle-restored-${Date.now()}-${Math.random()}`;
                                    const newField = document.createElement('div');
                                    newField.className = 'anders-input-container';
                                    newField.innerHTML = `
                                        <input type="text" 
                                            class="anders-input saved" 
                                            id="${newFieldId}"
                                            value="${obstacle}"
                                            data-saved-value="${obstacle}"
                                            readonly
                                            onblur="handleAndersObstacleInput('${newFieldId}')"
                                            onkeypress="if(event.key==='Enter') handleAndersObstacleInput('${newFieldId}')"
                                        >
                                        <button class="edit-anders-btn" onclick="editAndersObstacleField('${newFieldId}')">Wijzig</button>
                                        <button class="delete-anders-btn" onclick="deleteAndersObstacleField('${newFieldId}')">X</button>
                                    `;
                                    container.insertBefore(newField, container.querySelector('.add-anders-btn'));
                                });
                            }
                            
                            updateSelectedObstacles();
                        }, 20);
                    }
                    break;
                case 'text-input':
                    const textInput = document.getElementById('text-input');
                    if (textInput) {
                        textInput.value = answer;
                        enableNextIfFilled();
                    }
                    break;
                case 'triple-text-input':
                    const textInput1 = document.getElementById('text-input-1');
                    const textInput2 = document.getElementById('text-input-2');
                    const textInput3 = document.getElementById('text-input-3');
                    if (textInput1 && answer.bedrijfsnaam) {
                    textInput1.value = answer.bedrijfsnaam;
                    }
                    if (textInput2 && answer.branche) {
                    textInput2.value = answer.branche;
                    }
                    if (textInput3 && answer.description) {
                        textInput3.value = answer.description;
                    }
                    if (textInput1 && textInput2 && textInput3) {
                        enableNextIfTripleFilled();
                    }
                    break;
            }
        }

        function previousQuestion() {
            saveCurrentAnswer();
            currentQuestion--;
            showQuestion(currentQuestion);
        }

        function nextQuestion() {
            saveCurrentAnswer();
            currentQuestion++;
            showQuestion(currentQuestion);
        }

        function showResults() {
    saveCurrentAnswer();
    
    document.getElementById('questionSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    
    // Toon laad scherm met roterende teksten
    document.querySelector('.results-container').innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
            <div style="max-width: 696px; margin: 0 auto 40px;">
    <img src="assets/images/alpaca_dashboard.jpg" 
         alt="AI Processing" 
         style="width: 100%; height: auto; border-radius: 20px; box-shadow: 0 10px 40px rgba(168, 85, 247, 0.3);">
</div>
            <h2 style="font-size: 32px; margin-bottom: 20px; color: var(--text-white); font-weight: 700;">
                Onze AI is druk bezig om uit te zoeken
            </h2>
            <p id="rotating-text" style="font-size: 20px; color: var(--text-light); margin-bottom: 40px; font-weight: 400; min-height: 30px; transition: opacity 0.3s ease;">
                welke processen het meeste opleveren
            </p>
            <div class="loading-dots" style="display: flex; justify-content: center; gap: 10px;">
                <div style="width: 15px; height: 15px; background: var(--pink); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both;"></div>
                <div style="width: 15px; height: 15px; background: var(--pink); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div>
                <div style="width: 15px; height: 15px; background: var(--pink); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div>
            </div>
        </div>
        
        <style>
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
        </style>
    `;
    
    // Start rotating text
    const rotatingTexts = [
        "welke processen het meeste opleveren",
        "hoeveel uren jij kan besparen",
        "hoe je efficiënter kan werken",
        "hoe we jou aan meer omzet en minder hoofdpijn gaan helpen",
        "hoe hoog jouw automatiseringspotentieel is",
        "waar de grootste tijdvreters in je processen zitten",
        "welke quick wins we voor je hebben gevonden",
        "wat de slimste volgorde is om te beginnen"
    ];

    let textIndex = 0;
    const rotateTextInterval = setInterval(() => {
        const textElement = document.getElementById('rotating-text');
        if (textElement) {
            textIndex = (textIndex + 1) % rotatingTexts.length;
            textElement.style.opacity = '0';
            setTimeout(() => {
                textElement.textContent = rotatingTexts[textIndex];
                textElement.style.opacity = '1';
            }, 300);
        } else {
            clearInterval(rotateTextInterval);
        }
    }, 3000); // Wissel elke 3 seconden
    // Check voor gepersonaliseerde sessie - voeg teksten toe aan wachtscherm
    if (sessionStorage.getItem('is_personalized') === 'true') {
        const name = sessionStorage.getItem('personalized_name');
        const email = sessionStorage.getItem('personalized_email');
        
        
            // 1. Voeg "Bedankt [Naam]" toe BOVEN de afbeelding
            const img = document.querySelector('img[alt="AI Processing"]');
            if (img) {
                const bedanktTekst = document.createElement('h2');
                bedanktTekst.style.cssText = 'font-size: 32px; margin-bottom: 20px; color: var(--text-white); font-weight: 700;';
                bedanktTekst.textContent = `Bedankt ${name}, wij weten genoeg`;
                img.parentElement.insertBefore(bedanktTekst, img);
            }
            
            // 2. Voeg email info toe ONDER de loading dots
            const loadingDots = document.querySelector('.loading-dots');
            if (loadingDots) {
                const emailInfo = document.createElement('div');
                emailInfo.style.cssText = 'margin-top: 40px; text-align: center;';
                emailInfo.innerHTML = `
                    <h2 style="font-size: 26px; margin-bottom: 15px; color: var(--text-white); font-weight: 700;">
                        Check ${email}, over 10 min zijn je resultaten binnen
                    </h2>
                    <p style="font-size: 20px; color: var(--text-light); font-weight: 400;">
                        Zie je geen mail? Kijk dan even bij spam
                    </p>
                `;
                loadingDots.parentElement.appendChild(emailInfo);
            }
        
        
        
    }
    
    // Verzamel alle data voor n8n
    const submissionData = prepareLLMData();
    // Voor gepersonaliseerde links: voeg naam en email toe aan submission data
const isPersonalized = sessionStorage.getItem('is_personalized') === 'true';
if (isPersonalized) {
    submissionData.contact_name = sessionStorage.getItem('personalized_name');
    submissionData.contact_email = sessionStorage.getItem('personalized_email');
    console.log('✅ Naam toegevoegd aan submission:', submissionData.contact_name);
}
            
            // Bepaal minimum wachttijd (35-65 sec voor perceived value)
            const minWaitTime = 0;
            const startTime = Date.now();
            
            // Stuur naar N8N
            sendToSupabase(submissionData).then(submission => {
                // Check voor gepersonaliseerde sessie
    const isPersonalized = sessionStorage.getItem('is_personalized') === 'true';
    
    if (isPersonalized) {
        console.log('📤 Gepersonaliseerde sessie - skip resultaten');
        
        const name = sessionStorage.getItem('personalized_name');
        const email = sessionStorage.getItem('personalized_email');
        
        // Trigger gepersonaliseerde webhook
        setTimeout(() => {
            fetch('https://hjemj85.app.n8n.cloud/webhook/1178c22d-93c1-4b0e-a52f-0a5ab8f9fbbf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'personalized_report',
                    session_id: sessionId,
                    voornaam: name,  // ← AANGEPAST: name → voornaam
                    email: email,
                    source: 'personalized_link',
                    timestamp: new Date().toISOString()
                })
            });
        }, 2000);
        
        return; // Stop hier voor gepersonaliseerde links
    }
    
    // Hieronder blijft alles zoals het was
    if (submission && submission.id) {
        console.log('N8N webhook triggered, starting to poll with session_id');
        // Wacht op complete resultaten van n8n
        waitForCompleteResults(submission.id, startTime, minWaitTime);
    } else {
        console.error('Failed to trigger N8N webhook');
        // Fallback bij error
        setTimeout(() => {
            document.querySelector('.results-container').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2 style="color: var(--text-white);">Er ging iets mis</h2>
                    <p style="color: var(--text-light);">Probeer het later opnieuw</p>
                    <button class="cta-button" onclick="location.reload()">
                        Probeer opnieuw
                    </button>
                </div>
            `;
        }, 2000);
    }
}).catch(error => {
    console.error('Error in submission:', error);
    setTimeout(() => {
        document.querySelector('.results-container').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: var(--text-white);">Er ging iets mis</h2>
                <p style="color: var(--text-light);">Probeer het later opnieuw</p>
                <button class="cta-button" onclick="location.reload()">
                    Probeer opnieuw
                </button>
            </div>
        `;
    }, 2000);
});
        }
        
        function prepareLLMData() {
            // Verzamel alle ruwe data voor n8n
            const tasks = [];
            
            // Verzamel alle taken met hun data
            // Automation scores voor standaard taken
            const taskAutomationScores = {
                "Data invoeren/overzetten": 3,
                "Data analyse": 3,
                "Gegevens opzoeken": 3,
                "Rapporten maken": 2,
                "Emails/offertes versturen": 2,
                "Planning/roosters maken": 2,
                "Herhalende administratieve klussen": 2,
                "Werken met Excel bestanden": 4,
                "Klantgegevens bijwerken/opzoeken": 2,
                "Documenten archiveren/opslaan": 1,
                "Status updates geven": 2,
                "Contracten/documenten opstellen": 2,
                "KPI's/cijfers verzamelen": 4,
                "Agenda's/afspraken beheren": 1
            };

            const savingsPercentages = {
                4: 0.92,
                3: 0.81,
                2: 0.67,
                1: 0.50,
                0: 0
            };

            selectedTasks.forEach((taskName) => {
                const taskData = answers[1][taskName];
                if (taskData) {
                    const hours = parseInt(taskData.hours) || 0;
                    const hoursMultiplier = hours / 10;
                    const isAndersTask = andersTasks.includes(taskName);
                    const isPriority = taskName === answers[2]?.priority;
                    
                    // Bepaal automation score (alleen voor standaard taken)
                    let automationScore = 0;
                    let score = 0;
                    let potentialSaving = 0;
                    
                    if (!isAndersTask && taskAutomationScores[taskName]) {
                        automationScore = taskAutomationScores[taskName];
                        score = Math.pow(automationScore, 2) * hoursMultiplier;
                        if (isPriority) score = score * 1.2;
                        
                        const savingPercentage = savingsPercentages[automationScore] || 0;
                        potentialSaving = Math.round(hours * savingPercentage);
                    }
                    
                    // Hours category
                    let hoursCategory = "heel weinig";
                    if (hours > 100) hoursCategory = "heel veel";
                    else if (hours >= 51) hoursCategory = "veel";
                    else if (hours >= 26) hoursCategory = "gemiddeld";
                    else if (hours >= 11) hoursCategory = "weinig";
                    
                    tasks.push({
                        taskName: taskName,
                        hours: hours,
                        automationScore: automationScore,
                        hoursCategory: hoursCategory,
                        hoursMultiplier: hoursMultiplier,
                        score: score,
                        isPriority: isPriority,
                        potentialSaving: potentialSaving,
                        isAndersTask: isAndersTask
                    });
                }
            });
            
            // Bereken pain score (ergernissen + obstakels)
            const ergernissen = answers[6]?.selectedErgernissen || [];
            const obstacles = answers[7]?.selectedObstacles || [];
            const isZen = ergernissen.includes("Niks, ik ben zen 🧘");
            const isOrientering = obstacles.includes("Niks, ik oriënteer me");
            
            return {
            // Basis info
            bedrijfsnaam: answers[4]?.bedrijfsnaam || "Niet opgegeven",
            branche: answers[4]?.branche || "Niet opgegeven",
            bedrijfs_omschrijving: answers[4]?.description || "Niet opgegeven",
            teamSize: answers[5] || "Niet opgegeven",
                
                // Source tracking
                sourceType: detectSourceType(),
                
                // Taken data
                tasks: tasks,
                priorityTask: answers[2]?.priority,
                priorityReason: answers[2]?.reason,
                
                // Systemen
                systems: answers[3],
                
                // Pijn punten
                ergernissen: ergernissen,
                isZen: isZen,
                obstacles: obstacles,
                isOrientering: isOrientering,
                
                // Impact
                firePercentage: answers[8] || 0,
                missedRevenue: answers[9] || 0,
                
                // Alle "anders" opties - deze zijn al gefilterd tijdens saveCurrentAnswer
                andersTasks: andersTasks,
                andersErgernissen: andersErgernissen,
                andersObstacles: andersObstacles
            };
        }
        
        function displayResultsPreview(data) {
    // Parse JSON strings als ze als string zijn opgeslagen
    if (typeof data.top_3_tasks === 'string') {
        try {
            data.top_3_tasks = JSON.parse(data.top_3_tasks);
        } catch (e) {
            console.error('Error parsing top_3_tasks:', e);
            data.top_3_tasks = [];
        }
    }
    
    if (typeof data.summary === 'string') {
        try {
            data.summary = JSON.parse(data.summary);
        } catch (e) {
            console.error('Error parsing summary:', e);
            data.summary = {};
        }
    }
    
    if (typeof data.all_tasks === 'string') {
        try {
            data.all_tasks = JSON.parse(data.all_tasks);
        } catch (e) {
            console.error('Error parsing all_tasks:', e);
            data.all_tasks = [];
        }
    }
    
    // Data komt nu compleet uit n8n/Supabase
    const automationPotential = data.automation_potential || "Berekenen...";
    const totalHoursSaved = data.summary?.total_potential_hours_saved || 0;
    const efficiencyPercentage = data.summary?.gemiddelde_besparing_percentage || 0;
    
    // Extract emoji en tekst voor het potentieel vakje
    const potentialParts = automationPotential.split(' ');
    const potentialEmoji = potentialParts[0];
    const potentialText = potentialParts.slice(1).join(' ');
    
    // Tel alle automatiseerbare taken per categorie
    const automatiseerbareTaken = data.all_tasks ? data.all_tasks.filter(t => t.score > 0) : [];
    
    // Groepeer taken per label
    const takenPerLabel = {};
    automatiseerbareTaken.forEach(task => {
        const label = task.taskLabel || 'Overig';
        if (!takenPerLabel[label]) {
            takenPerLabel[label] = 0;
        }
        takenPerLabel[label]++;
    });
    
    // Check of er überhaupt automatiseerbare taken zijn
    const hasAutomatiseerbareTaken = data.summary?.total_automatiseerbare_taken > 0;
    
    document.querySelector('.results-container').innerHTML = `
        <h2 class="results-title" style="font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 5px;">
            ${answers[4]?.bedrijfsnaam || 'Jouw bedrijf'}
        </h2>
        <h2 class="results-title" style="font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 20px;">
            Automatiseringspotentieel
        </h2>
        
        ${hasAutomatiseerbareTaken ? `
            <!-- 3 vakjes naast elkaar - COMPACTER -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 0 auto 20px; max-width: 700px;">
                <div style="background: rgba(236, 72, 153, 0.1); border: 2px solid var(--pink); 
                            border-radius: 1rem; padding: 20px 15px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: var(--pink); margin-bottom: 3px;">
                        ${totalHoursSaved}
                    </div>
                    <div style="font-size: 13px; color: var(--text-light); line-height: 1.3;">
                        potentieel uren per<br>maand te besparen
                    </div>
                </div>
                
                <div style="background: rgba(96, 165, 250, 0.1); border: 2px solid var(--light-blue); 
                            border-radius: 1rem; padding: 20px 15px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: var(--light-blue); margin-bottom: 3px;">
                        ${efficiencyPercentage}%
                    </div>
                    <div style="font-size: 13px; color: var(--text-light); line-height: 1.3;">
                        gemiddelde<br>efficiëntiewinst
                    </div>
                </div>
                
                <div style="background: rgba(168, 85, 247, 0.1); border: 2px solid var(--purple); 
                            border-radius: 1rem; padding: 20px 15px; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 3px;">${potentialEmoji}</div>
                    <div style="font-size: 13px; color: var(--text-light); line-height: 1.3; font-weight: 600;">
                        ${potentialText}
                    </div>
                </div>
            </div>
            
            <!-- Taken overzicht - COMPACTER -->
            <div style="background: rgba(168, 85, 247, 0.1); border: 2px solid var(--purple); 
                        border-radius: 1rem; padding: 25px; margin: 0 auto 25px; max-width: 650px;">
                <h3 style="font-size: 20px; margin-bottom: 15px; text-align: center; color: var(--text-white);">
                    We hebben ${automatiseerbareTaken.length} automatiseerbare taken gevonden!
                </h3>
                <div style="font-size: 15px; line-height: 1.6;">
                    ${Object.entries(takenPerLabel).map(([label, count]) => 
                        `<div style="margin-bottom: 8px;">✅ <strong>${count}x</strong> ${label}</div>`
                    ).join('')}
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="font-size: 16px; text-align: center; font-weight: 600; margin-bottom: 12px;">
                        De details staan in je persoonlijke rapport:
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 14px;">
                        <div>• taken met meeste impact</div>
                        <div>• Valkuilen</div>
                        <div>• Kansen</div>
                        <div>• Quick wins</div>
                        <div>• Waar te beginnen</div>
                        <div>• Meer winst minder hoofdpijn</div>
                    </div>
                </div>
            </div>
        ` : `
            <div style="background: rgba(168, 85, 247, 0.1); border: 2px solid var(--purple); 
                        border-radius: 1rem; padding: 35px; margin: 30px auto; max-width: 650px;">
                <h3 style="font-size: 22px; margin-bottom: 15px; text-align: center; color: var(--text-white);">
                    Helaas, geen automatiseringskansen gevonden
                </h3>
                <p style="font-size: 16px; color: var(--text-light); text-align: center; line-height: 1.5;">
                    Op basis van je antwoorden hebben we geen taken gevonden die eenvoudig te automatiseren zijn. 
                    Dit kan komen doordat je taken te complex zijn, of omdat ze menselijk contact vereisen.
                </p>
                <p style="font-size: 16px; color: var(--text-light); text-align: center; margin-top: 15px;">
                    Maar geen zorgen! Er zijn mogelijk andere manieren om je processen te verbeteren.
                </p>
            </div>
        `}
        
        <div class="email-section" style="margin-top: 25px; padding: 30px;">
            <h3 style="font-size: 22px; margin-bottom: 12px;">
                ${hasAutomatiseerbareTaken ? `Ontvang het complete rapport voor ${answers[4]?.bedrijfsnaam || 'jouw bedrijf'}` : 'Wil je toch advies ontvangen?'}
            </h3>
            <p style="font-size: 15px; margin-bottom: 18px;">
                ${hasAutomatiseerbareTaken ? 'Met een gedetailleerde analyse' : 'Onze experts kijken graag persoonlijk naar jouw situatie'}
            </p>
            <form class="email-form" onsubmit="submitEmail(event)">
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; max-width: 380px; margin: 0 auto;">
                    <input type="text" 
                        class="email-input" 
                        name="voornaam" 
                        placeholder="Voornaam" 
                        required
                        style="text-align: left; padding: 10px 15px; font-size: 14px;">
                    <input type="email" 
                        class="email-input" 
                        name="email" 
                        placeholder="jouw@email.nl" 
                        required
                        style="text-align: left; padding: 10px 15px; font-size: 14px;">
                </div>
                <button type="submit" class="cta-button" style="margin-top: 18px; padding: 0.8rem 1.8rem; font-size: 14px;">
                    <span>${hasAutomatiseerbareTaken ? 'Stuur mijn automatiseringsrapport' : 'Vraag persoonlijk advies aan'}</span>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M6.75 4.5L11.25 9L6.75 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </form>
        </div>
    `;
}

        function calculateScore() {
            // Analyseer taken met het nieuwe scoring systeem
            const taskAnalysis = analyzeAllTasks();
            
            // Basis score componenten
            let score = 0;
            
            // 1. Taken score (0-40 punten)
            // Meer taken + hogere automation scores = hogere score
            const avgAutomationScore = taskAnalysis.allTasks.reduce((sum, t) => sum + t.automationScore, 0) / taskAnalysis.allTasks.length || 0;
            score += (selectedTasks.length / 14) * 20; // Max 20 punten voor aantal taken
            score += (avgAutomationScore / 4) * 20; // Max 20 punten voor automation ease
            
            // 2. Tijd impact (0-30 punten)
            const totalHours = taskAnalysis.totalHoursPerMonth;
            if (totalHours > 200) score += 30;
            else if (totalHours > 100) score += 25;
            else if (totalHours > 50) score += 20;
            else if (totalHours > 25) score += 15;
            else if (totalHours > 10) score += 10;
            else score += 5;
            
            // 3. Systemen (0-10 punten)
            const systems = answers[3];
            if (systems === "Te veel om te tellen") score += 10;
            else if (systems === "Meer dan 5 systemen") score += 8;
            else if (systems === "3-5 systemen") score += 5;
            else score += 2;
            
            // 4. Brandjes blussen (0-10 punten)
            const firePercentage = parseInt(answers[8]) || 0;
            score += (firePercentage / 100) * 10;
            
            // 5. Gemiste omzet (0-10 punten)
            const missedRevenue = parseInt(answers[9]) || 0;
            score += (missedRevenue / 100) * 10;
            
            return {
                totalScore: Math.min(Math.round(score), 100),
                taskAnalysis: taskAnalysis,
                insights: {
                    totalHours: totalHours,
                    topTasks: taskAnalysis.topTasks,
                    systemComplexity: systems,
                    firePercentage: firePercentage,
                    missedRevenue: missedRevenue
                }
            };
        }
    
