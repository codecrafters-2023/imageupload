const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Image = require('../models/Image');
const { verifyCloudinaryAsset } = require('../utils/cloudinaryValidator');
const stream = require('stream');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 5 } // 10MB limit
});

// Multiple image upload
router.post('/upload', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Process all files in parallel
        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        quality: 'auto:good',
                        format: 'webp',
                        transformation: [{ width: 1920, crop: 'limit' }]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                const bufferStream = new stream.PassThrough();
                bufferStream.end(file.buffer);
                bufferStream.pipe(uploadStream);
            });
        });

        const results = await Promise.all(uploadPromises);

        // Create image documents
        const imagesToCreate = results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            size: result.bytes
        }));

        const createdImages = await Image.insertMany(imagesToCreate);

        res.status(201).json(createdImages);
    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// Get all images
router.get('/images', async (req, res) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update image
// PUT: Update image
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ error: 'Image not found' });

        if (!req.file) return res.status(400).json({ error: 'No new image provided' });

        // Delete old image from Cloudinary
        await cloudinary.uploader.destroy(image.public_id, {
            resource_type: 'image',
            invalidate: true
        });

        // Upload new image
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                quality: 'auto:good',
                format: 'webp',
                transformation: [{ width: 1920, crop: 'limit' }]
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Update Error:', error);
                    return res.status(500).json({ error: 'Image update failed' });
                }

                // Update database record
                const updatedImage = await Image.findByIdAndUpdate(
                    req.params.id,
                    {
                        url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format,
                        size: result.bytes
                    },
                    { new: true } // Return updated document
                );

                res.json(updatedImage);
            }
        );

        // Pipe the new file buffer to Cloudinary
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);
        bufferStream.pipe(uploadStream);

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message || 'Update failed' });
    }
});

// Delete image
router.delete('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        // Add resource_type and verify Cloudinary config
        const cloudinaryResult = await cloudinary.uploader.destroy(image.public_id, {
            resource_type: 'image', // Explicitly specify resource type
            invalidate: true // Optional: CDN cache invalidation
        });

        console.log('Cloudinary Delete Result:', cloudinaryResult); // Debug log

        const cloudinaryVerification = await verifyCloudinaryAsset(image.public_id);
        if (!cloudinaryVerification.exists) {
            console.log('Cloudinary asset missing:', cloudinaryVerification.error);
            // Delete from DB anyway
            await Image.findByIdAndDelete(req.params.id);
            return res.json({
                message: 'Removed database entry (Cloudinary asset not found)'
            });
        }

        if (cloudinaryResult.result !== 'ok') {
            throw new Error(`Cloudinary error: ${cloudinaryResult.result}`);
        }

        await Image.findByIdAndDelete(req.params.id);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete Error Details:', {
            error: error.message,
            stack: error.stack,
            imageId: req.params.id
        });
        res.status(500).json({
            message: `Deletion failed: ${error.message}`
        });
    }
});

router.get('/test-cloudinary', async (req, res) => {
    try {
        const result = await cloudinary.api.resources({ max_results: 1 });
        res.json({ status: 'Working', details: result });
    } catch (error) {
        console.error('Cloudinary Test Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;