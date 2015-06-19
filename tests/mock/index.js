var imgurGallery = require('./imgurGallery');
var imgurSearch = require('./imgurSearch');
var imgurServiceErrors = require('./imgurServiceErrors');

module.exports = {
    imgur: {
        serviceError: {
            apiKey: JSON.stringify(imgurServiceErrors.apiKey),
            emptySearch: JSON.stringify(imgurServiceErrors.emptySearch),
            albumNotFound: JSON.stringify(imgurServiceErrors.albumNotFound)
        },
        album: JSON.stringify(imgurGallery),
        search:  JSON.stringify(imgurSearch)
    }
};
