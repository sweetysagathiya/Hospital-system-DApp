// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere"; // REMIX REPLACE
const CONTRACT_ABI = [
    "function registerDoctor(address _doctor) external",
    "function registerPatient(address _patient) external",
    "function updateBloodInventory(string _bloodGroup, uint256 _units) external",
    "function addMedicalRecord(address _patient, string _symptoms, string _aiPrescriptionHash) external",
    "function getMyRecordCount() external view returns (uint256)",
    "function getMyRecord(uint256 _index) external view returns (string, string, address, uint256)",
    "function getBloodUnits(string _bloodGroup) external view returns (uint256)"
];

// --- STATE ---
let provider, signer, contract;
let currentAccount = null;

// AI Generated Data Buffer
let pendingAIHash = null;
let pendingSymptoms = "";

// UI ELEMENTS
const connectBtn = document.getElementById('connect-btn');
const toastEl = document.getElementById('toast');

window.addEventListener('DOMContentLoaded', () => {
    switchTab('public');
    
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Setup Read-Only contract default
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        connectBtn.addEventListener('click', connectWallet);
        
        // Admin listeners
        document.getElementById('btn-reg-doctor').addEventListener('click', async () => handleRoleReg('doctor'));
        document.getElementById('btn-reg-patient').addEventListener('click', async () => handleRoleReg('patient'));
        document.getElementById('btn-update-blood').addEventListener('click', updateBloodInventory);
        
        // Doc listeners
        document.getElementById('btn-run-ai').addEventListener('click', runAISimulator);
        document.getElementById('btn-submit-ehr').addEventListener('click', submitEHRToBlockchain);

        // Patient listeners
        document.getElementById('btn-fetch-ehr').addEventListener('click', fetchPatientEHRs);

        // Auto load public data
        setTimeout(fetchBloodData, 1000); 

    } else {
        showToast("MetaMask is not installed!");
    }
});

// --- CORE ETHERS LOGIC ---

async function connectWallet() {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        currentAccount = accounts[0];
        
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        connectBtn.innerText = `${currentAccount.substring(0,6)}...${currentAccount.substring(38)}`;
        connectBtn.classList.replace('bg-medical', 'bg-slate-800');
        
        showToast('Wallet Connected');
        fetchBloodData(); // Refresh read data

    } catch (e) {
        console.error(e);
        showToast('Connection Refused');
    }
}

// --- ADMIN FUNCTIONS ---

async function handleRoleReg(role) {
    if(!contract) return showToast("Connect Wallet");
    const input = role === 'doctor' ? document.getElementById('admin-reg-doctor').value : document.getElementById('admin-reg-patient').value;
    if(!input) return;

    try {
        const tx = role === 'doctor' 
            ? await contract.registerDoctor(input) 
            : await contract.registerPatient(input);
            
        showToast(`Sending ${role} registration tx...`);
        await tx.wait();
        showToast(`Successfully registered ${input} as ${role}!`);
    } catch(err) {
        showToast(err.reason || "Transaction failed. Are you Admin?");
    }
}

async function updateBloodInventory() {
    if(!contract) return showToast("Connect Wallet");
    const group = document.getElementById('admin-blood-type').value;
    const units = document.getElementById('admin-blood-units').value;
    
    try {
        const tx = await contract.updateBloodInventory(group, units);
        showToast("Updating Ledger...");
        await tx.wait();
        showToast("Blood Inventory Updated!");
        fetchBloodData();
    } catch(err) {
        showToast(err.reason || "Transaction failed");
    }
}

// --- PUBLIC FUNCTIONS ---

async function fetchBloodData() {
    if(!contract) return;
    try {
        const aPos = await contract.getBloodUnits("A+");
        const oNeg = await contract.getBloodUnits("O-");
        const bPos = await contract.getBloodUnits("B+");
        const abPos = await contract.getBloodUnits("AB+");

        document.getElementById('blood-A-pos').innerText = aPos.toString();
        document.getElementById('blood-O-neg').innerText = oNeg.toString();
        document.getElementById('blood-B-pos').innerText = bPos.toString();
        document.getElementById('blood-AB-pos').innerText = abPos.toString();
    } catch(err) {
        console.log("Could not fetch blood data. Check contract address.", err);
    }
}

// --- DOCTOR & AI LOGIC ---

/**
 * JS-based mock specific AI Model.
 * In a real Web3 environment, this function queries a backend ML model (like Python/TensorFlow),
 * receives the output, and prepares it for the blockchain.
 */
