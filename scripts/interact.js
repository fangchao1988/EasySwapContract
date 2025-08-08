const { ethers, upgrades } = require("hardhat")
const { Side, SaleKind } = require("../test/common")
const { toBn } = require("evm-bn")

/**  * 2024/12/22 in sepolia testnet
 * esVault contract deployed to: 0x75EC7448bC37c1FB484520C45b40F1564eBd0d19
     esVault ImplementationAddress: 
     esVault AdminAddress: 
   esDex contract deployed to: 0x5560e1c2E0260c2274e400d80C30CDC4B92dC8ac
      esDex ImplementationAddress: 
      esDex AdminAddress: 
 */

const esDex_name = "EasySwapOrderBook";
const esDex_address = "0x62Cc034a3461edE7D627ABe32804fA9074F7d978"

const esVault_name = "EasySwapVault";
const esVault_address = "0xAD203639Ea6A02ffe3a0b6c08f7169EE182e041f"

const erc721_name = "TestERC721"
const erc721_address = "0x5852043AeEeD5C32748516532Ee2e21563f865dA"

let esDex, esVault, testERC721
let deployer
async function main() {
    [deployer, trader] = await ethers.getSigners()
    console.log("deployer: ", deployer.address)
    console.log("trader: ", trader.address)

    esDex = await (
        await ethers.getContractFactory(esDex_name)
    ).attach(esDex_address)

    esVault = await (
        await ethers.getContractFactory(esVault_name)
    ).attach(esVault_address)

    testERC721 = await (
        await ethers.getContractFactory(erc721_name)
    ).attach(erc721_address)


    // 1. setApprovalForAll
    await approvalForVault();

    // 2. make order
    // await testMakeOrder();

    // for (let i = 1; i < 20; i++) {
    //     await testMakeOrder(i);
    // }


    // 3. cancel order
    // let orderKeys = [];
    // await testCancelOrder(orderKeys);

    // let orderKeys1 = ["0xa3cbd061a6f3581b5506c285e5321bf3b03e37cdc817c94ad72fd3e4cf67934f"]
    // let orderKeys2 = ["0x2f01e4ef5cbea217934b2bb27a73fac35032a75ffb030dea41fdb995c55f3069",
    //     "0x3450ada942fc2595d7d12bd6385cf3f1b03a614b9076bb23adaf808205e49d3b"]

    // await testCancelOrder(orderKeys1);
    // await testCancelOrder(orderKeys2);


    // 4. match order 
    // await testMatchOrder();

    let orderKeys = ["0x7c6165ea00e164d49d602ef7a23dda15709420a1d4ce535616cd686c336c1bf0"];

    for (let i = 0; i < 2; i++) {
        let info = await getOrderInfo(orderKeys[i]);
        let sellOrder = info.order;
        console.log("sellOrder: ", sellOrder);
        let buyOrder = {
            side: Side.Bid,
            saleKind: SaleKind.FixedPriceForItem,
            maker: trader.address,
            nft: sellOrder.nft,
            price: sellOrder.price,
            expiry: sellOrder.expiry,
            salt: sellOrder.salt,
        }

        let tx = await esDex.connect(trader).matchOrder(sellOrder, buyOrder, { value: toBn("0.002") });
        let txRec = await tx.wait();
        console.log("matchOrder tx: ", tx.hash);
    }

    // 5. else
    // await withdrawProtocolFee();
    // await testBatchTransferERC721();
}

async function approvalForVault() {
    // check is approved
    let isApproved = await testERC721.isApprovedForAll(deployer.address, esVault_address);

    if (isApproved) {
        console.log("Already approved");
        return;
    }

    let tx = await testERC721.setApprovalForAll(esVault_address, true);
    await tx.wait();
    console.log("Approval tx:", tx.hash)
}

async function testMakeOrder(tokenId = 0) {
    let now = parseInt(new Date() / 1000) + 100000
    let salt = 1;
    let nftAddress = erc721_address;
    // let tokenId = 0;
    let order = {
        side: Side.List,
        saleKind: SaleKind.FixedPriceForItem,
        maker: deployer.address,
        nft: [tokenId, nftAddress, 1],
        price: toBn("0.002"),
        expiry: now,
        salt: salt,
    }

    tx = await esDex.makeOrders([order]);
    txRec = await tx.wait();
    console.log(tx.hash);
}

async function testCancelOrder(orderKeys) {
    tx = await esDex.cancelOrders(orderKeys);
    txRec = await tx.wait();
    console.log(txRec);
}

async function testMatchOrder() {
    let now = 1734937947;
    let salt = 1;
    let tokenId = 0;
    let nftAddress = erc721_address;

    let sellOrder = {
        side: Side.List,
        saleKind: SaleKind.FixedPriceForItem,
        maker: deployer.address,
        nft: [tokenId, nftAddress, 1],
        price: toBn("0.002"),
        expiry: now,
        salt: salt,
    }

    // tx = await esDex.makeOrders([sellOrder]);
    // txRec = await tx.wait();
    // console.log("sellOrder tx: ", tx.hash);

    // ====
    let buyOrder = {
        side: Side.Bid,
        saleKind: SaleKind.FixedPriceForCollection,
        maker: trader.address,
        nft: [tokenId, nftAddress, 1],
        price: toBn("0.002"),
        expiry: now,
        salt: salt,
    }

    tx = await esDex.connect(trader).matchOrder(sellOrder, buyOrder, { value: toBn("0.002") });
    txRec = await tx.wait();
    console.log("matchOrder tx: ", txRec.hash);
}

async function testBatchTransferERC721() {
    toAddr = "0x7752A564c941f7145AdF8B50AA2eC975cEf58689"
    nftAddr = "0x3c8ac104dcbf03ae12c9ac80aa830e1b39609e97"
    tokenId = 1159
    asset = [nftAddr, tokenId]
    assets = [asset]
    tx = await esVault.callStatic.batchTransferERC721(toAddr, assets);
    console.log("tx: ", tx);
}

async function getOrderInfo(orderKey) {
    orderInfo = await esDex.orders(orderKey);
    // console.log("orderInfo: ", orderInfo);
    return orderInfo;
}

async function getfillsStat(orderKey) {
    fillStat = await esDex.filledAmount(orderKey);
    // console.log(fillStat);
    return fillStat;
}

async function withdrawProtocolFee() {
    await esDex.withdrawETH(deployer.address, toBn("0.00011"), { gasLimit: 100000 });
    console.log("WithdrawETH succeed.");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
