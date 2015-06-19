'use strict';

var $ = require('jquery-deferred');
var _ = require('underscore');
var Imgur = require('imgur-search');

/**
 * Parses HipChat requests.
 * Promises resolve and reject with HipChat response objects.
 * @see {@link https://www.hipchat.com/docs/apiv2/webhooks}
 * @param {String} imgurID - needed for calls to Imgur API
 * @constructor
 * @class
 */
function HipChatBot (imgurID) {
    this.imgurID = imgurID;
};

/**
 * NOTE: This module uses a Node port of JQuery's Promise implementation.
 * @typedef {$.Deferred()} HipChatBot.Deferred
 * @see {@link https://github.com/zzdhidden/node-jquery-deferred}
 */
HipChatBot.Deferred = $.Deferred;

/**
 * Start every error with an apology...
 * @type {string}
 */
HipChatBot.ERROR_ROOT = 'Sorry, {n}. ';

/**
 * Error message for empty search result.
 * @type {string}
 */
HipChatBot.ERROR_NO_RESULTS = HipChatBot.ERROR_ROOT +
'I couldn\'t find anything with the query: "{q}". I suck.';

/**
 * Error message for 500.
 * @type {string}
 */
HipChatBot.ERROR_500 = HipChatBot.ERROR_ROOT +
'Something\'s borked. Try again later...';

/**
 * Error message for 500.
 * @type {string}
 */
HipChatBot.ERROR_BAD_HOOK = HipChatBot.ERROR_ROOT +
'Something\'s borked. HipChat data looks funny.';

/**
 * Generic request parser for HipChat WebHooks.
 * Override this in subclasses.
 * Returns a promise that resolves with a generic HipChat message
 * Should reject with an error in subclassed implementations.
 * @param {Object} reqData - the HipChat request body
 * @returns {HipChatBot.Deferred}
 */
HipChatBot.prototype.parseReq = function (reqData) {

    var _this = this;
    var def = HipChatBot.Deferred();
    var sender = this.getSenderHandle(reqData);
    var message = this.getMessageText(reqData);

    if (!sender || !message) {
        def.reject(
            _this.buildResponse(_this.getBadHookMsg(sender), 'red')
        );
    } else {
        def.resolve(
            _this.buildResponse('oh hey, ' + sender + '. it\'s a generic bot.')
        );
    }

    return def.promise();
};

/**
 * Parses a chat message to return gif based on text after the slug.
 * Returns a promise that resolves with a HipChat message consisting of a link to an Imgur GIF.
 * Promise rejects with a HipChat message object containing an error indicating no GIFs were found.
 * @param {Object} reqData - the HipChat request body
 * @param {String} slug - optional, the slug to remove from the message, default is "/gif"
 * @returns {HipChatbot.Deferred}
 *
 */
HipChatBot.prototype.parseGifReq = function (reqData, slug) {

    var msg = this.getMessageText(reqData);
    var _this = this;
    var query;

    if (msg) {
        query = this.stripSlug(msg, slug) + Imgur.EXT_GIF;
        return this.findImg(query, reqData);
    }
    return HipChatBot.Deferred().reject(
        _this.buildResponse(_this.getBadHookMsg(), 'red')
    ).promise();
};

/**
 * Searches Imgur API for an image, returning a promise.
 * The promise resolves with a HipChat response message containing a link to an Imgur image.
 * The promise rejects with a HipChat error response if no images could be found.
 * @param {String} query - what you're searching for
 * @param {Object} reqData - the HipChat request body
 * @returns {HipChatBot.Deferred}
 */
HipChatBot.prototype.findImg = function (query, reqData) {

    var _this = this;
    var imgur = new Imgur(this.imgurID);
    var def = HipChatBot.Deferred();
    var handle = this.getSenderHandle(reqData);
    var errorMsg;

    imgur.getRandomFromSearch(encodeURIComponent(query))
        .done(function (resp) {
            def.resolve(_this.buildResponse(resp.link));
        })
        .fail(function (resp) {
            switch (resp.status) {
                case 500 :
                    errorMsg = _this.get500Msg(handle);
                    break;
                case 200 :
                    errorMsg = _this.getNoResultsMsg(handle, resp.data.query);
                    break;
                default :
                    errorMsg = _this.getCustomErrorMsg(handle, resp.data.error);
                    break;
            }
            def.reject(_this.buildResponse(errorMsg, 'red'));
        });

    return def.promise();
};

