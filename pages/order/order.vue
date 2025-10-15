<template>
  <view class="container">
    <!-- 左侧导航 -->
    <view class="nav-container">
      <view 
        v-for="tab in tabs" 
        :key="tab.value"
        class="nav-item"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 右侧内容 -->
    <scroll-view class="content-container" scroll-y @scrolltolower="loadMore">
      <!-- 加载中 -->
      <view v-if="loading && orders.length === 0" class="loading-box">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 订单列表 -->
      <view v-else-if="orders.length > 0" class="order-list">
      <view 
          v-for="order in orders" 
        :key="order.id"
          class="order-card"
          @click="goToDetail(order.id)"
        >
          <!-- 待支付订单显示倒计时 -->
          <view v-if="order.status === 'PENDING_PAYMENT' && order.countdownText" class="order-countdown">
            <text class="countdown-label">⏰ 剩余支付时间：</text>
            <text class="countdown-value">{{ order.countdownText }}</text>
          </view>
          
          <!-- 订单头部 -->
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
            <text class="order-status" :class="'status-' + order.status">
              {{ order.statusDesc }}
          </text>
        </view>

          <!-- 订单内容 -->
          <view class="order-content">
            <view class="service-info">
              <text class="service-name">{{ order.serviceTypeName }}</text>
              <text class="service-time">服务时间：{{ formatDateTime(order.serviceTime) }}</text>
              <text class="service-address">服务地址：{{ order.serviceAddress }}</text>
              <text class="service-hours">服务时长：{{ order.serviceHours }}小时</text>
              
              <!-- 核验码显示（已接单和服务中状态） -->
              <view v-if="(order.status === 'ACCEPTED' || order.status === 'STARTED') && order.verificationCode" class="verification-code-box">
                <text class="verification-label">🔐 核验码</text>
                <text class="verification-code">{{ order.verificationCode }}</text>
        </view>
      </view>
          </view>

          <!-- 订单底部 -->
          <view class="order-footer">
            <view class="footer-left">
              <text class="amount-label">订单金额</text>
              <text class="amount-value">¥{{ order.totalAmount }}</text>
          </view>
            
            <view class="footer-right">
              <!-- 待支付：立即支付 + 取消订单 -->
              <template v-if="order.status === 'PENDING_PAYMENT'">
                <button class="btn-cancel" @click.stop="cancelOrder(order)">取消</button>
                <button class="btn-pay" @click.stop="payOrder(order)">立即支付</button>
              </template>

              <!-- 待接单：取消订单 -->
              <template v-else-if="order.status === 'PENDING'">
                <button class="btn-cancel" @click.stop="cancelOrder(order)">取消订单</button>
              </template>

              <!-- 已接单：取消订单 + 联系阿姨 -->
              <template v-else-if="order.status === 'ACCEPTED'">
                <button class="btn-cancel" @click.stop="cancelOrder(order)">取消</button>
                <button class="btn-contact" @click.stop="contactStaff(order)">联系阿姨</button>
              </template>

              <!-- 服务中：联系阿姨 -->
              <template v-else-if="order.status === 'STARTED'">
                <button class="btn-contact" @click.stop="contactStaff(order)">联系阿姨</button>
              </template>

              <!-- 已完成：评价订单 + 再次预约 -->
              <template v-else-if="order.status === 'COMPLETED'">
                <button v-if="!order.reviewed" class="btn-review" @click.stop="reviewOrder(order)">评价</button>
                <button class="btn-rebook" @click.stop="bookAgain(order)">再次预约</button>
              </template>
          </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-box">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">加载更多...</text>
      </view>
      
      <view v-if="!hasMore && orders.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
    </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import request from '../../api/request';

// Tab 定义
const tabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '待接单', value: 'PENDING' },
  { label: '已接单', value: 'ACCEPTED' },
  { label: '服务中', value: 'STARTED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
];

