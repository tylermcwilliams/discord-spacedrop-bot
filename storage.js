const fs = require("fs");

function Storage() {
  this.userProfiles = {};

  this.claimsPath = "./storage/claims.txt";
  this.blacklistPath = "./storage/blacklist.txt";
  this.ethPath = "./storage/eth.txt";
  this.twitterPath = "./storage/twitter.txt";

  this.blacklistFile = fs.readFileSync(this.blacklistPath, "utf8").split("\n");
  this.twitterFile = fs.readFileSync(this.twitterPath, "utf8").split("\n");
  this.ethFile = fs.readFileSync(this.ethPath, "utf8").split("\n");
  // codes are: <discordID>_<code>\n
  this.claimsFile = fs.readFileSync(this.claimsPath, "utf8").split("\n");

  this.addToBlacklist = function(doc) {
    let file = fs.readFileSync(this.blacklistPath, "utf8");

    file += doc + "\n";

    blacklistFile = file.split("\n");
    fs.writeFileSync(blacklistPath, file);
  };

  this.addTwitter = function(doc) {
    let file = fs.readFileSync(this.twitterPath, "utf8");
    file += doc + "\n";

    this.twitterFile = file.split("\n");
    fs.writeFileSync(this.twitterPath, file);
  };

  this.addEth = function(doc) {
    let file = fs.readFileSync(this.ethPath, "utf8");
    file += doc + "\n";

    ethFile = file.split("\n");
    fs.writeFileSync(this.ethPath, file);
  };

  this.addClaimCode = function(userId, doc) {
    let file = fs.readFileSync(this.claimsPath, "utf8");
    let entry = userId + "_" + doc;
    file += entry + "\n";

    this.claimsFile = file.split("\n");
    fs.writeFileSync(this.claimsPath, file);
  };

  this.findClaimCode = function(userId) {
    let code;
    this.claimsFile.find(element => {
      let entry = element.split("_");
      if (entry[0] == String(userId)) {
        return (code = entry[1]);
      }
    });

    return code;
  };
}

const StorageInstance = new Storage();

module.exports = StorageInstance;
