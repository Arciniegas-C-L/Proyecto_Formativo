import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/usuario/login/', {
    email,
    password,
  });
  return response.data;
};
