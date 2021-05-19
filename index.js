const axios = require("axios");
const mongoose = require('mongoose');
const Twit = require("twit");
const Post = require("./models/Post");
const fs = require("fs");
const request = require('request');
const schedule = require("node-schedule");
const Config = require("./config.json");

const Posts = require('./models/Post')

// Connect to MongoDB
mongoose.connect(Config.dbLink, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});
mongoose.connection.on('open', () => console.log(`Database: Connected to ${mongoose.connection.host}`));
mongoose.connection.on('error', (err) => console.log(`Database: Error, Cannot conned to the database. => ${err}`))

// Connect to Twitter
const T = new Twit({
    consumer_key: Config.consumer_key,
    consumer_secret: Config.consumer_secret,
    access_token: Config.access_token,
    access_token_secret: Config.access_token_secret
})

//BASIC API STUFF
// Request post from reddit and check if the ID is in database, if not save them locally and add them to DB
async function getNewPost() {
    axios.get(`https://www.reddit.com/r/cableporn.json?sort=top&t=week&limit=800`, { limit: 800 })
        .then(res => {
            res.data.data.children.forEach(reddit => {

                if (reddit.data.url_overridden_by_dest == null) {
                    console.log("No media")
                } else {
                    if (!reddit.data.url_overridden_by_dest.endsWith(".jpg")) return
                    let data = reddit.data
                    Posts.findOne
                    Posts.findOne({
                        PostId: data.id
                    }, async(err, post) => {
                        if (!post) {
                            newPost = new Posts({
                                PostId: data.id,
                                pictname: data.url_overridden_by_dest,
                                title: data.title,
                                Author: data.author,
                                url: data.url,
                                isPosted: false
                            })
                            newPost.save()
                                .then(console.log(`${data.id} has been saved to the database.`))
                            const image = data
                                // Download media
                            const download = async(url, path, callback) => {
                                await request.head(url, async(err, res, body) => {
                                    await request(url)
                                        .pipe(fs.createWriteStream(path))
                                        .on('close', callback)
                                })
                            }
                            const url = data.url_overridden_by_dest
                            const path = './images/' + data.id + '.jpg'
                            await download(url, path, () => {
                                console.log('✅ Done!')
                            })
                        } else {
                            console.log(`${data.id} has already been saved in database.`)
                        }
                    })
                }
            });
        })
}
// Send Tweet with the last non-sent image.
async function tweet() {
    //Get media
    const posts = await Post.find({ isPosted: false })
    image = posts[0]
    postImage(image)
}
// Actual Function to send the tweet (Temporary will be moved later.)
async function postImage(image) {
    // Post Media
    // Encode Media
    var b64content = await fs.readFileSync('./images/' + image.PostId + '.jpg', { encoding: 'base64' })
    T.post('media/upload', { media_data: b64content }, (err, data, response) => {
        var mediaIdStr = data.media_id_string;
        var altText = image.title;
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

        T.post('media/metadata/create', meta_params, (err, data, response) => {
            if (!err) {
                var params = { status: `${image.title}\nAuthor: u/${image.Author}\n${image.url}\nvia r/CablePorn`, media_ids: [mediaIdStr] }
                T.post('statuses/update', params, function(err, data, response) {
                    console.log(data)
                    image.isPosted = true
                    image.save()
                })
            } else {
                console.log(err)
            }
        })
    })
}

// TIMING AND EXECUTING FUNCTION ON TIME

// Get new Imges everyday at midnight.
schedule.scheduleJob('0 0 * * *', () => {
        getNewPost()
        console.log("New image saved.")
    })
    //Send tweet everyday at 2pm GTM.
schedule.scheduleJob('0 14 * * *', () => {
        tweet()
    })
    //Populate Database on start then wait for cron job
getNewPost()

//SOCKET STUFF AKA STREAMS
var stream = T.stream('statuses/filter', { track: Config.account })
Post.countDocuments({}, function(err, count) {
    var totalPost = count
    Post.countDocuments({ isPosted: false }, function(err, c) {
        var totalUnpost = c

        stream.on('tweet', (tweet) => {
            if (tweet.text.split(" ").slice(1)[0] === "info") {
                var tweetID = tweet.id_str;
                var name = tweet.user.screen_name;
                if (err) {
                    console.log(err)
                    T.post('statuses/update', {
                        in_reply_to_status_id: tweetID,
                        status: `Yikes! An error happen... \n${err.message}`
                    }, function(err, data, response) {
                        console.log(data)
                    })
                }
            }
            const randNumb = Math.round(Math.random() * (1000000 - 9999999 + 1) + 9999999)
            T.post('statuses/update', {
                in_reply_to_status_id: tweetID,
                status: `@${name}\n Total Posts: ${totalPost}\nPicture unposted yet: ${totalUnpost}\n random: ${randNumb}`
            }, function(err, data, response) {
                console.log(`@${name} Total Posts: ${totalPost}\nPicture unposted yet: ${totalUnpost}\n random: ${randNumb}`)
            })
        })
    });
});