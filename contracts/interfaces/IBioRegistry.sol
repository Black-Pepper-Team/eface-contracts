// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IBioRegistry
 * @notice Interface for the BioRegistry contract, serving as an auxiliary tool for the State Contract.
 * It stores and manages users' biometric data.
 */
interface IBioRegistry {
    /**
     * @notice Defines the structure representing user biometric data.
     * @dev BiometricData struct holds all relevant information regarding a user's biometric identity.
     * @param uuid Unique identifier of the user, linking them to their biometric data.
     * @param userAddress Ethereum address of the user. This can be updated by proving ownership of the UUID via trusted issuers.
     * @param biometricInfo Raw representation of the user's biometric data.
     * @param userMetadata Additional metadata associated with the user.
     */
    struct BiometricData {
        string uuid;
        address userAddress;
        bytes biometricInfo;
        string userMetadata;
    }

    /**
     * @notice Registers a user's account by linking it with a UUID.
     * @param uuid_ The unique identifier of the user.
     * @param account_ The address of the user's account to be registered.
     */
    function registerAccount(string memory uuid_, address account_) external;

    /**
     * @notice Retrieves the biometric data associated with a given UUID.
     * @param issuerId_ Identifier of the issuer or authority.
     * @param uuid_ The unique identifier of the user.
     * @return BiometricData The user's biometric data associated with the specified UUID.
     */
    function getUserByUUID(
        uint256 issuerId_,
        string memory uuid_
    ) external view returns (BiometricData memory);

    /**
     * @notice Retrieves the Ethereum account address associated with a given UUID.
     * @param uuid_ The unique identifier of the user.
     * @return address The Ethereum address associated with the user's UUID.
     */
    function getUserAccountByUUID(string memory uuid_) external view returns (address);

    /**
     * @notice Retrieves metadata associated with a user's address.
     * @param issuerId_ Identifier of the issuer or authority.
     * @param userAddress_ The Ethereum address of the user.
     * @return string Metadata associated with the user's address.
     */
    function getMetadataByUser(
        uint256 issuerId_,
        address userAddress_
    ) external view returns (string memory);

    /**
     * @notice Retrieves metadata based on biometric information and user address.
     * @param issuerId_ Identifier of the issuer or authority.
     * @param biometricInfo_ Biometric information associated with the user.
     * @param userAddress_ The Ethereum address of the user.
     * @return string Metadata associated with the user and the biometric info.
     */
    function getMetadataByFAndUser(
        uint256 issuerId_,
        bytes memory biometricInfo_,
        address userAddress_
    ) external view returns (string memory);

    /**
     * @notice Checks whether a UUID has been registered in the system.
     * @param uuid_ The unique identifier of the user.
     * @return bool True if the UUID is registered, false otherwise.
     */
    function isUUIDRegistered(string memory uuid_) external view returns (bool);
}
