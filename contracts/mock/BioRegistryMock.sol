// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {AccountFactory} from "../core/AccountFactory.sol";

import {State} from "../iden3/State.sol";

import {IBioRegistry} from "../interfaces/IBioRegistry.sol";

/**
 * @title BioRegistry Mock
 */
contract BioRegistryMock is IBioRegistry {
    AccountFactory public accountFactory;

    mapping(string => bool) private _isUUIDRegistered;

    mapping(string => address) private _userAccountByUUID;

    mapping(uint256 => mapping(string => BiometricData)) private _biometricDataByUUID;

    mapping(address => string) private _metadataByUser;

    mapping(bytes => mapping(address => string)) private _metadataByFAndUser;

    modifier onlyAccountFactory() {
        require(msg.sender == address(accountFactory), "BioRegistry: Only AccountFactory");
        _;
    }

    constructor(AccountFactory accountFactory_) {
        accountFactory = accountFactory_;
    }

    function registerAccount(string memory uuid_, address account_) external onlyAccountFactory {
        require(_isUUIDRegistered[uuid_], "BioRegistry: UUID not registered");
        require(
            _userAccountByUUID[uuid_] == address(0),
            "BioRegistry: Account already registered"
        );

        _userAccountByUUID[uuid_] = account_;
    }

    function saveBiometricDataMock(
        uint256 issuerId_,
        BiometricData memory biometricData_
    ) external {
        _isUUIDRegistered[biometricData_.uuid] = true;
        _biometricDataByUUID[issuerId_][biometricData_.uuid] = biometricData_;
        _metadataByUser[biometricData_.userAddress] = biometricData_.userMetadata;
        _metadataByFAndUser[biometricData_.biometricInfo][
            biometricData_.userAddress
        ] = biometricData_.userMetadata;
    }

    function getUserByUUID(
        uint256 issuerId_,
        string memory uuid_
    ) external view returns (BiometricData memory) {
        return _biometricDataByUUID[issuerId_][uuid_];
    }

    function getUserAccountByUUID(string memory uuid_) external view returns (address) {
        return _userAccountByUUID[uuid_];
    }

    function getMetadataByUser(
        uint256,
        address userAddress_
    ) external view returns (string memory) {
        return _metadataByUser[userAddress_];
    }

    function getMetadataByFAndUser(
        uint256,
        bytes memory biometricInfo_,
        address userAddress_
    ) external view returns (string memory) {
        return _metadataByFAndUser[biometricInfo_][userAddress_];
    }

    function isUUIDRegistered(string memory uuid_) external view returns (bool) {
        return _isUUIDRegistered[uuid_];
    }
}