/**
 * Builds a response object to be sent to HipChat.
 * @param {String} message
 * @param {String} color - optional, defaults to green
 * @param {Boolean} notify - optional, defaults to false
 * @returns {Object} response
 * @returns {String} response.color
 * @returns {String} response.message
 * @returns {String} response.message_format
 * @returns {Boolean} response.notify
 */
HipChatBot.prototype.buildResponse = function (message, color, notify, format) {
    return {
        color: color || 'green',
        message: message,
        'message_format': format || 'text',
        notify: !!notify
    }
};

/**
 * Remove the slug from a HipChat message string, returning the message.
 * @param {String} msg - the string of a HipChat message
 * @param {String} slug - the hook/slug of the message, ex: '/gif'
 * @returns {String}
 */
HipChatBot.prototype.stripSlug = function (msg, slug) {
    return _.last(msg.split(slug)).trim();
};

/**
 * Retrieves a sender handle from a HipChat request object.
 * @param {object} reqData - HipChat request body
 * @returns {string} - an appropriate recipient name for personalized responses
 */
HipChatBot.prototype.getSenderHandle = function (reqData) {
    var msg = this.getMessage(reqData);
    if (msg.from && _.isString(msg.from.name)) {
        return msg.from.name.split(' ')[0];
    }
    return null;
};

/**
 * Finds the message object in the HipChat request object.
 * @param {Object} reqData - hip chat request body
 * @returns {Object} - message object from a HipChat request
 */
HipChatBot.prototype.getMessage = function (reqData) {
    if (reqData && reqData.item) {
        return reqData.item.message || {};
    }
    return {};
};

/**
 * Finds the message string in the HipChat request object.
 * @param {Object} reqData - hip chat request body
 * @returns {String} - message string from a HipChat request
 */
HipChatBot.prototype.getMessageText = function (reqData) {
    return this.getMessage(reqData).message;
};

/**
 * Finds the message string in the HipChat request object,
 * removes the slug and separates it into lowercase fragments
 * @param {Object} reqData - hip chat request body
 * @param {String} slug - optional, the slug to be removed from the message
 * @returns {Array}
 */
HipChatBot.prototype.getMessageExploded = function (reqData, slug) {
    var message = this.getMessageText(reqData);
    message = this.stripSlug(message, slug).toLowerCase();
    return message.split(' ');
};

/**
 * Error message for no results found.
 * @param {String} sender - the user's first name or handle
 * @param {String} query
 * @returns {String}
 */
HipChatBot.prototype.getNoResultsMsg = function (sender, query) {
    return HipChatBot.ERROR_NO_RESULTS
        .replace('{n}', sender)
        .replace('{q}', unescape(query).replace(Imgur.EXT_GIF, ''));
};

/**
 * Builds an error message for missing or malformed WebHook data from HipChat.
 * @param {string} sender - the user's first name or handle
 * @returns {String}
 */
HipChatBot.prototype.getBadHookMsg = function (sender) {
    return HipChatBot.ERROR_BAD_HOOK.replace('{n}', sender || 'guys');
};

/**
 * Builds an error message for an internal server error.
 * @param {string} sender - the user's first name or handle
 * @returns {String}
 */
HipChatBot.prototype.get500Msg = function (sender) {
    return HipChatBot.ERROR_500.replace('{n}', sender);
};

/**
 * Builds an error message for other errors (403, invalid key, etc.).
 * @param {String} sender - the user's first name or handle
 * @param {String} error - custom error text you wish to append
 * @returns {String}
 */
HipChatBot.prototype.getCustomErrorMsg = function (sender, error) {
    return HipChatBot.ERROR_ROOT.replace('{n}', sender) + error;
}

module.exports = HipChatBot;
