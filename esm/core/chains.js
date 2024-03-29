import { QNInvalidEndpointUrl } from '../lib/errors/QNInvalidEnpointUrl.js';
import { QNChainNotSupported } from '../lib/errors/QNChainNotSupported.js';
import { arbitrum, arbitrumGoerli, avalanche, avalancheFuji, baseGoerli, bsc, bscTestnet, celo, fantom, gnosis, goerli, harmonyOne, mainnet, optimism, optimismGoerli, polygon, polygonMumbai, polygonZkEvm, polygonZkEvmTestnet, sepolia, holesky, baseSepolia, base } from 'viem/chains';

//quick fix, since i am migrate from replit to glitch that force me to downgrade nodejs version to 16.4.2 where not support .at
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
      // Convert index to an integer, allowing for negative indices
      index = Math.trunc(index) || 0;
      
      // When index is negative, count from the end of the array
      if (index < 0) index += this.length;
      
      // Return undefined if index is out of bounds
      if (index < 0 || index >= this.length) return undefined;
      
      // Return the element at the given index
      return this[index];
  };
}

const ETH_MAINNET_NETWORK = 'ethereum-mainnet';
const qnChainToViemChain = {
    'arbitrum-mainnet': arbitrum,
    'arbitrum-goerli': arbitrumGoerli,
    'avalanche-mainnet': avalanche,
    'avalanche-testnet': avalancheFuji,
    'base-goerli': baseGoerli,
    ['bsc']: bsc,
    'bsc-testnet': bscTestnet,
    'celo-mainnet': celo,
    ['fantom']: fantom,
    ['xdai']: gnosis,
    ['gnosis']: gnosis,
    'ethereum-goerli': goerli,
    'harmony-mainnet': harmonyOne,
    [ETH_MAINNET_NETWORK]: mainnet,
    ['optimism']: optimism,
    'optimism-goerli': optimismGoerli,
    ['matic']: polygon,
    ['polygon']: polygon,
    'matic-testnet': polygonMumbai,
    'zkevm-mainnet': polygonZkEvm,
    'zkevm-testnet': polygonZkEvmTestnet,
    'ethereum-sepolia': sepolia,
    'ethereum-holesky': holesky,
    'base-sepolia': baseSepolia,
    'base-mainnet': base
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

export { deriveChainFromUrl };
