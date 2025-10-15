<template>
  <view class="container">
    <!-- 选项卡 -->
    <view class="tabs">
      <text 
        v-for="(tab, index) in tabs" 
        :key="index"
        :class="['tab-item', { 'active': activeTab === index }]"
        @click="activeTab = index"
      >
        {{ tab }}
      </text>
    </view>

    <!-- 优惠券列表 -->
    <scroll-view scroll-y class="coupon-list">
      <view 
        v-for="(item, index) in filteredCoupons"
        :key="index"
        class="coupon-card"
        :class="[getCardClass(item)]"
      >
        <view class="card-left">
          <text class="value">{{ formatValue(item) }}</text>
          <text class="unit">{{ getUnit(item.type) }}</text>
        </view>
        <view class="card-right">
          <text class="title">{{ item.title }}</text>
          <text class="date">有效期 {{ formatDate(item.startDate) }} 至 {{ formatDate(item.endDate) }}</text>
          <text v-if="item.status === 2" class="expired-tag">已过期</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'

const tabs = ['待使用', '已使用', '已过期']
const activeTab = ref(0)
const coupons = ref([])

// 模拟数据
const mockData = [
  {
    id: 1,
    type: 'CASH',
    title: '黄金红包',
    value: 3,
    status: 0,
    startDate: '2025-03-25',
    endDate: '2025-03-31'
  },
  {
    id: 2,
    type: 'RATE',
    title: '闪电贷利率券',
    value: 2.58,
    status: 0,
    startDate: '2025-03-20',
    endDate: '2025-03-31'
  }
]

// 格式化显示值
const formatValue = (item) => {
  return item.type === 'CASH' ? `${item.value}元` : `${item.value}%`
}

// 获取单位
const getUnit = (type) => {
  return type === 'CASH' ? '现金券' : '利率券'
}

// 卡片样式
const getCardClass = (item) => {
  return {
    'cash-card': item.type === 'CASH',
    'rate-card': item.type === 'RATE',
    'disabled': item.status !== 0
  }
}

// 日期格式化
const formatDate = (date) => {
  return dayjs(date).format('YYYY.MM.DD')
}

// 过滤优惠券
const filteredCoupons = computed(() => {
  return coupons.value
    .filter(item => {
      if (activeTab.value === 0) return item.status === 0 // 待使用
      if (activeTab.value === 1) return item.status === 1 // 已使用
      return item.status === 2 // 已过期
    })
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
})

onLoad(async () => {
  // 实际应调用接口获取数据
  coupons.value = mockData
})
</script>

<style scoped>
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.tabs {
  display: flex;
  margin-bottom: 30rpx;
  background: #fff;
  border-radius: 16rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
  color: #666;
}

.active {
  color: #007AFF;
  border-bottom: 4rpx solid #007AFF;
}

.coupon-list {
  height: calc(100vh - 120rpx);
}

.coupon-card {
  display: flex;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  position: relative;
  overflow: hidden;
}

.cash-card {
  background: linear-gradient(135deg, #FFD700, #FFC800);
}

.rate-card {
  background: linear-gradient(135deg, #6B8EFF, #4169E1);
}

.disabled {
  background: #ccc !important;
}

.card-left {
  width: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 2rpx dashed #fff;
}

.value {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

.unit {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.card-right {
  flex: 1;
  padding-left: 30rpx;
}

.title {
  display: block;
  font-size: 32rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.date {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.expired-tag {
  position: absolute;
  right: -40rpx;
  top: 20rpx;
  transform: rotate(45deg);
  background: #999;
  color: #fff;
  padding: 8rpx 60rpx;
  font-size: 24rpx;
}
</style>