// 状态
const activeTab = ref('');
const orders = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(10);
const total = ref(0);
const hasMore = ref(true);
const countdownTimers = ref({});

// 格式化日期时间
const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化倒计时
const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
};

// 切换 Tab
const switchTab = (value) => {
  activeTab.value = value;
  page.value = 1;
  orders.value = [];
  loadOrders();
};

// 加载订单列表
const loadOrders = async (isLoadMore = false) => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
    return;
  }

  if (loading.value) return;

  try {
    loading.value = true;

    const params = {
      page: page.value,
      size: size.value
    };
    
    // 如果不是全部，则传递状态参数
    if (activeTab.value) {
      params.status = activeTab.value;
    }

    const res = await request({
      url: '/user/order',
      method: 'GET',
      data: params
    });

    if (res.code === 200 && res.data) {
      const data = res.data;
      const records = data.records || [];
      
      // 处理订单数据
      const processedRecords = records.map(order => {
        // 处理待支付订单的倒计时
        if (order.status === 'PENDING_PAYMENT' && order.createTime) {
          const createTime = new Date(order.createTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createTime) / 1000);
          const remaining = Math.max(0, 15 * 60 - elapsed); // 15分钟倒计时
          
  return {
            ...order,
            remainingSeconds: remaining,
            countdownText: formatCountdown(remaining)
          };
        }
        return order;
      });

      if (isLoadMore) {
        orders.value = [...orders.value, ...processedRecords];
      } else {
        orders.value = processedRecords;
      }

      total.value = data.total || 0;
      hasMore.value = data.hasNext || false;
      
      // 启动倒计时
      startAllCountdowns();
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载订单列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadOrders(true);
};

// 启动所有倒计时
const startAllCountdowns = () => {
  stopAllCountdowns();
  
  orders.value.forEach(order => {
    if (order.status === 'PENDING_PAYMENT' && order.remainingSeconds > 0) {
      countdownTimers.value[order.id] = setInterval(() => {
        order.remainingSeconds--;
        order.countdownText = formatCountdown(order.remainingSeconds);
        
        if (order.remainingSeconds <= 0) {
          clearInterval(countdownTimers.value[order.id]);
          delete countdownTimers.value[order.id];
          
          // 刷新订单列表
          setTimeout(() => {
            page.value = 1;
            loadOrders();
          }, 2000);
        }
      }, 1000);
    }
  });
};

// 停止所有倒计时
const stopAllCountdowns = () => {
  Object.values(countdownTimers.value).forEach(timer => {
    if (timer) clearInterval(timer);
  });
  countdownTimers.value = {};
};

// 跳转到订单详情
const goToDetail = (orderId) => {
  uni.navigateTo({
    url: `/pages/order/detail?id=${orderId}`
  });
};

// 取消订单
const cancelOrder = (order) => {
  uni.navigateTo({
    url: `/pages/order/detail?id=${order.id}`
  });
};

// 支付订单
const payOrder = (order) => {
  uni.showModal({
    title: '提示',
    content: '支付功能开发中',
    showCancel: false
  });
};

// 联系阿姨
const contactStaff = (order) => {
  if (order.staffInfo && order.staffInfo.phone) {
    uni.makePhoneCall({
      phoneNumber: order.staffInfo.phone
    });
  } else {
    uni.showToast({
      title: '暂无阿姨联系方式',
      icon: 'none'
    });
  }
};

// 评价订单
const reviewOrder = (order) => {
  uni.navigateTo({
    url: `/pages/rating/create?orderId=${order.id}`
  });
};

// 再次预约
const bookAgain = (order) => {
  uni.navigateTo({
    url: `/pages/service/detail?id=${order.serviceTypeId || order.productId}`
  });
};

// 监听评价完成事件
uni.$on('orderRated', () => {
  page.value = 1;
  loadOrders();
});

