// import React, { useState } from 'react';
// import { uploadImage, getImages } from '../api/imageService';

// const ImageUpload = ({ onUploadSuccess }) => {
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [preview, setPreview] = useState('');

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!selectedFile) return;

//         const formData = new FormData();
//         formData.append('image', selectedFile);

//         try {
//             const response = await uploadImage(formData);
//             console.log(response, 'upload');

//             const { data } = await getImages();
//             onUploadSuccess(data);
//             setSelectedFile(null);

//             if (response.status === 201) {
//                 alert('Uploaded image successfully')
//             }
//         } catch (error) {
//             console.error('Upload failed:', error);
//         }
//     };

//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             setSelectedFile(file);
//             const reader = new FileReader();
//             reader.onloadend = () => setPreview(reader.result);
//             reader.readAsDataURL(file);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit}>
//             {preview && <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />}
//             <input
//                 type="file"
//                 onChange={(e) => setSelectedFile(e.target.files[0])}
//             />
//             <button type="submit">Upload</button>
//         </form>
//     );
// };

// export default ImageUpload;

import React, { useState } from 'react';
import { uploadImage } from '../api/imageService';
import imageCompression from 'browser-image-compression';
import PropTypes from 'prop-types';

const ImageUpload = ({ onUpload }) => {
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState([]);
    const [overallProgress, setOverallProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const compressFiles = async (files) => {
        return Promise.all(
            files.map(file =>
                imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                }).catch(error => file) // Fallback to original
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0 || isUploading) return;

        setIsUploading(true);
        setOverallProgress(0);

        try {
            const compressedFiles = await compressFiles(files);
            const formData = new FormData();

            compressedFiles.forEach(file => {
                formData.append('images', file);
            });

            const response = await uploadImage(formData, {
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setOverallProgress(percent);
                }
            });

            if (typeof onUpload === 'function') {
                onUpload(response.data);
            }

            setFiles([]);
            setPreview([]);
        } catch (error) {
            console.error('Upload Error:', error);
            alert(`Upload failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUploading(false);
            setOverallProgress(0);
        }    
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 5) {
            alert('Maximum 5 files allowed');
            return;
        }

        setFiles(selectedFiles);
        setPreview(selectedFiles.map(file => URL.createObjectURL(file)));
    };

    return (
        <div className="upload-container">
            <form onSubmit={handleSubmit}>
                <label className="file-input-label">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    />
                    Choose Files (Max 5)
                </label>

                <div className="preview-grid">
                    {preview?.map((preview, index) => (
                        <div key={index} className="preview-item">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="preview-image"
                            />
                            <span className="file-info">
                                {files[index].name} -
                                {(files[index].size / 1024 / 1024).toFixed(2)}MB
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={files.length === 0 || isUploading}
                    className="upload-button"
                >
                    {isUploading ? (
                        `Uploading... ${overallProgress}%`
                    ) : (
                        `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
                    )}
                </button>
            </form>
        </div>
    );
};

ImageUpload.propTypes = {
    onUpload: PropTypes.func
};

export default ImageUpload;