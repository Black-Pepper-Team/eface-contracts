// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IBioRegistry
 * @notice This is an interface for contract that works as an auxilary tool for the State Contract to
 * store necessary information about the user's public snapshot of the biometric.
 */
interface IBioRegistry {
    /**
     * @notice Structure that represents user data.
     * @param uuid - unique identifier of the user. It is needed ... TODO.
     * @param userAddress - address of the user. I can be replaced ... TODO.
     * @param f -TODO.
     * @param metadata - link to the IPFS where TODO.
     */
    struct BiometricData {
        string uuid;
        address userAddress;
        bytes biometricInfo;
        string userMetadata;
    }

    /**
     * @notice Function to register user account.
     */
    function registerAccount(string memory uuid_, address account_) external;

    /**
     * @notice Function to get user data by UUID.
     */
    function getUserByUUID(
        uint256 issuerId_,
        string memory uuid_
    ) external view returns (BiometricData memory);

    /**
     * @notice Function to get user account by UUID.
     */
    function getUserAccountByUUID(string memory uuid_) external view returns (address);

    /**
     * @notice Function to get user data by address.
     */
    function getMetadataByUser(
        uint256 issuerId_,
        address userAddress_
    ) external view returns (string memory);

    /**
     * @notice Function to get user data by F.
     */
    function getMetadataByFAndUser(
        uint256 issuerId_,
        bytes memory biometricInfo_,
        address userAddress_
    ) external view returns (string memory);

    /**
     * @notice Function to check if UUID is registered.
     */
    function isUUIDRegistered(string memory uuid_) external view returns (bool);
}
