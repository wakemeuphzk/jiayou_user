<template>
  <view class="my-cards">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @click="goBack">
        <uni-icons type="left" size="20" color="#333"></uni-icons>
      </view>
      <view class="navbar-title">我的次卡</view>
    </view>
    
    <!-- 标签页 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'active' }"
        @click="changeTab('active')"
      >
        有效({{ activeCards.length }})
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'expired' }"
        @click="changeTab('expired')"
      >
        已过期({{ expiredCards.length }})
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'used' }"
        @click="changeTab('used')"
      >
        已用完({{ usedUpCards.length }})
      </view>
    </view>
    
    <!-- 次卡列表 -->
    <scroll-view scroll-y class="cards-list">
      <!-- 加载中 -->
      <view v-if="loading" class="loading">
        <uni-icons type="spinner-cycle" size="40" color="#007aff"></uni-icons>
        <text>加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="!loading && currentCards.length === 0" class="empty">
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-text">
          {{ activeTab === 'active' ? '暂无有效次卡' : activeTab === 'expired' ? '暂无过期次卡' : '暂无已用完次卡' }}
        </text>
      </view>
      
      <!-- 次卡列表 -->
      <view v-else class="cards-container">
        <view 
          class="card-item" 
          v-for="card in currentCards" 
          :key="card.id"
          @click="viewCardDetail(card)"
        >
          <!-- 卡片背景 -->
          <view class="card-bg" :class="getCardClass(card)">
            <view class="card-header">
              <view class="card-name">{{ card.productName || card.name }}</view>
              <view class="card-status" :class="getStatusClass(card)">
                {{ getStatusText(card) }}
              </view>
            </view>
            
            <view class="card-body">
              <view class="card-info">
                <view class="info-item">
                  <text class="info-label">剩余次数</text>
                  <text class="info-value">{{ card.remainingTimes }}/{{ card.totalTimes }}次</text>
                </view>
                <view class="info-item">
                  <text class="info-label">有效期至</text>
                  <text class="info-value">{{ formatDate(card.expirationDate) }}</text>
                </view>
              </view>
              
              <!-- 进度条 -->
              <view class="progress-bar">
                <view 
                  class="progress-fill" 
                  :style="{ width: getProgress(card) + '%' }"
                ></view>
              </view>
            </view>
            
            <view class="card-footer">
              <view class="card-code">卡号：{{ card.cardNumber || card.id }}</view>
              <button 
                v-if="card.status === 'ACTIVE' && card.remainingTimes > 0"
                class="btn-use" 
                @click.stop="useCard(card)"
              >
                立即使用
              </button>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

const activeTab = ref('active');
const allCards = ref([]);
const loading = ref(true);

// 有效次卡
const activeCards = computed(() => {
  return allCards.value.filter(card => 
    card.status === 'ACTIVE' && 
    card.remainingTimes > 0 &&
    new Date(card.expirationDate) > new Date()
  );
});

// 已过期次卡
const expiredCards = computed(() => {
  return allCards.value.filter(card => 
    card.status === 'EXPIRED' || 
    (card.status === 'ACTIVE' && new Date(card.expirationDate) <= new Date())
  );
});

// 已用完次卡
const usedUpCards = computed(() => {
  return allCards.value.filter(card => 
    card.status === 'USED_UP' || 
    (card.status === 'ACTIVE' && card.remainingTimes === 0)
  );
});

// 当前显示的次卡列表
const currentCards = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return activeCards.value;
    case 'expired':
      return expiredCards.value;
    case 'used':
      return usedUpCards.value;
    default:
      return [];
  }
});

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 切换标签
const changeTab = (tab) => {
  activeTab.value = tab;
};

// 获取卡片样式类
const getCardClass = (card) => {
  if (card.status === 'ACTIVE' && card.remainingTimes > 0) {
    return 'card-active';
  }
  return 'card-inactive';
};

// 获取状态样式类
const getStatusClass = (card) => {
  if (card.status === 'ACTIVE' && card.remainingTimes > 0) {
    return 'status-active';
  } else if (card.status === 'EXPIRED') {
    return 'status-expired';
  } else if (card.remainingTimes === 0) {
    return 'status-used';
  }
  return 'status-inactive';
};

