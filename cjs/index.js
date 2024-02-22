'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var viem = require('viem');
var zod = require('zod');
var chains = require('viem/chains');
var fetch = require('cross-fetch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var viem__namespace = /*#__PURE__*/_interopNamespace(viem);
var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);

class QNInputValidationError extends Error {
    constructor({ messages, zodError, }) {
        super(`QuickNode SDK Input Validation Error: ${messages.join(', ')}`);
        this.messages = messages;
        this.issues = zodError.issues;
        this.zodError = zodError; // see https://github.com/colinhacks/zod/blob/HEAD/ERROR_HANDLING.md
    }
}

class QNInvalidEndpointUrl extends Error {
    constructor() {
        super('Endpoint URL is not in a valid QuickNode URL format. Please check the URL and try again');
    }
}

class QNChainNotSupported extends Error {
    constructor(endpointUrl) {
        super(`The chain for endpoint URL ${endpointUrl} is not currently supported by the QuickNode SDK.`);
    }
}

function formatErrors(baseError) {
    const errorMessages = [];
    baseError.errors.forEach((error) => {
        errorMessages.push(`${error.path.length > 0 ? error.path + ': ' : ''}${error.message}`);
    });
    return errorMessages.length > 0
        ? new QNInputValidationError({
            messages: errorMessages,
            zodError: baseError,
        })
        : null;
}

// We can't dynamically extend the viem client based on which add-ons are specified, which would
// make the types fully align with the add-ons for the client, so instead we do run-time checks to
// prevent calling add-ons not explicitly added in the config
function checkAddOnEnabled(enabled, humanName, configName) {
    if (!enabled) {
        throw new Error(`${humanName} is not set as enabled. Please ensure the addon is enabled on your QuickNode endpoint and enable ${configName} in the Core configuration argument`);
    }
}

const isEvmAddress = zod.z
    .string()
    .length(42) // Using built-in function for better error messages
    .startsWith('0x') // Using built-in function for better error messages
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Not a valid address');
const rpcPaginationParams = zod.z
    .object({
    perPage: zod.z.number().positive().nullish(),
    page: zod.z.number().positive().nullish(),
})
    .strict();

const qnFetchNFTInputSchema = zod.z
    .object({
    wallet: isEvmAddress,
    contracts: zod.z.array(isEvmAddress).nullish(),
    omitFields: zod.z.array(zod.z.string()).nullish(),
})
    .merge(rpcPaginationParams)
    .strict();

const qnFetchNFTCollectionDetailsInputSchema = zod.z
    .object({
    contracts: zod.z.array(isEvmAddress),
})
    .strict();

const qnFetchNFTsByCollectionInputSchema = zod.z
    .object({
    collection: isEvmAddress,
    tokens: zod.z.array(zod.z.string()).nullish(),
    omitFields: zod.z.array(zod.z.string()).nullish(),
})
    .merge(rpcPaginationParams)
    .strict();

const qnGetTransfersByNFTInputSchema = zod.z
    .object({
    collection: isEvmAddress,
    collectionTokenId: zod.z.string(),
})
    .merge(rpcPaginationParams)
    .strict();

const qnVerifyNFTsOwnerInputSchema = zod.z
    .object({
    wallet: isEvmAddress,
    contracts: zod.z.array(zod.z.string()), // TODO: make this enforce the address:id format
})
    .strict();

const qnGetTokenMetadataByCAInputSchema = zod.z
    .object({
    contract: isEvmAddress,
})
    .strict();

const qnGetTokenMetadataBySymbolInputSchema = zod.z
    .object({
    symbol: zod.z.string(),
})
    .merge(rpcPaginationParams)
    .strict();

const qnGetTransactionsByAddressInputSchema = zod.z
    .object({
    address: isEvmAddress,
    fromBlock: zod.z.number().positive().nullish(),
    toBlock: zod.z.number().positive().nullish(),
})
    .merge(rpcPaginationParams)
    .strict()
    .refine(({ fromBlock, toBlock }) => {
    if (fromBlock && toBlock)
        return fromBlock < toBlock;
    return true;
}, { message: 'fromBlock must be less than toBlock' });

const qnGetWalletTokenBalanceInputSchema = zod.z
    .object({
    wallet: isEvmAddress,
    contracts: zod.z.array(isEvmAddress).nullish(),
})
    .merge(rpcPaginationParams)
    .strict();

const qnGetWalletTokenTransactionsInputSchema = zod.z
    .object({
    address: isEvmAddress,
    contract: isEvmAddress,
    fromBlock: zod.z.number().positive().nullish(),
    toBlock: zod.z.number().positive().nullish(),
})
    .merge(rpcPaginationParams)
    .strict();

