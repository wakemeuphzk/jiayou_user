<!-- pages/recharge/result.vue -->
<template>
  <view class="container">
    <view class="result-card">
      <uni-icons 
        :type="isSuccess ? 'checkmark-filled' : 'close-filled'"
        :color="isSuccess ? '#4CAF50' : '#F44336'"
        size="80"
      ></uni-icons>
      <text class="result-title">{{ isSuccess ? '充值成功' : '充值失败' }}</text>
      <text class="amount" v-if="isSuccess">到账金额：¥{{ amount }}</text>
      <text class="error-msg" v-else>{{ errorMsg }}</text>
    </view>

    <view class="action-btns">
      <button 
        class="primary-btn"
        @click="handleAction"
      >{{ isSuccess ? '查看余额' : '重新充值' }}</button>
      <button 
        class="secondary-btn"
        @click="goHome"
      >返回首页</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const isSuccess = ref(true);
const amount = ref(0);
const errorMsg = ref('');

onLoad((options) => {
  isSuccess.value = options.status === 'success';
  amount.value = options.amount || 0;
  errorMsg.value = decodeURIComponent(options.msg || '支付遇到问题，请重试');
});

const handleAction = () => {
  if (isSuccess.value) {
    uni.navigateTo({ url: '/pages/user/wallet' });
  } else {
    uni.navigateBack();
  }
};

const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' });
};
</script>

<style lang="scss" scoped>

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 40rpx;
}

.result-box {
  text-align: center;
  .result-title {
    display: block;
    font-size: 48rpx;
    font-weight: 500;
    margin: 40rpx 0 20rpx;
  }
  .amount {
    font-size: 36rpx;
    color: #666;
  }
  .error-msg {
    font-size: 32rpx;
    color: #F44336;
  }
}

.action-btns {
  width: 100%;
  margin-top: 80rpx;
  
  button {
    margin-bottom: 30rpx;
    height: 90rpx;
    line-height: 90rpx;
    font-size: 32rpx;
    border-radius: 50rpx;
    
    &.back-btn {
      background: #4CAF50;
      color: #fff;
    }
    &.retry-btn {
      background: #F44336;
      color: #fff;
    }
    &.home-btn {
      background: #fff;
      color: #666;
      border: 1rpx solid #eee;
    }
  }
}
</style>


