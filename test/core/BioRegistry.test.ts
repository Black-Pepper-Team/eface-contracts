import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@test-helpers";

import { BioRegistry } from "@ethers-v6";

describe("BioRegistry", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER: SignerWithAddress;
  let MOCK_STATE: SignerWithAddress;
  let FACTORY: SignerWithAddress;
  let MOCK_ACCOUNT: SignerWithAddress;

  let bioRegistry: BioRegistry;

  const ISSUER_ID = 1;
  const UUID = "UUID";

  before("setup", async () => {
    [OWNER, USER, MOCK_STATE, FACTORY, MOCK_ACCOUNT] = await ethers.getSigners();

    const BioRegistry = await ethers.getContractFactory("BioRegistry");
    bioRegistry = await BioRegistry.deploy();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    let deployedProxy = await Proxy.deploy(await bioRegistry.getAddress(), "0x");

    bioRegistry = BioRegistry.attach(await deployedProxy.getAddress()) as BioRegistry;

    await bioRegistry.__BioRegistry_init(MOCK_STATE.address, FACTORY.address);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  const saveBiometricData = async () => {
    await bioRegistry.transitStateAndBiometricData(
      ISSUER_ID,
      0,
      0,
      false,
      [0, 0],
      [
        [0, 0],
        [0, 0],
      ],
      [0, 0],
      [
        {
          uuid: UUID,
          userAddress: USER.address,
          biometricInfo: "0x",
          userMetadata: "metadata",
        },
      ],
    );
  };

  describe("#access", () => {
    it("should not initialize the contract twice", async () => {
      await expect(bioRegistry.__BioRegistry_init(MOCK_STATE.address, FACTORY.address)).to.be.eventually.rejected;
    });
  });

  describe("#registerAccount", () => {
    it("should revert if trying to register account by non-factory", async () => {
      await expect(bioRegistry.connect(USER).registerAccount(UUID, USER.address)).to.be.rejectedWith(
        "BioRegistry: caller is not the factory",
      );
    });

    it("should revert if trying to register account with un-existing UUID", async () => {
      await expect(bioRegistry.connect(FACTORY).registerAccount("un-existing-uuid", USER.address)).to.be.rejectedWith(
        "BioRegistry: UUID not registered",
      );
    });

    it.skip("should register an account and revert if trying to register the same account", async () => {
      await saveBiometricData();

      expect(await bioRegistry.getUserAccountByUUID(UUID)).to.be.equal(ethers.ZeroAddress);

      await bioRegistry.connect(FACTORY).registerAccount(UUID, MOCK_ACCOUNT.address);

      expect(await bioRegistry.getUserAccountByUUID(UUID)).to.be.equal(MOCK_ACCOUNT.address);

      await expect(bioRegistry.connect(FACTORY).registerAccount(UUID, USER.address)).to.be.rejectedWith(
        "BioRegistry: Account already registered",
      );
    });
  });

  describe("#getters", () => {
    it.skip("should return correct information", async () => {
      expect(await bioRegistry.isUUIDRegistered(UUID)).to.be.false;

      await saveBiometricData();

      expect(await bioRegistry.isUUIDRegistered(UUID)).to.be.true;
      expect(await bioRegistry.getUserByUUID(ISSUER_ID, UUID)).to.be.deep.equal([UUID, USER.address, "0x", "metadata"]);
      expect(await bioRegistry.getUserAccountByUUID(UUID)).to.be.equal(ethers.ZeroAddress);
      expect(await bioRegistry.getMetadataByUser(ISSUER_ID, USER.address)).to.be.equal("metadata");
      expect(await bioRegistry.getMetadataByFAndUser(ISSUER_ID, "0x", USER.address)).to.be.equal("metadata");
    });
  });

  describe("#upgradeImpleemntation", () => {
    it("should upgrade the implementation only by the owner", async () => {
      const BioRegistry = await ethers.getContractFactory("BioRegistry");
      const newImplementation = await BioRegistry.deploy();

      await expect(bioRegistry.connect(USER).upgradeTo(await newImplementation.getAddress())).to.be.rejectedWith(
        "Ownable: caller is not the owner",
      );

      await bioRegistry.connect(OWNER).upgradeTo(await newImplementation.getAddress());

      expect(await bioRegistry.implementation()).to.be.equal(await newImplementation.getAddress());
    });
  });
});
