// ********************** CONFIGURATION & DONNÉES INITIALES ********************************

const STORAGE_KEY = 'bioresulats-demo-v1';

const seedPatients = [

    {
        id: 'PAT-8F3K2X',
        firstName: 'Jores',
        lastName: 'Tagni',
        birthDate: '1985-04-12',
        results: [
            { id: 1, name: 'Glycémie', value: 1.2, unit: 'g/L', min: 0.7, max: 1.1, date: '2026-09-18', published: true },
            { id: 2, name: 'Cholestérol total', value: 2.1, unit: 'g/L', min: 0, max: 2, date: '2026-09-18', published: true },
            { id: 3, name: 'Hémoglobine', value: 14.2, unit: 'g/dL', min: 13, max: 17, date: '2026-09-18', published: false },
        ],
    },

    {
        id: 'PAT-2J9R7M',
        firstName: 'Amina',
        lastName: 'Njoya',
        birthDate: '1993-11-26',
        results: [
            { id: 4, name: 'Glycémie', value: 0.92, unit: 'g/L', min: 0.7, max: 1.1, date: '2026-09-17', published: true },
        ],
    },
    
    {
        id: 'PAT-4D1L8Q',
        firstName: 'Paul',
        lastName: 'Mbarga',
        birthDate: '1977-07-03',
        results: [],
    },
];

// Patients chargés depuis le localStorage, ou données de démo si rien n'est stocké
let patients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedPatients;

// Identifiant du patient actuellement sélectionné dans la vue "professionnel"
let selectedPatientId = patients[0].id;


// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

// Raccourci pour document.querySelector
function $(selector) {
    return document.querySelector(selector);
}

// Retrouve un patient par son identifiant
function getPatient(id) {
    return patients.find(p => p.id === id);
}

// Sauvegarde la liste des patients dans le localStorage
function savePatients() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

// Formate un nombre en français (ex: 1.2 -> "1,20")
function formatNumber(value) {
    return Number(value).toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    });
}

// Formate une date en français (ex: "2026-09-18" -> "18/09/2026")
function formatDate(value) {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(value + 'T12:00:00'));
}


// ============================================================
// NAVIGATION ENTRE LES VUES
// ============================================================

// Affiche la section demandée et masque les autres
function showView(name) {
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
    });
    $(`#${name}-view`).classList.remove('hidden');

    if (name === 'professional') {
        drawProfessionalView();
    }
}


// ============================================================
// AFFICHAGE : LISTE DES PATIENTS (vue professionnel)
// ============================================================

function renderPatientList(items = patients) {
    if (items.length === 0) {
        $('#patient-list').innerHTML = '<p class="p-3 text-sm text-sky-200">Aucun patient trouvé.</p>';
        return;
    }

    $('#patient-list').innerHTML = items.map(p => {
        const isSelected = p.id === selectedPatientId;

        return `
            <button data-patient="${p.id}" class="w-full rounded-xl p-3 text-left ${isSelected ? 'bg-medical' : 'hover:bg-white/10'}">
                <p class="font-semibold">${p.firstName} ${p.lastName}</p>
                <p class="mt-1 text-xs text-sky-200">${p.id} · ${p.results.length} analyse(s)</p>
            </button>
        `;
    }).join('');
}


// ============================================================
// AFFICHAGE : TABLEAU DE RÉSULTATS
// ============================================================

