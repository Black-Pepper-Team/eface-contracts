// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {Account} from "./Account.sol";

import {IBioRegistry} from "../interfaces/IBioRegistry.sol";
import {IAccountFactory} from "../interfaces/IAccountFactory.sol";

/**
 * @title AccountFactory
 * @notice Manages the creation and deployment of Account contracts using deterministic method.
 */
contract AccountFactory is IAccountFactory, OwnableUpgradeable, UUPSUpgradeable {
    IBioRegistry public bioRegistry;

    address public accountImplementation;

    event AccountCreated(string uuid, address account);

    constructor() {
        _disableInitializers();
    }

    function __AccountFactory_init(
        IBioRegistry bioRegistry_,
        address accountImplementation_
    ) external initializer {
        __Ownable_init();

        bioRegistry = bioRegistry_;
        accountImplementation = accountImplementation_;
    }

    /**
     * @inheritdoc IAccountFactory
     */
    function setAccountImplementation(address accountImplementation_) external onlyOwner {
        accountImplementation = accountImplementation_;
    }

    /**
     * @inheritdoc IAccountFactory
     */
    function createAccountWithSalt(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        bytes32 salt_
    ) external returns (address) {
        validateAccountCreation(uuid_, trustedIssuers_);

        bytes memory data_ = abi.encodeWithSelector(
            Account.__Account_init.selector,
            bioRegistry,
            uuid_,
            trustedIssuers_,
            threshold
        );

        address account_ = _deploy2(data_, msg.sender, salt_);

        _register(uuid_, account_);

        emit AccountCreated(uuid_, account_);

        return account_;
    }

    /**
     * @inheritdoc IAccountFactory
     */
    function predictAccountAddress(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        address deployer_,
        bytes32 salt_
    ) external view returns (address) {
        bytes memory data_ = abi.encodeWithSelector(
            Account.__Account_init.selector,
            bioRegistry,
            uuid_,
            trustedIssuers_,
            threshold
        );

        bytes32 combinedSalt_ = _getCombinedSalt(deployer_, salt_);

        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(accountImplementation, data_)
            )
        );

        return Create2.computeAddress(combinedSalt_, bytecodeHash);
    }

    /**
     * @notice Function to validate account creation.
     * Account can only be created by user that is set in trusted issuers.
     */
    function validateAccountCreation(
        string memory uuid_,
        uint256[] memory trustedIssuers_
    ) public view {
        uint256 arrayLength_ = trustedIssuers_.length;
        for (uint256 i = 0; i < arrayLength_; i++) {
            require(
                msg.sender == bioRegistry.getUserByUUID(trustedIssuers_[i], uuid_).userAddress,
                "AccountFactory: Account can be created only by user that is set in trusted issuers"
            );
        }
    }

    function _register(string memory uuid_, address userAccount_) private {
        bioRegistry.registerAccount(uuid_, userAccount_);
    }

    function _deploy2(
        bytes memory data_,
        address deployer_,
        bytes32 salt_
    ) private returns (address) {
        return
            address(
                new ERC1967Proxy{salt: _getCombinedSalt(deployer_, salt_)}(
                    accountImplementation,
                    data_
                )
            );
    }

    function _getCombinedSalt(address deployer_, bytes32 salt_) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(deployer_, salt_));
    }

    // A functionality to upgrade the contract

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return _getImplementation();
    }
}
