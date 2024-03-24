import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { getPoseidon, Reverter } from "@test-helpers";

import { State } from "@ethers-v6";
import { deepClone } from "@scripts";

describe.skip("State", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let USER: SignerWithAddress;

  let state: State;

  const ISSUER_ID = 1;
  const UUID = "UUID";

  const DEFAULT_STATE_TRANSITION_PARAMS = {
    id: 1,
    oldState: 1,
    newState: 1,
    isOldStateGenesis: true,
    a: [0n, 0n],
    b: [
      [0n, 0n],
      [0n, 0n],
    ],
    c: [0n, 0n],
  };

  before("setup", async () => {
    [OWNER, USER] = await ethers.getSigners();

    const SmtLib = await ethers.getContractFactory("SmtLib", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const smtLib = await SmtLib.deploy();

    const StateLib = await ethers.getContractFactory("StateLib");
    const stateLib = await StateLib.deploy();

    const State = await ethers.getContractFactory("State", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        SmtLib: await smtLib.getAddress(),
        StateLib: await stateLib.getAddress(),
      },
    });
    state = await State.deploy();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    let deployedProxy = await Proxy.deploy(await state.getAddress(), "0x");

    state = State.attach(await deployedProxy.getAddress()) as State;

    await state.__State_init(ethers.ZeroAddress);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#access", () => {
    it("should not initialize the contract twice", async () => {
      await expect(state.__State_init(ethers.ZeroAddress)).to.be.eventually.rejected;
    });

    it("should revert if trying to set verifier address by not owner", async () => {
      await expect(state.connect(USER).setVerifier(OWNER.address)).to.be.eventually.rejected;

      await state.setVerifier(OWNER.address);
    });
  });

  describe("#stateTransition", () => {
    it("should revert if trying to transit state with zero ID", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);
      stateTransitionParams.id = 0;

      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("ID should not be zero");
    });

    it("should revert if trying to transit state with zero new state", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);
      stateTransitionParams.newState = 0;

      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("New state should not be zero");
    });

    it("should revert if trying to transit state with existing new state", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);

      await state.transitState(
        stateTransitionParams.id,
        stateTransitionParams.oldState,
        stateTransitionParams.newState,
        stateTransitionParams.isOldStateGenesis,
        [stateTransitionParams.a[0], stateTransitionParams.a[1]],
        [
          [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
          [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
        ],
        [stateTransitionParams.c[0], stateTransitionParams.c[1]],
      );

      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("New state already exists");
    });

    it("should revert if trying to transit state with non-existing old state", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);
      stateTransitionParams.isOldStateGenesis = false;

      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("Old state is not genesis but identity does not yet exist");
    });

    it("should revert if trying to transit genesis state with existing identity", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);
      stateTransitionParams.isOldStateGenesis = true;

      await state.transitState(
        stateTransitionParams.id,
        stateTransitionParams.oldState,
        stateTransitionParams.newState,
        stateTransitionParams.isOldStateGenesis,
        [stateTransitionParams.a[0], stateTransitionParams.a[1]],
        [
          [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
          [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
        ],
        [stateTransitionParams.c[0], stateTransitionParams.c[1]],
      );

      stateTransitionParams.newState = 2;
      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("Old state is genesis but identity already exists");
    });

    it("should revert if trying to transit state with invalid old state", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);

      await state.transitState(
        stateTransitionParams.id,
        stateTransitionParams.oldState,
        stateTransitionParams.newState,
        stateTransitionParams.isOldStateGenesis,
        [stateTransitionParams.a[0], stateTransitionParams.a[1]],
        [
          [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
          [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
        ],
        [stateTransitionParams.c[0], stateTransitionParams.c[1]],
      );

      stateTransitionParams.newState = 2;
      stateTransitionParams.oldState = 2;
      stateTransitionParams.isOldStateGenesis = false;
      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("Old state does not match the latest state");
    });

    it.skip("should revert if trying to transit state with invalid proof", async () => {
      const stateTransitionParams = deepClone(DEFAULT_STATE_TRANSITION_PARAMS);

      stateTransitionParams.a[0] = 0n;
      await expect(
        state.transitState(
          stateTransitionParams.id,
          stateTransitionParams.oldState,
          stateTransitionParams.newState,
          stateTransitionParams.isOldStateGenesis,
          [stateTransitionParams.a[0], stateTransitionParams.a[1]],
          [
            [stateTransitionParams.b[0][0], stateTransitionParams.b[0][1]],
            [stateTransitionParams.b[1][0], stateTransitionParams.b[1][1]],
          ],
          [stateTransitionParams.c[0], stateTransitionParams.c[1]],
        ),
      ).to.be.rejectedWith("Zero-knowledge proof of state transition is not valid");
    });
  });

  describe("#getters", () => {
    beforeEach("setup", async () => {
      await state.transitState(
        ISSUER_ID,
        0,
        1,
        true,
        [0n, 0n],
        [
          [0n, 0n],
          [0n, 0n],
        ],
        [0n, 0n],
      );
    });

    it("should return verifier address", async () => {
      expect(await state.getVerifier()).to.be.equal(ethers.ZeroAddress);
    });

    it("should return state info by id", async () => {
      const stateInfo = await state.getStateInfoById(ISSUER_ID);

      expect(stateInfo.id).to.be.equal(ISSUER_ID);
      expect(stateInfo.state).to.be.equal(1);
    });

    it("should return state history length by id", async () => {
      expect(await state.getStateInfoHistoryLengthById(ISSUER_ID)).to.be.equal(2);
    });

    it("should return state history by id", async () => {
      const stateInfos = await state.getStateInfoHistoryById(ISSUER_ID, 0, 1);

      expect(stateInfos.length).to.be.equal(1);
      expect(stateInfos[0].id).to.be.equal(ISSUER_ID);
      expect(stateInfos[0].state).to.be.equal(0);
    });

    it("should return state info by id and state", async () => {
      const stateInfo = await state.getStateInfoByIdAndState(ISSUER_ID, 1);

      expect(stateInfo.id).to.be.equal(ISSUER_ID);
      expect(stateInfo.state).to.be.equal(1);
    });

    it("should return GIST proof", async () => {
      const gistProof = await state.getGISTProof(ISSUER_ID);

      expect(gistProof.root).to.be.equal(
        15566112709755133066494192905153829276622605225840614389854486777848253051691n,
      );
    });

    it("should return GIST proof by root", async () => {
      const gistProof = await state.getGISTProofByRoot(ISSUER_ID, 0n);

      expect(gistProof.root).to.be.equal(0n);
    });

    it("should return GIST proof by block", async () => {
      const gistProof = await state.getGISTProofByBlock(ISSUER_ID, 0);

      expect(gistProof.root).to.be.equal(0n);
    });

    it("should return GIST proof by time", async () => {
      const gistProof = await state.getGISTProofByTime(ISSUER_ID, 0);

      expect(gistProof.root).to.be.equal(0n);
    });

    it("should return GIST root", async () => {
      expect(await state.getGISTRoot()).to.be.equal(
        15566112709755133066494192905153829276622605225840614389854486777848253051691n,
      );
    });

    it("should return GIST root history", async () => {
      const gistRootInfos = await state.getGISTRootHistory(0, 1);

      expect(gistRootInfos.length).to.be.equal(1);
      expect(gistRootInfos[0].root).to.be.equal(0n);
    });

    it("should return GIST root history length", async () => {
      expect(await state.getGISTRootHistoryLength()).to.be.equal(2);
    });

    it("should return GIST root info", async () => {
      const gistRootInfo = await state.getGISTRootInfo(0n);

      expect(gistRootInfo.root).to.be.equal(0n);
    });

    it("should return GIST root info by block", async () => {
      const gistRootInfo = await state.getGISTRootInfoByBlock(0);

      expect(gistRootInfo.root).to.be.equal(0n);
    });

    it("should return GIST root info by time", async () => {
      const gistRootInfo = await state.getGISTRootInfoByTime(0);

      expect(gistRootInfo.root).to.be.equal(0n);
    });

    it("should return true if identity exists", async () => {
      expect(await state.idExists(ISSUER_ID)).to.be.true;
    });

    it("should return true if state exists", async () => {
      expect(await state.stateExists(ISSUER_ID, 1)).to.be.true;
    });
  });
});
