// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IBioRegistry} from "./IBioRegistry.sol";

/**
 * @title IAccount
 * @notice Interface for Smart Accounts, supporting operations like setting a threshold for trusted
 * issuers, transferring assets, and making arbitrary calls.
 */
interface IAccount {
    /**
     * @notice Initializes the Smart Account with essential parameters.
     * @param bioRegistry_ Address of the BioRegistry contract to link the account with biometric data.
     * @param uuid_ Unique identifier of the user associated with this account.
     * @param issuers_ Array of trusted issuers' identifiers that will validate the user's actions.
     * @param threshold_ Minimum number of validations from trusted issuers required to authorize transactions.
     */
    function __Account_init(
        IBioRegistry bioRegistry_,
        string memory uuid_,
        uint256[] memory issuers_,
        uint256 threshold_
    ) external;

    /**
     * @notice Sets a new threshold of required issuer validations for the account.
     * @param threshold_ New threshold number, representing the minimum required trusted issuer validations.
     */
    function setThreshold(uint256 threshold_) external;

    /**
     * @notice Transfers the native cryptocurrency to a specified address.
     * @param amount_ The amount of the native cryptocurrency to be transferred.
     * @param to_ The address of the recipient.
     */
    function transfer(uint256 amount_, address to_) external payable;

    /**
     * @notice Transfers ERC20 tokens to a specified address.
     * @param token_ The address of the ERC20 token to be transferred.
     * @param amount_ The amount of the ERC20 token to be transferred.
     * @param to_ The address of the recipient.
     */
    function transferERC20(address token_, uint256 amount_, address to_) external;

    /**
     * @notice Executes an arbitrary call to another contract.
     * @param to_ The address of the contract to call.
     * @param data_ The calldata to be sent with the call.
     */
    function arbitraryCall(address to_, bytes calldata data_) external;

    /**
     * @notice Retrieves the list of trusted issuer identifiers associated with the account.
     * @return An array containing the identifiers of the trusted issuers.
     */
    function getTrustedIssuers() external view returns (uint256[] memory);

    /**
     * @notice Validates if the execution request meets the required number of validations from trusted issuers.
     * @dev This function checks if the calling address is registered with a sufficient number of trusted issuers, according to the account's threshold.
     */
    function validateExecution() external view;
}
