// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "erc721a/contracts/ERC721A.sol";

contract Troll is ERC721A, Ownable, ReentrancyGuard {
    string private metaURI;

    uint256 public constant MAX_SUPPLY = 2024;
    uint256 public constant PER_MINT = 4;
    bool public mintStatus;

    constructor() ERC721A("Troll", "Troll") Ownable(msg.sender) {}

    function mint(address to, uint256 quantity) external nonReentrant {
        // require(mintStatus, "Not yet started");
        // require(
        //     _totalMinted() + quantity <= MAX_SUPPLY,
        //     "Exceed the maximum amount"
        // );
        // require(quantity <= PER_MINT, "Exceed per mint");

        // mint
        _safeMint(to, quantity);
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(_exists(tokenId), "The energy has not yet been collected");
        return metaURI;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721A) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setMintStatus(bool status) external onlyOwner {
        mintStatus = status;
    }

    function setTokenURI(string calldata tokenURI_) external onlyOwner {
        metaURI = tokenURI_;
    }

    function withdrawETH() external onlyOwner {
        (bool success, ) = _msgSender().call{value: address(this).balance}("");
        require(success, "withdraw failed");
    }

    receive() external payable {}
}