function runAISimulator() {
    pendingSymptoms = document.getElementById('doc-symptoms').value.toLowerCase();
    const patientAddr = document.getElementById('doc-patient-addr').value;

    if(!pendingSymptoms || !patientAddr) return showToast("Enter patient address & symptoms!");

    document.getElementById('ai-blank-state').classList.add('hidden');
    
    // Simple Heuristic Decision Tree Logic (Mock AI)
    let diagnosis = "General Fatigue";
    let treatmentHash = "0xGenRst";

    if (pendingSymptoms.includes("fever") && pendingSymptoms.includes("cough")) {
        diagnosis = "Viral Infection / Flu";
        treatmentHash = "0xFluViT" + Math.floor(Math.random()*1000); // Random mock hash
    } else if (pendingSymptoms.includes("chest") && pendingSymptoms.includes("pain")) {
        diagnosis = "Cardiac Eval Required";
        treatmentHash = "0xCardio" + Math.floor(Math.random()*1000);
    } else if (pendingSymptoms.includes("headache") || pendingSymptoms.includes("migraine")) {
        diagnosis = "Acute Migraine";
        treatmentHash = "0xMigrnX" + Math.floor(Math.random()*1000);
    }

    pendingAIHash = treatmentHash;

    document.getElementById('ai-diagnosis').innerText = diagnosis;
    document.getElementById('ai-hash').innerText = treatmentHash;
    document.getElementById('ai-result-state').classList.remove('hidden');

    const submitBtn = document.getElementById('btn-submit-ehr');
    submitBtn.disabled = false;
    submitBtn.className = "w-full bg-medical hover:bg-medical-dark text-white font-bold py-3 rounded-lg shadow-md transition-all";
}

async function submitEHRToBlockchain() {
    if(!contract || !currentAccount) return showToast("Connect Wallet");
    const patientAddr = document.getElementById('doc-patient-addr').value;

    const submitBtn = document.getElementById('btn-submit-ehr');
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing Blockchain Tx...";

    try {
        const tx = await contract.addMedicalRecord(patientAddr, pendingSymptoms, pendingAIHash);
        showToast("Uploading Encrypted Record to Blockchain...");
        
        await tx.wait();
        showToast("Medical Record Immutably Stored!");
        
        // Reset Doctor UI
        document.getElementById('doc-symptoms').value = "";
        document.getElementById('ai-result-state').classList.add('hidden');
        document.getElementById('ai-blank-state').classList.remove('hidden');
        submitBtn.className = "w-full bg-slate-300 text-slate-500 font-bold py-3 rounded-lg cursor-not-allowed transition-all";
        submitBtn.innerText = "Submit Validated Record to Blockchain";
        
    } catch(err) {
        showToast(err.reason || "Tx Reverted. Are you a registered Doctor?");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Validated Record to Blockchain";
    }
}

// --- PATIENT FUNCTIONS ---

async function fetchPatientEHRs() {
    if(!contract || !currentAccount) return showToast("Connect Wallet first!");
    const container = document.getElementById('ehr-container');
    
    container.innerHTML = `<div class="p-4 text-center">Fetching records...</div>`;

    try {
        const count = await contract.getMyRecordCount();
        const numRecords = count.toNumber();
        
        if(numRecords === 0) {
            container.innerHTML = `<div class="p-8 text-center border-2 border-dashed rounded-lg text-slate-400">No medical records found for this address.</div>`;
            return;
        }

        container.innerHTML = ""; // Clear
        
        // Loop backwards to show newest first
        for(let i = numRecords - 1; i >= 0; i--) {
            const rec = await contract.getMyRecord(i);
            // rec returns: symptoms, aiHash, doctor, timestamp
            
            const dateStr = new Date(rec[3].toNumber() * 1000).toLocaleString();
            
            const card = document.createElement('div');
            card.className = "border border-slate-200 p-4 rounded-lg bg-slate-50";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs bg-medical-light text-medical-dark px-2 py-1 rounded font-bold">Record #${i}</span>
                    <span class="text-xs text-slate-400">${dateStr}</span>
                </div>
                <div class="mb-2">
                    <span class="block text-xs uppercase text-slate-500 font-semibold">Doctor Address</span>
                    <span class="font-mono text-xs break-all">${rec[2]}</span>
                </div>
                <div class="mb-2">
                    <span class="block text-xs uppercase text-slate-500 font-semibold">Reported Symptoms</span>
                    <p class="text-sm bg-white p-2 rounded border border-slate-200">${rec[0]}</p>
                </div>
                <div>
                    <span class="block text-xs uppercase text-slate-500 font-semibold text-purple-600">AI Treatment Hash</span>
                    <span class="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded break-all">${rec[1]}</span>
                </div>
            `;
            container.appendChild(card);
        }

    } catch(err) {
        console.error(err);
        container.innerHTML = `<div class="p-8 text-center border-2 border-dashed border-red-200 rounded-lg text-red-500">Error fetching records. Ensure you are a registered patient.</div>`;
    }
}


// --- UTILITIES ---

function switchTab(tabName) {
    // Hide all
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('text-medical-dark', 'border-b-2', 'border-medical');
        el.classList.add('text-slate-500');
    });

    // Show active
    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.remove('text-slate-500');
    activeBtn.classList.add('text-medical-dark', 'border-b-2', 'border-medical');
}

function showToast(msg) {
    toastEl.innerText = msg;
    toastEl.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toastEl.classList.add('translate-y-20', 'opacity-0');
    }, 4000);
}
