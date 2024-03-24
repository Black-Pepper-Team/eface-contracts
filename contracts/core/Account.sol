// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IAccount} from "../interfaces/IAccount.sol";
import {IBioRegistry} from "../interfaces/IBioRegistry.sol";

/**
 * @title Account
 * @notice This contract represents a smart account, the ownership of which is determined by a UUID and a threshold of trusted issuers.
 */
contract Account is IAccount, Initializable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    IBioRegistry public bioRegistry;

    string public UUID;
    uint256 public threshold;

    EnumerableSet.UintSet private _issuers;

    modifier onlyOwner() {
        validateExecution();
        _;
    }

    constructor() {
        _disableInitializers();
    }

    /**
     * @inheritdoc IAccount
     */
    function __Account_init(
        IBioRegistry bioRegistry_,
        string memory uuid_,
        uint256[] memory issuers_,
        uint256 threshold_
    ) external initializer {
        bioRegistry = bioRegistry_;

        UUID = uuid_;
        threshold = threshold_;

        uint256 arrayLength_ = issuers_.length;
        for (uint256 i = 0; i < arrayLength_; ++i) {
            _issuers.add(issuers_[i]);
        }
    }

    /**
     * @inheritdoc IAccount
     */
    function setThreshold(uint256 threshold_) external onlyOwner {
        threshold = threshold_;
    }

    /**
     * @inheritdoc IAccount
     */
    function transfer(uint256 amount_, address to_) external payable onlyOwner {
        (bool success_, bytes memory data_) = to_.call{value: amount_}("");
        Address.verifyCallResult(success_, data_, "Account: transfer failed");
    }

    /**
     * @inheritdoc IAccount
     */
    function transferERC20(address token_, uint256 amount_, address to_) external onlyOwner {
        IERC20(token_).safeTransfer(to_, amount_);
    }

    /**
     * @inheritdoc IAccount
     */
    function arbitraryCall(address to_, bytes calldata data_) external onlyOwner {
        (bool success_, bytes memory data__) = to_.call(data_);
        Address.verifyCallResult(success_, data__, "Account: arbitrary call failed");
    }

    /**
     * @inheritdoc IAccount
     */
    function getTrustedIssuers() external view returns (uint256[] memory) {
        return _issuers.values();
    }

    /**
     * @inheritdoc IAccount
     */
    function validateExecution() public view {
        uint256 counter_ = 0;

        uint256 arrayLength_ = _issuers.length();
        for (uint256 i = 0; i < arrayLength_; i++) {
            if (msg.sender == bioRegistry.getUserByUUID(_issuers.at(i), UUID).userAddress) {
                ++counter_;
            }
        }

        require(counter_ >= threshold, "Account: unauthorized");
    }

    // A functionality to upgrade the contract

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return _getImplementation();
    }
}
