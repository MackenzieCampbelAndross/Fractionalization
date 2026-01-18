// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetaVaultBond is ERC1155, Ownable {

    uint256 public constant TOTAL_UNITS = 1_000_000 * 1e18;

    struct Bond {
        uint256 maturityTime;
        uint256 totalYield;
        uint256 bondValue;          // total pool value
        uint256 distributedUnits;  // total fractions distributed
        bool minted;
    }

    mapping(uint256 => Bond) public bonds;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event BondSealed(uint256 indexed bondId, uint256 bondValue, uint256 totalUnits);
    event FractionDistributed(uint256 indexed bondId, address indexed investor, uint256 units);
    event YieldDeposited(uint256 indexed bondId, uint256 amount);
    event Claimed(uint256 indexed bondId, address indexed investor, uint256 payout);

    constructor() ERC1155("") Ownable(msg.sender) {}

    // ============================================================
    //  Mint bond with locked economics
    // ============================================================
    function mintBond(uint256 bondId, uint256 bondValue, uint256 maturityTime) external onlyOwner {
        require(!bonds[bondId].minted, "Bond already minted");
        require(bondValue > 0, "Invalid bond value");
        require(maturityTime > block.timestamp, "Invalid maturity");

        bonds[bondId] = Bond({
            maturityTime: maturityTime,
            totalYield: 0,
            bondValue: bondValue,
            distributedUnits: 0,
            minted: true
        });

        _mint(owner(), bondId, TOTAL_UNITS, "");


        emit BondSealed(bondId, bondValue, TOTAL_UNITS);
    }

    // ============================================================
    //  Fractional distribution (mathematically enforced)
    // ============================================================
    function distribute(uint256 bondId, address investor, uint256 investmentAmount) external onlyOwner {
        Bond storage bond = bonds[bondId];

        require(bond.minted, "Bond not minted");
        require(investmentAmount > 0, "Invalid investment");

        uint256 units = (investmentAmount * TOTAL_UNITS) / bond.bondValue;

        require(units > 0, "Zero allocation");
        require(bond.distributedUnits + units <= TOTAL_UNITS, "Over-distribution");

        bond.distributedUnits += units;

        _safeTransferFrom(address(this), investor, bondId, units, "");

        emit FractionDistributed(bondId, investor, units);
    }

    // ============================================================
    //  Yield deposit after maturity
    // ============================================================
    function depositYield(uint256 bondId) external payable onlyOwner {
        Bond storage bond = bonds[bondId];

        require(bond.minted, "Bond not minted");
        require(block.timestamp >= bond.maturityTime, "Bond not matured");
        require(msg.value > 0, "Zero deposit");

        bond.totalYield += msg.value;

        emit YieldDeposited(bondId, msg.value);
    }

    // ============================================================
    //  Claim payout
    // ============================================================
    function claim(uint256 bondId) external {
        Bond storage bond = bonds[bondId];

        require(block.timestamp >= bond.maturityTime, "Bond not matured");
        require(!hasClaimed[bondId][msg.sender], "Already claimed");

        uint256 holderUnits = balanceOf(msg.sender, bondId);
        require(holderUnits > 0, "No bond units");

        uint256 payout = (holderUnits * bond.totalYield) / TOTAL_UNITS;
        require(payout > 0, "Nothing to claim");

        hasClaimed[bondId][msg.sender] = true;

        payable(msg.sender).transfer(payout);

        emit Claimed(bondId, msg.sender, payout);
    }

    // ============================================================
    //  Views
    // ============================================================
    function isMatured(uint256 bondId) external view returns (bool) {
        return block.timestamp >= bonds[bondId].maturityTime;
    }
}
