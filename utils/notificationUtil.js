import request from '@/api/request.js'

/**
 * 消息通知工具类
 */
class NotificationUtil {
  
  /**
   * 微信订阅消息模板ID配置
   * 注意：需要在微信公众平台获取实际的模板ID
   */
  static TEMPLATE_IDS = {
    // 订单相关
    ORDER_ACCEPTED: 'YOUR_TEMPLATE_ID_1',      // 订单接单通知
    SERVICE_STARTING: 'YOUR_TEMPLATE_ID_2',    // 服务开始提醒
    ORDER_COMPLETED: 'YOUR_TEMPLATE_ID_3',     // 服务完成通知
    ORDER_CANCELED: 'YOUR_TEMPLATE_ID_4',      // 订单取消通知
    
    // 支付相关
    PAYMENT_SUCCESS: 'YOUR_TEMPLATE_ID_5',     // 支付成功通知
    REFUND_SUCCESS: 'YOUR_TEMPLATE_ID_6',      // 退款成功通知
    
    // 其他
    COUPON_RECEIVED: 'YOUR_TEMPLATE_ID_7',     // 优惠券到账
    POINTS_CHANGED: 'YOUR_TEMPLATE_ID_8'       // 积分变动
  }
  
  /**
   * 请求订阅消息授权
   * @param {Array} templateCodes - 模板编码数组，如 ['ORDER_ACCEPTED', 'SERVICE_STARTING']
   * @returns {Promise<Object>} 授权结果
   */
  static async requestSubscribe(templateCodes = []) {
    try {
      // 将模板编码转换为模板ID
      const tmplIds = templateCodes
        .map(code => this.TEMPLATE_IDS[code])
        .filter(id => id && !id.startsWith('YOUR_'))
      
      if (tmplIds.length === 0) {
        console.warn('没有有效的订阅消息模板ID')
        return { success: false, message: '模板ID未配置' }
      }
      
      // 调用微信订阅消息API
      const result = await new Promise((resolve, reject) => {
        uni.requestSubscribeMessage({
          tmplIds: tmplIds,
          success: (res) => {
            console.log('订阅授权结果:', res)
            resolve(res)
          },
          fail: (err) => {
            console.error('订阅授权失败:', err)
            reject(err)
          }
        })
      })
      
      // 保存授权结果到后端
      for (let i = 0; i < tmplIds.length; i++) {
        const tmplId = tmplIds[i]
        const templateCode = templateCodes[i]
        
        if (result[tmplId] === 'accept') {
          try {
            await this.saveSubscribeAuth(tmplId, templateCode)
          } catch (error) {
            console.error('保存订阅授权失败:', error)
          }
        }
      }
      
      return { success: true, result }
      
    } catch (error) {
      console.error('请求订阅授权失败:', error)
      return { success: false, error }
    }
  }
  
  /**
   * 保存订阅授权到后端
   * @param {String} templateId - 微信模板ID
   * @param {String} templateCode - 模板编码
   */
  static async saveSubscribeAuth(templateId, templateCode) {
    try {
      await request({
        url: '/user/notifications/subscribe',
        method: 'POST',
        data: {
          templateId,
          templateCode
        }
      })
      console.log('订阅授权已保存:', templateCode)
    } catch (error) {
      console.error('保存订阅授权失败:', error)
      throw error
    }
  }
  
