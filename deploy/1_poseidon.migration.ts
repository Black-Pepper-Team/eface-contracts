import { Deployer } from "@solarity/hardhat-migrate";

import { deployPoseidons } from "@deploy-helper";

import { PoseidonFacade__factory, SpongePoseidon__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  await deployPoseidons(
    deployer,
    new Array(6).fill(6).map((_, i) => i + 1),
  );

  await deployer.deploy(SpongePoseidon__factory);
  await deployer.deploy(PoseidonFacade__factory);
};
