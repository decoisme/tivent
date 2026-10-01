// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EventTicketing
 * @dev Decentralized event ticketing system with anti-scalping rules and atomic resale
 * @notice Each ticket is an ERC-721 NFT with ownership tracked on-chain
 */
contract EventTicketing is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    
    // ==================== State Variables ====================
    
    uint256 private _nextTokenId;
    uint256 private _nextEventId;
    
    // Mappings
    mapping(uint256 => EventData) public events;
    mapping(uint256 => TicketData) public tickets;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(address => uint256)) public ticketsPurchasedByWallet;
    mapping(address => bool) public gateOfficers;
    
    // Ticket types: eventId => typeId => TicketType
    mapping(uint256 => mapping(uint256 => TicketType)) public ticketTypes;
    
    // Per-type purchase tracking: eventId => typeId => buyer => quantity
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public ticketsPurchasedByType;
    
    // ==================== Structs ====================
    
    struct TicketType {
        uint256 typeId;
        string name;
        uint256 price;
        uint256 maxSupply;
        uint256 sold;
        bool active;
    }
    
    struct TicketTypeInput {
        string name;
        uint256 price;
        uint256 maxSupply;
    }
    
    struct EventData {
        uint256 eventId;
        address organizer;
        string metadataURI;
        uint256 ticketTypesCount;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 maxTicketsPerWallet;
        uint256 resalePriceCap;        // Basis points (10000 = 100%, 11000 = 110%)
        uint256 resaleDeadline;        // Unix timestamp
        bool primarySaleActive;
        bool resaleActive;
        bool cancelled;
    }
    
    struct TicketData {
        uint256 eventId;
        uint256 ticketTypeId;
        uint256 originalPrice;
        uint8 resaleCount;
        uint8 maxResaleCount;
        bool redeemed;
        bool active;
    }
    
    struct Listing {
        uint256 ticketId;
        address seller;
        uint256 price;
        bool active;
    }
    
    // ==================== Events ====================
    
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string metadataURI,
        uint256 ticketTypesCount
    );
    
    event TicketTypeAdded(
        uint256 indexed eventId,
        uint256 indexed typeId,
        string name,
        uint256 price,
        uint256 maxSupply
    );
    
    event EventUpdated(
        uint256 indexed eventId,
        bool primarySaleActive,
        bool resaleActive
    );
    
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 price
    );
    
    event TicketListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    
    event TicketDelisted(
        uint256 indexed tokenId
    );
    
    event TicketResold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );
    
    event TicketRedeemed(
        uint256 indexed tokenId,
        address indexed holder,
        uint256 eventId
    );
    
    event EventCancelled(
        uint256 indexed eventId,
        address indexed organizer
    );
    
    event RefundClaimed(
        uint256 indexed tokenId,
        address indexed holder,
        uint256 amount
    );
    
    event GateOfficerAdded(address indexed officer);
    event GateOfficerRemoved(address indexed officer);
    
    // ==================== Modifiers ====================
    
    modifier onlyEventOrganizer(uint256 eventId) {
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        _;
    }
    
    modifier onlyGateOfficer() {
        require(gateOfficers[msg.sender], "Not authorized gate officer");
        _;
    }
    
    modifier eventExists(uint256 eventId) {
        require(eventId < _nextEventId, "Event does not exist");
        _;
    }
    
    modifier ticketExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        _;
    }
    
    // ==================== Constructor ====================
    
    constructor() ERC721("TiventTicket", "TVNT") Ownable(msg.sender) {
        _nextTokenId = 1;
        _nextEventId = 1;
    }
    
    // ==================== Core Functions ====================
    
    /**
     * @dev Internal function to create event with ticket types
     */
    function _createEventWithTypes(
        string memory metadataURI,
        TicketTypeInput[] memory ticketTypeInputs,
        uint256 maxTicketsPerWallet,
        uint256 resalePriceCap,
        uint256 resaleDeadline
    ) internal returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(ticketTypeInputs.length > 0, "At least one ticket type required");
        require(ticketTypeInputs.length <= 10, "Max 10 ticket types per event");
        require(maxTicketsPerWallet > 0, "Max per wallet must be greater than 0");
        require(resalePriceCap >= 10000, "Resale cap must be >= 100%");
        require(resaleDeadline > block.timestamp, "Deadline must be in future");
        
        uint256 eventId = _nextEventId++;
        uint256 totalMaxTickets = 0;
        
        // Validate and create ticket types
        for (uint256 i = 0; i < ticketTypeInputs.length; i++) {
            require(bytes(ticketTypeInputs[i].name).length > 0, "Type name required");
            require(ticketTypeInputs[i].price > 0, "Price must be greater than 0");
            require(ticketTypeInputs[i].maxSupply > 0, "Max supply must be greater than 0");
            require(ticketTypeInputs[i].maxSupply <= 1000000, "Max supply too large");
            
            totalMaxTickets += ticketTypeInputs[i].maxSupply;
            
            ticketTypes[eventId][i] = TicketType({
                typeId: i,
                name: ticketTypeInputs[i].name,
                price: ticketTypeInputs[i].price,
                maxSupply: ticketTypeInputs[i].maxSupply,
                sold: 0,
                active: true
            });
            
            emit TicketTypeAdded(eventId, i, ticketTypeInputs[i].name, ticketTypeInputs[i].price, ticketTypeInputs[i].maxSupply);
        }
        
        require(totalMaxTickets <= 1000000, "Total max tickets too large");
        
        events[eventId] = EventData({
            eventId: eventId,
            organizer: msg.sender,
            metadataURI: metadataURI,
            ticketTypesCount: ticketTypeInputs.length,
            maxTickets: totalMaxTickets,
            ticketsSold: 0,
            maxTicketsPerWallet: maxTicketsPerWallet,
            resalePriceCap: resalePriceCap,
            resaleDeadline: resaleDeadline,
            primarySaleActive: true,
            resaleActive: true,
            cancelled: false
        });
        
        emit EventCreated(eventId, msg.sender, metadataURI, ticketTypeInputs.length);
        
        return eventId;
    }
    
    /**
     * @dev Create a new event with multiple ticket types
     * @param metadataURI IPFS URI containing event metadata
     * @param ticketTypeInputs Array of ticket types with name, price, and supply
     * @param maxTicketsPerWallet Purchase limit per wallet (across all types)
     * @param resalePriceCap Maximum resale price in basis points (11000 = 110%)
     * @param resaleDeadline Unix timestamp after which resale is disabled
     */
    function createEventWithTypes(
        string memory metadataURI,
        TicketTypeInput[] memory ticketTypeInputs,
        uint256 maxTicketsPerWallet,
        uint256 resalePriceCap,
        uint256 resaleDeadline
    ) external whenNotPaused returns (uint256) {
        return _createEventWithTypes(metadataURI, ticketTypeInputs, maxTicketsPerWallet, resalePriceCap, resaleDeadline);
    }
    
    /**
     * @dev Create a new event (backward compatible - single ticket type)
     * @param metadataURI IPFS URI containing event metadata
     * @param ticketPrice Price per ticket in wei
     * @param maxTickets Maximum number of tickets
     * @param maxTicketsPerWallet Purchase limit per wallet
     * @param resalePriceCap Maximum resale price in basis points (11000 = 110%)
     * @param resaleDeadline Unix timestamp after which resale is disabled
     */
    function createEvent(
        string memory metadataURI,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 maxTicketsPerWallet,
        uint256 resalePriceCap,
        uint256 resaleDeadline
    ) external whenNotPaused returns (uint256) {
        // Convert to single ticket type
        TicketTypeInput[] memory types = new TicketTypeInput[](1);
        types[0] = TicketTypeInput({
            name: "General Admission",
            price: ticketPrice,
            maxSupply: maxTickets
        });
        
        return _createEventWithTypes(metadataURI, types, maxTicketsPerWallet, resalePriceCap, resaleDeadline);
    }
    
    /**
     * @dev Purchase a ticket for an event by ticket type
     * @param eventId ID of the event
     * @param ticketTypeId Type of ticket to purchase
     * @param ticketMetadataURI IPFS URI for ticket-specific metadata
     */
    function buyTicket(
        uint256 eventId,
        uint256 ticketTypeId,
        string memory ticketMetadataURI
    ) external payable whenNotPaused eventExists(eventId) nonReentrant returns (uint256) {
        EventData storage eventData = events[eventId];
        TicketType storage ticketType = ticketTypes[eventId][ticketTypeId];
        
        require(eventData.primarySaleActive, "Primary sale not active");
        require(!eventData.cancelled, "Event cancelled");
        require(ticketTypeId < eventData.ticketTypesCount, "Invalid ticket type");
        require(ticketType.active, "Ticket type not active");
        require(ticketType.sold < ticketType.maxSupply, "Ticket type sold out");
        require(msg.value == ticketType.price, "Incorrect payment amount");
        require(
            ticketsPurchasedByWallet[eventId][msg.sender] < eventData.maxTicketsPerWallet,
            "Purchase limit exceeded"
        );
        
        uint256 tokenId = _nextTokenId++;
        
        // Mint NFT to buyer
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ticketMetadataURI);
        
        // Store ticket data
        tickets[tokenId] = TicketData({
            eventId: eventId,
            ticketTypeId: ticketTypeId,
            originalPrice: ticketType.price,
            resaleCount: 0,
            maxResaleCount: 3,
            redeemed: false,
            active: true
        });
        
        // Update counters
        ticketType.sold++;
        eventData.ticketsSold++;
        ticketsPurchasedByWallet[eventId][msg.sender]++;
        ticketsPurchasedByType[eventId][ticketTypeId][msg.sender]++;
        
        // Transfer payment to organizer
        (bool success, ) = payable(eventData.organizer).call{value: msg.value}("");
        require(success, "Payment transfer failed");
        
        emit TicketMinted(tokenId, eventId, msg.sender, ticketType.price);
        
        return tokenId;
    }
    
    // ==================== Getter Functions ====================
    
    /**
     * @dev Get event details
     */
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (EventData memory) {
        return events[eventId];
    }
    
    /**
     * @dev Get ticket type details
     */
    function getTicketType(uint256 eventId, uint256 typeId) external view eventExists(eventId) returns (TicketType memory) {
        require(typeId < events[eventId].ticketTypesCount, "Invalid ticket type");
        return ticketTypes[eventId][typeId];
    }
    
    /**
     * @dev Get all ticket types for an event
     */
    function getEventTicketTypes(uint256 eventId) external view eventExists(eventId) returns (TicketType[] memory) {
        uint256 count = events[eventId].ticketTypesCount;
        TicketType[] memory types = new TicketType[](count);
        
        for (uint256 i = 0; i < count; i++) {
            types[i] = ticketTypes[eventId][i];
        }
        
        return types;
    }
    
    /**
     * @dev Get ticket details
     */
    function getTicket(uint256 tokenId) external view ticketExists(tokenId) returns (TicketData memory) {
        return tickets[tokenId];
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev Get total number of events
     */
    function eventCount() external view returns (uint256) {
        return _nextEventId - 1;
    }
    
    /**
     * @dev Get total number of tickets minted
     */
    function ticketCount() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @dev Check if ticket is valid for entry
     */
    function isTicketValid(uint256 tokenId) external view ticketExists(tokenId) returns (bool) {
        TicketData storage ticket = tickets[tokenId];
        EventData storage eventData = events[ticket.eventId];
        
        return (
            ticket.active &&
            !ticket.redeemed &&
            !eventData.cancelled &&
            _ownerOf(tokenId) != address(0)
        );
    }
    
    /**
     * @dev Get how many tickets a wallet has purchased for an event
     */
    function getWalletPurchaseCount(uint256 eventId, address wallet) external view eventExists(eventId) returns (uint256) {
        return ticketsPurchasedByWallet[eventId][wallet];
    }
    
    /**
     * @dev Get how many tickets of a specific type a wallet has purchased
     */
    function getWalletPurchaseCountByType(uint256 eventId, uint256 typeId, address wallet) 
        external view eventExists(eventId) returns (uint256) 
    {
        require(typeId < events[eventId].ticketTypesCount, "Invalid ticket type");
        return ticketsPurchasedByType[eventId][typeId][wallet];
    }
    
    // ==================== Organizer Functions ====================
    
    /**
     * @dev Add a new ticket type to an existing event
     */
    function addTicketType(
        uint256 eventId,
        string memory name,
        uint256 price,
        uint256 maxSupply
    ) external onlyEventOrganizer(eventId) eventExists(eventId) {
        EventData storage eventData = events[eventId];
        require(bytes(name).length > 0, "Type name required");
        require(price > 0, "Price must be greater than 0");
        require(maxSupply > 0, "Max supply must be greater than 0");
        require(eventData.ticketTypesCount < 10, "Max 10 ticket types per event");
        
        uint256 newTypeId = eventData.ticketTypesCount;
        
        ticketTypes[eventId][newTypeId] = TicketType({
            typeId: newTypeId,
            name: name,
            price: price,
            maxSupply: maxSupply,
            sold: 0,
            active: true
        });
        
        eventData.ticketTypesCount++;
        eventData.maxTickets += maxSupply;
        
        emit TicketTypeAdded(eventId, newTypeId, name, price, maxSupply);
    }
    
    /**
     * @dev Update ticket type (only if no tickets sold yet)
     */
    function updateTicketType(
        uint256 eventId,
        uint256 typeId,
        uint256 price,
        uint256 maxSupply,
        bool active
    ) external onlyEventOrganizer(eventId) eventExists(eventId) {
        EventData storage eventData = events[eventId];
        require(typeId < eventData.ticketTypesCount, "Invalid ticket type");
        
        TicketType storage ticketType = ticketTypes[eventId][typeId];
        require(ticketType.sold == 0, "Cannot update type with sales");
        require(price > 0, "Price must be greater than 0");
        require(maxSupply > 0, "Max supply must be greater than 0");
        
        // Update total max tickets
        eventData.maxTickets = eventData.maxTickets - ticketType.maxSupply + maxSupply;
        
        ticketType.price = price;
        ticketType.maxSupply = maxSupply;
        ticketType.active = active;
    }
    
    /**
     * @dev Toggle ticket type active status
     */
    function setTicketTypeActive(uint256 eventId, uint256 typeId, bool active) 
        external 
        onlyEventOrganizer(eventId) 
        eventExists(eventId) 
    {
        require(typeId < events[eventId].ticketTypesCount, "Invalid ticket type");
        ticketTypes[eventId][typeId].active = active;
    }
    
    /**
     * @dev Toggle primary sale status
     */
    function setPrimarySaleActive(uint256 eventId, bool active) 
        external 
        onlyEventOrganizer(eventId) 
        eventExists(eventId) 
    {
        events[eventId].primarySaleActive = active;
        emit EventUpdated(eventId, active, events[eventId].resaleActive);
    }
    
    /**
     * @dev Toggle resale status
     */
    function setResaleActive(uint256 eventId, bool active) 
        external 
        onlyEventOrganizer(eventId) 
        eventExists(eventId) 
    {
        events[eventId].resaleActive = active;
        emit EventUpdated(eventId, events[eventId].primarySaleActive, active);
    }
    
    // ==================== Gate Officer Functions ====================
    
    /**
     * @dev Add gate officer
     */
    function addGateOfficer(address officer) external onlyOwner {
        require(officer != address(0), "Invalid address");
        gateOfficers[officer] = true;
        emit GateOfficerAdded(officer);
    }
    
    /**
     * @dev Remove gate officer
     */
    function removeGateOfficer(address officer) external onlyOwner {
        gateOfficers[officer] = false;
        emit GateOfficerRemoved(officer);
    }
    
    // ==================== Resale Marketplace Functions ====================
    
    /**
     * @dev List a ticket for resale
     * @param tokenId ID of the ticket to list
     * @param price Resale price in wei
     */
    function listForResale(uint256 tokenId, uint256 price) 
        external 
        whenNotPaused 
        ticketExists(tokenId) 
        nonReentrant 
    {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        
        TicketData storage ticket = tickets[tokenId];
        EventData storage eventData = events[ticket.eventId];
        
        require(ticket.active, "Ticket not active");
        require(!ticket.redeemed, "Ticket already redeemed");
        require(!eventData.cancelled, "Event cancelled");
        require(eventData.resaleActive, "Resale not active");
        require(block.timestamp < eventData.resaleDeadline, "Resale deadline passed");
        require(ticket.resaleCount < ticket.maxResaleCount, "Max resale count reached");
        require(price > 0, "Price must be greater than 0");
        
        // Check resale price cap
        uint256 maxPrice = (ticket.originalPrice * eventData.resalePriceCap) / 10000;
        require(price <= maxPrice, "Price exceeds cap");
        
        // Create or update listing
        listings[tokenId] = Listing({
            ticketId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit TicketListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Cancel a resale listing
     * @param tokenId ID of the ticket listing to cancel
     */
    function cancelResale(uint256 tokenId) 
        external 
        ticketExists(tokenId) 
    {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not listing owner");
        
        listing.active = false;
        
        emit TicketDelisted(tokenId);
    }
    
    /**
     * @dev Buy a ticket from resale marketplace (atomic escrow)
     * @param tokenId ID of the ticket to purchase
     */
    function buyResale(uint256 tokenId) 
        external 
        payable 
        whenNotPaused 
        ticketExists(tokenId) 
        nonReentrant 
    {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        
        TicketData storage ticket = tickets[tokenId];
        EventData storage eventData = events[ticket.eventId];
        
        require(!eventData.cancelled, "Event cancelled");
        require(eventData.resaleActive, "Resale not active");
        require(block.timestamp < eventData.resaleDeadline, "Resale deadline passed");
        
        address seller = listing.seller;
        require(ownerOf(tokenId) == seller, "Seller no longer owns ticket");
        require(msg.sender != seller, "Cannot buy own ticket");
        
        // Close listing first (reentrancy protection)
        listing.active = false;
        
        // Increment resale count
        ticket.resaleCount++;
        
        // Transfer NFT to buyer
        _transfer(seller, msg.sender, tokenId);
        
        // Transfer payment to seller
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "Payment transfer failed");
        
        emit TicketResold(tokenId, seller, msg.sender, listing.price);
    }
    
    // ==================== Ticket Redemption Functions ====================
    
    /**
     * @dev Redeem a ticket at the gate
     * @param tokenId ID of the ticket to redeem
     * @param holder Address of the ticket holder
     */
    function redeemTicket(uint256 tokenId, address holder) 
        external 
        onlyGateOfficer 
        ticketExists(tokenId) 
    {
        require(ownerOf(tokenId) == holder, "Holder mismatch");
        
        TicketData storage ticket = tickets[tokenId];
        EventData storage eventData = events[ticket.eventId];
        
        require(ticket.active, "Ticket not active");
        require(!ticket.redeemed, "Ticket already redeemed");
        require(!eventData.cancelled, "Event cancelled");
        
        // Mark as redeemed
        ticket.redeemed = true;
        
        emit TicketRedeemed(tokenId, holder, ticket.eventId);
    }
    
    // ==================== Event Cancellation & Refund Functions ====================
    
    /**
     * @dev Cancel an event
     * @param eventId ID of the event to cancel
     */
    function cancelEvent(uint256 eventId) 
        external 
        onlyEventOrganizer(eventId) 
        eventExists(eventId) 
    {
        EventData storage eventData = events[eventId];
        require(!eventData.cancelled, "Event already cancelled");
        
        eventData.cancelled = true;
        eventData.primarySaleActive = false;
        eventData.resaleActive = false;
        
        emit EventCancelled(eventId, msg.sender);
    }
    
    /**
     * @dev Claim refund for a cancelled event
     * @param tokenId ID of the ticket to refund
     */
    function claimRefund(uint256 tokenId) 
        external 
        ticketExists(tokenId) 
        nonReentrant 
    {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        
        TicketData storage ticket = tickets[tokenId];
        EventData storage eventData = events[ticket.eventId];
        
        require(eventData.cancelled, "Event not cancelled");
        require(ticket.active, "Ticket not active");
        require(!ticket.redeemed, "Ticket already redeemed");
        
        // Mark ticket as inactive to prevent double refund
        ticket.active = false;
        
        // Calculate refund amount (original price)
        uint256 refundAmount = ticket.originalPrice;
        
        // Transfer refund to ticket holder
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(tokenId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Organizer deposits funds for refunds (for cancelled events)
     */
    function depositRefundFunds(uint256 eventId) 
        external 
        payable 
        onlyEventOrganizer(eventId) 
        eventExists(eventId) 
    {
        EventData storage eventData = events[eventId];
        require(eventData.cancelled, "Event not cancelled");
        // Funds are held in contract for refund claims
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw (only owner, only for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ==================== Override Functions ====================
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
