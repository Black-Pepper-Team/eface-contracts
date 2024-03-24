import { expect } from "chai";
import { ethers } from "hardhat";

import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@test-helpers";

import { Account, BioRegistryMock, ERC20Mock } from "@ethers-v6";

describe("Account", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER: SignerWithAddress;
  let FACTORY: SignerWithAddress;

  let erc20: ERC20Mock;
  let account: Account;
  let bioRegistryMock: BioRegistryMock;

  const ISSUER_ID = 1;
  const UUID = "UUID";

  before("setup", async () => {
    [OWNER, USER, FACTORY] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    erc20 = await ERC20.deploy("Test Token", "TT", 18);

    const BioRegistry = await ethers.getContractFactory("BioRegistryMock");
    bioRegistryMock = await BioRegistry.deploy(FACTORY.address);

    const Account = await ethers.getContractFactory("Account");
    account = await Account.deploy();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const deployedProxy = await Proxy.deploy(await account.getAddress(), "0x");

    account = Account.attach(await deployedProxy.getAddress()) as Account;

    await account.__Account_init(await bioRegistryMock.getAddress(), UUID, [ISSUER_ID], 1);

    await bioRegistryMock.saveBiometricDataMock(ISSUER_ID, {
      uuid: UUID,
      userAddress: USER.address,
      biometricInfo: "0x",
      userMetadata: "metadata",
    });
    await bioRegistryMock.connect(FACTORY).registerAccount(UUID, await account.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#access", () => {
    it("should not initialize the contract twice", async () => {
      await expect(account.__Account_init(await bioRegistryMock.getAddress(), UUID, [ISSUER_ID], 1)).to.be.rejectedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("should revert if threshold is not reached when trying to call protected function", async () => {
      await account.connect(USER).setThreshold(2);

      await expect(account.connect(USER).transfer(10n, OWNER.address)).to.be.rejectedWith("Account: unauthorized");

      await expect(
        account.connect(USER).transferERC20(await erc20.getAddress(), 10n, OWNER.address),
      ).to.be.rejectedWith("Account: unauthorized");

      await expect(account.connect(USER).arbitraryCall(OWNER.address, "0x")).to.be.rejectedWith(
        "Account: unauthorized",
      );

      await expect(account.connect(USER).setThreshold(1)).to.be.rejectedWith("Account: unauthorized");
    });
  });

  describe("#transfers/calls", () => {
    it("should transfer if threshold is reached", async () => {
      await setBalance(await account.getAddress(), 10n);

      const ownerBalanceBefore = await ethers.provider.getBalance(OWNER.address);

      await account.connect(USER).transfer(10n, OWNER.address);

      expect(await ethers.provider.getBalance(await account.getAddress())).to.equal(0n);
      expect(await ethers.provider.getBalance(OWNER.address)).to.equal(ownerBalanceBefore + 10n);
    });

    it("should transfer ERC20 if threshold is reached", async () => {
      await erc20.mint(await account.getAddress(), 10n);

      const ownerBalanceBefore = await erc20.balanceOf(OWNER.address);

      await account.connect(USER).transferERC20(await erc20.getAddress(), 10n, OWNER.address);

      expect(await erc20.balanceOf(await account.getAddress())).to.equal(0n);
      expect(await erc20.balanceOf(OWNER.address)).to.equal(ownerBalanceBefore + 10n);
    });

    it("should call arbitrary function if threshold is reached", async () => {
      await erc20.mint(await account.getAddress(), 10n);

      const ownerBalanceBefore = await erc20.balanceOf(OWNER.address);

      const data = erc20.interface.encodeFunctionData("transfer", [OWNER.address, 10n]);

      await account.connect(USER).arbitraryCall(await erc20.getAddress(), data);

      expect(await erc20.balanceOf(await account.getAddress())).to.equal(0n);
      expect(await erc20.balanceOf(OWNER.address)).to.equal(ownerBalanceBefore + 10n);
    });
  });

  describe("#upgradeImpleemntation", () => {
    it("should upgrade the implementation only by the owner", async () => {
      const Account = await ethers.getContractFactory("Account");
      const newImplementation = await Account.deploy();

      await expect(account.connect(OWNER).upgradeTo(await newImplementation.getAddress())).to.be.rejectedWith(
        "Account: unauthorized",
      );

      await account.connect(USER).upgradeTo(await newImplementation.getAddress());

      expect(await account.implementation()).to.be.equal(await newImplementation.getAddress());
    });
  });

  describe("#getters", () => {
    it("should return trusted issuers", async () => {
      expect(await account.getTrustedIssuers()).to.deep.equal([ISSUER_ID]);
    });
  });
});
