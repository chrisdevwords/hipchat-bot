# hipchat-bot [![Build Status](https://travis-ci.org/chrisdevwords/hipchat-bot.svg?branch=master)](https://travis-ci.org/chrisdevwords/hipchat-bot)
Server-side node module for parsing and resolving HipChat integration hooks. Easy to extend for custom Integrations and Chatbots.

Extend this module and override the parseReq method, returning a promise that resolves or rejects with a hipchat message object containing either the desired response or an error message.

To return GIFS, you will need an Imgur API [Client ID](https://api.imgur.com/oauth2/addclient).

### Learn more
Read [How to create a HipChat webhook](https://www.hipchat.com/docs/apiv2/method/create_webhook).
