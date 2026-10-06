
# EscrowX Protocol - Setup Guide

## Requirements
* **Node.js:** v18 or v20+
* **MetaMask Extension:** Installed in your browser

---

## 1. Install Dependencies
In your terminal, navigate to the project directory and run:

```bash
npm install

```

*(If the frontend is in a nested `/frontend` folder, open a terminal in that folder and run `npm install` there as well).*

---

## 2. Start Local Blockchain

Open **Terminal 1** and start the Hardhat local node:

```bash
npx hardhat node

```

*Leave this terminal running.*

---

## 3. Deploy the Smart Contract

Open **Terminal 2** and deploy the escrow contract:

```bash
npx hardhat run scripts/deploy.ts --network localhost

```

> **Note:** If the terminal outputs an address other than `0x5FbDB2315678afecb367f032d93F642f64180aa3`, copy it and update `ESCROW_ADDRESS` in `src/contracts/escrowConfig.ts`.

---

## 4. Set Up MetaMask

1. Add a custom network in MetaMask:
* **Network Name:** Hardhat Localhost
* **RPC URL:** `http://127.0.0.1:8545`
* **Chain ID:** `31337`
* **Currency Symbol:** `ETH`


2. Import the two test accounts (using private keys from Terminal 1):
* **Account 0 (Client):** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
* **Account 1 (Freelancer):** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`



---

## 5. Run the Frontend

In **Terminal 2**, start the development server:

```bash
npm run dev

```

Open `http://localhost:5173` in your browser.

```


git push origin main

```
