// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IAccountFactory {
    function setAccountImplementation(address accountImplementation_) external;

    function createAccountWithSalt(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        bytes32 salt_
    ) external returns (address);

    function predictAccountAddress(
        string memory uuid_,
        uint256[] memory trustedIssuers_,
        uint256 threshold,
        address deployer_,
        bytes32 salt_
    ) external view returns (address);
}
