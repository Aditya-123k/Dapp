export const ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ESCROW_ABI = [
  "function client() view returns (address)",
  "function freelancer() view returns (address)",
  "function lockedAmount() view returns (uint256)",
  "function projectTitle() view returns (string)",
  "function deliverableUrl() view returns (string)",
  "function submissionNotes() view returns (string)",
  "function currentState() view returns (uint8)",
  "function deposit() payable",
  "function submitWork(string _url, string _notes)",
  "function releaseFunds()",
  "function refundClient()"
];