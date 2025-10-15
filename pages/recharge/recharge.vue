<!-- pages/recharge/recharge.vue -->
<template>
  <view class="container">
    <view class="banner">
      <text class="title">充值享优惠</text>
      <text class="subtitle">家政服务专用优惠券</text>
    </view>

    <view class="package-list">
      <view 
        v-for="(pkg, index) in packages"
        :key="index"
        :class="['package-item', { active: selectedIndex === index }]"
        @click="selectPackage(index)"
      >
        <text class="amount">¥{{ pkg.recharge }}</text>
        <view class="discount-box">
          <text class="discount-text">立减¥{{ pkg.discount }}</text>
        </view>
        <view class="service-count">
          约{{ calcServiceCount(pkg.recharge) }}小时服务
        </view>
      </view>
    </view>

    <view class="cost-example">
      <text class="example-title">优惠说明：</text>
      <view class="cost-item">
        <text class="item-text">· 3元抵用券：3张 （180天内可用）</text>
        <text class="item-text">· 5元抵用券：1张 （90天内可用）</text>
		<text class="item-text">· 8元抵用券：1张 （30天内可用）</text>
      </view>
    </view>

    <button class="recharge-btn" @click="goToConfirm">立即充值</button>
  </view>
  
  
</template>

<script setup>
import { ref } from 'vue';

// 上海市场调整后充值套餐（保留合理利润空间）
const packages = ref([
  { recharge: 200, discount: 5 },  // 毛利率 19.2%
  { recharge: 300, discount: 10 }, // 毛利率 22.4%
  { recharge: 500, discount: 20 }, // 毛利率 25.0%
  { recharge: 800, discount: 40 }  // 毛利率 27.6%
]);

const selectedIndex = ref(0);

// 计算约服务次数（基于55元/次）
const calcServiceCount = (amount) => {
  return Math.floor(amount / 55);
};

const selectPackage = (index) => {
  selectedIndex.value = index;
};

const goToConfirm = () => {
  const pkg = packages.value[selectedIndex.value];
  uni.navigateTo({
    url: `/pages/recharge/confirm?recharge=${pkg.recharge}&payment=${pkg.recharge - pkg.discount}`
  });
};
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
}

.banner {
  background: linear-gradient(135deg, #007aff, #00a8ff);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  color: #fff;
  
  .title {
    font-size: 48rpx;
    font-weight: bold;
    display: block;
  }
  
  .subtitle {
    font-size: 28rpx;
    opacity: 0.9;
  }
}

.package-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;

  .package-item {
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx;
    text-align: center;
    position: relative;
    border: 2rpx solid #eee;

    &.active {
      border-color: #007aff;
      background: #f0f7ff;
      box-shadow: 0 8rpx 24rpx rgba(0,122,255,0.1);
    }

    .amount {
      font-size: 56rpx;
      color: #ff5722;
      font-weight: bold;
      line-height: 1.2;
    }

    .discount-box {
      position: absolute;
      top: -20rpx;
      right: -20rpx;
      background: #e4393c;
      color: #fff;
      padding: 8rpx 24rpx;
      border-radius: 40rpx;
      font-size: 24rpx;
      transform: rotate(15deg);
    }

    .service-count {
      font-size: 24rpx;
      color: #666;
      margin-top: 16rpx;
    }
  }
}

.cost-example {
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;

  .example-title {
    display: block;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 20rpx;
  }

  .cost-item {
    font-size: 24rpx;
    color: #666;
    line-height: 1.6;
	
	.item-text{
		display: block;
	}
  }
}

.recharge-btn {
  background: linear-gradient(135deg, #007aff, #00a8ff);
  color: #fff;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 32rpx;
}
</style>