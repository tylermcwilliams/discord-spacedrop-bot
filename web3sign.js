const HDWalletProvider = require("truffle-hdwallet-provider");
const eutil = require("ethereumjs-util");
const web3Utils = require("web3-utils");
const Web3 = require("web3");
const { master_key, infura_url } = require("./config.js");

const provider = new HDWalletProvider(master_key, infura_url);

const web3 = new Web3(provider);

async function sign(sender, h) {
  const signedData = await web3.eth.sign(h, sender);

  const rsv = eutil.fromRpcSig(signedData);
  return {
    v: rsv.v,
    r: eutil.bufferToHex(rsv.r),
    s: eutil.bufferToHex(rsv.s)
  };
}

async function signAirdrop(token, sender, recipient, nTokens, nonce) {
  const h = web3Utils.soliditySha3(token, sender, recipient, nTokens, nonce);
  return await sign(sender, h);
}

module.exports = signAirdrop;
