<template>
  <view class="poster-container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">普通用户 vs VIP会员</text>
      <text class="subtitle">解锁超值特权，省心又省钱！</text>
    </view>

    <!-- 权益对比 -->
    <view class="privilege-comparison">
      <!-- 普通用户 -->
      <view class="column user-normal">
        <view class="column-header">
          <text class="user-type">普通用户</text>
        </view>
        <view class="privilege-item" v-for="(item, index) in normalPrivileges" :key="index">
          <uni-icons type="minus" size="16" color="#999"></uni-icons>
          <text class="text">{{ item }}</text>
        </view>
      </view>

      <!-- VIP用户 -->
      <view class="column user-vip">
        <view class="column-header">
          <text class="user-type">VIP会员</text>
          <uni-icons type="star-filled" color="#ffd700" size="20"></uni-icons>
        </view>
        <view class="privilege-item" v-for="(item, index) in vipPrivileges" :key="index">
          <uni-icons type="checkmark" size="16" color="#007aff"></uni-icons>
          <text class="text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 价格与按钮 -->
    <view class="price-section">
      <text class="price-text">上海地区专属价</text>
      <view class="price-box">
        <text class="price">{{ vipPrice }}</text>
        <text class="unit">/月</text>
        <text class="original-price">原价{{ originalPrice }}元</text>
      </view>
      <button class="subscribe-btn" @click="handleSubscribe">立即开通</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

// 数据定义
const normalPrivileges = ref([
  '按原价支付服务费用',
  '无免费保洁服务',
  '排队预约家政阿姨',
  '标准客服响应（48小时内）'
]);

const vipPrivileges = ref([
  '所有服务享受8折优惠',
  '每月免费2小时日常保洁',
  '优先预约优质阿姨',
  '24小时专属客服',
  '消费积分兑换免费服务'
]);

const vipPrice = ref('59');
// 根据城市切换价格
// const cityPrice = {
//   '上海': 59,
//   '北京': 59,
//   '广州': 49,
//   '深圳': 59
// }
const originalPrice = ref('79');
</script>

<style lang="scss" scoped>
.poster-container {
  padding: 30rpx;
  background: linear-gradient(to bottom, #f5f7fa, #ffffff);
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  .title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  .subtitle {
    font-size: 28rpx;
    color: #666;
  }
}

.privilege-comparison {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;

  .column {
    flex: 1;
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);

    &.user-normal {
      margin-right: 20rpx;
      border: 2rpx solid #eee;
    }

    &.user-vip {
      border: 2rpx solid #007aff;
    }
  }

  .column-header {
    text-align: center;
    margin-bottom: 30rpx;
    .user-type {
      font-size: 32rpx;
      font-weight: 500;
      color: #007aff;
    }
  }

  .privilege-item {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    .text {
      font-size: 28rpx;
      margin-left: 12rpx;
      color: #666;
    }
  }
}

.price-section {
  text-align: center;
  .price-text {
    display: block;
    color: #666;
    font-size: 28rpx;
    margin-bottom: 16rpx;
  }
  .price-box {
    margin-bottom: 30rpx;
    .price {
      font-size: 64rpx;
      color: #007aff;
      font-weight: bold;
    }
    .unit {
      font-size: 28rpx;
      color: #666;
    }
    .original-price {
      display: block;
      font-size: 24rpx;
      color: #999;
      text-decoration: line-through;
    }
  }
  .subscribe-btn {
    background: #007aff;
    color: #fff;
    border-radius: 50rpx;
    font-size: 32rpx;
    height: 80rpx;
    line-height: 80rpx;
  }
}
</style>