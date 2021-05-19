# CablePorn Twitter bot.
This is the core of [@CablePorn_](https://Twitter.com/CablePorn_), This software is made to link [r/CablePorn](https://reddit.com/r/cablePorn) and [Twitter](https://Twitter.com/CablePorn_)  
A each start it will fetch all the posts from Reddit, and save them in the database with all the links (images, ID, Author, Posts Link) and if the post has been sent to twitter or not.  
Every days at 2PM GTM (11PM JST) it will check for the latest post in the database and post it on twitter.

## Config file:
To run this bot you will need:
+ Access to Twitter API.
+ A mongoDB Database

Copy the `config.json.exemple` and name the file `config.json`  
You should have something like this:
```
{
    "dbLink": "mongodb+srv://[USERNAME]:[PASSWORD]@[DATABASE DNS/IP]/CablePorn",
    "consumer_key": "[TWITTER_CONSUMER_KEY]",
    "consumer_secret": "[TWITTER_CONSUMER_SECRET]",
    "access_token": "[TWITTER_ACCESS_TOKEN]",
    "access_token_secret": "[TWITTER_ACCESS_TOKEN_SECRET]",
    "account": "[BOT_ACCOUNT_NAME]"
}
```
Fill all the information.  
Note: account must be the bot account name without the @. for me it would look like this: `"account": "_RiseDev"`

## More information: 
This bot is running on NodeJS 14, we havent tested it on older version, because this is a side project, and our main project is [Yukiko](https://Yukiko.app) and its running on NodeJS 14.  
This bot is owned by [Yukiko Dev Team](https://github.com/Yukiko-Dev-Team)