// edit  : true si on affiche le bouton "publié / brouillon" (vue pro)
// owner : identifiant du patient propriétaire des résultats (nécessaire si edit = true)
function renderResultsTable(rows, edit = false, owner = '') {
    if (rows.length === 0) {
        return '<div class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Aucun résultat pour ce patient.</div>';
    }

    const tableRows = rows.map(r => {
        const isAlert = r.value < r.min || r.value > r.max;

        const statusCell = edit
            ? `
                <td class="py-4">
                    <button data-toggle="${r.id}" data-owner="${owner}" class="rounded-full px-3 py-1 text-xs font-bold ${r.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                        ${r.published ? 'Publié' : 'Brouillon'}
                    </button>
                </td>
            `
            : '';

        return `
            <tr class="border-b border-slate-100">
                <td class="py-4 font-semibold text-navy">${r.name}${isAlert ? ' <span class="text-amber-600">●</span>' : ''}</td>
                <td class="py-4 ${isAlert ? 'font-bold text-amber-700' : ''}">${formatNumber(r.value)} ${r.unit}</td>
                <td class="py-4 text-slate-500">${formatNumber(r.min)} – ${formatNumber(r.max)} ${r.unit}</td>
                <td class="py-4 text-slate-500">${formatDate(r.date)}</td>
                ${statusCell}
            </tr>
        `;
    }).join('');

    return `
        <div class="overflow-x-auto">
            <table class="w-full min-w-[540px] text-left text-sm">
                <thead class="border-b text-xs uppercase text-slate-500">
                    <tr>
                        <th class="pb-3">Analyse</th>
                        <th class="pb-3">Résultat</th>
                        <th class="pb-3">Référence</th>
                        <th class="pb-3">Date</th>
                        ${edit ? '<th class="pb-3">Statut</th>' : ''}
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;
}


// ============================================================
// AFFICHAGE : DÉTAIL D'UN PATIENT (vue professionnel)
// ============================================================

function renderPatientDetail(patient) {
    const publishedCount = patient.results.filter(r => r.published).length;
    const pendingCount = patient.results.length - publishedCount;

    $('#patient-detail').innerHTML = `
        <div class="rounded-2xl bg-white shadow-sm">
            <div class="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row">
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-medical">Dossier patient</p>
                    <h1 class="mt-1 text-2xl font-bold text-navy">${patient.firstName} ${patient.lastName}</h1>
                    <p class="mt-1 text-sm text-slate-500">${patient.id} · Né(e) le ${formatDate(patient.birthDate)}</p>
                </div>
                <button data-add-result="${patient.id}" class="rounded-xl bg-medical px-4 py-3 text-sm font-bold text-white">
                    + Ajouter une analyse
                </button>
            </div>

            <div class="grid grid-cols-1 gap-3 border-b p-5 sm:grid-cols-3">
                <div class="rounded-xl bg-skysoft p-3">
                    Analyses <strong class="block text-2xl text-navy">${patient.results.length}</strong>
                </div>
                <div class="rounded-xl bg-emerald-50 p-3">
                    Publiées <strong class="block text-2xl text-emerald-700">${publishedCount}</strong>
                </div>
                <div class="rounded-xl bg-amber-50 p-3">
                    En attente <strong class="block text-2xl text-amber-700">${pendingCount}</strong>
                </div>
            </div>

            <div class="p-5">
                <h2 class="mb-4 font-bold text-navy">Résultats biologiques</h2>
                ${renderResultsTable(patient.results, true, patient.id)}
            </div>
        </div>
    `;
}

// Rafraîchit toute la vue professionnel (compteur, liste, détail)
function drawProfessionalView() {
    $('#patient-count').textContent = `${patients.length} dossiers`;
    renderPatientList();
    renderPatientDetail(getPatient(selectedPatientId));
}


// ============================================================
// AFFICHAGE : DOSSIER PATIENT (vue accès patient)
// ============================================================

function renderPatientRecord(patient) {
    $('#record-title').textContent = `Bonjour, ${patient.firstName}`;
    $('#record-id').textContent = `Patient n° ${patient.id}`;

    // Le patient ne voit que ses résultats publiés
    const publishedResults = patient.results.filter(r => r.published);
    $('#patient-results').innerHTML = renderResultsTable(publishedResults);

    showView('patient-record');
}


// ============================================================
// GESTION DES MODALES (fenêtres pop-up)
// ============================================================

function openModal(html) {
    $('#modal-root').innerHTML = `
        <div class="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4">
            <div class="max-h-[90vh] w-[94%] overflow-y-auto rounded-2xl bg-white p-6 sm:w-[80%] lg:w-[42%]">
                ${html}
            </div>
        </div>
    `;
}

function closeModal() {
    $('#modal-root').replaceChildren();
}

// Formulaire : créer un nouveau patient
function openNewPatientModal() {
    openModal(`
        <div class="flex justify-between">
            <h2 class="text-xl font-bold text-navy">Nouveau patient</h2>
            <button data-close>✕</button>
        </div>
        <form id="patient-form" class="mt-5 space-y-3">
            <div class="flex gap-3">
                <input required name="firstName" placeholder="Prénom" class="w-[50%] rounded-lg border p-3">
                <input required name="lastName" placeholder="Nom" class="w-[50%] rounded-lg border p-3">
            </div>
            <input required name="birthDate" type="date" class="w-full rounded-lg border p-3">
            <button class="w-full rounded-xl bg-medical py-3 font-bold text-white">Créer le dossier</button>
        </form>
    `);
}

// Formulaire : ajouter une analyse à un patient
function openNewResultModal(patientId) {
    openModal(`
        <div class="flex justify-between">
            <h2 class="text-xl font-bold text-navy">Ajouter une analyse</h2>
            <button data-close>✕</button>
        </div>
        <form id="result-form" data-id="${patientId}" class="mt-5 space-y-3">
            <input required name="name" placeholder="Analyse (ex. Glycémie)" class="w-full rounded-lg border p-3">
            <div class="flex gap-3">
                <input required name="value" type="number" step=".01" placeholder="Valeur" class="w-[50%] rounded-lg border p-3">
                <input required name="unit" placeholder="Unité" class="w-[50%] rounded-lg border p-3">
            </div>
            <div class="flex gap-3">
                <input required name="min" type="number" step=".01" placeholder="Référence min." class="w-[50%] rounded-lg border p-3">
                <input required name="max" type="number" step=".01" placeholder="Référence max." class="w-[50%] rounded-lg border p-3">
            </div>
            <input required name="date" type="date" value="2026-09-21" class="w-full rounded-lg border p-3">
            <label class="flex gap-2 text-sm">
                <input name="published" type="checkbox"> Publier immédiatement
            </label>
            <button class="w-full rounded-xl bg-medical py-3 font-bold text-white">Enregistrer l'analyse</button>
        </form>
    `);
}


// ============================================================
// CONNEXION PATIENT (accès par code)
// ============================================================

function accessPatientRecord() {
    const code = $('#patient-code').value.trim().toUpperCase();
    const patient = getPatient(code);

    if (patient) {
        renderPatientRecord(patient);
        return;
    }

    $('#login-error').textContent = 'Identifiant introuvable. Vérifiez votre code.';
    $('#login-error').classList.remove('hidden');
}


// ============================================================
// ÉVÉNEMENTS : CLICS (délégation sur tout le document)
// ============================================================

document.addEventListener('click', (event) => {
    // Changement de vue (ex: data-view="professional")
    const viewName = event.target.closest('[data-view]')?.dataset.view;
    if (viewName) {
        return showView(viewName);
    }

    // Bouton "ajouter un patient"
    if (event.target.closest('#add-patient')) {
        return openNewPatientModal();
    }

    // Bouton de fermeture d'une modale
    if (event.target.closest('[data-close]')) {
        return closeModal();
    }

    // Clic sur un patient dans la liste
    const clickedPatientId = event.target.closest('[data-patient]')?.dataset.patient;
    if (clickedPatientId) {
        selectedPatientId = clickedPatientId;
        return drawProfessionalView();
    }

    // Bouton "ajouter une analyse" pour un patient donné
    const addResultPatientId = event.target.closest('[data-add-result]')?.dataset.addResult;
    if (addResultPatientId) {
        return openNewResultModal(addResultPatientId);
    }

    // Bouton pour publier / dépublier un résultat
    const toggleButton = event.target.closest('[data-toggle]');
    if (toggleButton) {
        const owner = getPatient(toggleButton.dataset.owner);
        const result = owner.results.find(r => r.id === +toggleButton.dataset.toggle);
        result.published = !result.published;
        savePatients();
        return drawProfessionalView();
    }

    // Bouton de connexion patient (accès par code)
    if (event.target.closest('#patient-access')) {
        return accessPatientRecord();
    }

    // Bouton "remplir le code de démo"
    if (event.target.closest('#demo-code')) {
        $('#patient-code').value = 'PAT-8F3K2X';
    }
});


// ============================================================
// ÉVÉNEMENTS : RECHERCHE & SAISIE
// ============================================================

// Recherche en direct dans la liste des patients (vue professionnel)
$('#patient-search').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();

    const filtered = patients.filter(p =>
        `${p.firstName} ${p.lastName} ${p.id}`.toLowerCase().includes(query)
    );

    renderPatientList(filtered);
});

// Permet de valider le code patient avec la touche "Entrée"
$('#patient-code').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        accessPatientRecord();
    }
});


// ============================================================
// ÉVÉNEMENTS : SOUMISSION DES FORMULAIRES
// ============================================================

document.addEventListener('submit', (event) => {

    // Création d'un nouveau patient
    if (event.target.id === 'patient-form') {
        event.preventDefault();

        const formData = new FormData(event.target);
        const newId = 'PAT-' + Math.random().toString(36).slice(2, 8).toUpperCase();

        patients.unshift({
            id: newId,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            birthDate: formData.get('birthDate'),
            results: [],
        });

        selectedPatientId = newId;
        savePatients();
        closeModal();
        drawProfessionalView();
    }

    // Ajout d'un résultat d'analyse à un patient existant
    if (event.target.id === 'result-form') {
        event.preventDefault();

        const formData = new FormData(event.target);
        const patient = getPatient(event.target.dataset.id);

        patient.results.unshift({
            id: Date.now(),
            name: formData.get('name'),
            value: +formData.get('value'),
            unit: formData.get('unit'),
            min: +formData.get('min'),
            max: +formData.get('max'),
            date: formData.get('date'),
            published: formData.has('published'),
        });

        savePatients();
        closeModal();
        drawProfessionalView();
    }
});