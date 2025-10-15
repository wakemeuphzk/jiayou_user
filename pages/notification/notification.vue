<template>
  <view class="notification-page">
    <!-- 消息统计卡片 -->
    <view class="stat-card">
      <view class="stat-info">
        <text class="stat-count">{{ stat.unreadCount || 0 }}</text>
        <text class="stat-label">未读消息</text>
      </view>
      <button v-if="stat.unreadCount > 0" class="btn-mark-all" @click="markAllAsRead">全部已读</button>
    </view>

    <!-- 消息类型选项卡 -->
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.type"
        :class="['tab-item', { active: activeType === tab.type }]"
        @click="switchTab(tab.type)"
      >
        <text>{{ tab.name }}</text>
        <view v-if="getTabUnreadCount(tab.type) > 0" class="badge">{{ getTabUnreadCount(tab.type) }}</view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view 
      scroll-y 
      class="message-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view 
        v-for="item in messageList" 
        :key="item.id"
        :class="['message-item', { unread: item.status === 'UNREAD' }]"
        @click="handleMessageClick(item)"
      >
        <view class="message-main">
          <view class="message-header">
            <text class="message-title">{{ item.title }}</text>
            <text class="message-time">{{ formatTime(item.createdTime) }}</text>
          </view>
          <view class="message-content">{{ item.content }}</view>
          <view v-if="item.typeName" class="message-type">{{ item.typeName }}</view>
        </view>
        <view v-if="item.status === 'UNREAD'" class="unread-dot"></view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="load-more">加载中...</view>
      <view v-else-if="!hasMore && messageList.length > 0" class="no-more">没有更多了</view>

      <!-- 空状态 -->
      <view v-if="messageList.length === 0 && !loading" class="empty-state">
        <image src="/static/images/empty.png" class="empty-icon" mode="aspectFit" />
        <text class="empty-text">暂无消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import request from '@/api/request.js'

