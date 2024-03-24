import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@test-helpers";

import { AccountFactory, BioRegistryMock } from "@ethers-v6";

describe("AccountFactory", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER: SignerWithAddress;

  let accountFactory: AccountFactory;
  let bioRegistryMock: BioRegistryMock;

  const ISSUER_ID = 1;
  const UUID = "UUID";

  before("setup", async () => {
    [OWNER, USER] = await ethers.getSigners();

    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    accountFactory = await AccountFactory.deploy();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    let deployedProxy = await Proxy.deploy(await accountFactory.getAddress(), "0x");

    accountFactory = AccountFactory.attach(await deployedProxy.getAddress()) as AccountFactory;

    const BioRegistry = await ethers.getContractFactory("BioRegistryMock");
    bioRegistryMock = await BioRegistry.deploy(await accountFactory.getAddress());

    const Account = await ethers.getContractFactory("Account");
    const account = await Account.deploy();

    await accountFactory.__AccountFactory_init(await bioRegistryMock.getAddress(), await account.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#access", () => {
    it("should not initialize the contract twice", async () => {
      await expect(accountFactory.__AccountFactory_init(await bioRegistryMock.getAddress(), ethers.ZeroAddress)).to.be
        .eventually.rejected;
    });
  });

  describe("#account creation", () => {
    it("should set new implementation for the account only by the owner", async () => {
      const Account = await ethers.getContractFactory("Account");
      const newImplementation = await Account.deploy();

      await expect(
        accountFactory.connect(USER).setAccountImplementation(await newImplementation.getAddress()),
      ).to.be.rejectedWith("Ownable: caller is not the owner");

      await accountFactory.connect(OWNER).setAccountImplementation(await newImplementation.getAddress());

      expect(await accountFactory.accountImplementation()).to.be.equal(await newImplementation.getAddress());
    });

    it("should create account and predict its address", async () => {
      await bioRegistryMock.saveBiometricDataMock(ISSUER_ID, {
        uuid: UUID,
        userAddress: USER.address,
        biometricInfo: "0x",
        userMetadata: "metadata",
      });

      const predictedAccountAddress = await accountFactory.predictAccountAddress(
        UUID,
        [ISSUER_ID],
        1,
        USER.address,
        ethers.ZeroHash,
      );

      await expect(accountFactory.connect(USER).createAccountWithSalt(UUID, [ISSUER_ID], 1, ethers.ZeroHash))
        .to.emit(accountFactory, "AccountCreated")
        .withArgs(UUID, predictedAccountAddress);
    });

    it("should revert if trying to create account by not account owner", async () => {
      await bioRegistryMock.saveBiometricDataMock(ISSUER_ID, {
        uuid: UUID,
        userAddress: USER.address,
        biometricInfo: "0x",
        userMetadata: "metadata",
      });

      await expect(
        accountFactory.connect(OWNER).createAccountWithSalt(UUID, [ISSUER_ID], 1, ethers.ZeroHash),
      ).to.be.rejectedWith("AccountFactory: Account can be created only by user that is set in trusted issuers");
    });
  });

  describe("#upgradeImpleemntation", () => {
    it("should upgrade the implementation only by the owner", async () => {
      const AccountFactory = await ethers.getContractFactory("AccountFactory");
      const newImplementation = await AccountFactory.deploy();

      await expect(accountFactory.connect(USER).upgradeTo(await newImplementation.getAddress())).to.be.rejectedWith(
        "Ownable: caller is not the owner",
      );

      await accountFactory.connect(OWNER).upgradeTo(await newImplementation.getAddress());

      expect(await accountFactory.implementation()).to.be.equal(await newImplementation.getAddress());
    });
  });
});
