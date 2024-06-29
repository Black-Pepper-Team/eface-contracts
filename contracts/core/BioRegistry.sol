// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {AccountFactory} from "./AccountFactory.sol";

import {State} from "../iden3/State.sol";

import {IBioRegistry} from "../interfaces/IBioRegistry.sol";

/**
 * @title BioRegistry
 * @notice Manages biometric data and user identities.
 */
contract BioRegistry is IBioRegistry, UUPSUpgradeable, OwnableUpgradeable {
    State public stateContract;

    AccountFactory public accountFactory;

    mapping(string => bool) private _isUUIDRegistered;

    mapping(string => address) private _userAccountByUUID;

    mapping(uint256 => mapping(string => BiometricData)) private _biometricDataByUUID;

    mapping(uint256 => mapping(address => string)) private _metadataByUser;

    mapping(uint256 => mapping(bytes => mapping(address => string))) private _metadataByFAndUser;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;

    /**
     * @dev Restricts function access to the account factory.
     */
    modifier onlyAccountFactory() {
        require(msg.sender == address(accountFactory), "BioRegistry: caller is not the factory");
        _;
    }

    /**
     * @dev Disables initializer functions to prevent direct contract initialization.
     */
    constructor() {
        _disableInitializers();
    }

    function __BioRegistry_init(
        State stateContract_,
        AccountFactory accountFactory_
    ) external initializer {
        __Ownable_init();

        stateContract = stateContract_;
        accountFactory = accountFactory_;
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function registerAccount(string memory uuid_, address account_) external onlyAccountFactory {
        require(_isUUIDRegistered[uuid_], "BioRegistry: UUID not registered");
        require(
            _userAccountByUUID[uuid_] == address(0),
            "BioRegistry: Account already registered"
        );

        _userAccountByUUID[uuid_] = account_;
    }

    /**
     * @dev Changes the state of a user's identity and records their biometric data.
     * @param id_ User identity identifier.
     * @param oldState_ Previous identity state.
     * @param newState_ New identity state.
     * @param isOldStateGenesis_ Indicates if the previous state is the genesis state.
     * @param a_ First part of the ZKP proof.
     * @param b_ Second part of the ZKP proof.
     * @param c_ Third part of the ZKP proof.
     * @param biometricData_ Array of biometric data.
     */
    function transitStateAndBiometricData(
        uint256 id_,
        uint256 oldState_,
        uint256 newState_,
        bool isOldStateGenesis_,
        uint256[2] memory a_,
        uint256[2][2] memory b_,
        uint256[2] memory c_,
        IBioRegistry.BiometricData[] memory biometricData_
    ) external {
        stateContract.transitState(id_, oldState_, newState_, isOldStateGenesis_, a_, b_, c_);

        uint256 arrayLength_ = biometricData_.length;
        for (uint256 i = 0; i < arrayLength_; ++i) {
            _saveBiometricData(id_, biometricData_[i]);
        }
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function getUserByUUID(
        uint256 issuerId_,
        string memory uuid_
    ) external view returns (BiometricData memory) {
        return _biometricDataByUUID[issuerId_][uuid_];
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function getUserAccountByUUID(string memory uuid_) external view returns (address) {
        return _userAccountByUUID[uuid_];
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function getMetadataByUser(
        uint256 issuerId_,
        address userAddress_
    ) external view returns (string memory) {
        return _metadataByUser[issuerId_][userAddress_];
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function getMetadataByFAndUser(
        uint256 issuerId_,
        bytes memory biometricInfo_,
        address userAddress_
    ) external view returns (string memory) {
        return _metadataByFAndUser[issuerId_][biometricInfo_][userAddress_];
    }

    /**
     * @inheritdoc IBioRegistry
     */
    function isUUIDRegistered(string memory uuid_) external view returns (bool) {
        return _isUUIDRegistered[uuid_];
    }

    function _saveBiometricData(uint256 issuerId_, BiometricData memory biometricData_) private {
        _isUUIDRegistered[biometricData_.uuid] = true;
        _biometricDataByUUID[issuerId_][biometricData_.uuid] = biometricData_;
        _metadataByUser[issuerId_][biometricData_.userAddress] = biometricData_.userMetadata;
        _metadataByFAndUser[issuerId_][biometricData_.biometricInfo][
            biometricData_.userAddress
        ] = biometricData_.userMetadata;
        _userAccountByUUID[biometricData_.uuid] = biometricData_.userAddress;
    }

    // A functionality to upgrade the contract

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return _getImplementation();
    }
}
