export const generateUUID8 = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};
export const generateUUID16 = () => {
  return `${Math.random()
    .toString(36)
    .substr(2, 16)
    .toUpperCase()}-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;
};