  /**
   * 获取消息统计
   * @returns {Promise<Object>} 统计数据
   */
  static async getStat() {
    try {
      const res = await request({
        url: '/user/notifications/stat',
        method: 'GET'
      })
      
      if (res.code === 200) {
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取消息统计失败:', error)
      return null
    }
  }
  
  /**
   * 更新TabBar消息徽标
   * @param {Number} tabIndex - TabBar索引（消息Tab在第3个位置，索引为2）
   */
  static async updateTabBarBadge(tabIndex = 2) {
    try {
      const stat = await this.getStat()
      
      if (stat && stat.unreadCount > 0) {
        uni.setTabBarBadge({
          index: tabIndex,
          text: String(stat.unreadCount > 99 ? '99+' : stat.unreadCount)
        })
      } else {
        uni.removeTabBarBadge({ index: tabIndex })
      }
    } catch (error) {
      console.error('更新TabBar徽标失败:', error)
    }
  }
  
  /**
   * 标记消息为已读
   * @param {Number} messageId - 消息ID
   */
  static async markAsRead(messageId) {
    try {
      await request({
        url: `/user/notifications/${messageId}/read`,
        method: 'PUT'
      })
      
      // 更新徽标
      this.updateTabBarBadge()
      
      return true
    } catch (error) {
      console.error('标记已读失败:', error)
      return false
    }
  }
  
  /**
   * 批量标记为已读
   * @param {Array} messageIds - 消息ID数组
   */
  static async batchMarkAsRead(messageIds) {
    try {
      await request({
        url: '/user/notifications/batch-read',
        method: 'PUT',
        data: messageIds
      })
      
      // 更新徽标
      this.updateTabBarBadge()
      
      return true
    } catch (error) {
      console.error('批量标记已读失败:', error)
      return false
    }
  }
  
  /**
   * 标记全部为已读
   * @param {String} type - 消息类型（可选）
   */
  static async markAllAsRead(type = '') {
    try {
      await request({
        url: '/user/notifications/read-all',
        method: 'PUT',
        data: { type }
      })
      
      // 更新徽标
      this.updateTabBarBadge()
      
      return true
    } catch (error) {
      console.error('全部标记已读失败:', error)
      return false
    }
  }
  
  /**
   * 删除消息
   * @param {Number} messageId - 消息ID
   */
  static async deleteMessage(messageId) {
    try {
      await request({
        url: `/user/notifications/${messageId}`,
        method: 'DELETE'
      })
      
      // 更新徽标
      this.updateTabBarBadge()
      
      return true
    } catch (error) {
      console.error('删除消息失败:', error)
      return false
    }
  }
  
  /**
   * 获取消息列表
   * @param {Object} params - 查询参数 { type, status, page, size }
   */
  static async getMessageList(params = {}) {
    try {
      const res = await request({
        url: '/user/notifications/list',
        method: 'GET',
        data: {
          type: params.type || '',
          status: params.status || '',
          page: params.page || 1,
          size: params.size || 20
        }
      })
      
      if (res.code === 200) {
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取消息列表失败:', error)
      return null
    }
  }
  
  /**
   * 获取消息详情（自动标记已读）
   * @param {Number} messageId - 消息ID
   */
  static async getMessageDetail(messageId) {
    try {
      const res = await request({
        url: `/user/notifications/${messageId}`,
        method: 'GET'
      })
      
      if (res.code === 200) {
        // 后端获取详情时会自动标记已读，所以这里更新徽标
        this.updateTabBarBadge()
        return res.data
      }
      return null
    } catch (error) {
      console.error('获取消息详情失败:', error)
      return null
    }
  }
  
  /**
   * 处理消息点击事件
   * @param {Object} message - 消息对象
   */
  static async handleMessageClick(message) {
    try {
      // 获取消息详情（会自动标记已读）
      if (message.status === 'UNREAD') {
        await this.getMessageDetail(message.id)
      }
      
      // 跳转到相关页面
      if (message.jumpUrl) {
        const params = message.jumpParams || {}
        const query = Object.keys(params)
          .map(key => `${key}=${params[key]}`)
          .join('&')
        
        uni.navigateTo({
          url: `${message.jumpUrl}${query ? '?' + query : ''}`,
          fail: (err) => {
            console.error('页面跳转失败:', err)
            uni.showToast({ title: '页面跳转失败', icon: 'none' })
          }
        })
      }
    } catch (error) {
      console.error('处理消息点击失败:', error)
    }
  }
}

export default NotificationUtil

