/* 
* NOTICE:
* This file will be reforctored in order to be readable soon. (I'm very lazy and tired atm.)
* - Asthriona
*/

const Twit = require("twit");
const Config = require("../config.json");
const fs = require("fs");
const request = require("request");
const axios = require("axios");
const Path = require("path");

// Models
const CablePorn = require("../models/Post");
const CableGore = require("../models/cableGore");

module.exports = {
    // Upload and create media on Twitter then send the tweet.
  tweet: async function (account, imgData) {
    const T = new Twit({
      consumer_key: Config.consumer_key,
      consumer_secret: Config.consumer_secret,
      access_token: account.at,
      access_token_secret: account.as,
    });
    // Upload media
    T.post(
      "media/upload",
      { media_data: imgData.b64content },
      (err, data, response) => {
        altText = imgData.img.title;
        mediaIdStr = data.media_id_string;
        meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

        // Create media
        T.post("media/metadata/create", meta_params, (err, data, response) => {
          if (err) return console.log(err);
          var params = {
            status: `${imgData.img.title}\nAuthor: ${imgData.img.author}\n${imgData.img.url}\nvia r/${account.name}`,
            media_ids: [mediaIdStr],
          };
          // Post Tweet
          T.post("statuses/update", params, function (err, data, response) {
            if (err) return err;
          });
        });
      }
    );
  },
  getMedia: async function(account){
    if (account.name == "CablePorn") {
        post = await CablePorn.find({ isPosted: false });
        img = post[0];
        // encode media
        b64content = fs.readFileSync(`${Path.join(__dirname, `../images/${account.name}/${img.PostId}.jpg`)}`, {
            encoding: "base64",
          });
          return img = {
              img: post[0],
              b64content: b64content
          };
      } else if(account.name == "CableGore"){
        post = await CableGore.find({ isPosted: false });
        img = post[0];
        // encode media
        b64content = fs.readFileSync(`${Path.join(__dirname, `../images/${account.name}/${img.PostId}.jpg`)}`, {
          encoding: "base64",
        });
        return img = {
            img: post[0],
            b64content: b64content
        };
      }else{
          return console.log(`Database: Error, Cannot find account ${account.name}`);
      }
},
    getPosts: async function(account){
        axios.get(`https://www.reddit.com/r/${account.name.toLowerCase()}.json?sort=top&t=week&limit=800`)
        .then(res =>{
            const posts = res.data.data.children;
            posts.forEach(async reddit =>{
                if(reddit.data.url_overridden_by_dest == null) return console.log("no media");
                if(!reddit.data.url_overridden_by_dest.endsWith(".jpg")) return;
                let data = reddit.data;
                let db
                if(account.name === "CablePorn"){
                    db = CablePorn;
                }else if(account.name === "CableGore"){
                    db = CableGore;
                }else{
                    return console.log(`DATABASE ERROR: ${account.name}`);
                }
                db.findOne({ PostId: data.id }, async (err, post) => {
                    if(!post) {
                        newPost = new db({
                            PostId: data.id,
                                pictname: data.url_overridden_by_dest,
                                title: data.title,
                                Author: data.author,
                                url: `https://reddit.com${data.permalink}`,
                                isPosted: false
                        })
                        newPost.save()
                        .then(console.log(`${account.name.toUpperCase()}: ${data.id} has been saved to the database.`))
                        .catch(err => console.log(err))
                        const download = async (url, path, callback) =>{
                            await request.head(url, async(err,res,body) => {
                                await request(url)
                                .pipe(fs.createWriteStream(path))
                                .on("close", callback);
                            });
                        }
                        const url = data.url_overridden_by_dest;
                        const path = Path.join(__dirname, `../images/${account.name}/${data.id}.jpg`);
                        await download(url, path, () => {
                            console.log(`${account.name.toUpperCase()}: 🙆‍♀️ ${data.id} has been downloaded.`)
                        });
                    }
                })
            })
        })
        .catch(err => {
            console.log(`${account.name.toUpperCase()}: ${err}`)
        })
    },
    savePosted: async function(account, postId){
        if(account.name === "CablePorn"){
            db = CablePorn;
        }else if(account.name === "CableGore"){
            db = CableGore;
        }else{
            return console.log(`DATABASE ERROR: ${account.name}`);
        }
        db.findOne({ PostId: postId }, (err, post) => {
            if(!post) return console.log(`${account.name.toUpperCase()}: ${postId} was not found in the database.`);
            post.isPosted = true;
            post.save()
            .then(console.log(`${account.name.toUpperCase()}: ${postId} has been saved as posted to the database.`))
            .catch(err => console.log(err))
        })
    }
};
