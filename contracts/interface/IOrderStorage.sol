// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {OrderKey, Price, LibOrder} from "../libraries/LibOrder.sol";

interface IOrderStorage {
    // view functions
    function getOrders(
        address collection,
        uint256 tokenId,
        LibOrder.Side side,
        LibOrder.SaleKind saleKind,
        uint256 count,
        Price price,
        OrderKey firstOrderKey
    )
        external
        view
        returns (LibOrder.Order[] memory resultOrders, OrderKey nextOrderKey);

    function getBestOrder(
        address collection,
        uint256 tokenId,
        LibOrder.Side listBid,
        LibOrder.SaleKind saleKind
    ) external view returns (LibOrder.Order memory orderResult);
    // write functions
}
