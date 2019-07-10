const {
  etherscan_key,
  twitter_keys,
  token_twitter_account,
  token_twitter_status
} = require("./config");
const textCleaner = require("text-cleaner");
const eutil = require("ethereumjs-util");
const Twitter = require("twitter");

const etherscan = require("etherscan-api").init(etherscan_key);
const twitter = new Twitter(twitter_keys);

// gets a discord message object, returns an object:
// {
//    errors: Error string to present
//    final: true if it's ready to go
//    eth : An address, if found, String
//    twitter : A twitter id if found, String
// }
async function validateMessage(message) {
  // setup return object
  const returnData = {
    errors: [],
    eth: "",
    twitter: ""
  };

  // strip the text of extra spaces, newlines etc
  const cleanedText = textCleaner(message.content)
    .condense()
    .valueOf();
  const textParts = cleanedText.split(" ");
  console.log(cleanedText);

  if (textParts.length <= 0) {
    return false;
  }

  // for each piece, run verification and collect in returnData{}
  for (let x = 0; x < textParts.length; x++) {
    let currentPart = textParts[x];

    // if it's an address, check that
    if (
      eutil.isValidAddress(currentPart) &&
      !eutil.isZeroAddress(currentPart)
    ) {
      returnData.eth = await verifyEth(currentPart).catch(err => {
        console.log(err);
        returnData.errors.push(err);
      });
    }

    // if it's a url, verify Twtter
    if (currentPart.includes("twitter")) {
      returnData.twitter = await verifyTwitter(currentPart).catch(err => {
        console.log(err);
        returnData.errors.push(err);
      });
    }
  }

  return returnData;
}

// returns a twitter id or throw an error
async function verifyTwitter(currentPart) {
  // split up the url
  const path = currentPart.split("/");
  // return if it's not long enough
  if (path.length < 6) {
    throw new Error("Invalid status url.");
  }

  // collect parameters
  const statusId = path.pop();

  // check status first
  const twitterStatus = await twitter
    .get("statuses/show/" + statusId, {
      tweet_mode: "extended"
    })
    .catch(err => {
      console.log(err);
      throw new Error(
        "Something went wrong when getting your tweet. Please try again later."
      );
    });

  if (!twitterStatus) {
    throw new Error(
      "Your twitter reply or retweet appears to be invalid. Please review the instructions in #announcement and try again."
    );
  }
  const twitterUser = twitterStatus.user;

  // check if is EROS account
  if (twitterUser.id == token_twitter_account) {
    throw new Error(
      "It seems like you entered the main tweet. Please remember to add a comment when retweeting."
    );
  }

  // check if it's the right status
  if (
    twitterStatus.in_reply_to_status_id_str != token_twitter_status &&
    twitterStatus.quoted_status_id_str != token_twitter_status
  ) {
    throw new Error("You did not retweet or reply to the correct status.");
  }

  // check if is older than 30 days
  if (Date.now() - new Date(twitterUser.created_at) < 2592000000) {
    throw new Error("Your Twitter account must be 30 days or older.");
  }

  // check if it has 5 followers
  if (twitterUser.followers_count < 5) {
    throw new Error("You need at least 5 followers on Twitter to be eligible.");
  }

  // if we're here, everything was verified successfully
  return twitterUser.id_str;
}

// returns an address or throw an error
async function verifyEth(currentPart) {
  const txList = await etherscan.account.txlist(currentPart).catch(err => {
    console.log(err);
    throw new Error(
      "Something went wrong when fetching your ethereum history. Please wait and try again."
    );
  });

  // if there's no transaction list, return an error
  if (!txList) {
    throw new Error("No transactions found on your ethereum address.");
  }

  // return the address
  return currentPart;
}

module.exports = validateMessage;
