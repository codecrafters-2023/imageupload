import axios from 'axios';

const API = axios.create({
    // baseURL: 'http://localhost:5000/api'
    baseURL: 'https://imageupload-h8p9.onrender.com/api'
});

export const uploadImage = (formData) => API.post('/upload', formData);
export const getImages = () => API.get('/images');
export const updateImage = (id, formData) => API.put(`/${id}`, formData);
export const deleteImage = (id) => API.delete(`/${id}`);
