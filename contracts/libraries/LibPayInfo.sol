// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library LibPayInfo {
    //total share in percentage, 10,000 = 100%
    uint128 public constant TOTAL_SHARE = 10000;
    uint128 public constant MAX_PROTOCOL_SHARE = 1000;
    bytes32 public constant TYPE_HASH =
        keccak256("PayInfo(address receiver,uint96 share)");

    struct PayInfo {
        address payable receiver;
        // Share of funds. 
        // Basis point format.
        uint96 share;
    }

    function hash(PayInfo memory info) internal pure returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, info.receiver, info.share));
    }
}
