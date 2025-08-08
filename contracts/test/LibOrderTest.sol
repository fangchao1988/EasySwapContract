// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {LibOrder, OrderKey} from "../libraries/LibOrder.sol";

contract LibOrderTest {
    using LibOrder for LibOrder.Order;

    function getOrderHash(
        LibOrder.Order memory order
    ) public pure returns (OrderKey) {
        return order.hash();
    }
}
