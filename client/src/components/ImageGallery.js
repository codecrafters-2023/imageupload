// import React, { useEffect, useState } from 'react';
// // import { getImages } from '../api/imageService';
// import { getImages, deleteImage, updateImage } from '../api/imageService';

// const ImageGallery = () => {
//     const [images, setImages] = useState([]);

//     useEffect(() => {
//         const fetchImages = async () => {
//             try {
//                 const { data } = await getImages();
//                 setImages(data);
//             } catch (error) {
//                 console.error('Error fetching images:', error);
//             }
//         };
//         fetchImages();
//     }, []);

//     const handleDelete = async (id) => {
//         try {
//             const confirmDelete = window.confirm('Are you sure you want to delete this image?');
//             if (!confirmDelete) return;

//             const response = await deleteImage(id);

//             if (response.data.message === 'Image deleted successfully') {
//                 setImages(prev => prev.filter(img => img._id !== id));
//                 alert('Image deleted successfully');
//             } else {
//                 throw new Error('Unexpected response from server');
//             }
//         } catch (error) {
//             console.log(`Delete failed: ${error.response?.data?.message || error.message}`);
//             console.error('Delete Error Details:', {
//                 error,
//                 imageId: id
//             });
//         }
//     };

//     const handleUpdate = async (id, file) => {
//         try {
//             const formData = new FormData();
//             formData.append('image', file);

//             const { data: updatedImage } = await updateImage(id, formData);
//             setImages(images.map(img => img._id === id ? updatedImage : img));
//         } catch (error) {
//             console.error('Update failed:', error);
//         }
//     };

//     return (
//         <div className="gallery">
//             {images.map((image) => (
//                 <div key={image._id} className="image-item">
//                     <img src={image.url} alt="Uploaded content" style={{ width: "200px", height: "200px", objectFit: "cover" }} />
//                     <button onClick={() => handleDelete(image._id)}>Delete</button>
//                     <input
//                         type="file"
//                         onChange={(e) => handleUpdate(image._id, e.target.files[0])}
//                     />
//                 </div>
//             ))}
//         </div>
//     );
// };

// export default ImageGallery;


import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { getImages, deleteImage, updateImage } from '../api/imageService';
import 'react-lazy-load-image-component/src/effects/blur.css';
import '../App.css'

const ImageGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedUpdates, setSelectedUpdates] = useState({});

    useEffect(() => {
        const loadImages = async () => {
            try {
                const response = await getImages();
                setImages(response.data);
            } catch (error) {
                console.error('Load Error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadImages();
    }, [images]);

    const handleDelete = async (id, publicId) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await deleteImage(id);
            setImages(prev => prev.filter(img => img._id !== id));
        } catch (error) {
            console.error('Delete Error:', error);
            alert(`Delete failed: ${error.response?.data?.error || error.message}`);
        }
    };

    // Handle file selection for update
    const handleFileSelect = (id, file) => {
        if (!file) return;

        const preview = URL.createObjectURL(file);
        setSelectedUpdates(prev => ({
            ...prev,
            [id]: { file, preview }
        }));
    };

    const handleUpdate = async (id) => {
        const updateData = selectedUpdates[id];
        if (!updateData?.file) return;

        try {
            setUpdatingId(id);
            const formData = new FormData();
            formData.append('image', updateData.file);

            const { data: updatedImage } = await updateImage(id, formData);

            setImages(prev => prev.map(img =>
                img._id === id ? updatedImage : img
            ));

            // Clear update state
            setSelectedUpdates(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } catch (error) {
            console.error('Update Error:', error);
            alert(`Update failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setUpdatingId(null);
            URL.revokeObjectURL(updateData.preview); // Cleanup
        }
    };

    if (loading) return <div className="loading">Loading images...</div>;

    return (
        // <div className="image-grid">
        //     {images.map((image) => (
        //         <div key={image._id} className="image-card">
        //             <LazyLoadImage
        //                 src={image.url}
        //                 effect="blur"
        //                 width="100%"
        //                 height="auto"
        //                 alt="Uploaded content"
        //                 className="grid-image"
        //             />

        //             <div className="image-info">
        //                 <label className="update-label">
        //                     <input
        //                         type="file"
        //                         accept="image/*"
        //                         onChange={(e) => handleFileSelect(image._id, e.target.files[0])}
        //                         disabled={isUpdating}
        //                     />
        //                     {updatingId === image._id ? 'Updating...' : 'Replace'}
        //                     Select
        //                 </label>

        //                 <button
        //                     onClick={() => handleUpdate(image._id)}
        //                     disabled={!hasUpdate || isUpdating}
        //                     className="update-button"
        //                 >
        //                     Apply Update
        //                 </button>

        //                 <button
        //                     onClick={() => handleDelete(image._id, image.public_id)}
        //                     className="delete-button"
        //                 >
        //                     Delete
        //                 </button>
        //             </div>
        //         </div>
        //     ))}
        // </div>
        <div className="image-grid">
            {images.map((image) => {
                const isUpdating = updatingId === image._id;
                const hasUpdate = selectedUpdates[image._id];

                return (
                    <div key={image._id} className="image-card">
                        <div className="image-container">
                            {isUpdating && (
                                <div className="updating-overlay">
                                    <div className="spinner"></div>
                                    <span>Updating...</span>
                                </div>
                            )}

                            <div>
                                <LazyLoadImage
                                    src={image.url}
                                    effect="blur"
                                    width="100%"
                                    height="auto"
                                    alt="Current version"
                                />

                                {/* {hasUpdate && (
                                    <div className="update-preview">
                                        <img
                                            src={selectedUpdates[image._id].preview}
                                            alt="Update preview"
                                        />
                                        <div className="preview-label">New Version</div>
                                    </div>
                                )} */}
                            </div>

                            <div className="image-info">
                                <label className="file-label">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(image._id, e.target.files[0])}
                                        disabled={isUpdating}
                                    />
                                    Select Update
                                </label>

                                <button
                                    onClick={() => handleUpdate(image._id)}
                                    disabled={!hasUpdate || isUpdating}
                                    className="update-button"
                                >
                                    Apply Update
                                </button>

                                <button
                                    onClick={() => handleDelete(image._id)}
                                    disabled={isUpdating}
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* <div className="image-meta">
                            <span>{(image.size / 1024).toFixed(2)} KB</span>
                            <span>{(image.format || 'unknown').toUpperCase()}</span>
                        </div> */}
                    </div>
                );
            })}
        </div>
    );
};

export default ImageGallery;