// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {RedBlackTreeLibrary, Price} from "./libraries/RedBlackTreeLibrary.sol";
import {LibOrder, OrderKey} from "./libraries/LibOrder.sol";

error CannotInsertDuplicateOrder(OrderKey orderKey);

contract OrderStorage is Initializable{
    using RedBlackTreeLibrary for RedBlackTreeLibrary.Tree;

    /// @dev all order keys are wrapped in a sentinel value to avoid collisions
    mapping(OrderKey => LibOrder.DBOrder) public orders;

    /// @dev price tree for each collection and side, sorted by price
    mapping(address => mapping(LibOrder.Side => RedBlackTreeLibrary.Tree))
        public priceTrees;

    /// @dev order queue for each collection, side and expecially price, sorted by orderKey
    mapping(address => mapping(LibOrder.Side => mapping(Price => LibOrder.OrderQueue)))
        public orderQueues;

    function __OrderStorage_init(
        string memory EIP712Name,
        string memory EIP712Version
    ) internal onlyInitializing{}

    function __OrderStorage_init_unchained() internal onlyInitializing {}
    
    function onePlus(uint256 x) internal pure returns (uint256) {
        unchecked {
            return 1 + x;
        }
    }

    function getBestPrice(
        address collection,
        LibOrder.Side side
    ) public view returns (Price price) {
        price = (side == LibOrder.Side.Bid)
            ? priceTrees[collection][side].last()
            : priceTrees[collection][side].first();
    }

    function getNextBestPrice(
        address collection,
        LibOrder.Side side,
        Price price
    ) public view returns (Price nextBestPrice) {
        if (RedBlackTreeLibrary.isEmpty(price)) {
            nextBestPrice = (side == LibOrder.Side.Bid)
                ? priceTrees[collection][side].last()
                : priceTrees[collection][side].first();
        } else {
            nextBestPrice = (side == LibOrder.Side.Bid)
                ? priceTrees[collection][side].prev(price)
                : priceTrees[collection][side].next(price);
        }
    }

    function _addOrder(
        LibOrder.Order memory order
    ) internal returns (OrderKey orderKey) {
        orderKey = LibOrder.hash(order);
        if (orders[orderKey].order.maker != address(0)) {
            revert CannotInsertDuplicateOrder(orderKey);
        }

        // insert price to price tree if not exists
        RedBlackTreeLibrary.Tree storage priceTree = priceTrees[
            order.nft.collection
        ][order.side];
        if (!priceTree.exists(order.price)) {
            priceTree.insert(order.price);
        }

        // insert order to order queue
        LibOrder.OrderQueue storage orderQueue = orderQueues[
            order.nft.collection
        ][order.side][order.price];

        if (LibOrder.isSentinel(orderQueue.head)) {
            orderQueues[order.nft.collection][order.side][
                order.price
            ] = LibOrder.OrderQueue(
                LibOrder.ORDERKEY_SENTINEL,
                LibOrder.ORDERKEY_SENTINEL
            );
            orderQueue = orderQueues[order.nft.collection][order.side][
                order.price
            ];
        }
        if (LibOrder.isSentinel(orderQueue.tail)) {
            orderQueue.head = orderKey;
            orderQueue.tail = orderKey;
            orders[orderKey] = LibOrder.DBOrder(
                order,
                LibOrder.ORDERKEY_SENTINEL
            );
        } else {
            orders[orderQueue.tail].next = orderKey;
            orders[orderKey] = LibOrder.DBOrder(
                order,
                LibOrder.ORDERKEY_SENTINEL
            );
            orderQueue.tail = orderKey;
        }
    }

    function _removeOrder(
        LibOrder.Order memory order
    ) internal returns (OrderKey orderKey) {
        LibOrder.OrderQueue storage orderQueue = orderQueues[
            order.nft.collection
        ][order.side][order.price];
        orderKey = orderQueue.head;
        OrderKey prevOrderKey;
        bool found;
        while (LibOrder.isNotSentinel(orderKey) && !found) {
            LibOrder.DBOrder memory dbOrder = orders[orderKey];
            if (
                (dbOrder.order.maker == order.maker) &&
                (dbOrder.order.saleKind == order.saleKind) &&
                (dbOrder.order.expiry == order.expiry) &&
                (dbOrder.order.salt == order.salt) &&
                (dbOrder.order.nft.tokenId == order.nft.tokenId) &&
                (dbOrder.order.nft.amount == order.nft.amount)
            ) {
                OrderKey temp = orderKey;
                // emit OrderRemoved(order.nft.collection, orderKey, order.maker, order.side, order.price, order.nft, block.timestamp);
                if (
                    OrderKey.unwrap(orderQueue.head) ==
                    OrderKey.unwrap(orderKey)
                ) {
                    orderQueue.head = dbOrder.next;
                } else {
                    orders[prevOrderKey].next = dbOrder.next;
                }
                if (
                    OrderKey.unwrap(orderQueue.tail) ==
                    OrderKey.unwrap(orderKey)
                ) {
                    orderQueue.tail = prevOrderKey;
                }
                prevOrderKey = orderKey;
                orderKey = dbOrder.next;
                delete orders[temp];
                found = true;
            } else {
                prevOrderKey = orderKey;
                orderKey = dbOrder.next;
            }
        }
        if (found) {
            if (LibOrder.isSentinel(orderQueue.head)) {
                delete orderQueues[order.nft.collection][order.side][
                    order.price
                ];
                RedBlackTreeLibrary.Tree storage priceTree = priceTrees[
                    order.nft.collection
                ][order.side];
                if (priceTree.exists(order.price)) {
                    priceTree.remove(order.price);
                }
            }
        } else {
            revert("Cannot remove missing order");
        }
    }

    /**
     * @dev Retrieves a list of orders that match the specified criteria.
     * @param collection The address of the NFT collection.
     * @param tokenId The ID of the NFT.
     * @param side The side of the orders to retrieve (buy or sell).
     * @param saleKind The type of sale (fixed price or auction).
     * @param count The maximum number of orders to retrieve.
     * @param price The maximum price of the orders to retrieve.
     * @param firstOrderKey The key of the first order to retrieve.
     * @return resultOrders An array of orders that match the specified criteria.
     * @return nextOrderKey The key of the next order to retrieve.
     */
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
        returns (LibOrder.Order[] memory resultOrders, OrderKey nextOrderKey)
    {
        resultOrders = new LibOrder.Order[](count);

        if (RedBlackTreeLibrary.isEmpty(price)) {
            price = getBestPrice(collection, side);
        } else {
            if (LibOrder.isSentinel(firstOrderKey)) {
                price = getNextBestPrice(collection, side, price);
            }
        }

        uint256 i;
        while (RedBlackTreeLibrary.isNotEmpty(price) && i < count) {
            LibOrder.OrderQueue memory orderQueue = orderQueues[collection][
                side
            ][price];
            OrderKey orderKey = orderQueue.head;
            if (LibOrder.isNotSentinel(firstOrderKey)) {
                while (
                    LibOrder.isNotSentinel(orderKey) &&
                    OrderKey.unwrap(orderKey) != OrderKey.unwrap(firstOrderKey)
                ) {
                    LibOrder.DBOrder memory order = orders[orderKey];
                    orderKey = order.next;
                }
                firstOrderKey = LibOrder.ORDERKEY_SENTINEL;
            }

            while (LibOrder.isNotSentinel(orderKey) && i < count) {
                LibOrder.DBOrder memory dbOrder = orders[orderKey];
                orderKey = dbOrder.next;
                if (
                    (dbOrder.order.expiry != 0 &&
                        dbOrder.order.expiry < block.timestamp)
                ) {
                    continue;
                }

                if (
                    (side == LibOrder.Side.Bid) &&
                    (saleKind == LibOrder.SaleKind.FixedPriceForCollection)
                ) {
                    if (
                        (dbOrder.order.side == LibOrder.Side.Bid) &&
                        (dbOrder.order.saleKind ==
                            LibOrder.SaleKind.FixedPriceForItem)
                    ) {
                        continue;
                    }
                }

                if (
                    (side == LibOrder.Side.Bid) &&
                    (saleKind == LibOrder.SaleKind.FixedPriceForItem)
                ) {
                    if (
                        (dbOrder.order.side == LibOrder.Side.Bid) &&
                        (dbOrder.order.saleKind ==
                            LibOrder.SaleKind.FixedPriceForItem) &&
                        (tokenId != dbOrder.order.nft.tokenId)
                    ) {
                        continue;
                    }
                }

                resultOrders[i] = dbOrder.order;
                nextOrderKey = dbOrder.next;
                i = onePlus(i);
            }
            price = getNextBestPrice(collection, side, price);
        }
    }

    function getBestOrder(
        address collection,
        uint256 tokenId,
        LibOrder.Side side,
        LibOrder.SaleKind saleKind
    ) external view returns (LibOrder.Order memory orderResult) {
        Price price = getBestPrice(collection, side);
        while (RedBlackTreeLibrary.isNotEmpty(price)) {
            LibOrder.OrderQueue memory orderQueue = orderQueues[collection][
                side
            ][price];
            OrderKey orderKey = orderQueue.head;
            while (LibOrder.isNotSentinel(orderKey)) {
                LibOrder.DBOrder memory dbOrder = orders[orderKey];
                if (
                    (side == LibOrder.Side.Bid) &&
                    (saleKind == LibOrder.SaleKind.FixedPriceForItem)
                ) {
                    if (
                        (dbOrder.order.side == LibOrder.Side.Bid) &&
                        (dbOrder.order.saleKind ==
                            LibOrder.SaleKind.FixedPriceForItem) &&
                        (tokenId != dbOrder.order.nft.tokenId)
                    ) {
                        orderKey = dbOrder.next;
                        continue;
                    }
                }

                if (
                    (side == LibOrder.Side.Bid) &&
                    (saleKind == LibOrder.SaleKind.FixedPriceForCollection)
                ) {
                    if (
                        (dbOrder.order.side == LibOrder.Side.Bid) &&
                        (dbOrder.order.saleKind ==
                            LibOrder.SaleKind.FixedPriceForItem)
                    ) {
                        orderKey = dbOrder.next;
                        continue;
                    }
                }

                if (
                    (dbOrder.order.expiry == 0 ||
                        dbOrder.order.expiry > block.timestamp)
                ) {
                    orderResult = dbOrder.order;
                    break;
                }
                orderKey = dbOrder.next;
            }
            if (Price.unwrap(orderResult.price) > 0) {
                break;
            }
            price = getNextBestPrice(collection, side, price);
        }
    }

    uint256[50] private __gap;
}
