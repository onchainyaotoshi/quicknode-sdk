# quicknode-sdk
 Since the [https://www.npmjs.com/package/@quicknode/sdk](@quicknode/sdk) does not yet include support for base-sepolia, I have forked it for personal use until they update their library.

To fix this bug:

 QNChainNotSupported [Error]: The chain for endpoint URL https://soft-blue-mansion.base-sepolia.quiknode.pro/... is not currently supported by the QuickNode SDK.
    at deriveChainFromUrl (file:///D:/frame-cube/node_modules/@quicknode/sdk/esm/core/chains.js:58:11)
    at new Core (file:///D:/frame-cube/node_modules/@quicknode/sdk/esm/core/core.js:16:29)
    at file:///D:/frame-cube/idea2.js:6:14
    at ModuleJob.run (node:internal/modules/esm/module_job:193:25)
    at async Promise.all (index 0)
    at async ESMLoader.import (node:internal/modules/esm/loader:530:24)
    at async loadESM (node:internal/process/esm_loader:91:5)
    at async handleMainPromise (node:internal/modules/run_main:65:12)

Node.js v18.12.1
