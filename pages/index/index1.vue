<template>
  <view class="container">
   <!-- 可点击定位 -->
       <view class="location-header" @click="showCityPicker = true">
         <uni-icons type="location-filled" size="20" color="#007aff"></uni-icons>
         <text class="location-text">{{ currentCity }}</text>
         <uni-icons type="arrowdown" size="16" color="#666"></uni-icons>
       </view>
   
       <!-- 城市选择弹窗 -->
       <uni-popup ref="cityPopup" type="bottom">
         <view class="city-picker">
           <view class="picker-header">
             <text class="title">选择城市</text>
             <uni-icons type="close" @click="showCityPicker = false"></uni-icons>
           </view>
           <scroll-view scroll-y class="city-list">
             <view 
               v-for="(city, index) in cityList" 
               :key="index"
               class="city-item"
               @click="selectCity(city)"
             >
               {{ city }}
             </view>
           </scroll-view>
         </view>
       </uni-popup>

    <!-- 地图区域 -->
    <view class="map-container">
      <map 
        :latitude="latitude" 
        :longitude="longitude" 
        :markers="markers"
        class="map"
        show-location
      >
        <cover-view class="map-tip">附近有{{ auntCount }}位阿姨</cover-view>
      </map>
    </view>

    <!-- 服务类目 -->
    <view class="service-section">
      <view class="service-tabs">
        <view 
          v-for="(item, index) in services"
          :key="index"
          class="service-tab"
          :class="{ active: activeService === index }"
          @click="changeService(index)"
        >
          {{ item.title }}
        </view>
      </view>

      <view class="service-content">
        <text class="service-desc">{{ services[activeService].desc }}</text>
		<text class="service-desc"> 原价：55/小时  VIP价: 50/小时</text>
        <button class="reserve-btn">立即预约</button>
      </view>
    </view>

    <!-- 活动区域 -->
    <scroll-view class="activity-section" scroll-x>
      <view class="activity-card new-user">
        <text class="activity-title">新客专享</text>
        <text class="activity-desc">首单立享9折优惠</text>
        <button class="activity-btn" @click="handleRegister">立即注册会员</button>
      </view>

      <view class="activity-card vip">
        <text class="activity-title">VIP特权</text>
        <text class="activity-desc">专享8折+免费加急</text>
        <button class="activity-btn" @click="goToPoster">开通VIP会员立省30%</button>
      </view>

      <view class="activity-card coupon">
        <text class="activity-title">限时抢券</text>
        <text class="activity-desc">满199减30元</text>
        <button class="activity-btn">立即抢券</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const latitude = ref(31.2304);
const longitude = ref(121.4737);

// 城市选择相关
const showCityPicker = ref(false);
const currentCity = ref('上海市');
const cityList = ref(['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市']);
const auntCount = ref(3);

// 服务类目数据
const activeService = ref(0);
const services = ref([
  {
    title: '基础保洁',
    desc: '日常清洁服务，包含地面清洁、桌面整理、卫生间清洁等基础项目。',
    image: '/static/images/od_10.png'
  },
  {
    title: '深度保洁',
    desc: '全方位深度清洁，包含厨房去油污、卫生间除垢消毒、家电表面清洁等深度服务。',
    image: '/static/images/od_30.png'
  },
  {
    title: '包月服务',
    desc: '超值包月套餐，每周定期上门服务，享专属折扣和优先预约特权。',
    image: '/static/images/od_40.png'
  }
]);

// 地图标记
const markers = ref([{
  id: 0,
  latitude: 31.2304,
  longitude: 121.4737,
  iconPath: '/static/images/empty/address.png',
  width: 30,
  height: 30
}]);

// 获取定位
onMounted(() => {
  uni.getLocation({
    type: 'wgs84',
	geocode: true,
    success: (res) => {
      latitude.value = res.latitude;
      longitude.value = res.longitude;
      // 这里应调用逆地理编码接口获取城市信息
      currentCity.value = '上海市';
    },
    fail: () => {
      uni.showToast({ title: '定位失败', icon: 'none' });
    }
  });
});

// 跳转到注册页面
const handleRegister = () => {
  uni.navigateTo({
    url: '/pages/register/register',
  });
};

// 跳转到会员权益页面
const goToPoster = () => {
  uni.navigateTo({
	url: '/pages/poster/poster',
  });
};

// 选择城市
const selectCity = (city) => {
  currentCity.value = city;
  showCityPicker.value = false;
  // 这里应调用接口更新地图和阿姨数量
};

// 切换服务类目
const changeService = (index) => {
  activeService.value = index;
};
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
  background-color: #f5f5f5;
}

.location-header {
  position: absolute;
  top: 20rpx;
  left: 30rpx;
  z-index: 999;
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background: rgba(255,255,255,0.9);
  border-radius: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);

  .location-text {
    margin-left: 10rpx;
    font-size: 28rpx;
    color: #333;
  }
}

.map-container {
  margin-left: 30rpx;
  margin-right: 30rpx;
  height: 40vh;
  position: relative;

  .map {
    width: 100%;
    height: 100%;
  }

  .map-tip {
    position: absolute;
    bottom: 30rpx;
    left: 50%;
    transform: translateX(-50%);
    padding: 16rpx 40rpx;
    background: rgba(0,122,255,0.9);
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
  }
}

.service-section {
  margin: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);

  .service-tabs {
    display: flex;
    padding: 30rpx;
    border-bottom: 2rpx solid #eee;

    .service-tab {
      flex: 1;
      text-align: center;
      padding: 20rpx;
      font-size: 30rpx;
      color: #666;
      transition: all 0.3s;

      &.active {
        color: #007aff;
        font-weight: 500;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: -2rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 80rpx;
          height: 4rpx;
          background: #007aff;
        }
      }
    }
  }

  .service-content {
    padding: 30rpx;

    .service-image {
      width: 100%;
      height: 300rpx;
      border-radius: 16rpx;
      margin-bottom: 30rpx;
    }

    .service-desc {
      display: block;
      font-size: 28rpx;
      color: #666;
      line-height: 1.6;
      margin-bottom: 40rpx;
    }

    .reserve-btn {
      background: linear-gradient(135deg, #007aff, #00a8ff);
      color: #fff;
      border-radius: 50rpx;
      font-size: 32rpx;
      height: 80rpx;
      line-height: 80rpx;
    }
  }
}

.activity-section {
  padding: 0 30rpx 30rpx;
  white-space: nowrap;

  .activity-card {
    display: inline-block;
    width: 82%;
    height: 150rpx;
    margin-right: 30rpx;
    border-radius: 24rpx;
    padding: 40rpx;
    color: #fff;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.1), transparent);
    }

    &.new-user {
      background: linear-gradient(135deg, #ff9800, #ffc107);
    }

    &.vip {
      background: linear-gradient(135deg, #673ab7, #9c27b0);
    }

    &.coupon {
      background: linear-gradient(135deg, #e91e63, #f44336);
    }

    .activity-title {
      display: block;
      font-size: 40rpx;
      font-weight: 500;
      margin-bottom: 15rpx;
    }

    .activity-desc {
      display: block;
      font-size: 28rpx;
      opacity: 0.9;
      margin-bottom: 40rpx;
    }

    .activity-btn {
      position: absolute;
      bottom: 40rpx;
      right: 40rpx;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border-radius: 40rpx;
      padding: 0 40rpx;
      height: 60rpx;
      line-height: 60rpx;
      font-size: 26rpx;
      border: none;

      &::after {
        border: none;
      }
    }
  }
}
</style>