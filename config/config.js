// const apiConfig = {
// 	dev: { baseUrl: 'localhost:8083/front'},
// 	prod: { baseUrl: 'localhost:8083/front'}
// }

// export default apiConfig
export const baseURL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:38081/mini' 
  : 'http://localhost:38081/mini'