const {
  discord_token,
  master_address,
  token_address,
  drop_amount
} = require("./config");
const { resendCode, claimInstr } = require("./replies_EN");
const signAirdrop = require("./web3sign");
const storage = require("./storage");
const validateMessage = require("./validation");
//npm
const Discord = require("discord.js");

// bot functions
const bot = new Discord.Client();

bot.on("message", message => {
  // check if pinged
  if (!message.mentions.users.get(bot.user.id)) {
    return;
  }

  // check if it's in the right channel
  if (message.channel.name != "spacedrop-verification") {
    return;
  }

  // check if person already claimed
  let claimCode = storage.findClaimCode(message.author.id);
  if (claimCode) {
    return message
      .reply(resendCode)
      .then(result => {
        return message.author.send(claimCode);
      })
      .catch(err => {
        console.log(err);
      });
  }

  // check if person has a profile with us, if not make it
  if (!storage.userProfiles[message.author.id]) {
    storage.userProfiles[message.author.id] = {};
  }

  // check message for address or twitter
  validateMessage(message)
    .then(result => {
      const { errors, eth, twitter } = result;

      // check eth
      if (eth) {
        if (storage.ethFile.includes(eth)) {
          errors.push("Ethereum address already in use.");
        } else {
          storage.userProfiles[message.author.id].eth = eth;
        }
      }
      // check twitter
      if (twitter) {
        if (storage.twitterFile.includes(twitter)) {
          errors.push("Twitter account already in use.");
        } else {
          storage.userProfiles[message.author.id].twitter = twitter;
        }
      }

      // extrapolate errors
      let errorString = "";
      if (errors.length > 0) {
        for (let x = 0; x < errors.length; x++) {
          errorString += errors[x] + "\n";
        }
      }

      // if there's something missing add to errors, else give him code
      let isReady = true;
      if (!storage.userProfiles[message.author.id].twitter) {
        errorString += "I'm still missing a retweet from you. \n";
        isReady = false;
      }
      if (!storage.userProfiles[message.author.id].eth) {
        errorString += "I'm still missing an ethereum address from you. \n";
        isReady = false;
      }

      // gen code if ready
      if (isReady) {
        GenerateClaimCode(message.author.id)
          .then(result => {
            message.author.send(claimInstr + result).then(msg => {
              message.reply(
                "Congratulations, I sent you a private message with your code to redeem 500 free EROS!"
              );
            });
          })
          .catch(err => {
            console.log(err);
            message.reply(
              "Something went wrong when generating your code, please try again."
            );
          });
      } else {
        message.reply(errorString);
      }
    })
    .catch(err => {
      console.log(err);
      message.reply("Something went wrong, please try again later.");
    });
});

bot.login(discord_token);

// helper functions
async function GenerateClaimCode(userId) {
  const rsv = await signAirdrop(
    token_address,
    master_address,
    storage.userProfiles[userId].eth,
    drop_amount,
    storage.userProfiles[userId].twitter
  );

  const claimCode =
    storage.userProfiles[userId].eth.slice(2) +
    rsv.r.slice(2) +
    rsv.s.slice(2) +
    rsv.v.toString() +
    storage.userProfiles[userId].twitter;

  console.log("once");
  storage.addClaimCode(userId, claimCode);
  storage.addEth(storage.userProfiles[userId].eth);
  storage.addTwitter(storage.userProfiles[userId].twitter);

  return claimCode;
}
