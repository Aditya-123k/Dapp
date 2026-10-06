// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FreelanceEscrow {
    address public client;
    address public freelancer;
    uint256 public lockedAmount;

    // Real deliverables and project details
    string public projectTitle;
    string public deliverableUrl;
    string public submissionNotes;

    enum State { Initialized, Locked, Completed, Released, Refunded }
    State public currentState;

    modifier onlyClient() {
        require(msg.sender == client, "Only client can call this");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only freelancer can call this");
        _;
    }

    modifier inState(State _state) {
        require(currentState == _state, "Invalid state");
        _;
    }

    constructor(address _freelancer, string memory _title) {
        client = msg.sender;
        freelancer = _freelancer;
        projectTitle = _title;
        currentState = State.Initialized;
    }

    function deposit() external payable onlyClient inState(State.Initialized) {
        require(msg.value > 0, "Deposit must be > 0");
        lockedAmount = msg.value;
        currentState = State.Locked;
    }

    function submitWork(string memory _url, string memory _notes) external onlyFreelancer inState(State.Locked) {
        require(bytes(_url).length > 0, "Deliverable URL required");
        deliverableUrl = _url;
        submissionNotes = _notes;
        currentState = State.Completed;
    }

function releaseFunds() external onlyClient inState(State.Completed) {
        currentState = State.Released;
        (bool success, ) = payable(freelancer).call{value: address(this).balance}("");
        require(success, "Transfer to freelancer failed");
    }

    function refundClient() external onlyClient inState(State.Locked) {
        currentState = State.Refunded;
        (bool success, ) = payable(client).call{value: address(this).balance}("");
        require(success, "Refund to client failed");
    }
}