export default {
  data() {
    return {
      activeType: '', // 当前选中的消息类型
      stat: {
        unreadCount: 0,
        orderUnreadCount: 0,
        systemUnreadCount: 0,
        otherUnreadCount: 0
      },
      tabs: [
        { name: '全部', type: '' },
        { name: '订单', type: 'ORDER' },
        { name: '服务', type: 'SERVICE' },
        { name: '支付', type: 'PAYMENT' },
        { name: '系统', type: 'SYSTEM' }
      ],
      messageList: [],
      page: 1,
      size: 20,
      hasMore: true,
      loading: false,
      refreshing: false
    }
  },
  
  onLoad() {
    this.init()
  },
  
  onShow() {
    // 每次显示页面时刷新统计数据
    this.loadStat()
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.refresh()
  },
  
  methods: {
    // 初始化
    async init() {
      await this.loadStat()
      await this.loadMessageList()
    },
    
    // 刷新
    async refresh() {
      this.page = 1
      this.hasMore = true
      await this.loadStat()
      await this.loadMessageList()
      uni.stopPullDownRefresh()
    },
    
    // 下拉刷新事件
    async onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      await this.loadStat()
      await this.loadMessageList()
      this.refreshing = false
    },
    
    // 加载统计数据
    async loadStat() {
      try {
        const res = await request({
          url: '/notification/stat',
          method: 'GET'
        })
        
        if (res.code === 200) {
          this.stat = res.data
          this.updateTabBarBadge()
        }
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },
    
    // 加载消息列表
    async loadMessageList() {
      if (this.loading) return
      
      this.loading = true
      try {
        const res = await request({
          url: '/notification/list',
          method: 'GET',
          data: {
            type: this.activeType,
            page: this.page,
            size: this.size
          }
        })
        
        if (res.code === 200) {
          const newList = res.data.records || []
          
          if (this.page === 1) {
            this.messageList = newList
          } else {
            this.messageList = [...this.messageList, ...newList]
          }
          
          this.hasMore = newList.length >= this.size
        }
      } catch (error) {
        console.error('加载消息列表失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadMessageList()
    },
    
    // 切换选项卡
    switchTab(type) {
      if (this.activeType === type) return
      this.activeType = type
      this.page = 1
      this.hasMore = true
      this.messageList = []
      this.loadMessageList()
    },
    
    // 获取选项卡未读数
    getTabUnreadCount(type) {
      switch(type) {
        case '':
          return this.stat.unreadCount || 0
        case 'ORDER':
        case 'SERVICE':
          return this.stat.orderUnreadCount || 0
        case 'SYSTEM':
          return this.stat.systemUnreadCount || 0
        default:
          return this.stat.otherUnreadCount || 0
      }
    },
    
    // 点击消息
    async handleMessageClick(item) {
      try {
        // 标记为已读
        if (item.status === 'UNREAD') {
          await request({
            url: `/notification/${item.id}/read`,
            method: 'PUT'
          })
          
          // 更新本地数据
          item.status = 'READ'
          this.updateLocalStat(-1, item.type)
          this.updateTabBarBadge()
        }
        
        // 跳转到相关页面
        if (item.jumpUrl) {
          const params = item.jumpParams || {}
          const query = Object.keys(params)
            .map(key => `${key}=${params[key]}`)
            .join('&')
          
          uni.navigateTo({
            url: `${item.jumpUrl}${query ? '?' + query : ''}`
          })
        }
        
      } catch (error) {
        console.error('处理消息点击失败:', error)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    // 全部已读
    async markAllAsRead() {
      try {
        uni.showLoading({ title: '处理中...' })
        
        await request({
          url: '/notification/read-all',
          method: 'PUT',
          data: {
            type: this.activeType
          }
        })
        
        uni.hideLoading()
        uni.showToast({ title: '操作成功', icon: 'success' })
        
        // 刷新数据
        this.refresh()
        
      } catch (error) {
        uni.hideLoading()
        console.error('全部已读失败:', error)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    // 更新本地统计数据
    updateLocalStat(delta, messageType) {
      this.stat.unreadCount = Math.max(0, (this.stat.unreadCount || 0) + delta)
      
      if (messageType === 'ORDER' || messageType === 'SERVICE') {
        this.stat.orderUnreadCount = Math.max(0, (this.stat.orderUnreadCount || 0) + delta)
      } else if (messageType === 'SYSTEM') {
        this.stat.systemUnreadCount = Math.max(0, (this.stat.systemUnreadCount || 0) + delta)
      } else {
        this.stat.otherUnreadCount = Math.max(0, (this.stat.otherUnreadCount || 0) + delta)
      }
    },
    
    // 更新TabBar徽标
    updateTabBarBadge() {
      if (this.stat.unreadCount > 0) {
        uni.setTabBarBadge({
          index: 2, // 根据实际情况调整消息中心的TabBar索引
          text: String(this.stat.unreadCount > 99 ? '99+' : this.stat.unreadCount)
        })
      } else {
        uni.removeTabBarBadge({ index: 2 })
      }
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      
      const now = new Date()
      const target = new Date(time)
      const diff = Math.floor((now - target) / 1000) // 秒差
      
      if (diff < 60) {
        return '刚刚'
      } else if (diff < 3600) {
        return `${Math.floor(diff / 60)}分钟前`
      } else if (diff < 86400) {
        return `${Math.floor(diff / 3600)}小时前`
      } else if (diff < 172800) {
        return '昨天 ' + this.formatDateTime(target, 'HH:mm')
      } else if (diff < 604800) {
        return `${Math.floor(diff / 86400)}天前`
      } else {
        return this.formatDateTime(target, 'MM-DD HH:mm')
      }
    },
    
    // 格式化日期时间
    formatDateTime(date, format) {
      const o = {
        'M+': date.getMonth() + 1,
        'D+': date.getDate(),
        'H+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds()
      }
      
      for (let k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
          format = format.replace(
            RegExp.$1,
            RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
          )
        }
      }
      return format
    }
  }
}
</script>

<style scoped lang="scss">
.notification-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  
  .stat-info {
    display: flex;
    flex-direction: column;
  }
  
  .stat-count {
    font-size: 48rpx;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 10rpx;
  }
  
  .stat-label {
    font-size: 28rpx;
    opacity: 0.9;
  }
  
  .btn-mark-all {
    padding: 12rpx 24rpx;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border: 1rpx solid rgba(255, 255, 255, 0.5);
    border-radius: 40rpx;
    font-size: 26rpx;
    line-height: 1.5;
  }
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 30rpx;
  
  .tab-item {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx 0;
    font-size: 30rpx;
    color: #666;
    
    &.active {
      color: #667eea;
      font-weight: bold;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: #667eea;
        border-radius: 2rpx;
      }
    }
    
    .badge {
      position: absolute;
      top: 20rpx;
      right: 15%;
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      background: #ff4d4f;
      color: #fff;
      font-size: 20rpx;
      line-height: 32rpx;
      text-align: center;
      border-radius: 16rpx;
    }
  }
}

.message-list {
  height: calc(100vh - 340rpx);
}

.message-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 30rpx;
  margin: 20rpx 30rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  &.unread {
    background: linear-gradient(to right, #f0f5ff, #fff);
    border-left: 4rpx solid #667eea;
  }
  
  .message-main {
    flex: 1;
    overflow: hidden;
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
  }
  
  .message-title {
    flex: 1;
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .message-time {
    margin-left: 20rpx;
    font-size: 24rpx;
    color: #999;
    flex-shrink: 0;
  }
  
  .message-content {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 8rpx;
  }
  
  .message-type {
    display: inline-block;
    padding: 4rpx 12rpx;
    background: #f0f0f0;
    color: #666;
    font-size: 22rpx;
    border-radius: 4rpx;
  }
  
  .unread-dot {
    width: 16rpx;
    height: 16rpx;
    background: #ff4d4f;
    border-radius: 50%;
    margin-left: 20rpx;
    flex-shrink: 0;
  }
}

.load-more,
.no-more {
  padding: 30rpx;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  
  .empty-icon {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>

