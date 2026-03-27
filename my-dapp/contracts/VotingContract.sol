// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VotingContract
 * @dev A secure decentralized voting system with admin controls, voter registration, and time-based voting
 * @author Your Name
 */
contract VotingContract {
    
    // ==================== STATE VARIABLES ====================
    
    address public owner;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    bool public votingActive;
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        bool exists;
    }
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }
    
    // Mappings
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    mapping(address => bool) public authorizedAdmins;
    
    // Arrays
    uint256[] public candidateIds;
    
    // Counters
    uint256 public totalCandidates;
    uint256 public totalVoters;
    uint256 public totalVotes;
    
    // ==================== EVENTS ====================
    
    event VoterRegistered(address indexed voter, uint256 timestamp);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event CandidateAdded(uint256 indexed candidateId, string name, uint256 timestamp);
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 endTime);
    event AdminAuthorized(address indexed admin);
    event AdminRevoked(address indexed admin);
    event WinnerDeclared(uint256 indexed candidateId, string name, uint256 voteCount);
    
    // ==================== MODIFIERS ====================
    
    /**
     * @dev Restricts function access to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "VotingContract: Only owner can call this function");
        _;
    }
    
    /**
     * @dev Restricts function access to authorized admins or owner
     */
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedAdmins[msg.sender], 
            "VotingContract: Only authorized admin can call this function"
        );
        _;
    }
    
    /**
     * @dev Restricts voting to active voting period
     */
    modifier onlyDuringVoting() {
        require(votingActive, "VotingContract: Voting is not active");
        require(
            block.timestamp >= votingStartTime && block.timestamp <= votingEndTime,
            "VotingContract: Voting is outside the allowed time period"
        );
        _;
    }
    
    /**
     * @dev Ensures voter is registered
     */
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "VotingContract: Voter is not registered");
        _;
    }
    
    /**
     * @dev Prevents double voting
     */
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "VotingContract: Voter has already voted");
        _;
    }
    
    /**
     * @dev Ensures candidate exists
     */
    modifier candidateExists(uint256 _candidateId) {
        require(candidates[_candidateId].exists, "VotingContract: Candidate does not exist");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        authorizedAdmins[msg.sender] = true;
        emit AdminAuthorized(msg.sender);
    }
    
    // ==================== OWNER & ADMIN FUNCTIONS ====================
    
    /**
     * @dev Authorizes an admin address
     * @param _admin Address to authorize as admin
     */
    function authorizeAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "VotingContract: Invalid address");
        authorizedAdmins[_admin] = true;
        emit AdminAuthorized(_admin);
    }
    
    /**
     * @dev Revokes admin authorization
     * @param _admin Address to revoke admin rights from
     */
    function revokeAdmin(address _admin) external onlyOwner {
        authorizedAdmins[_admin] = false;
        emit AdminRevoked(_admin);
    }
    
    /**
     * @dev Transfers ownership to a new address
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "VotingContract: Invalid new owner address");
        authorizedAdmins[owner] = false;
        emit AdminRevoked(owner);
        
        owner = _newOwner;
        authorizedAdmins[_newOwner] = true;
        emit AdminAuthorized(_newOwner);
    }
    
    // ==================== CANDIDATE MANAGEMENT ====================
    
    /**
     * @dev Adds a new candidate to the election
     * @param _name Name of the candidate
     * @return candidateId The ID of the newly added candidate
     */
    function addCandidate(string memory _name) external onlyAuthorized returns (uint256) {
        require(bytes(_name).length > 0, "VotingContract: Candidate name cannot be empty");
        require(!votingActive, "VotingContract: Cannot add candidates after voting starts");
        
        totalCandidates++;
        candidates[totalCandidates] = Candidate({
            id: totalCandidates,
            name: _name,
            voteCount: 0,
            exists: true
        });
        
        candidateIds.push(totalCandidates);
        emit CandidateAdded(totalCandidates, _name, block.timestamp);
        return totalCandidates;
    }
    
    /**
     * @dev Removes a candidate (only before voting starts)
     * @param _candidateId ID of candidate to remove
     */
    function removeCandidate(uint256 _candidateId) external onlyAuthorized candidateExists(_candidateId) {
        require(!votingActive, "VotingContract: Cannot remove candidates after voting starts");
        require(candidates[_candidateId].voteCount == 0, "VotingContract: Cannot remove candidate with votes");
        
        candidates[_candidateId].exists = false;
        
        // Remove from candidateIds array
        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidateIds[i] == _candidateId) {
                candidateIds[i] = candidateIds[candidateIds.length - 1];
                candidateIds.pop();
                break;
            }
        }
    }
    
    // ==================== VOTER MANAGEMENT ====================
    
    /**
     * @dev Registers a new voter
     * @param _voter Address of the voter to register
     */
    function registerVoter(address _voter) external onlyAuthorized {
        require(_voter != address(0), "VotingContract: Invalid voter address");
        require(!voters[_voter].isRegistered, "VotingContract: Voter already registered");
        
        voters[_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0
        });
        
        totalVoters++;
        emit VoterRegistered(_voter, block.timestamp);
    }
    
    /**
     * @dev Registers multiple voters at once
     * @param _voters Array of voter addresses to register
     */
    function registerMultipleVoters(address[] memory _voters) external onlyAuthorized {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !voters[_voters[i]].isRegistered) {
                voters[_voters[i]] = Voter({
                    isRegistered: true,
                    hasVoted: false,
                    votedCandidateId: 0
                });
                totalVoters++;
                emit VoterRegistered(_voters[i], block.timestamp);
            }
        }
    }
    
    // ==================== VOTING CONTROL ====================
    
    /**
     * @dev Starts the voting period
     * @param _durationInMinutes Duration of voting in minutes
     */
    function startVoting(uint256 _durationInMinutes) external onlyAuthorized {
        require(!votingActive, "VotingContract: Voting is already active");
        require(_durationInMinutes > 0, "VotingContract: Duration must be greater than 0");
        require(totalCandidates > 0, "VotingContract: No candidates available");
        require(totalVoters > 0, "VotingContract: No voters registered");
        
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        votingActive = true;
        
        emit VotingStarted(votingStartTime, votingEndTime);
    }
    
    /**
     * @dev Ends the voting period manually
     */
    function endVoting() external onlyAuthorized {
        require(votingActive, "VotingContract: Voting is not active");
        
        votingActive = false;
        votingEndTime = block.timestamp;
        
        emit VotingEnded(votingEndTime);
    }
    
    // ==================== VOTING FUNCTIONS ====================
    
    /**
     * @dev Casts a vote for a candidate
     * @param _candidateId ID of the candidate to vote for
     */
    function vote(uint256 _candidateId) 
        external 
        onlyDuringVoting 
        onlyRegisteredVoter 
        hasNotVoted 
        candidateExists(_candidateId) 
    {
        // Record the vote
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        
        // Increment candidate vote count
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Gets all candidates
     * @return Array of all candidate information
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateIds.length);
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            allCandidates[i] = candidates[candidateIds[i]];
        }
        
        return allCandidates;
    }
    
    /**
     * @dev Gets voting status
     * @return status String representing voting status
     */
    function getVotingStatus() external view returns (string memory) {
        if (!votingActive) {
            if (votingStartTime == 0) {
                return "Not Started";
            } else {
                return "Ended";
            }
        }
        
        if (block.timestamp < votingStartTime) {
            return "Scheduled";
        } else if (block.timestamp <= votingEndTime) {
            return "Active";
        } else {
            return "Ended";
        }
    }
    
    /**
     * @dev Gets the winner of the election
     * @return winnerId ID of the winning candidate
     * @return winnerName Name of the winning candidate
     * @return voteCount Vote count of the winner
     */
    function getWinner() external view returns (uint256 winnerId, string memory winnerName, uint256 voteCount) {
        require(votingStartTime > 0, "VotingContract: Voting has not started");
        require(block.timestamp > votingEndTime || !votingActive, "VotingContract: Voting has not ended");
        
        uint256 maxVotes = 0;
        winnerId = 0;
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidates[candidateIds[i]].voteCount > maxVotes) {
                maxVotes = candidates[candidateIds[i]].voteCount;
                winnerId = candidateIds[i];
            }
        }
        
        require(winnerId > 0, "VotingContract: No votes cast");
        
        winnerName = candidates[winnerId].name;
        voteCount = candidates[winnerId].voteCount;
    }
    
    /**
     * @dev Checks if an address has voted
     * @param _voter Address to check
     * @return hasVoted Whether the voter has voted
     */
    function hasVoted(address _voter) external view returns (bool) {
        return voters[_voter].hasVoted;
    }
    
    /**
     * @dev Gets voter information
     * @param _voter Address of the voter
     * @return isRegistered Whether the voter is registered
     * @return hasVoted Whether the voter has voted
     * @return votedCandidateId ID of the candidate the voter voted for
     */
    function getVoterInfo(address _voter) external view returns (bool isRegistered, bool hasVoted, uint256 votedCandidateId) {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedCandidateId);
    }
    
    /**
     * @dev Gets time remaining for voting
     * @return remainingTime Time remaining in seconds (0 if voting ended)
     */
    function getTimeRemaining() external view returns (uint256) {
        if (!votingActive || block.timestamp >= votingEndTime) {
            return 0;
        }
        
        return votingEndTime - block.timestamp;
    }
    
    /**
     * @dev Gets election statistics
     * @return _totalCandidates Total number of candidates
     * @return _totalVoters Total number of registered voters
     * @return _totalVotes Total number of votes cast
     * @return _votingActive Whether voting is currently active
     */
    function getElectionStats() external view returns (uint256 _totalCandidates, uint256 _totalVoters, uint256 _totalVotes, bool _votingActive) {
        return (totalCandidates, totalVoters, totalVotes, votingActive);
    }
}
