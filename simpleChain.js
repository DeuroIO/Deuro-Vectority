/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('./levelSandbox.js');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
  constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    level.getBlockHeight().then((height) => {
      if(height === 0) {
        console.log("this is no block. so we are going to create the genesis block");
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }
    });
  }

  // Add new block
  async addBlock(newBlock){
    // Block height
    let height = await level.getBlockHeight();
    console.log("Current block height: " + height);
    newBlock.height = height + 1;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(height > 0){
      newBlock.previousBlockHash = await level.getLevelDBdata(height - 1).hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    console.log(newBlock);
    level.addDataToLevelDB(newBlock);
  }

  // Get block height
    getBlockHeight(){
      return level.getBlockHeight();
    }

    // get block
    getBlock(blockHeight){
      // return object as a single string
      return level.getLevelDBdata(blockHeight);
    }

    // validate block
    async validateBlock(blockHeight){
      // get block object
      let block = await this.getBlock(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
    }

   // Validate blockchain
    async validateChain(){
      let errorLog = [];
      let blockHeight = await this.getBlockHeight()
      for (var i = 0; i < blockHeight; i++) {
        // validate block
        if (!this.validateBlock(i))errorLog.push(i);
        // compare blocks hash link
        let blockHash = await level.getLevelDBdata(i).hash;
        let previousHash = await level.getLevelDBdata(i - 1).hash;
        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
      }
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }
}
module.exports = {
  Blockchain,
  Block
}
// // main function
async function main() {
  let blockchain = new Blockchain();
  for (var i = 0; i <= 10; i++) {
    console.log(i);
    await blockchain.addBlock(new Block("test data "+i));
  }
  blockchain.validateChain();
}

// main();
// let inducedErrorBlocks = [2,4,7];
// for (var i = 0; i < inducedErrorBlocks.length; i++) {
//   blockchain.chain[inducedErrorBlocks[i]].data='induced chain error';
// }
// blockchain.validateChain();