// 获取状态文本
const getStatusText = (card) => {
  if (card.status === 'EXPIRED' || new Date(card.expirationDate) <= new Date()) {
    return '已过期';
  } else if (card.remainingTimes === 0) {
    return '已用完';
  } else if (card.status === 'ACTIVE') {
    return '有效';
  }
  return '未知';
};

// 获取进度
const getProgress = (card) => {
  if (card.totalTimes === 0) return 0;
  return ((card.totalTimes - card.remainingTimes) / card.totalTimes * 100).toFixed(0);
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

// 查看次卡详情
const viewCardDetail = (card) => {
  // 暂时显示卡片信息
  uni.showModal({
    title: card.productName || card.name,
    content: `卡号：${card.cardNumber || card.id}\n剩余次数：${card.remainingTimes}/${card.totalTimes}\n有效期至：${formatDate(card.expirationDate)}`,
    showCancel: false
  });
};

// 使用次卡
const useCard = (card) => {
  uni.showModal({
    title: '使用次卡',
    content: '是否使用此次卡预约服务？',
    success: (res) => {
      if (res.confirm) {
        // 跳转到首页，让用户选择服务
        uni.switchTab({
          url: '/pages/index/index'
        });
      }
    }
  });
};

// 加载我的次卡列表
const loadMyCards = async () => {
  try {
    loading.value = true;
    
    const res = await request({
      url: '/user/service-cards/my-cards',
      method: 'GET',
      data: {
        page: 1,
        size: 100  // 获取所有次卡
      }
    });
    
    if (res.code === 200) {
      // 后端返回的是分页数据，需要取 records 字段
      const cards = res.data.records || res.data || [];
      
      // 字段映射：将后端字段转换为前端期望的字段
      allCards.value = cards.map(card => ({
        id: card.id,
        cardNumber: card.cardNo || card.id,
        productName: card.cardName,
        name: card.cardName,
        totalTimes: card.totalTimes,
        usedTimes: card.usedTimes,
        remainingTimes: card.remainingTimes,
        expirationDate: card.expireTime,
        status: card.status,
        cardType: card.cardType,
        purchaseAmount: card.purchaseAmount,
        singleServiceValue: card.singleServiceValue,
        applicableServices: card.applicableServices,
        createdTime: card.createdTime
      }));
      
      console.log('加载次卡成功，数量：', allCards.value.length);
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载次卡列表失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

onLoad(() => {
  // 检查登录状态
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showModal({
      title: '提示',
      content: '请先登录',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        } else {
          uni.navigateBack();
        }
      }
    });
    return;
  }
  
  loadMyCards();
});
</script>

<style scoped>
.my-cards {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  z-index: 1000;
}

.navbar-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 60rpx;
}

/* 标签页 */
.tabs {
  position: fixed;
  top: 88rpx;
  left: 0;
  right: 0;
  height: 88rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #e0e0e0;
  z-index: 999;
}

.tab-item {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 20rpx 0;
  position: relative;
}

.tab-item.active {
  color: #007aff;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007aff;
  border-radius: 2rpx;
}

/* 次卡列表 */
.cards-list {
  margin-top: 176rpx;
  height: calc(100vh - 176rpx);
  padding: 20rpx;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  gap: 20rpx;
}

.empty-image {
  width: 300rpx;
  height: 300rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 卡片样式 */
.card-item {
  margin-bottom: 20rpx;
}

.card-bg {
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.card-bg:active {
  transform: scale(0.98);
}

.card-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.card-inactive {
  background: linear-gradient(135deg, #bbb 0%, #999 100%);
  color: #fff;
  opacity: 0.7;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.card-name {
  font-size: 32rpx;
  font-weight: bold;
}

.card-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

.status-active {
  background-color: rgba(0, 255, 0, 0.3);
}

.status-expired {
  background-color: rgba(255, 0, 0, 0.3);
}

.status-used {
  background-color: rgba(128, 128, 128, 0.3);
}

.card-body {
  margin-bottom: 30rpx;
}

.card-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.info-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.info-value {
  font-size: 28rpx;
  font-weight: bold;
}

.progress-bar {
  height: 12rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-code {
  font-size: 24rpx;
  opacity: 0.8;
}

.btn-use {
  padding: 15rpx 40rpx;
  background-color: rgba(255, 255, 255, 0.9);
  color: #667eea;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 40rpx;
  border: none;
}
</style>