onLoad((options) => {
  // 支持从其他页面传入初始状态
  if (options.status) {
    activeTab.value = options.status;
  }
  loadOrders();
});

onShow(() => {
  // 从详情页返回时刷新列表
  page.value = 1;
  loadOrders();
});

onUnload(() => {
  stopAllCountdowns();
  uni.$off('orderRated');
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  height: 100vh;
  background-color: #f7f8fa;
}

/* 左侧导航 */
.nav-container {
  width: 180rpx;
  background-color: #fff;
  border-right: 1rpx solid #e5e5e5;
}

  .nav-item {
  padding: 40rpx 20rpx;
    font-size: 28rpx;
    color: #666;
    text-align: center;
    transition: all 0.3s;
  position: relative;
}

.nav-item.active {
      color: #007aff;
  font-weight: bold;
      background-color: #f0f7ff;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 40rpx;
  background: linear-gradient(180deg, #007aff 0%, #0056d6 100%);
  border-radius: 0 6rpx 6rpx 0;
}

/* 右侧内容 */
.content-container {
  flex: 1;
  padding: 20rpx;
  background-color: #f7f8fa;
}

/* 加载状态 */
.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 空状态 */
.empty-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 订单列表 */
.order-list {
  padding-bottom: 20rpx;
}

/* 订单卡片 */
.order-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

.order-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

/* 倒计时 */
.order-countdown {
  background: linear-gradient(135deg, #FFF7E6 0%, #FFE7BA 100%);
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #FFD966;
}

.countdown-label {
  font-size: 26rpx;
  color: #8B5A00;
  margin-right: 10rpx;
}

.countdown-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF6B00;
}

/* 订单头部 */
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  padding: 24rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

    .order-no {
  font-size: 24rpx;
      color: #999;
    }

    .order-status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-weight: bold;
}

.status-PENDING_PAYMENT {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  color: #F57C00;
}

.status-PENDING {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  color: #1976D2;
}

.status-ACCEPTED {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  color: #388E3C;
}

.status-STARTED {
  background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%);
  color: #F57F17;
}

.status-COMPLETED {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  color: #2E7D32;
}

.status-CANCELLED {
  background: linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%);
  color: #616161;
}

/* 订单内容 */
.order-content {
  padding: 24rpx 30rpx;
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

    .service-name {
      font-size: 32rpx;
  font-weight: bold;
      color: #333;
  margin-bottom: 8rpx;
    }

.service-time,
.service-address,
.service-hours {
      font-size: 26rpx;
      color: #666;
  line-height: 1.6;
}

/* 核验码 */
.verification-code-box {
  margin-top: 16rpx;
  padding: 16rpx;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 12rpx;
  border: 2rpx solid #81C784;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.verification-label {
  font-size: 26rpx;
  color: #2E7D32;
  font-weight: bold;
}

.verification-code {
  font-size: 36rpx;
  font-weight: bold;
  color: #1B5E20;
  letter-spacing: 4rpx;
  font-family: 'Courier New', monospace;
}

/* 订单底部 */
  .order-footer {
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.amount-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.amount-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.footer-right {
  display: flex;
  align-items: center;
}

/* 操作按钮统一样式 */
.footer-right button {
  padding: 0 24rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
  margin-left: 12rpx;
  transition: all 0.3s;
}

.footer-right button::after {
  border: none;
}

/* 取消按钮 */
.btn-cancel {
  background: #fff;
  color: #999;
  border: 2rpx solid #e5e5e5;
}

/* 支付按钮 */
.btn-pay {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

/* 联系阿姨按钮 */
.btn-contact {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

/* 评价按钮 */
.btn-review {
  background: #fff;
  color: #667eea;
  border: 2rpx solid #667eea;
}

/* 再次预约按钮 */
.btn-rebook {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

/* 加载更多 */
.load-more,
.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}

.load-more-text,
.no-more-text {
  font-size: 26rpx;
  color: #999;
}
</style>