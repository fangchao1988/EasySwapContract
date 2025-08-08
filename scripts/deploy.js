const { ethers, upgrades } = require("hardhat")

/**  * 2024/12/22 in sepolia testnet
 * esVault contract deployed to: 0xAD203639Ea6A02ffe3a0b6c08f7169EE182e041f
     esVault ImplementationAddress: 
     esVault AdminAddress: 
   esDex contract deployed to: 0x62Cc034a3461edE7D627ABe32804fA9074F7d978
      esDex ImplementationAddress: 
      esDex AdminAddress: 
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("deployer: ", deployer.address)

  // let esVault = await ethers.getContractFactory("EasySwapVault")
  // esVault = await upgrades.deployProxy(esVault, { initializer: 'initialize' });
  // await esVault.deployed()
  // console.log("esVault contract deployed to:", esVault.address)
  // console.log(await upgrades.erc1967.getImplementationAddress(esVault.address), " esVault getImplementationAddress")
  // console.log(await upgrades.erc1967.getAdminAddress(esVault.address), " esVault getAdminAddress")

  // newProtocolShare = 200;
  // newESVault = "0xAD203639Ea6A02ffe3a0b6c08f7169EE182e041f";
  // EIP712Name = "EasySwapOrderBook";
  // EIP712Version = "1";
  // let esDex = await ethers.getContractFactory("EasySwapOrderBook")
  // esDex = await upgrades.deployProxy(esDex, [newProtocolShare, newESVault, EIP712Name, EIP712Version], { initializer: 'initialize' });
  // await esDex.deployed()
  // console.log("esDex contract deployed to:", esDex.address)
  // console.log(await upgrades.erc1967.getImplementationAddress(esDex.address), " esDex getImplementationAddress")
  // console.log(await upgrades.erc1967.getAdminAddress(esDex.address), " esDex getAdminAddress")

  // esDexAddress = "0x62Cc034a3461edE7D627ABe32804fA9074F7d978"
  // esVaultAddress = "0xAD203639Ea6A02ffe3a0b6c08f7169EE182e041f"
  // const esVault = await (
  //   await ethers.getContractFactory("EasySwapVault")
  // ).attach(esVaultAddress)
  // tx = await esVault.setOrderBook(esDexAddress)
  // await tx.wait()
  // console.log("esVault setOrderBook tx:", tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
