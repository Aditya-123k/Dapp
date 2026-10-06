import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI } from "./contracts/escrowConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const STATE_MAP = [
  "Initialized",
  "Locked (In Progress)",
  "Completed (Under Review)",
  "Released (Settled)",
  "Refunded"
];

// Sample marketplace items to simulate a live Web3 freelancing board
const EXPLORE_JOBS = [
  {
    id: "job-1",
    title: "ERC-4337 Account Abstraction Paymaster Integration",
    client: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    budget: "2.5 ETH",
    tags: ["Solidity", "Account Abstraction", "Hardhat"],
    description: "Looking for an engineer to implement custom gas sponsorship via ERC-4337 Paymaster on Base L2.",
    status: "Open"
  },
  {
    id: "job-2",
    title: "Subsquid Indexer & GraphQL Schema for NFT Marketplace",
    client: "0x2B09Ec...b3132",
    budget: "1.2 ETH",
    tags: ["TypeScript", "GraphQL", "Subsquid"],
    description: "Write custom indexing logic for multi-chain transfer and royalty distribution events.",
    status: "In Progress"
  },
  {
    id: "job-3",
    title: "Rust Core Developer for Solana Settlement Engine",
    client: "0xB6686...E43df",
    budget: "4.0 ETH",
    tags: ["Rust", "Anchor", "DeFi"],
    description: "Build an off-chain orderbook matching engine settlement pipeline on Solana devnet.",
    status: "Open"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"workspace" | "marketplace" | "create">("workspace");
  const [account, setAccount] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [freelancerAddress, setFreelancerAddress] = useState<string>("");
  const [contractAmount, setContractAmount] = useState<string>("0");
  const [contractState, setContractState] = useState<number>(0);
  const [projectTitle, setProjectTitle] = useState<string>("");

  // Deliverables State
  const [deliverableUrl, setDeliverableUrl] = useState<string>("");
  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [inputNotes, setInputNotes] = useState<string>("");

  const [depositValue, setDepositValue] = useState<string>("1.0");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // New Contract Modal Simulation State
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalFreelancer, setModalFreelancer] = useState<string>("");
  const [modalBudget, setModalBudget] = useState<string>("1.0");

  const getContract = async (needSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not detected");
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (needSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    }
    return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
  };

  const loadContractData = async () => {
    try {
      const contract = await getContract();
      const [state, client, freelancer, amount, title, url, notes] = await Promise.all([
        contract.currentState(),
        contract.client(),
        contract.freelancer(),
        contract.lockedAmount(),
        contract.projectTitle(),
        contract.deliverableUrl(),
        contract.submissionNotes(),
      ]);

      setContractState(Number(state));
      setClientAddress(client);
      setFreelancerAddress(freelancer);
      setContractAmount(ethers.formatEther(amount));
      setProjectTitle(title);
      setDeliverableUrl(url);
      setSubmissionNotes(notes);

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage("Failed to load contract details. Ensure local node is running.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to interact with this DApp");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setStatusMessage("Connected: " + accounts[0]);
      loadContractData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || "Failed to connect wallet.");
    }
  };

  const handleDeposit = async () => {
    try {
      setLoading(true);
      setStatusMessage("Locking funds into escrow...");
      const contract = await getContract(true);
      const tx = await contract.deposit({ value: ethers.parseEther(depositValue) });
      await tx.wait();
      setStatusMessage("1.0 ETH successfully committed to the contract!");
      loadContractData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.reason || err.message || "Deposit transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!inputUrl) {
      alert("Please provide a deliverable repository or deployment link.");
      return;
    }
    try {
      setLoading(true);
      setStatusMessage("Recording deliverables on-chain...");
      const contract = await getContract(true);
      const tx = await contract.submitWork(inputUrl, inputNotes);
      await tx.wait();
      setStatusMessage("Work committed to blockchain!");
      setInputUrl("");
      setInputNotes("");
      loadContractData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.reason || err.message || "Submit work failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndRelease = async () => {
    try {
      setLoading(true);
      setStatusMessage("Settling contract and releasing payment...");
      const contract = await getContract(true);
      const tx = await contract.releaseFunds();
      await tx.wait();
      setStatusMessage("Contract settled. Funds dispatched to freelancer!");
      loadContractData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.reason || err.message || "Release transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setLoading(true);
      setStatusMessage("Refunding escrow balance...");
      const contract = await getContract(true);
      const tx = await contract.refundClient();
      await tx.wait();
      setStatusMessage("Funds refunded to client.");
      loadContractData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.reason || err.message || "Refund failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      loadContractData();
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadContractData();
        } else {
          setAccount("");
        }
      });
    }
  }, []);

  const isClient = account.toLowerCase() === clientAddress.toLowerCase();
  const isFreelancer = account.toLowerCase() === freelancerAddress.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("workspace")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-black text-white text-lg">
                Ξ
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                EscrowX
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Protocol v1
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <button
                onClick={() => setActiveTab("workspace")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "workspace"
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                Active Workspace
              </button>
              <button
                onClick={() => setActiveTab("marketplace")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "marketplace"
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "create"
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                Create Agreement
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Hardhat Localnet
            </div>

            {account ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="text-slate-400">Connected:</span>
                <span className="text-emerald-400 font-semibold">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-600/20"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Platform Metric Banner */}
      <section className="bg-slate-900/40 border-b border-slate-800/60 py-4 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-400">Total Value Locked</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">14.5 ETH</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Active Contract Escrow</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{contractAmount} ETH</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Settled Milestones</div>
            <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">38 Contracts</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Platform Protocol Fee</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">0.0% (Trustless)</div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Views */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
        {/* VIEW A: Active Workspace */}
        {activeTab === "workspace" && (
          <div className="space-y-6">
            {/* Project Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Live Escrow Instance
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {ESCROW_ADDRESS.slice(0, 8)}...{ESCROW_ADDRESS.slice(-6)}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {projectTitle || "Loading Agreement..."}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  On-chain peer-to-peer milestone agreement backed by autonomous smart contract custody.
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 mb-1">Contract Status</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {STATE_MAP[contractState]}
                </span>
              </div>
            </div>

            {/* Split Grid: Details & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Contract Snapshot */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Financial Snapshot
                  </h3>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                    <span className="text-xs text-slate-400">Escrow Locked Vault</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                      {contractAmount} ETH
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-xs text-slate-500">Authorized Client</span>
                      <p className="text-xs font-mono text-slate-300 break-all bg-slate-950/40 p-2 rounded mt-1 border border-slate-800">
                        {clientAddress || "Loading..."}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Designated Freelancer</span>
                      <p className="text-xs font-mono text-slate-300 break-all bg-slate-950/40 p-2 rounded mt-1 border border-slate-800">
                        {freelancerAddress || "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Session Identity
                  </h3>
                  <div className="text-xs text-slate-400">
                    Active Wallet: <span className="font-mono text-white">{account ? `${account.slice(0, 8)}...` : "None"}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Resolved Role:{" "}
                    <span className="font-semibold text-indigo-400">
                      {isClient ? "Client (Depositor)" : isFreelancer ? "Freelancer (Beneficiary)" : "Observer / Guest"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Action Interface */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Milestone Workflow Engine</h3>
                      <p className="text-xs text-slate-400">State machines restrict execution to authorized signatories.</p>
                    </div>
                  </div>

                  {/* STAGE 0: Initialized */}
                  {contractState === 0 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Stage 1: Funding Escrow</span>
                        <p className="text-sm text-slate-300">
                          The agreement terms have been instantiated. To green-light development, the Client must lock the agreed ETH into the autonomous escrow contract.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <input
                          type="number"
                          step="0.1"
                          value={depositValue}
                          onChange={(e) => setDepositValue(e.target.value)}
                          disabled={!isClient || loading}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-full sm:w-44"
                        />
                        <button
                          onClick={handleDeposit}
                          disabled={loading || !isClient}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition"
                        >
                          {loading ? "Confirming..." : "Deposit & Lock ETH"}
                        </button>
                      </div>
                      {!isClient && (
                        <p className="text-xs text-rose-400">Switch to the Client account in MetaMask to deposit.</p>
                      )}
                    </div>
                  )}

                  {/* STAGE 1: Locked / In Progress */}
                  {contractState === 1 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Stage 2: Milestone In Progress</span>
                        <p className="text-sm text-slate-300">
                          Payment is locked in escrow. The freelancer is authorized to carry out work and submit proof of deliverables upon completion.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1">Deliverable URL (GitHub / IPFS / Figma)</label>
                          <input
                            type="text"
                            placeholder="https://github.com/..."
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            disabled={!isFreelancer || loading}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1">Release Notes & Technical Summary</label>
                          <textarea
                            rows={3}
                            placeholder="Implemented responsive frontend, API routes, and unit tests."
                            value={inputNotes}
                            onChange={(e) => setInputNotes(e.target.value)}
                            disabled={!isFreelancer || loading}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={handleSubmitWork}
                          disabled={loading || !isFreelancer}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition"
                        >
                          {loading ? "Submitting..." : "Submit Completed Deliverables"}
                        </button>
                        <button
                          onClick={handleRefund}
                          disabled={loading || !isClient}
                          className="bg-rose-900/60 hover:bg-rose-800 disabled:opacity-40 text-rose-200 border border-rose-700 font-medium text-sm px-4 py-2.5 rounded-lg transition"
                        >
                          Abort & Refund Client
                        </button>
                      </div>
                      {!isFreelancer && (
                        <p className="text-xs text-rose-400">Switch to the Freelancer account in MetaMask to submit deliverables.</p>
                      )}
                    </div>
                  )}

                  {/* STAGE 2: Completed / Inspection */}
                  {contractState === 2 && (
                    <div className="space-y-5">
                      <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Stage 3: Deliverable Audit & Release</span>
                        <p className="text-sm text-slate-300">
                          Work has been committed to the blockchain. Inspect the submitted repository and notes before authorizing irreversible fund release.
                        </p>
                      </div>

                      {/* Deliverable Card */}
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Proof of Work URL</span>
                          <a
                            href={deliverableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-mono break-all underline"
                          >
                            {deliverableUrl || "None provided"}
                          </a>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Developer Notes</span>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{submissionNotes || "No notes submitted"}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleApproveAndRelease}
                        disabled={loading || !isClient}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition"
                      >
                        {loading ? "Settling..." : "Approve Deliverables & Release 1.0 ETH"}
                      </button>
                      {!isClient && (
                        <p className="text-xs text-rose-400">Switch to the Client account in MetaMask to approve and release payment.</p>
                      )}
                    </div>
                  )}

                  {/* STAGE 3: Settled */}
                  {contractState === 3 && (
                    <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-2">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                      </div>
                      <h4 className="text-lg font-bold text-emerald-400">Contract Settled Successfully</h4>
                      <p className="text-sm text-slate-300 max-w-md mx-auto">
                        All milestones were approved. Locked collateral of {contractAmount || "1.0"} ETH has been transferred to the freelancer's wallet.
                      </p>
                    </div>
                  )}

                  {/* STAGE 4: Refunded */}
                  {contractState === 4 && (
                    <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-xl text-center space-y-2">
                      <h4 className="text-lg font-bold text-rose-400">Agreement Terminated & Refunded</h4>
                      <p className="text-sm text-slate-300 max-w-md mx-auto">
                        The escrow agreement was canceled and funds returned to the client address.
                      </p>
                    </div>
                  )}
                </div>

                {statusMessage && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>{statusMessage}</span>
                    <button onClick={() => setStatusMessage("")} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: Marketplace Gigs */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Web3 Gig Marketplace</h2>
                <p className="text-sm text-slate-400">Verified contracts with pre-funded escrow pools.</p>
              </div>
              <button
                onClick={() => setActiveTab("create")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                + Post Job Agreement
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPLORE_JOBS.map((job) => (
                <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white text-base leading-snug">{job.title}</h3>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                      {job.budget}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}</span>
                    <button
                      onClick={() => setActiveTab("workspace")}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Inspect Escrow →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW C: Create Agreement Form */}
        {activeTab === "create" && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create Milestone Agreement</h2>
              <p className="text-sm text-slate-400 mt-1">
                Deploy an autonomous escrow instance to enforce milestone terms without intermediaries.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Agreement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack NFT Marketplace Development"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Freelancer EVM Address
                </label>
                <input
                  type="text"
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  value={modalFreelancer}
                  onChange={(e) => setModalFreelancer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Escrow Milestone Deposit (ETH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={modalBudget}
                  onChange={(e) => setModalBudget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("workspace")}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("This initiates deployment of a new FreelanceEscrow instance via the factory contract.");
                    setActiveTab("workspace");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-lg transition"
                >
                  Deploy Escrow Agreement
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Minimalist Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        EscrowX Protocol • Decentralized Trustless Settlement System • Built with Solidity, React, and Ethers.js
      </footer>
    </div>
  );
}