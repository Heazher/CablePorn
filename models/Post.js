const mongoose = require('mongoose');

const newPost = new mongoose.Schema({
    PostId: String,
    pictname: String,
    title: String,
    Author: String,
    url: String,
    isPosted: Boolean
})

module.exports = mongoose.model("Posts", newPost)