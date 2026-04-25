# AI Healthcare System DApp

A comprehensive Web3 application integrating Hospital Records, Blood Bank Inventory, and Role-Based Access Control, capped with an off-chain AI prescription simulator.

## Project Structure
- `contracts/HealthcareSystem.sol`: The core Solidity engine regulating the logic and enforcing Strict Role Access (`onlyAdmin`, `onlyDoctor`, `onlyPatient`).
- `frontend/index.html`: A multi-view dashboard layout stylized efficiently using Tailwind CSS. 
- `frontend/app.js`: The frontend controller using `ethers.js`. It contains the mock AI Decision Tree heuristic that generates a treatment hash before securing the ledger.

---

## 🚀 Setup & Execution Guide for Presentation

### 1. Compile & Deploy the Smart Contract
1. Navigate to [Remix IDE](https://remix.ethereum.org/).
2. Create `HealthcareSystem.sol` in the Remix workspace and paste the code from this project's `contracts` folder.
3. **Compile** using the Solidity Compiler (`^0.8.0`).
4. **Deploy**: In the Deploy tab, select **Remix VM**. Hit **Deploy**. 
   > Note: The account you use to hit "Deploy" automatically becomes the Admin, Doctor, and Patient simultaneously for easy testing.
5. **Copy the Contract Address** from the deployed contracts list.

### 2. Connect the Dashboard
1. Open the file `hospital-system-dapp/frontend/app.js` in your code editor.
2. At the top of `app.js`, find:
   `const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";`
3. Replace the placeholder string with your copied address. Save.

### 3. Demo the Workflows
1. Host the `index.html` file using a local web server (e.g., Live Server in VS Code).
2. Connect your **MetaMask** wallet.

**Demo A: Blood Bank (Admin)**
- Navigate to the **Admin Controls** tab.
- Update the Blood Bank (e.g., set A+ to 50 units).
- Switch to the **Public Services** tab. Click "Refresh Ledger" to see the live Blockchain data update.

**Demo B: The Doctor & AI Flow**
- Jump to the **Doctor Terminal**.
- Enter your own MetaMask wallet address in the Patient Address slot.
- Enter symptoms like `"High fever, bad cough"`.
- Click the **Generate AI Prescription** button. The JS logic will identify keywords, output a diagnosis, and generate a mock hash.
- Click **Submit Validated Record to Blockchain** and sign the transaction.

**Demo C: Patient View**
- Move to the **My Patient Portal** tab.
- Click **Fetch My Records**. It will pull the immutable record you just generated as a Doctor!

---

## 👩‍⚕️ Code Highlight for Professor:
In `contracts/HealthcareSystem.sol`, direct attention to the mappings: `mapping(address => bool) public doctors;`
Explain that unlike web2 databases where APIs can be hacked to change data, the Blockchain Smart Contract guarantees that absolutely no one but the `Admin` can register a Doctor, and no one but a registered `Doctor` can write a medical record to a Patient's array. The access controls are mathematically enforced by `msg.sender`.
