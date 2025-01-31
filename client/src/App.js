import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageGallery from './components/ImageGallery';

function App() {
  const [images, setImages] = useState([]);

  const handleUploadSuccess = (newImages) => {
    setImages(newImages);
  };

  return (
    <div>
      <h1>Image Upload</h1>
      <ImageUpload onUpload={handleUploadSuccess} />
      <h2>Gallery</h2>
      <ImageGallery images={images} />
    </div>
  );
}

export default App;