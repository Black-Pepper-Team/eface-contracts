// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IAccountFactory
 * @notice Interface for the AccountFactory contract, which facilitates the creation of Account contracts.
 */
interface IAccountFactory {
    /**
     * @notice Sets the implementation contract for new accounts.
     * @dev This function can typically only be called by the owner of the factory.
     * @param accountImplementation_ The address of the new account implementation contract.
     */
    function setAccountImplementation(address accountImplementation_) external;

    /**
     * @notice Creates a new Account contract with specified parameters and a unique salt, resulting in a deterministic address.
     * @param uuid_ Unique identifier for the user associated with the new account.
     * @param trustedIssuers_ Array of identifiers for trusted issuers; these entities can validate transactions for the account.
     * @param threshold The number of validations required from trusted issuers for the account to perform sensitive operations.
     * @param salt_ Unique salt to ensure the deterministic creation of the account contract's address.
     * @return address The address of the newly created Account contract.
     */
    function createAccountWithSalt(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        bytes32 salt_
    ) external returns (address);

    /**
     * @notice Predicts the address of a new Account contract based on provided parameters and a unique salt.
     * @param uuid_ Unique identifier for the user associated with the account.
     * @param trustedIssuers_ Array of identifiers for trusted issuers.
     * @param threshold The required number of validations from trusted issuers.
     * @param deployer_ The address of the entity that will deploy the account, used in address calculation.
     * @param salt_ Unique salt used to compute the deterministic address.
     * @return address The predicted address of the new Account contract.
     */
    function predictAccountAddress(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        address deployer_,
        bytes32 salt_
    ) external view returns (address);

    /**
     * @notice Validates whether the creation of a new account is permitted based on the trusted issuers and the UUID provided.
     * @dev This function checks if the caller (msg.sender) is authorized to create an account based on the list of trusted issuers.
     * @param uuid_ Unique identifier for the user associated with the account being created.
     * @param trustedIssuers_ Array of identifiers for trusted issuers who can validate the creation of the account.
     */
    function validateAccountCreation(
        string memory uuid_,
        uint256[] memory trustedIssuers_
    ) external view;
}
