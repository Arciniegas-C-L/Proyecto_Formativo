import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/http://127.0.0.1:8000/api/token/', {
    email,
    password,
  });
  return response.data;
};
