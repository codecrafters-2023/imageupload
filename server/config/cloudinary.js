const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dg7sjoect',
    api_key: '568186538692724',
    api_secret: 'q_UPlKwqYxkASjxB4kkHWxKapLg'
});

module.exports = cloudinary;