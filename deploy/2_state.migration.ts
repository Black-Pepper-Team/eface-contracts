import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { ERC1967Proxy__factory, Groth16Verifier__factory, State__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  let state = await deployer.deploy(State__factory);
  const stateProxy = await deployer.deploy(ERC1967Proxy__factory, [await state.getAddress(), "0x"], {
    name: "State",
  });

  state = await deployer.deployed(State__factory, await stateProxy.getAddress());

  const verifier = await deployer.deploy(Groth16Verifier__factory);

  await state.__State_init(await verifier.getAddress());

  Reporter.reportContracts(["State Proxy", await stateProxy.getAddress()]);
};
