// utils/cloudinaryValidator.js
const cloudinary = require('../config/cloudinary');

const verifyCloudinaryAsset = async (public_id) => {
    try {
        const result = await cloudinary.api.resource(public_id);
        return {
            exists: true,
            public_id: result.public_id,
            type: result.resource_type
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
};

module.exports = { verifyCloudinaryAsset };