// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {IBioRegistry} from "./IBioRegistry.sol";

/**
 * @title IAccount
 * @notice This interface provides minimal functionality to function as Smart Account with addition oh helper function for the demo purposes.
 */
interface IAccount {
    /**
     * @notice This is intialzer function, needed for the account set up.
     * @param bioRegistry_ - address of the BioRegistry contract
     * @param uuid_ - unique identifier of the user
     * @param issuers_ - array of the trusted issuers
     * @param threshold_ - number of the trusted issuers where user is registered that are needed to execute the function
     */
    function __Account_init(
        IBioRegistry bioRegistry_,
        string memory uuid_,
        uint256[] memory issuers_,
        uint256 threshold_
    ) external;

    /**
     * @notice This function is used to set the threshold of the trusted issuers
     * @param threshold_ - number of the trusted issuers where user is registered that are needed to execute the function
     */
    function setThreshold(uint256 threshold_) external;

    /**
     * @notice This function is used to transfer native currency to the desired address
     * @param amount_ - amount of the native currency to transfer
     * @param to_ - address of the receiver
     */
    function transfer(uint256 amount_, address to_) external payable;

    /**
     * @notice This function is used to transfer ERC20 token to the desired address
     * @param token_ - address of the ERC20 token
     * @param amount_ - amount of the ERC20 token to transfer
     * @param to_ - address of the receiver
     */
    function transferERC20(address token_, uint256 amount_, address to_) external;

    /**
     * @notice This function is used to execute the arbitrary function
     * @param to_ - address of the contract where the function is located
     * @param data_ - data of the function
     */
    function arbitraryCall(address to_, bytes calldata data_) external;

    /**
     * @notice This function is used to get the trusted issuers
     * @return array of the trusted issuers
     */
    function getTrustedIssuers() external view returns (uint256[] memory);

    /**
     * @notice In current implementation the user can set up a number of the issuers that he trusts
     * And if all of them contains his address,  or at least k of n, where k is the threshold, then the user can execute the desired function
     */
    function validateExecution() external view;
}
