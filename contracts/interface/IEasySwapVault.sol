// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {LibOrder, OrderKey} from "../libraries/LibOrder.sol";

interface IEasySwapVault {
    // function

    /**
     * @notice Get the balance info of the order.
     * @param orderKey The unique id of the order.
     * @return ETHAmount The amount of ETH in the order.
     * @return tokenId The tokenId of the NFT in the order.
     */
    function balanceOf(
        OrderKey orderKey
    ) external view returns (uint256 ETHAmount, uint256 tokenId);

    /**
     * @notice Deposit ETH to the order when creating a Bid order.
     * @param orderKey The unique id of the order.
     * @param ETHAmount The amount of ETH to deposit.
     */
    function depositETH(OrderKey orderKey, uint256 ETHAmount) external payable;

    /**
     * @notice Withdraw ETH from the order when the order is canceled or partly matched.
     * @param orderKey The unique id of the order.
     * @param ETHAmount The amount of ETH to withdraw.
     * @param to The address to receive the ETH.
     */
    function withdrawETH(
        OrderKey orderKey,
        uint256 ETHAmount,
        address to
    ) external;

    /**
     * @notice Deposit NFT to the order when creating a List order.
     * @param orderKey The unique id of the order.
     * @param from The address of the NFT owner.
     * @param collection The address of the NFT collection.
     * @param tokenId The tokenId of the NFT.
     */
    function depositNFT(
        OrderKey orderKey,
        address from,
        address collection,
        uint256 tokenId
    ) external;

    /**
     * @notice Withdraw NFT from the order when the order is canceled.
     * @param orderKey The unique id of the order.
     * @param to The address to receive the NFT.
     * @param collection The address of the NFT collection.
     * @param tokenId The tokenId of the NFT.
     */
    function withdrawNFT(
        OrderKey orderKey,
        address to,
        address collection,
        uint256 tokenId
    ) external;

    /**
     * @notice Edit the order's NFT when editing order.
     * @param oldOrderKey The unique id of the order.
     * @param newOrderKey The new unique id of the order.
     */
    function editNFT(OrderKey oldOrderKey, OrderKey newOrderKey) external;

    /**
     * @notice Edit the order's ETH when editing order.
     * @param oldOrderKey The unique id of the order.
     * @param newOrderKey The new unique id of the order.
     * @param oldETHAmount The old amount of ETH in the order.
     * @param newETHAmount The new amount of ETH in the order.
     * @param to The address to receive the ETH.
     */
    function editETH(
        OrderKey oldOrderKey,
        OrderKey newOrderKey,
        uint256 oldETHAmount,
        uint256 newETHAmount,
        address to
    ) external payable;

    /**
     * @notice Batch transfer ERC721 NFTs.
     * @param to The address to receive the NFTs.
     * @param assets The array of NFT info.
     */
    function batchTransferERC721(
        address to,
        LibOrder.NFTInfo[] calldata assets
    ) external;

    /**
     * @notice Transfer ERC721 NFT.
     * @param from The address of the NFT owner.
     * @param to The address to receive the NFT.
     * @param assets The NFT info.
     */
    function transferERC721(
        address from,
        address to,
        LibOrder.Asset calldata assets
    ) external;
}
