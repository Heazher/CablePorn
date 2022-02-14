const mongoose = require("mongoose");
const schedule = require("node-schedule");
const { tweet, getMedia, getPosts, savePosted } = require("./functions");
const Config = require("../config.json");

// Connect to MongoDB
mongoose.connect(Config.dbLink, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
mongoose.connection.on("open", () =>
  console.log(`Database: Connected to ${mongoose.connection.host}`)
);
mongoose.connection.on("error", (err) =>
  console.log(`Database: Error, Cannot conned to the database. => ${err}`)
);

// CablePorn = @Asthriona
// CableGore = @AsthrionaNG
const account = {
  cablePorn: {
    name: "CablePorn",
    at: Config.account_token.cableporn.access_token,
    as: Config.account_token.cableporn.access_token_secret,
  },
  cableGore: {
    name: "CableGore",
    at: Config.account_token.cablegore.access_token,
    as: Config.account_token.cablegore.access_token_secret,
  },
};

// get new media on start
getPosts(account.cablePorn);
// getPosts(account.cableGore);

// tweet on start (test)
CablePorn();

// Schedules (might move that to an API endpoint using cloudflare worker as cron.)

// get new posts from reddit everyday at midnight.
schedule.scheduleJob("0 0 * * *", async () => {
  getPosts(account.cablePorn);
  // getPosts(account.cableGore);
});

// Posts on both account at 0200PM everyday
schedule.scheduleJob("0 14 * * *", async () => {
  CablePorn();
  // cableGore();
});

// Nothing fancy just the fuction to posts the images so the schedule can be easly read.

// Post to CablePorn.
async function CablePorn() {
  getMedia(account.cablePorn).then((img) => {
    tweet(account.cablePorn, img).then((data) => {
      savePosted(account.cablePorn, img.img.PostId);
    });
  });
}

// Post to Cable Gore.
async function CableGore() {
  getMedia(account.cableGore).then((img) => {
    tweet(account.cableGore, img).then((data) => {
      savePosted(account.cableGore, img.img.PostId);
    });
  });
}

/*
 * NOTICE:
 * since this code is open-source, I made all this so you just have to add your consumer key from the account that have access to the API (here one of Asthriona's account)
 * You can use the code with any other account. I didnt made it easy to add more than 2 accounts, but one of us should change that later. (am lazy and made this code late night sorry.)
 * if you need more account just add a folder in ../images/ and add it to the array of accounts on top of this file.
 * Second notice, if you edit this code, (except the config.json) we wont be able to help you. if you open an issue anyway please let us know what you did to the code and send us snippet not just logs even less one line of logs.
 * We (and I mean all developers) will be so greatfull if you take time to make a nice and complete issue desctiption. <3
 * Asthriona
 * PS: 9+10=11
 */
