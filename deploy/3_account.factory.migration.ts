import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  Account__factory,
  AccountFactory__factory,
  BioRegistry__factory,
  ERC1967Proxy__factory,
  Groth16Verifier__factory,
  State__factory,
} from "@ethers-v6";

export = async (deployer: Deployer) => {
  let accountImplementation = await deployer.deploy(Account__factory);

  let accountFactory = await deployer.deploy(AccountFactory__factory);
  const accountFactoryProxy = await deployer.deploy(ERC1967Proxy__factory, [await accountFactory.getAddress(), "0x"], {
    name: "AccountFactory",
  });

  accountFactory = await deployer.deployed(AccountFactory__factory, await accountFactoryProxy.getAddress());

  let bioRegistry = await deployer.deploy(BioRegistry__factory);
  const bioRegistryProxy = await deployer.deploy(ERC1967Proxy__factory, [await bioRegistry.getAddress(), "0x"], {
    name: "BioRegistry",
  });

  bioRegistry = await deployer.deployed(BioRegistry__factory, await bioRegistryProxy.getAddress());

  const state = await deployer.deployed(State__factory, "State");

  await bioRegistry.__BioRegistry_init(await state.getAddress(), await accountFactory.getAddress());
  await accountFactory.__AccountFactory_init(
    await bioRegistryProxy.getAddress(),
    await accountImplementation.getAddress(),
  );

  Reporter.reportContracts(
    ["Account Implementation", await accountImplementation.getAddress()],
    ["Account Factory", await accountFactory.getAddress()],
    ["Bio Registry", await bioRegistry.getAddress()],
  );
};
