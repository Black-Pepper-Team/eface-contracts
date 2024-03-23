import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

import "@solarity/hardhat-migrate";
import "@solarity/hardhat-gobind";
import "@solarity/hardhat-markup";

import "@typechain/hardhat";

import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";

import "solidity-coverage";

import "tsconfig-paths/register";

import { HardhatUserConfig } from "hardhat/config";

import * as dotenv from "dotenv";
dotenv.config();

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      initialDate: "1970-01-01T00:00:00Z",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    qTestnet: {
      url: "https://rpc.qtestnet.org/",
      accounts: privateKey(),
    },
    qMainnet: {
      url: "https://rpc.q.org",
      accounts: privateKey(),
    },
  },
  solidity: {
    version: "0.8.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      evmVersion: "berlin",
    },
  },
  etherscan: {
    apiKey: {
      sepolia: `${process.env.ETHERSCAN_KEY}`,
      qTestnet: "abc",
      qMainnet: "abc",
    },
    customChains: [
      {
        network: "qTestnet",
        chainId: 35443,
        urls: {
          apiURL: "https://explorer.qtestnet.org/api",
          browserURL: "https://explorer.qtestnet.org",
        },
      },
      {
        network: "qMainnet",
        chainId: 35441,
        urls: {
          apiURL: "https://explorer.q.org/api",
          browserURL: "https://explorer.q.org",
        },
      },
    ],
  },
  migrate: {
    pathToMigrations: "./deploy/",
  },
  mocha: {
    timeout: 1000000,
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 50,
    enabled: false,
    coinmarketcap: `${process.env.COINMARKETCAP_KEY}`,
  },
  typechain: {
    outDir: "generated-types",
    target: "ethers-v6",
  },
  abiExporter: {
    flat: true,
  },
};

export default config;
