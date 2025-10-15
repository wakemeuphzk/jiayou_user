<template>
  <view class="wallet-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @click="goBack">
        <uni-icons type="left" size="20" color="#fff"></uni-icons>
      </view>
      <view class="navbar-title">我的钱包</view>
    </view>
    
    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-label">钱包余额（元）</text>
        <view class="balance-actions">
          <button class="btn-action" @click="goToRecharge">充值</button>
        </view>
      </view>
      <view class="balance-amount">
        <text class="currency">¥</text>
        <text class="amount">{{ walletInfo.balance || '0.00' }}</text>
      </view>
      <view class="balance-info">
        <view class="info-item">
          <text class="info-label">冻结金额</text>
          <text class="info-value">¥{{ walletInfo.frozenAmount || '0.00' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">累计消费</text>
          <text class="info-value">¥{{ walletInfo.totalExpense || '0.00' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @click="goToBalanceChanges">
        <image class="menu-icon" src="/static/images/icon_wallet.png" />
        <text class="menu-text">余额明细</text>
        <image class="arrow-icon" src="/static/images/ic_arrow.png" />
      </view>
      
      <view class="menu-item" @click="goToTransactions">
        <image class="menu-icon" src="/static/images/ic_list.png" />
        <text class="menu-text">交易记录</text>
        <image class="arrow-icon" src="/static/images/ic_arrow.png" />
      </view>
    </view>

    <!-- 余额明细弹窗 -->
    <uni-popup ref="balancePopup" type="bottom" :is-mask-click="true">
      <view class="balance-popup">
        <view class="popup-header">
          <text class="popup-title">余额明细</text>
          <image class="close-icon" src="/static/images/icon_close.png" @click="closeBalancePopup" />
        </view>
        
        <scroll-view 
          scroll-y 
          class="balance-list" 
          @scrolltolower="loadMoreBalanceChanges"
        >
          <view v-for="item in balanceChanges" :key="item.id" class="balance-item">
            <view class="item-info">
              <text class="item-type">{{ item.typeDesc }}</text>
              <text class="item-desc">{{ item.description || '无' }}</text>
              <text class="item-time">{{ formatDateTime(item.createdTime) }}</text>
            </view>
            <view class="item-amount">
              <text class="amount" :class="item.changeAmount > 0 ? 'income' : 'expense'">
                {{ item.changeAmount > 0 ? '+' : '' }}¥{{ Math.abs(item.changeAmount).toFixed(2) }}
              </text>
              <text class="balance-after">余额¥{{ item.balanceAfter }}</text>
            </view>
          </view>
          
          <view v-if="balanceChanges.length === 0" class="empty-state">
            <image src="/static/images/empty.png" class="empty-icon" />
            <text class="empty-text">暂无余额变动记录</text>
          </view>
          
          <view v-if="hasMoreBalance && balanceChanges.length > 0" class="loading-more">
            <text>加载更多...</text>
          </view>
          
          <view v-if="!hasMoreBalance && balanceChanges.length > 0" class="no-more">
            <text>没有更多了</text>
          </view>
        </scroll-view>
      </view>
    </uni-popup>

    <!-- 交易记录弹窗 -->
    <uni-popup ref="transactionPopup" type="bottom" :is-mask-click="true">
      <view class="transaction-popup">
        <view class="popup-header">
          <text class="popup-title">交易记录</text>
          <image class="close-icon" src="/static/images/icon_close.png" @click="closeTransactionPopup" />
        </view>
        
        <!-- 交易类型筛选 -->
        <view class="transaction-filter">
          <view 
            v-for="type in transactionTypes" 
            :key="type.key"
            class="filter-item"
            :class="{ active: currentType === type.key }"
            @click="changeTransactionType(type.key)"
          >
            {{ type.label }}
          </view>
        </view>
        
        <scroll-view 
          scroll-y 
          class="transaction-list"
          @scrolltolower="loadMoreTransactions"
        >
          <view v-for="item in transactions" :key="item.id" class="transaction-item">
            <view class="item-info">
              <text class="item-type">{{ item.typeDesc }}</text>
              <text class="item-desc">{{ item.description || '无' }}</text>
              <text class="item-time">{{ formatDateTime(item.createdTime) }}</text>
            </view>
            <view class="item-amount">
              <text class="amount" :class="getAmountClass(item.type)">
                {{ getAmountPrefix(item.type) }}¥{{ item.amount }}
              </text>
              <text class="status" :class="getStatusClass(item.status)">{{ item.statusDesc }}</text>
            </view>
          </view>
          
          <view v-if="transactions.length === 0" class="empty-state">
            <image src="/static/images/empty.png" class="empty-icon" />
            <text class="empty-text">暂无交易记录</text>
          </view>
          
          <view v-if="hasMoreTransaction && transactions.length > 0" class="loading-more">
            <text>加载更多...</text>
          </view>
          
          <view v-if="!hasMoreTransaction && transactions.length > 0" class="no-more">
            <text>没有更多了</text>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

// 响应式数据
const walletInfo = ref({});
const balanceChanges = ref([]);
const transactions = ref([]);
const balancePopup = ref(null);
const transactionPopup = ref(null);
const currentType = ref('ALL');

// 分页参数
const balancePagination = reactive({
  page: 1,
  size: 10,
  hasMore: true
});

const transactionPagination = reactive({
  page: 1,
  size: 10,
  hasMore: true
});

const hasMoreBalance = ref(true);
const hasMoreTransaction = ref(true);

// 交易类型筛选
const transactionTypes = [
  { key: 'ALL', label: '全部' },
  { key: 'RECHARGE', label: '充值' },
  { key: 'PAYMENT', label: '支付' },
  { key: 'REFUND', label: '退款' }
];

// 页面加载
onLoad(() => {
  loadWalletInfo();
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 加载钱包信息
const loadWalletInfo = async () => {
  try {
    const res = await request({
      url: '/user/wallet',
      method: 'GET'
    });
    
    if (res.code === 200) {
      walletInfo.value = res.data || {};
    } else {
      uni.showToast({
        title: res.message || '获取钱包信息失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取钱包信息失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 跳转到充值页面
const goToRecharge = () => {
  uni.navigateTo({
    url: '/pages/recharge/recharge'
  });
};

// 跳转到余额明细
const goToBalanceChanges = () => {
  balanceChanges.value = [];
  balancePagination.page = 1;
  hasMoreBalance.value = true;
  loadBalanceChanges();
  balancePopup.value.open();
};

// 跳转到交易记录
const goToTransactions = () => {
  transactions.value = [];
  transactionPagination.page = 1;
  hasMoreTransaction.value = true;
  currentType.value = 'ALL';
  loadTransactions();
  transactionPopup.value.open();
};

// 加载余额明细
const loadBalanceChanges = async () => {
  if (!hasMoreBalance.value) return;
  
  try {
    const res = await request({
      url: '/user/wallet/balance-changes',
      method: 'GET',
      data: {
        page: balancePagination.page,
        size: balancePagination.size
      }
    });
    
    if (res.code === 200) {
      const data = res.data;
      const newRecords = data.records || [];
      
      if (balancePagination.page === 1) {
        balanceChanges.value = newRecords;
      } else {
        balanceChanges.value = [...balanceChanges.value, ...newRecords];
      }
      
      hasMoreBalance.value = data.current < data.pages;
    } else {
      uni.showToast({
        title: res.message || '获取余额明细失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取余额明细失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 加载更多余额明细
const loadMoreBalanceChanges = () => {
  if (hasMoreBalance.value) {
    balancePagination.page += 1;
    loadBalanceChanges();
  }
};

// 加载交易记录
const loadTransactions = async () => {
  if (!hasMoreTransaction.value) return;
  
  try {
    const params = {
      page: transactionPagination.page,
      size: transactionPagination.size
    };
    
    if (currentType.value !== 'ALL') {
      params.type = currentType.value;
    }
    
    const res = await request({
      url: '/user/wallet/transactions',
      method: 'GET',
      data: params
    });
    
    if (res.code === 200) {
      const data = res.data;
      const newRecords = data.records || [];
      
      if (transactionPagination.page === 1) {
        transactions.value = newRecords;
      } else {
        transactions.value = [...transactions.value, ...newRecords];
      }
      
      hasMoreTransaction.value = data.current < data.pages;
    } else {
      uni.showToast({
        title: res.message || '获取交易记录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取交易记录失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 加载更多交易记录
const loadMoreTransactions = () => {
  if (hasMoreTransaction.value) {
    transactionPagination.page += 1;
    loadTransactions();
  }
};

// 切换交易类型
const changeTransactionType = (type) => {
  if (currentType.value === type) return;
  
  currentType.value = type;
  transactions.value = [];
  transactionPagination.page = 1;
  hasMoreTransaction.value = true;
  loadTransactions();
};

// 关闭余额明细弹窗
const closeBalancePopup = () => {
  balancePopup.value.close();
};

// 关闭交易记录弹窗
const closeTransactionPopup = () => {
  transactionPopup.value.close();
};

// 获取金额前缀
const getAmountPrefix = (type) => {
  return ['RECHARGE', 'REFUND'].includes(type) ? '+' : '-';
};

// 获取金额样式类
const getAmountClass = (type) => {
  return ['RECHARGE', 'REFUND'].includes(type) ? 'income' : 'expense';
};

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    'SUCCESS': 'success',
    'PENDING': 'pending',
    'FAILED': 'failed'
  };
  return statusMap[status] || 'pending';
};

// 格式化日期时间
const formatDateTime = (timeString) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
</script>

<style lang="scss" scoped>
.wallet-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40rpx;
}

/* 自定义导航栏 */
.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 30rpx;
  padding-top: var(--status-bar-height, 0);
  position: relative;
}

.navbar-back {
  position: absolute;
  left: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #fff;
}

/* 余额卡片 */
.balance-card {
  margin: 40rpx 30rpx;
  padding: 40rpx 30rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.balance-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.balance-actions {
  display: flex;
  gap: 15rpx;
}

.btn-action {
  background: rgba(255, 255, 255, 0.25);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 24rpx;
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  height: auto;
  line-height: 1;
}

.btn-action::after {
  border: none;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 30rpx;
}

.currency {
  font-size: 40rpx;
  color: #fff;
  margin-right: 8rpx;
}

.amount {
  font-size: 64rpx;
  font-weight: bold;
  color: #fff;
}

.balance-info {
  display: flex;
  padding-top: 30rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 32rpx;
  font-weight: 500;
  color: #fff;
}

/* 功能菜单 */
.menu-section {
  margin: 0 30rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
}

/* 弹窗通用样式 */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100rpx;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.close-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 余额明细弹窗 */
.balance-popup {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.balance-list {
  height: 60vh;
  padding: 0 30rpx;
}

.balance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  flex: 1;
}

.item-type {
  font-size: 32rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.item-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 5rpx;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}

.item-amount {
  text-align: right;
}

.amount {
  font-size: 32rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 5rpx;
  
  &.income {
    color: #ff6b6b;
  }
  
  &.expense {
    color: #52c41a;
  }
}

.balance-after {
  font-size: 24rpx;
  color: #999;
}

/* 交易记录弹窗 */
.transaction-popup {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 85vh;
  overflow: hidden;
}

.transaction-filter {
  display: flex;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 20rpx;
}

.filter-item {
  padding: 12rpx 24rpx;
  background: #f8f8f8;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  
  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
}

.transaction-list {
  height: 55vh;
  padding: 0 30rpx;
}

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.status {
  font-size: 24rpx;
  
  &.success {
    color: #52c41a;
  }
  
  &.pending {
    color: #faad14;
  }
  
  &.failed {
    color: #ff4d4f;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 加载更多和没有更多 */
.loading-more,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #999;
  }
}
</style>
