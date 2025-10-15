import { baseURL } from '@/config/config.js'

const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: Object.assign(
      {
        'Content-Type': 'application/json',
        'token': uni.getStorageSync('token') || ''
      },
      options.headers || {} // 安全合并
      ),
      success: (res) => {
        if (res.code === 200 || res.data.code === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export default request