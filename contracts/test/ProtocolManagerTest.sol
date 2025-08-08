// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ProtocolManager} from "../ProtocolManager.sol";

contract ProtocolManagerTest is ProtocolManager {
    function initialize(uint128 newProtocolFee) public initializer {
        __ProtocolManager_init(newProtocolFee);
    }
}
