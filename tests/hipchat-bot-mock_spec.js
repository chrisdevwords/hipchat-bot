var should = require('should'),
    HipChatBot = require('../lib/hipchat-bot');

describe('HipChatBotMock getHook', function () {

    it('should provide a default "event" if one is not provided', function (done) {
        var hook = JSON.parse(HipChatBot.Mock.getHook());
        hook.event.should.be.a.string;
        done();
    });

    it('should provide a default "name" if one is not provided', function (done) {
        var hook = JSON.parse(HipChatBot.Mock.getHook());
        hook.item.message.from.name.should.be.a.string;
        done();
    });

    it('should provide a default message if one is not provided', function (done) {
        var hook = JSON.parse(HipChatBot.Mock.getHook());
        hook.item.message.message.should.be.a.string;
        done();
    });
});
