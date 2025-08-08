const { expect } = require("chai")
const { ethers, upgrades } = require("hardhat")
const { toBn } = require("evm-bn")
const { Side, SaleKind } = require("./common")
const { exp } = require("@prb/math")

let owner, addr1, addr2, addrs
let esVault, esDex, testERC721, testLibOrder
const AddressZero = "0x0000000000000000000000000000000000000000";
const Byte32Zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
const Uint128Max = toBn("340282366920938463463.374607431768211455");
const Uint256Max = toBn("115792089237316195423570985008687907853269984665640564039457.584007913129639935");


describe("EasySwap Test", function () {
    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        // console.log("owner: ", owner.address)

        esVault = await ethers.getContractFactory("EasySwapVault")
        esDex = await ethers.getContractFactory("EasySwapOrderBook")
        testERC721 = await ethers.getContractFactory("TestERC721")
        testLibOrder = await ethers.getContractFactory("LibOrderTest")

        testLibOrder = await testLibOrder.deploy()
        testERC721 = await testERC721.deploy()
        esVault = await upgrades.deployProxy(esVault, { initializer: 'initialize' });
        // await esVault.waitForDeployment();
        // console.log("esVault deployed to:", await esVault.getAddress());

        newProtocolShare = 200;
        newESVault = esVault.address
        EIP712Name = "EasySwapOrderBook"
        EIP712Version = "1"
        esDex = await upgrades.deployProxy(esDex, [newProtocolShare, newESVault, EIP712Name, EIP712Version], { initializer: 'initialize' });
        // await esDex.waitForDeployment();
        // console.log("esDex deployed to:", await esDex.getAddress());

        nft = testERC721.address
        await testERC721.mint(owner.address, 0)
        await testERC721.mint(owner.address, 1)
        await testERC721.mint(owner.address, 2)
        await testERC721.mint(owner.address, 3)
        await testERC721.mint(owner.address, 4)
        await testERC721.mint(owner.address, 5)
        await testERC721.mint(owner.address, 6)
        await testERC721.mint(owner.address, 7)
        await testERC721.mint(owner.address, 8)
        await testERC721.mint(owner.address, 9)
        await testERC721.mint(owner.address, 10)
        await testERC721.mint(owner.address, 11)
        testERC721.setApprovalForAll(esVault.address, true)
        // testERC721.setApprovalForAll(esDex.address, true)

        await esVault.setOrderBook(esDex.address)
    })

    describe("should initialize successfully", async () => {
        it("should initialize successfully", async () => {
            info = await esDex.eip712Domain();
            expect(info.name).to.equal(EIP712Name)
            expect(info.version).to.equal(EIP712Version)
        })
    })

    describe("should make order successfully", async () => {
        it("should make list/sell order successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const nftAmount = 1;
            const order = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order];

            orderKeys = await esDex.callStatic.makeOrders(orders)
            expect(orderKeys[0]).to.not.equal(Byte32Zero)

            // tx = await esDex.makeOrders(orders)
            // txRec = await tx.wait()
            // console.log("txRec: ", txRec.logs)

            await expect(await esDex.makeOrders(orders))
                .to.emit(esDex, "LogMake")

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            dbOrder = await esDex.orders(orderHash)
            // console.log("dbOrder: ", dbOrder)
            expect(dbOrder.order.maker).to.equal(owner.address)
            expect(await testERC721.ownerOf(0)).to.equal(esVault.address)
        })

        it("should make list/sell order and return orders successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order];

            orderKeys = await esDex.callStatic.makeOrders(orders)
            expect(orderKeys[0]).to.not.equal(Byte32Zero)

        })

        it("should make bid/buy order successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order];

            orderKeys = await esDex.callStatic.makeOrders(orders, { value: toBn("0.02") })
            expect(orderKeys[0]).to.not.equal(Byte32Zero)

            await expect(await esDex.makeOrders(orders, { value: toBn("0.02") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.01"), toBn("0.01")]);

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            dbOrder = await esDex.orders(orderHash)
            // console.log("dbOrder: ", dbOrder)
            expect(dbOrder.order.maker).to.equal(owner.address)
        })

        it("should make two side order successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const listOrder = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            const bidOrder = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [listOrder, bidOrder];

            orderKeys = await esDex.callStatic.makeOrders(orders, { value: toBn("0.02") })
            expect(orderKeys[0]).to.not.equal(Byte32Zero)
            expect(orderKeys[1]).to.not.equal(Byte32Zero)

            await expect(await esDex.makeOrders(orders, { value: toBn("0.02") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.01"), toBn("0.01")]);

            const listOrderHash = await testLibOrder.getOrderHash(listOrder)
            dbOrder = await esDex.orders(listOrderHash)
            expect(dbOrder.order.maker).to.equal(owner.address)
            expect(await testERC721.ownerOf(0)).to.equal(esVault.address)

            const bidOrderHash = await testLibOrder.getOrderHash(bidOrder)
            dbOrder2 = await esDex.orders(bidOrderHash)
            expect(dbOrder2.order.maker).to.equal(owner.address)
        })
    })

    describe("should cancel order successfully", async () => {
        it("should cancel list order successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order];


            await expect(await esDex.makeOrders(orders))
                .to.emit(esDex, "LogMake")

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            dbOrder = await esDex.orders(orderHash)
            // console.log("dbOrder: ", dbOrder)
            expect(dbOrder.order.maker).to.equal(owner.address)


            successes = await esDex.callStatic.cancelOrders([orderHash])
            expect(successes[0]).to.equal(true)


            // tx = await esDex.cancelOrders([orderHash])
            // txRec = await tx.wait()
            // console.log("txRec: ", txRec.logs)

            await expect(await esDex.cancelOrders([orderHash]))
                .to.emit(esDex, "LogCancel")

            stat = await esDex.filledAmount(orderHash)
            expect(stat).to.equal(Uint256Max)
        })

        it("should cancel bid order successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 5],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order];

            // await expect(await esDex.makeOrders(orders, { value: toBn("0.05") }))
            //     .to.emit(esDex, "LogMake")

            await expect(await esDex.makeOrders(orders, { value: toBn("0.07") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.05"), toBn("0.05")]);

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            dbOrder = await esDex.orders(orderHash)
            // console.log("dbOrder: ", dbOrder)
            expect(dbOrder.order.maker).to.equal(owner.address)


            successes = await esDex.callStatic.cancelOrders([orderHash])
            expect(successes[0]).to.equal(true)

            // await expect(await esDex.cancelOrders([orderHash]))
            //     .to.emit(esDex, "LogCancel")

            await expect(await esDex.cancelOrders([orderHash]))
                .to.changeEtherBalances([owner, esVault], [toBn("0.05"), toBn("-0.05")]);

            stat = await esDex.filledAmount(orderHash)
            expect(stat).to.equal(Uint256Max)
        })

        async function perparePartlyFilledOrder() {
            //bid order
            let now = parseInt(new Date() / 1000) + 10000000000
            let salt = 1;
            let nftAddress = testERC721.address;
            let tokenId = 1;
            let buyOrder = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: addr1.address,
                nft: [tokenId, nftAddress, 4],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            await expect(await esDex.connect(addr1).makeOrders([buyOrder], { value: toBn("0.04") }))
                .to.emit(esDex, "LogMake")

            const orderHash = await testLibOrder.getOrderHash(buyOrder)
            // console.log("buy orderHash: ", orderHash)

            const dbOrder = await esDex.orders(orderHash)
            // console.log("buy order: ", dbOrder)

            // market sell
            now = parseInt(new Date() / 1000) + 100000
            salt = 2;
            nftAddress = testERC721.address;
            tokenId = 1;
            sellOrder = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            await expect(await esDex.matchOrder(sellOrder, buyOrder))
                .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
            expect(await testERC721.ownerOf(1)).to.equal(addr1.address)
            return orderHash
        }

        it("should cancel bid order partly filled successfully", async () => {
            orderHash = await perparePartlyFilledOrder();
            // console.log("orderHash: ", orderHash)

            await expect(await esDex.connect(addr1).cancelOrders([orderHash]))
                .to.emit(esDex, "LogCancel")

            stat = await esDex.filledAmount(orderHash)
            expect(stat).to.equal(Uint256Max)

            newETHBalance = await esVault.ETHBalance(orderHash);
            expect(newETHBalance).to.equal(toBn("0"))
        })
    })

    describe("should edit orders successfully", async () => {
        it("should edit list orders successfully", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 1;
            const order = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            tokenId2 = 2;
            order2 = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }
            const orders = [order, order2];

            await expect(await esDex.makeOrders(orders))
                .to.emit(esDex, "LogMake")

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            const order2Hash = await testLibOrder.getOrderHash(order2)
            // console.log("order2Hash: ", order2Hash)

            dbOrder = await esDex.orders(orderHash)
            expect(dbOrder.order.maker).to.equal(owner.address)

            dbOrder2 = await esDex.orders(order2Hash)
            expect(dbOrder2.order.maker).to.equal(owner.address)

            // edit
            newOrder = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }
            newOrder2 = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 1],
                price: toBn("0.04"),
                expiry: now,
                salt: 11,
            }

            editDetail1 = {
                oldOrderKey: orderHash,
                newOrder: newOrder,
            }
            editDetail2 = {
                oldOrderKey: order2Hash,
                newOrder: newOrder2,
            }

            editDetails = [editDetail1, editDetail2]

            newOrderKeys = await esDex.callStatic.editOrders(editDetails)
            expect(newOrderKeys[0]).to.not.equal(Byte32Zero)
            expect(newOrderKeys[1]).to.not.equal(Byte32Zero)

            editDetailsSkip = [editDetail1, editDetail1, editDetail2]
            newOrderKeys = await esDex.callStatic.editOrders(editDetailsSkip)
            expect(newOrderKeys[0]).to.not.equal(Byte32Zero)
            expect(newOrderKeys[1]).to.equal(Byte32Zero)
            expect(newOrderKeys[2]).to.not.equal(Byte32Zero)
            await esDex.editOrders(editDetails)

            const newOrderHash = await testLibOrder.getOrderHash(newOrder)
            newNFTBalance = await esVault.NFTBalance(newOrderHash);
            expect(newNFTBalance).to.equal(1)

            oldNFTBalance = await esVault.NFTBalance(orderHash);
            expect(oldNFTBalance).to.equal(0)

            const newOrder2Hash = await testLibOrder.getOrderHash(newOrder2)
            newNFT2Balance = await esVault.NFTBalance(newOrder2Hash);
            expect(newNFT2Balance).to.equal(2)

            oldNFT2Balance = await esVault.NFTBalance(order2Hash);
            expect(oldNFT2Balance).to.equal(0)

            newStat = await esDex.filledAmount(newOrderHash);
            expect(newStat).to.equal(0)
            oldStat = await esDex.filledAmount(orderHash);
            expect(oldStat).to.equal(Uint256Max)

            newStat2 = await esDex.filledAmount(newOrder2Hash);
            expect(newStat2).to.equal(0)
            oldStat2 = await esDex.filledAmount(order2Hash);
            expect(oldStat2).to.equal(Uint256Max)
        })

        it("should edit bid order successfully, all new price > old price", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            tokenId2 = 2;
            const order2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order1, order2];

            await expect(await esDex.makeOrders(orders, { value: toBn("0.04") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.02"), toBn("0.02")]);

            const orderHash = await testLibOrder.getOrderHash(order1)
            // console.log("orderHash: ", orderHash)
            const order2Hash = await testLibOrder.getOrderHash(order2)
            // console.log("order2Hash: ", order2Hash)

            dbOrder = await esDex.orders(orderHash)
            expect(dbOrder.order.maker).to.equal(owner.address)

            dbOrder2 = await esDex.orders(order2Hash)
            expect(dbOrder2.order.maker).to.equal(owner.address)

            // edit
            newOrder1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 2],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            newOrder2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 2],
                price: toBn("0.03"),
                expiry: now,
                salt: salt,
            }

            editDetail1 = {
                oldOrderKey: orderHash,
                newOrder: newOrder1
            }
            editDetail2 = {
                oldOrderKey: order2Hash,
                newOrder: newOrder2
            }
            editDetails = [editDetail1, editDetail2]

            newOrderKeys = await esDex.callStatic.editOrders(editDetails, { value: toBn("0.09") })
            expect(newOrderKeys[0]).to.not.equal(Byte32Zero)
            expect(newOrderKeys[1]).to.not.equal(Byte32Zero)

            await expect(await esDex.editOrders(editDetails, { value: toBn("0.1") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.08"), toBn("0.08")]);

            const newOrderHash = await testLibOrder.getOrderHash(newOrder1)
            newStat = await esDex.filledAmount(newOrderHash);
            expect(newStat).to.equal(0)
            oldStat = await esDex.filledAmount(orderHash);
            expect(oldStat).to.equal(Uint256Max)

            const newOrder2Hash = await testLibOrder.getOrderHash(newOrder2)
            new2Stat = await esDex.filledAmount(newOrder2Hash);
            expect(newStat).to.equal(0)
            old2Stat = await esDex.filledAmount(order2Hash);
            expect(old2Stat).to.equal(Uint256Max)

            newETHBalance = await esVault.ETHBalance(newOrderHash);
            expect(newETHBalance).to.equal(toBn("0.04"))
            oldETHBalance = await esVault.ETHBalance(orderHash);
            expect(oldETHBalance).to.equal(0)

            newETHBalance2 = await esVault.ETHBalance(newOrder2Hash);
            expect(newETHBalance2).to.equal(toBn("0.06"))

            oldETHBalance2 = await esVault.ETHBalance(order2Hash);
            expect(oldETHBalance2).to.equal(0)
        })

        it("should edit bid order successfully, all new price < old price", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            tokenId2 = 2
            const order2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order1, order2];

            await expect(await esDex.makeOrders(orders, { value: toBn("0.04") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.02"), toBn("0.02")]);

            const orderHash = await testLibOrder.getOrderHash(order1)
            // console.log("orderHash: ", orderHash)
            const order2Hash = await testLibOrder.getOrderHash(order2)
            // console.log("order2Hash: ", order2Hash)

            dbOrder = await esDex.orders(orderHash)
            expect(dbOrder.order.maker).to.equal(owner.address)

            dbOrder2 = await esDex.orders(order2Hash)
            expect(dbOrder2.order.maker).to.equal(owner.address)

            // edit
            newOrder1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 3],
                price: toBn("0.005"),
                expiry: now,
                salt: salt,
            }

            newOrder2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 5],
                price: toBn("0.006"),
                expiry: now,
                salt: salt,
            }

            editDetail1 = {
                oldOrderKey: orderHash,
                newOrder: newOrder1
            }
            editDetail2 = {
                oldOrderKey: order2Hash,
                newOrder: newOrder2
            }
            editDetails = [editDetail1, editDetail2]

            newOrderKeys = await esDex.callStatic.editOrders(editDetails, { value: toBn("0.04") })
            expect(newOrderKeys[0]).to.not.equal(Byte32Zero)
            expect(newOrderKeys[1]).to.not.equal(Byte32Zero)

            await expect(await esDex.editOrders(editDetails, { value: toBn("0.04") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.025"), toBn("0.025")]);

            const newOrderHash = await testLibOrder.getOrderHash(newOrder1)
            newStat = await esDex.filledAmount(newOrderHash);
            expect(newStat).to.equal(0)
            oldStat = await esDex.filledAmount(orderHash);
            expect(oldStat).to.equal(Uint256Max)

            const newOrder2Hash = await testLibOrder.getOrderHash(newOrder2)
            new2Stat = await esDex.filledAmount(newOrder2Hash);
            expect(newStat).to.equal(0)
            old2Stat = await esDex.filledAmount(order2Hash);
            expect(old2Stat).to.equal(Uint256Max)

            newETHBalance = await esVault.ETHBalance(newOrderHash);
            expect(newETHBalance).to.equal(toBn("0.015"))
            oldETHBalance = await esVault.ETHBalance(orderHash);
            expect(oldETHBalance).to.equal(0)

            newETHBalance2 = await esVault.ETHBalance(newOrder2Hash);
            expect(newETHBalance2).to.equal(toBn("0.03"))

            oldETHBalance2 = await esVault.ETHBalance(order2Hash);
            expect(oldETHBalance2).to.equal(0)
        })

        it("should edit bid order successfully, order one: new price < old price, order two: new price > old price", async () => {
            const now = parseInt(new Date() / 1000) + 100000
            const salt = 1;
            const nftAddress = testERC721.address;
            const tokenId = 0;
            const order1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            tokenId2 = 2
            const order2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }
            const orders = [order1, order2];

            await expect(await esDex.makeOrders(orders, { value: toBn("0.04") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.02"), toBn("0.02")]);

            const orderHash = await testLibOrder.getOrderHash(order1)
            // console.log("orderHash: ", orderHash)
            const order2Hash = await testLibOrder.getOrderHash(order2)
            // console.log("order2Hash: ", order2Hash)

            dbOrder = await esDex.orders(orderHash)
            expect(dbOrder.order.maker).to.equal(owner.address)

            dbOrder2 = await esDex.orders(order2Hash)
            expect(dbOrder2.order.maker).to.equal(owner.address)

            // edit
            newOrder1 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 2],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            newOrder2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId2, nftAddress, 3],
                price: toBn("0.002"),
                expiry: now,
                salt: salt,
            }

            editDetail1 = {
                oldOrderKey: orderHash,
                newOrder: newOrder1
            }
            editDetail2 = {
                oldOrderKey: order2Hash,
                newOrder: newOrder2
            }
            editDetails = [editDetail1, editDetail2]

            newOrderKeys = await esDex.callStatic.editOrders(editDetails, { value: toBn("0.04") })
            expect(newOrderKeys[0]).to.not.equal(Byte32Zero)
            expect(newOrderKeys[1]).to.not.equal(Byte32Zero)

            await expect(await esDex.editOrders(editDetails, { value: toBn("0.04") }))
                .to.changeEtherBalances([owner, esVault], [toBn("-0.026"), toBn("0.026")]);

            const newOrderHash = await testLibOrder.getOrderHash(newOrder1)
            newStat = await esDex.filledAmount(newOrderHash);
            expect(newStat).to.equal(0)
            oldStat = await esDex.filledAmount(orderHash);
            expect(oldStat).to.equal(Uint256Max)

            const newOrder2Hash = await testLibOrder.getOrderHash(newOrder2)
            new2Stat = await esDex.filledAmount(newOrder2Hash);
            expect(newStat).to.equal(0)
            old2Stat = await esDex.filledAmount(order2Hash);
            expect(old2Stat).to.equal(Uint256Max)

            newETHBalance = await esVault.ETHBalance(newOrderHash);
            expect(newETHBalance).to.equal(toBn("0.04"))
            oldETHBalance = await esVault.ETHBalance(orderHash);
            expect(oldETHBalance).to.equal(0)

            newETHBalance2 = await esVault.ETHBalance(newOrder2Hash);
            expect(newETHBalance2).to.equal(toBn("0.006"))

            oldETHBalance2 = await esVault.ETHBalance(order2Hash);
            expect(oldETHBalance2).to.equal(0)
        })
    })

    describe("should match order successfully", async () => {
        describe("should check match available successfully", async () => {
            it("should match list order successfully", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.03") }))
                    .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

                // tx = await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })
                // txRec = await tx.wait()
                // console.log("txRec: ", txRec.logs)
                // console.log("gasUsed: ", txRec.gasUsed.toString())
            });

            it("should match collection bid order successfully", async () => {
                //bid order
                let now = parseInt(new Date() / 1000) + 10000000000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 1;
                let buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 4],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).makeOrders([buyOrder], { value: toBn("0.04") }))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(buyOrder)
                // console.log("buy orderHash: ", orderHash)

                const dbOrder = await esDex.orders(orderHash)
                // console.log("buy order: ", dbOrder)


                { // market sell one 
                    now = parseInt(new Date() / 1000) + 100000
                    salt = 2;
                    nftAddress = testERC721.address;
                    tokenId = 1;
                    sellOrder = {
                        side: Side.List,
                        saleKind: SaleKind.FixedPriceForItem,
                        maker: owner.address,
                        nft: [tokenId, nftAddress, 1],
                        price: toBn("0.01"),
                        expiry: now,
                        salt: salt,
                    }

                    await expect(await esDex.matchOrder(sellOrder, buyOrder))
                        .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                    expect(await testERC721.ownerOf(1)).to.equal(addr1.address)

                    newStat = await esDex.filledAmount(orderHash);
                    expect(newStat).to.equal(1)

                    newETHBalance = await esVault.ETHBalance(orderHash);
                    expect(newETHBalance).to.equal(toBn("0.03"))
                }

                {// market sell two 
                    now = parseInt(new Date() / 1000) + 100000
                    salt = 2;
                    nftAddress = testERC721.address;
                    tokenId = 2;
                    sellOrder = {
                        side: Side.List,
                        saleKind: SaleKind.FixedPriceForItem,
                        maker: owner.address,
                        nft: [tokenId, nftAddress, 1],
                        price: toBn("0.01"),
                        expiry: now,
                        salt: salt,
                    }

                    await expect(await esDex.matchOrder(sellOrder, buyOrder))
                        .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                    expect(await testERC721.ownerOf(1)).to.equal(addr1.address)

                    newStat = await esDex.filledAmount(orderHash);
                    expect(newStat).to.equal(2)

                    newETHBalance = await esVault.ETHBalance(orderHash);
                    expect(newETHBalance).to.equal(toBn("0.02"))
                }

                {// market sell three 
                    now = parseInt(new Date() / 1000) + 100000
                    salt = 2;
                    nftAddress = testERC721.address;
                    tokenId = 3;
                    sellOrder = {
                        side: Side.List,
                        saleKind: SaleKind.FixedPriceForItem,
                        maker: owner.address,
                        nft: [tokenId, nftAddress, 1],
                        price: toBn("0.01"),
                        expiry: now,
                        salt: salt,
                    }

                    await expect(await esDex.matchOrder(sellOrder, buyOrder))
                        .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                    expect(await testERC721.ownerOf(1)).to.equal(addr1.address)

                    newStat = await esDex.filledAmount(orderHash);
                    expect(newStat).to.equal(3)

                    newETHBalance = await esVault.ETHBalance(orderHash);
                    expect(newETHBalance).to.equal(toBn("0.01"))
                }

                { // market sell four 
                    now = parseInt(new Date() / 1000) + 100000
                    salt = 2;
                    nftAddress = testERC721.address;
                    tokenId = 4;
                    sellOrder = {
                        side: Side.List,
                        saleKind: SaleKind.FixedPriceForItem,
                        maker: owner.address,
                        nft: [tokenId, nftAddress, 1],
                        price: toBn("0.01"),
                        expiry: now,
                        salt: salt,
                    }

                    await expect(await esDex.matchOrder(sellOrder, buyOrder))
                        .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                    expect(await testERC721.ownerOf(1)).to.equal(addr1.address)

                    newStat = await esDex.filledAmount(orderHash);
                    expect(newStat).to.equal(4)

                    newETHBalance = await esVault.ETHBalance(orderHash);
                    expect(newETHBalance).to.equal(toBn("0"))
                }

                {// market sell five 
                    now = parseInt(new Date() / 1000) + 100000
                    salt = 2;
                    nftAddress = testERC721.address;
                    tokenId = 5;
                    sellOrder = {
                        side: Side.List,
                        saleKind: SaleKind.FixedPriceForItem,
                        maker: owner.address,
                        nft: [tokenId, nftAddress, 1],
                        price: toBn("0.01"),
                        expiry: now,
                        salt: salt,
                    }

                    await expect(esDex.matchOrder(sellOrder, buyOrder))
                        .to.be.revertedWith("HD: order closed")
                }
            });

            it("should match item bid order successfully", async () => {
                //bid order
                let now = parseInt(new Date() / 1000) + 10000000000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).makeOrders([buyOrder], { value: toBn("0.01") }))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(buyOrder)
                // console.log("buy orderHash: ", orderHash)

                const dbOrder = await esDex.orders(orderHash)
                // console.log("buy order: ", dbOrder)

                // market sell
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                sellOrder = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.matchOrder(sellOrder, buyOrder))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

                // tx = await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })
                // txRec = await tx.wait()
                // console.log("txRec: ", txRec.events)
                // console.log("gasUsed: ", txRec.gasUsed.toString())
            });

            it("should revert if order is the same", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: same order")
            });

            it("should revert if side mismatch", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: side mismatch")
            });

            it("should revert if sale kind mismatch", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: kind mismatch")
            });

            it("should revert if list order's sale kind is for collection", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: kind mismatch")
                // await expect(await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") }))
                //     .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                // expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

            });

            it("should revert if asset mismatch", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 1;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: asset mismatch")
            });

            it("should revert if order was canceled", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                await expect(await esDex.cancelOrders([orderHash]))
                    .to.emit(esDex, "LogCancel")

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") })).to.be.revertedWith("HD: order closed")
            });

            it("should revert if list order was filled", async () => {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.03") }))
                    .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

                await expect(esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.03") })).to.be.revertedWith("HD: order closed")
            });

            it("should revert if bid order was filled", async () => {
                //bid order
                let now = parseInt(new Date() / 1000) + 10000000000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 2],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).makeOrders([buyOrder], { value: toBn("0.02") }))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(buyOrder)
                // console.log("buy orderHash: ", orderHash)

                const dbOrder = await esDex.orders(orderHash)
                // console.log("buy order: ", dbOrder)

                // market sell
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                sellOrder = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.matchOrder(sellOrder, buyOrder))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

                tokenId = 1;
                sellOrder2 = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }
                await expect(await esDex.matchOrder(sellOrder2, buyOrder))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(tokenId)).to.equal(addr1.address)

                await expect(esDex.matchOrder(sellOrder2, buyOrder)).to.be.revertedWith("HD: order closed")
            });
        })

        describe("should check match successfully if msg.sender is sellOrder.maker", async () => {
            let bidOrder;

            beforeEach(async function () {
                // bid offer
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 2;
                let nftAddress = testERC721.address;
                let tokenId = 1;
                bidOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForCollection,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                orders = [bidOrder]
                await expect(await esDex.connect(addr1).makeOrders(orders, { value: toBn("0.02") }))
                    .to.changeEtherBalances([addr1, esVault], [toBn("-0.01"), toBn("0.01")]);

                const orderHash = await testLibOrder.getOrderHash(bidOrder)
                // console.log("orderHash: ", orderHash)

            })

            it("should match order successfully", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                expect(await testERC721.ownerOf(0)).to.equal(owner.address)
                await expect(await esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            })

            it("should match order with exist list order successfully", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                orders = [order]
                await esDex.makeOrders(orders);

                expect(await testERC721.ownerOf(0)).to.equal(esVault.address)
                await expect(await esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            })

            it("should revert if msgValue > 0", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(owner).matchOrder(order, bidOrder, { value: toBn("0.01") }))
                    .to.be.revertedWith("HD: value > 0")
            })

            it("should revert if maker is zero", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: AddressZero,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.be.revertedWith("HD: sender invalid")
            })

            it("should revert if salt = 0", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 0;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.be.revertedWith("OVa: zero salt")
            })

            it("should revert if unsupported nft asset", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, AddressZero, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.be.revertedWith("OVa: unsupported nft asset")
            })

            it.skip("should revert if buy price < sell price", async () => {
                // accept bid 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(owner).matchOrder(order, bidOrder))
                    .to.be.revertedWith("HD: buy price < fill price")
            })
        })

        describe("should check match successfully if msg.sender is buyOrder.maker", async () => {
            let listOrder;

            beforeEach(async function () {
                // list offer
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 2;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                listOrder = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                orders = [listOrder]
                await esDex.connect(owner).makeOrders(orders)

                const orderHash = await testLibOrder.getOrderHash(listOrder)
                // console.log("orderHash: ", orderHash)
            })

            it("should match order successfully", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                expect(await testERC721.ownerOf(0)).to.equal(esVault.address)
                await expect(await esDex.connect(addr1).matchOrder(listOrder, order, { value: toBn("0.01") }))
                    .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            })

            it("should match order with exist bid order successfully", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }
                orders = [order]

                await expect(await esDex.connect(addr1).makeOrders(orders, { value: toBn("0.04") }))
                    .to.changeEtherBalances([addr1, esVault], [toBn("-0.01"), toBn("0.01")]);

                expect(await testERC721.ownerOf(0)).to.equal(esVault.address)
                await expect(await esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            })

            it("should revert if maker is zero", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: AddressZero,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.be.revertedWith("HD: sender invalid")
            })

            it("should revert if salt = 0", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 0;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.be.revertedWith("OVa: zero salt")
            })

            it("should revert if unsupported nft asset", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 1;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.01"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.be.revertedWith("HD: asset mismatch")
            })

            it("should revert if value < sell price", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.02"),
                    expiry: now,
                    salt: salt,
                }

                await expect(esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.be.revertedWith("HD: value < fill price")
            })

            it("should revert if buy price < sell price", async () => {
                // accept list == buy 
                now = parseInt(new Date() / 1000) + 100000;
                salt = 1;
                nftAddress = testERC721.address;
                tokenId = 0;
                let order = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("0.002"),
                    expiry: now,
                    salt: salt,
                }

                orders = [order]

                await expect(await esDex.connect(addr1).makeOrders(orders, { value: toBn("0.004") }))
                    .to.changeEtherBalances([addr1, esVault], [toBn("-0.002"), toBn("0.002")]);


                await expect(esDex.connect(addr1).matchOrder(listOrder, order))
                    .to.be.revertedWith("HD: buy price < fill price")
            })
        })
    })

    describe("should match orders successfully", async () => {
        it("should match list orders successfully", async () => {
            //list order
            let now = parseInt(new Date() / 1000) + 100000
            let salt = 1;
            let nftAddress = testERC721.address;
            let tokenId = 0;
            let order = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            await expect(await esDex.makeOrders([order]))
                .to.emit(esDex, "LogMake")

            const orderHash = await testLibOrder.getOrderHash(order)
            // console.log("orderHash: ", orderHash)

            now = parseInt(new Date() / 1000) + 100000
            salt = 1;
            nftAddress = testERC721.address;
            tokenId = 1;
            order2 = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.01"),
                expiry: now,
                salt: salt,
            }

            await expect(await esDex.makeOrders([order2]))
                .to.emit(esDex, "LogMake")

            // market buy
            now = parseInt(new Date() / 1000) + 100000
            salt = 2;
            nftAddress = testERC721.address;
            tokenId = 0;
            buyOrder = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: addr1.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            tokenId = 1;
            buyOrder2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForItem,
                maker: addr1.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            matchDetail1 = {
                sellOrder: order,
                buyOrder: buyOrder,
            }
            matchDetail2 = {
                sellOrder: order2,
                buyOrder: buyOrder2,
            }
            matchDetails = [matchDetail1, matchDetail2]

            successes = await esDex.connect(addr1).callStatic.matchOrders(matchDetails, { value: toBn("0.06") })
            expect(successes[0]).to.equal(true)
            expect(successes[1]).to.equal(true)

            await expect(await esDex.connect(addr1).matchOrders(matchDetails, { value: toBn("0.06") }))
                .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0004"), toBn("0.0196"), toBn("-0.02")]);

            expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            expect(await testERC721.ownerOf(1)).to.equal(addr1.address)
        });

        it("should match bid orders successfully", async () => {
            //bid order
            let now = parseInt(new Date() / 1000) + 10000000000
            let salt = 1;
            let nftAddress = testERC721.address;
            let tokenId = 0;
            let buyOrder = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForCollection,
                maker: addr1.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            const orderHash = await testLibOrder.getOrderHash(buyOrder)
            // console.log("orderHash: ", orderHash)

            now = parseInt(new Date() / 1000) + 100000
            salt = 1;
            nftAddress = testERC721.address;
            tokenId = 0;
            let buyOrder2 = {
                side: Side.Bid,
                saleKind: SaleKind.FixedPriceForCollection,
                maker: addr1.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            await expect(await esDex.connect(addr1).makeOrders([buyOrder, buyOrder2], { value: toBn("0.04") }))
                .to.emit(esDex, "LogMake")

            // market sell
            now = parseInt(new Date() / 1000) + 100000
            salt = 2;
            nftAddress = testERC721.address;
            tokenId = 1;
            sellOrder = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            tokenId = 2;
            sellOrder2 = {
                side: Side.List,
                saleKind: SaleKind.FixedPriceForItem,
                maker: owner.address,
                nft: [tokenId, nftAddress, 1],
                price: toBn("0.02"),
                expiry: now,
                salt: salt,
            }

            matchDetail1 = {
                sellOrder: sellOrder,
                buyOrder: buyOrder,
            }
            matchDetail2 = {
                sellOrder: sellOrder2,
                buyOrder: buyOrder2,
            }
            matchDetails = [matchDetail1, matchDetail2]
            // await expect(await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("0.01") }))
            //     .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.0002"), toBn("0.0098"), toBn("-0.01")]);
            // expect(await testERC721.ownerOf(0)).to.equal(addr1.address)

            // tx = await esDex.connect(addr1).matchOrders(matchDetails, { value: toBn("0.01") })
            // txRec = await tx.wait()
            // console.log("txRec: ", txRec.events)
            // console.log("gasUsed: ", txRec.gasUsed.toString())

            successes = await esDex.callStatic.matchOrders(matchDetails)
            // console.log("successes: ", successes)
            expect(successes[0]).to.equal(true)
            expect(successes[1]).to.equal(true)

            await expect(await esDex.matchOrders(matchDetails))
                .to.changeEtherBalances([esDex, owner, esVault], [toBn("0.0008"), toBn("0.0392"), toBn("-0.04")]);

            expect(await testERC721.ownerOf(1)).to.equal(addr1.address)
            expect(await testERC721.ownerOf(2)).to.equal(addr1.address)
        });
    })

    describe("should transfer nft successfully", async () => {
        it("should transfer erc721 successfully", async () => {
            expect(await testERC721.ownerOf(0)).to.equal(owner.address)
            expect(await testERC721.ownerOf(1)).to.equal(owner.address)

            to = addr1.address
            asset1 = [testERC721.address, 0]
            asset2 = [testERC721.address, 1]
            assets = [asset1, asset2]

            await esVault.batchTransferERC721(to, assets)
            expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            expect(await testERC721.ownerOf(1)).to.equal(addr1.address)
        });

    })

    describe("withdraw ETH", async () => {
        it("should withdraw ETH successfully", async () => {
            {
                //list order
                let now = parseInt(new Date() / 1000) + 100000
                let salt = 1;
                let nftAddress = testERC721.address;
                let tokenId = 0;
                let order = {
                    side: Side.List,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: owner.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("1"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.makeOrders([order]))
                    .to.emit(esDex, "LogMake")

                const orderHash = await testLibOrder.getOrderHash(order)
                // console.log("orderHash: ", orderHash)

                // market buy
                now = parseInt(new Date() / 1000) + 100000
                salt = 2;
                nftAddress = testERC721.address;
                tokenId = 0;
                buyOrder = {
                    side: Side.Bid,
                    saleKind: SaleKind.FixedPriceForItem,
                    maker: addr1.address,
                    nft: [tokenId, nftAddress, 1],
                    price: toBn("2"),
                    expiry: now,
                    salt: salt,
                }

                await expect(await esDex.connect(addr1).matchOrder(order, buyOrder, { value: toBn("3") }))
                    .to.changeEtherBalances([esDex, owner, addr1], [toBn("0.02"), toBn("0.98"), toBn("-1")]);
                expect(await testERC721.ownerOf(0)).to.equal(addr1.address)
            }

            await expect(await esDex.withdrawETH(owner.address, toBn("0.02")))
                .to.changeEtherBalances([esDex, owner], [toBn("-0.02"), toBn("0.02")])
        })
    })
})