function nftAndTokenValidator(config, schema, args) {
    checkAddOnEnabled(config.addOns?.nftTokenV2 ?? false, 'NFT And Token RPC API V2', 'nftTokenV2');
    // Uses zod to validate schema at runtime
    const validation = schema.safeParse(args);
    if (!validation.success) {
        const formattedErrors = formatErrors(validation.error);
        if (formattedErrors)
            throw formattedErrors;
    }
}
const nftAndTokenActions = (client, config) => ({
    async qn_fetchNFTCollectionDetails(args) {
        nftAndTokenValidator(config, qnFetchNFTCollectionDetailsInputSchema, args);
        const response = await client.request({
            method: 'qn_fetchNFTCollectionDetails',
            params: [args],
        });
        return response;
    },
    async qn_fetchNFTs(args) {
        nftAndTokenValidator(config, qnFetchNFTInputSchema, args);
        const response = await client.request({
            method: 'qn_fetchNFTs',
            params: [args],
        });
        return response;
    },
    async qn_fetchNFTsByCollection(args) {
        nftAndTokenValidator(config, qnFetchNFTsByCollectionInputSchema, args);
        const response = await client.request({
            method: 'qn_fetchNFTsByCollection',
            params: [args],
        });
        return response;
    },
    async qn_getTransfersByNFT(args) {
        nftAndTokenValidator(config, qnGetTransfersByNFTInputSchema, args);
        const response = await client.request({
            method: 'qn_getTransfersByNFT',
            params: [args],
        });
        return response;
    },
    async qn_verifyNFTsOwner(args) {
        nftAndTokenValidator(config, qnVerifyNFTsOwnerInputSchema, args);
        const response = await client.request({
            method: 'qn_verifyNFTsOwner',
            params: [args],
        });
        return response;
    },
    async qn_getTokenMetadataByContractAddress(args) {
        nftAndTokenValidator(config, qnGetTokenMetadataByCAInputSchema, args);
        const response = await client.request({
            method: 'qn_getTokenMetadataByContractAddress',
            params: [args],
        });
        return response;
    },
    async qn_getTokenMetadataBySymbol(args) {
        nftAndTokenValidator(config, qnGetTokenMetadataBySymbolInputSchema, args);
        const response = await client.request({
            method: 'qn_getTokenMetadataBySymbol',
            params: [args],
        });
        return response;
    },
    async qn_getTransactionsByAddress(args) {
        nftAndTokenValidator(config, qnGetTransactionsByAddressInputSchema, args);
        const response = await client.request({
            method: 'qn_getTransactionsByAddress',
            params: [args],
        });
        return response;
    },
    async qn_getWalletTokenBalance(args) {
        nftAndTokenValidator(config, qnGetWalletTokenBalanceInputSchema, args);
        const response = await client.request({
            method: 'qn_getWalletTokenBalance',
            params: [args],
        });
        return response;
    },
    async qn_getWalletTokenTransactions(args) {
        nftAndTokenValidator(config, qnGetWalletTokenTransactionsInputSchema, args);
        const response = await client.request({
            method: 'qn_getWalletTokenTransactions',
            params: [args],
        });
        return response;
    },
});

const ETH_MAINNET_NETWORK = 'ethereum-mainnet';
const qnChainToViemChain = {
    'arbitrum-mainnet': chains.arbitrum,
    'arbitrum-goerli': chains.arbitrumGoerli,
    'avalanche-mainnet': chains.avalanche,
    'avalanche-testnet': chains.avalancheFuji,
    'base-goerli': chains.baseGoerli,
    ['bsc']: chains.bsc,
    'bsc-testnet': chains.bscTestnet,
    'celo-mainnet': chains.celo,
    ['fantom']: chains.fantom,
    ['xdai']: chains.gnosis,
    ['gnosis']: chains.gnosis,
    'ethereum-goerli': chains.goerli,
    'harmony-mainnet': chains.harmonyOne,
    [ETH_MAINNET_NETWORK]: chains.mainnet,
    ['optimism']: chains.optimism,
    'optimism-goerli': chains.optimismGoerli,
    ['matic']: chains.polygon,
    ['polygon']: chains.polygon,
    'matic-testnet': chains.polygonMumbai,
    'zkevm-mainnet': chains.polygonZkEvm,
    'zkevm-testnet': chains.polygonZkEvmTestnet,
    'ethereum-sepolia': chains.sepolia,
    'ethereum-holesky': chains.holesky,
};
function chainNameFromEndpoint(endpointUrl) {
    let hostnameParts;
    try {
        const parsedUrl = new URL(endpointUrl);
        hostnameParts = parsedUrl.hostname.split('.');
    }
    catch (e) {
        throw new QNInvalidEndpointUrl();
    }
    const quiknode = hostnameParts.at(-2);
    const chainOrDiscover = hostnameParts.at(-3);
    if (quiknode !== 'quiknode' || !chainOrDiscover)
        throw new QNInvalidEndpointUrl();
    const indexOfName = chainOrDiscover === 'discover' ? -4 : -3;
    const lengthOfEthereum = chainOrDiscover === 'discover' ? 4 : 3;
    if (hostnameParts.length === lengthOfEthereum)
        return ETH_MAINNET_NETWORK;
    const potentialChainName = hostnameParts.at(indexOfName);
    if (potentialChainName)
        return potentialChainName;
    throw new QNInvalidEndpointUrl();
}
function deriveChainFromUrl(endpointUrl) {
    const chainName = chainNameFromEndpoint(endpointUrl);
    const viemChain = qnChainToViemChain[chainName];
    if (viemChain)
        return viemChain;
    throw new QNChainNotSupported(endpointUrl);
}

function setupGlobalFetch() {
    // Required for viem to work in node
    if (!globalThis.fetch) {
        globalThis.fetch = fetch__default["default"];
        globalThis.Headers = fetch.Headers;
        globalThis.Request = fetch.Request;
        globalThis.Response = fetch.Response;
    }
}

const buildQNActions = (config) => {
    return (client) => ({
        ...nftAndTokenActions(client, config),
    });
};
class Core {
    constructor({ endpointUrl, chain, config = {} }) {
        setupGlobalFetch();
        this.endpointUrl = endpointUrl;
        const baseClient = viem.createClient({
            chain: chain || deriveChainFromUrl(endpointUrl),
            transport: viem.http(this.endpointUrl),
        }).extend(viem.publicActions);
        const qnClient = baseClient.extend(buildQNActions(config));
        this.client = qnClient;
    }
}

const QuickNode = {
    Core: Core,
};

exports.viem = viem__namespace;
exports.Core = Core;
exports.QNChainNotSupported = QNChainNotSupported;
exports.QNInputValidationError = QNInputValidationError;
exports.QNInvalidEndpointUrl = QNInvalidEndpointUrl;
exports["default"] = QuickNode;
