<template>
  <view class="container">
    <!-- 可点击定位 -->
    <view class="location-header" @click="openCityPicker">
      <uni-icons type="location-filled" size="20" color="#007aff"></uni-icons>
      <text class="location-text">{{ selectedCity ? selectedCity.name : '选择城市' }}</text>
      <uni-icons type="arrowdown" size="16" color="#666"></uni-icons>
    </view>
	
	<!-- 城市选择弹窗 -->
	<uni-popup ref="cityPopup" type="bottom" :show="showCityPicker" @close="showCityPicker = false">
	    <view class="city-picker">
	      <view class="picker-header">
	        <view class="title">选择服务城市</view>
	        <view class="close-btn" @click="closeCityPicker">×</view>
	      </view>
	
	      <!-- 字母索引 -->
	      <view class="index-bar">
	        <view 
	          v-for="letter in indexLetters"
	          :key="letter"
	          class="index-item"
	          @click="scrollToLetter(letter)"
	        >
	          {{ letter }}
	        </view>
	      </view>
	
	      <!-- 城市列表 -->
	      <scroll-view 
	        scroll-y 
	        class="city-list" 
	        :scroll-into-view="scrollToId"
	        @scroll="handleScroll"
	      >
	          <view 
	          v-for="(group, letter) in groupedCities"
	            :key="letter"
	            :id="`letter-${letter}`"
	          >
	            <view class="index-title">{{ letter }}</view>
	            <view 
	              v-for="city in group"
	            :key="city.id"
	              class="city-row"
	            :class="{ 'selected': selectedCity && selectedCity.id === city.id }"
	              @click="selectCity(city)"
	            >
	            <text class="city-name">{{ city.name }}</text>
	            <uni-icons v-if="selectedCity && selectedCity.id === city.id" type="checkmarkempty" size="16" color="#007aff"></uni-icons>
	          </view>
	        </view>
	      </scroll-view>
	    </view>
	  </uni-popup>

    <!-- 地图区域 -->
    <view class="map-container">
     <map
       id="homeMap"
       :latitude="latitude" 
       :longitude="longitude" 
       :markers="markers"
       :scale="12"
       class="map"
       show-location
       enable-3D
       show-compass
       enable-overlooking
       enable-zoom
       enable-scroll
       enable-rotate
     >
      <cover-view class="map-tip">附近有 5 位阿姨</cover-view>
     </map>
     <view class="debug-info" v-if="markers.length > 0">
       <text>标记点数: {{ markers.length }}</text>
     </view>
    </view>

    <!-- 服务类目 -->
    <view class="service-section" v-if="services.length > 0">
      <view class="service-tabs">
        <view 
          v-for="(item, index) in services"
          :key="item.productId"
          class="service-tab"
          :class="{ active: activeService === index }"
          @click="changeService(index)"
        >
          {{ item.serviceName || item.name }}
        </view>
      </view>

      <view class="service-content" v-if="services[activeService]">
        <text class="service-desc">{{ services[activeService].description }}</text>
        <text class="service-desc">价格：¥{{ services[activeService].hourlyPrice || services[activeService].price }}/小时</text>
        <text class="service-desc" v-if="services[activeService].minHours">最低服务时长：{{ services[activeService].minHours }}小时</text>
        <button class="reserve-btn" @click="onBookNow">立即预约</button>
      </view>
    </view>

    <!-- 加载中 -->
    <view class="loading-section" v-if="isLoading">
      <text>加载中...</text>
    </view>

    <!-- 次卡专区 -->
    <view class="card-section" v-if="serviceCards.length > 0">
      <view class="section-header">
        <text class="section-title">{{ isNewCustomer ? '新客专享' : '次卡套餐' }}</text>
        <text class="section-subtitle">{{ isNewCustomer ? '全场通用专享福利' : '优惠套餐，多次使用更划算' }}</text>
	  </view>
	
      <scroll-view scroll-x class="cards-scroll">
        <view 
          v-for="card in serviceCards"
          :key="card.productId"
          class="card-item"
          :class="card.isNewCustomerExclusive ? 'new-user' : 'normal-card'"
          @click="onServiceCardClick(card)"
        >
          <view class="card-badge" v-if="card.isNewCustomerExclusive">
            <text>新客专享</text>
          </view>
          <view class="card-title">{{ card.name }}</view>
          <view class="card-desc">{{ card.description }}</view>
          <view class="card-price-row">
            <text class="price-actual">¥{{ card.actualPrice || card.unitPrice }}</text>
            <text class="price-original" v-if="card.originalPrice">¥{{ card.originalPrice }}</text>
          </view>
          <view class="card-meta" v-if="card.serviceTimes || card.validityDays">
            <text v-if="card.serviceTimes">{{ card.serviceTimes }}次</text>
            <text v-if="card.serviceTimes && card.validityDays"> · </text>
            <text v-if="card.validityDays">{{ card.validityDays }}天有效</text>
          </view>
          <button class="card-btn">立即抢购</button>
        </view>
      </scroll-view>
    </view>

    <!-- 活动区域 -->
	<!-- <scroll-view class="activity-section" scroll-x>
	  <view class="activity-card vip">
	    <text class="activity-title">VIP特权</text>
	    <text class="activity-desc">专享8折+免费加急</text>
	    <button class="activity-btn" @click="goToCoupon">开通VIP会员立省30%</button>
	  </view>
	  
	  <view class="activity-card recharge">
	    <text class="activity-title">充值享优惠</text>
	    <text class="activity-desc">充得多省得多，最高立省¥40</text>
	    <button class="activity-btn" @click="goToRecharge">去充值</button>
	  </view>
	</scroll-view> -->
	  </view>
	
  <!-- 登录提示弹窗 -->
  <uni-popup ref="loginPopup" type="center" :is-mask-click="false" background-color="#fff">
    <view class="popup-content">
      <view class="popup-icon">
        <uni-icons type="info" size="60" color="#007aff"></uni-icons>
  </view>
      <view class="popup-title">请先登录</view>
      <view class="popup-message">登录后即可享受更多服务</view>
      <view class="popup-actions">
        <button class="login-btn" @click="goToLogin">去登录</button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';
	
const latitude = ref(31.2304);
const longitude = ref(121.4737);

// 登录弹窗引用
const loginPopup = ref(null);
// 用户信息
const userInfo = ref(null);

// 城市选择相关
const showCityPicker = ref(false);
const cityPopup = ref(null);
const availableCities = ref([]);
const selectedCity = ref(null);
const groupedCities = ref({});
const indexLetters = ref([]);
const scrollToId = ref('');

// 服务数据
const activeService = ref(0);
const services = ref([]);
const isLoading = ref(false);

// 次卡数据
const isNewCustomer = ref(false);
const serviceCards = ref([]);

// 地图标记 - 随机生成5个5km内的坐标
const markers = ref([]);

// 获取中文首字母
const getFirstLetter = (str) => {
  if (!str) return '#';
  
  const pinyinMap = {
    '北京': 'B', '上海': 'S', '广州': 'G', '深圳': 'S', '杭州': 'H',
    '南京': 'N', '武汉': 'W', '成都': 'C', '重庆': 'C', '天津': 'T',
    '苏州': 'S', '西安': 'X', '长沙': 'C', '沈阳': 'S', '青岛': 'Q',
    '郑州': 'Z', '大连': 'D', '东莞': 'D', '宁波': 'N', '厦门': 'X'
  };
  
  const cityName = str.replace(/市$/, '');
  
  if (pinyinMap[cityName]) {
    return pinyinMap[cityName];
  }
  
  return str.charAt(0).toUpperCase();
};

// 获取开通城市列表
const loadAvailableCities = async () => {
  try {
    const res = await request({
      url: '/staff/home/cities/available',
      method: 'GET'
    });
    
    if (res.code === 200) {
      availableCities.value = res.data;
      groupCitiesByLetter();
      
      // 设置默认城市（选择第一个可用城市）
      if (!selectedCity.value && availableCities.value.length > 0) {
        selectedCity.value = availableCities.value[0];
        // 加载该城市的服务
        loadRecommendedServices();
      }
      
      console.log('开通城市列表:', availableCities.value);
    }
  } catch (error) {
    console.error('获取开通城市列表失败:', error);
    // 如果接口不存在，使用默认数据
    availableCities.value = [
      { id: 1, name: '上海市', code: 'SHANGHAI' }
    ];
    selectedCity.value = availableCities.value[0];
    groupCitiesByLetter();
  }
};

// 按首字母分组城市
const groupCitiesByLetter = () => {
  const grouped = {};
  const letters = [];
  
  availableCities.value.forEach(city => {
    const firstChar = getFirstLetter(city.name);
    if (!grouped[firstChar]) {
      grouped[firstChar] = [];
      letters.push(firstChar);
    }
    grouped[firstChar].push(city);
  });
  
  letters.sort();
  indexLetters.value = letters;
  groupedCities.value = grouped;
};

// 字母跳转
const scrollToLetter = (letter) => {
  scrollToId.value = `letter-${letter}`;
};

// 处理滚动事件
const handleScroll = (e) => {
  // 可以在这里处理滚动事件
};

// 打开城市选择器
const openCityPicker = () => {
  showCityPicker.value = true;
  cityPopup.value.open('bottom');
};

// 关闭城市选择器
const closeCityPicker = () => {
  showCityPicker.value = false;
  cityPopup.value.close();
};

// 选择城市
const selectCity = (city) => {
  selectedCity.value = city;
  closeCityPicker();
  
  uni.showToast({
    title: `已选择${city.name}`,
    icon: 'success'
  });
  
  // 重新加载服务
  loadRecommendedServices();
  // 重新生成地图标记
  generateRandomMarkers();
};

// 获取推荐服务
const loadRecommendedServices = async () => {
  if (!selectedCity.value) return;
  
  isLoading.value = true;
  try {
    const res = await request({
      url: '/user/home/recommended-services',
      method: 'GET',
      data: {
        cityCode: selectedCity.value.code,
        latitude: latitude.value,
        longitude: longitude.value
      }
    });
    
    if (res.code === 200) {
      services.value = res.data || [];
      activeService.value = 0;
      console.log('推荐服务:', services.value);
    }
  } catch (error) {
    console.error('获取推荐服务失败:', error);
    // 使用默认数据
    services.value = [
      {
        productId: 1,
        serviceName: '基础保洁',
        description: '日常清洁服务，包含地面清洁、桌面整理、卫生间清洁等基础项目，2小时起订。',
        hourlyPrice: 55.00,
        minHours: 2
      },
      {
        productId: 2,
        serviceName: '深度保洁',
        description: '全方位深度清洁服务，包含厨房去油污、卫生间除垢消毒等深度服务。',
        hourlyPrice: 65.00,
        minHours: 2
      }
    ];
  } finally {
    isLoading.value = false;
  }
};

// 获取次卡列表（后端统一处理，返回适合当前用户的次卡）
const loadServiceCards = async () => {
  try {
    const res = await request({
      url: '/user/service-cards/products',
      method: 'GET'
    });
    
    if (res.code === 200) {
      let cards = res.data || [];
      
      // 判断是否为新客（根据是否有新客专享次卡）
      isNewCustomer.value = cards.some(card => card.newCustomerExclusive);
      
      // 处理卡片数据，提取SKU信息
      serviceCards.value = cards
        .filter(card => card.canPurchase) // 只显示可购买的次卡
        .map(card => {
          // 从skus中提取价格信息（取第一个SKU）
          if (card.skus && card.skus.length > 0) {
            const firstSku = card.skus[0];
            
            // 解析 specifications JSON 字符串获取次数和有效期
            let serviceTimes = 0;
            let validityDays = 0;
            try {
              if (firstSku.specifications) {
                const specs = JSON.parse(firstSku.specifications);
                serviceTimes = specs.times || 0;
                
                // 提取有效期（如 "180天" -> 180）
                if (specs.validity) {
                  const match = specs.validity.match(/(\d+)/);
                  if (match) {
                    validityDays = parseInt(match[1]);
                  }
                }
              }
            } catch (e) {
              console.error('解析SKU规格失败:', e);
            }
            
            return {
              ...card,
              actualPrice: firstSku.originalPrice, // 实际使用 originalPrice 作为售价
              originalPrice: firstSku.originalPrice,
              serviceTimes: serviceTimes, // 从规格中提取次数
              validityDays: validityDays, // 从规格中提取有效期
              unitPrice: firstSku.singleServiceValue, // 单次价值
              singleServiceValue: firstSku.singleServiceValue
            };
          }
          return card;
        });
      
      console.log('次卡列表:', serviceCards.value);
      console.log('是否新客:', isNewCustomer.value);
    }
  } catch (error) {
    console.error('获取次卡列表失败:', error);
    serviceCards.value = [];
  }
};

// 随机生成5个5km内的坐标
const generateRandomMarkers = () => {
  const markerList = [];
  const baseLatitude = latitude.value;
  const baseLongitude = longitude.value;
  
  // 5km 大约等于 0.045度（纬度）和 0.045/cos(纬度)度（经度）
  // 简化计算，使用 0.045 作为范围
  const range = 0.045;
  
  for (let i = 0; i < 5; i++) {
    // 生成随机偏移量（-range 到 +range）
    const latOffset = (Math.random() * 2 - 1) * range;
    const lngOffset = (Math.random() * 2 - 1) * range;
    
    markerList.push({
      id: i,
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      // 使用默认红色标记点，不设置自定义图标
  width: 30,
  height: 30
    });
  }
  
  markers.value = markerList;
  console.log('生成地图标记:', markers.value);
  console.log('标记数量:', markers.value.length);
  console.log('当前中心点:', { latitude: baseLatitude, longitude: baseLongitude });
};

// 页面加载时初始化
onLoad(async () => {
// 获取定位
  try {
    const location = await uni.getLocation({
      type: 'gcj02',
      altitude: false
    });
    latitude.value = location.latitude;
    longitude.value = location.longitude;
    console.log('获取位置成功:', location);
  } catch (error) {
    console.error('获取位置失败:', error);
    // 使用默认位置（上海）
    latitude.value = 31.2304;
    longitude.value = 121.4737;
  }
  
  // 生成地图标记
  generateRandomMarkers();
  
  // 加载开通城市列表
  await loadAvailableCities();
  
  // 检查登录状态
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      showLoginPopup();
      return;
    }
    
    // 验证token有效性
    const res = await request({
      url: '/user/profile',
      method: 'GET'
    });
    
    if (res.code === 200) {
      userInfo.value = res.data;
      console.log('用户信息:', userInfo.value);
      
      // 如果已登录，加载次卡列表
      loadServiceCards();
    } else {
      showLoginPopup();
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    showLoginPopup();
  }
});

// 显示登录弹窗
const showLoginPopup = () => {
  setTimeout(() => {
    if (loginPopup.value) {
      loginPopup.value.open('center');
    }
  }, 500);
};

// 跳转到登录页
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  });
};

// 切换服务类目
const changeService = (index) => {
  activeService.value = index;
};

// 立即预约 - 跳转到服务详情页
const onBookNow = () => {
  const service = services.value[activeService.value];
  
  if (!service || !service.productId) {
    uni.showToast({
      title: '服务信息加载中',
      icon: 'none'
    });
    return;
  }
  
  // 跳转到服务详情页，传递城市代码
  uni.navigateTo({
    url: `/pages/service/detail?id=${service.productId}&cityCode=${selectedCity.value?.id || ''}`
  });
};

// 点击次卡 - 跳转到次卡详情页
const onServiceCardClick = (card) => {
  if (!card || !card.productId) {
    uni.showToast({
      title: '次卡信息加载中',
      icon: 'none'
    });
    return;
  }
  
  // 跳转到次卡详情页
  uni.navigateTo({
    url: `/pages/card/detail?id=${card.productId}`
  });
};

// 跳转到优惠券页面（暂时注释）
// const goToCoupon = () => {
//   uni.navigateTo({
//     url: '/pages/coupon/coupon',
//   });
// };

// 跳转到充值页面（暂时注释）
// const goToRecharge = () => {
//   uni.navigateTo({
//     url: '/pages/recharge/recharge',
//   });
// };
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
    border-radius: 20rpx;
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
  
  .debug-info {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    background: rgba(0,0,0,0.6);
    color: #fff;
    padding: 10rpx 20rpx;
    border-radius: 10rpx;
    font-size: 24rpx;
  }
}

.service-section {
  margin: 0 30rpx 30rpx;
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
	
	&.recharge {
	  background: linear-gradient(135deg, #673ab7, #9c27b0);
	}
	
	&.card {
	  background: linear-gradient(135deg, #ff9800, #ffc107);
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
	
// /* 城市选择样式 */
// .city-picker {
//   background: #fff;
//   border-radius: 40rpx 40rpx 0 0;
//   padding: 40rpx;
//   max-height: 70vh;

//   .picker-header {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     margin-bottom: 40rpx;
    
//     .title {
//       font-size: 36rpx;
//       font-weight: 500;
//     }
//   }

//   .city-tree {
//     .province-item {
//       border-bottom: 1rpx solid #eee;
      
//       .province-name {
//         padding: 30rpx;
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//         font-size: 32rpx;
//         color: #333;
//       }

//       .city-list {
//         background: #f8f8f8;
//         padding-left: 30rpx;

//         .city-item {
//           padding: 25rpx 30rpx;
//           font-size: 28rpx;
//           color: #666;
//           border-bottom: 1rpx solid #eee;

//           &:last-child {
//             border-bottom: none;
//           }

//           &:active {
//             background: #f0f0f0;
//           }
//         }
//       }
//     }
//   }

/* 城市选择弹窗样式 */
.city-picker {
  height: 80vh;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 0;
  position: relative;

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 40rpx 40rpx 20rpx;
    border-bottom: 1rpx solid #eee;

    .title {
      font-size: 54rpx;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60rpx;
      color: #999;
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.3s;

      &:active {
        background: #f5f5f5;
      color: #666;
      }
    }
  }

  .index-bar {
    position: fixed;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 20rpx;
    padding: 10rpx 0;

    .index-item {
      font-size: 24rpx;
      color: #666;
      text-align: center;
      padding: 8rpx 12rpx;
      min-width: 40rpx;
      transition: all 0.2s;

      &:active {
        background: rgba(0, 122, 255, 0.2);
        color: #007aff;
        border-radius: 8rpx;
      }
    }
  }

  .city-list {
    height: calc(80vh - 120rpx);
    padding: 20rpx 40rpx;

    .index-title {
      padding: 20rpx 0 10rpx;
      font-size: 32rpx;
      color: #333;
      font-weight: 600;
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .city-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      transition: all 0.3s;

      &.selected {
        background: rgba(0, 122, 255, 0.05);
        border-radius: 8rpx;
        padding-left: 20rpx;
        padding-right: 20rpx;
      }

      &:active {
        background: #f5f5f5;
      }

      .city-name {
        font-size: 36rpx;
        color: #333;
      }

      &.selected .city-name {
        color: #007aff;
        font-weight: 500;
      }
    }
  }
}

/* 加载中样式 */
.loading-section {
  padding: 60rpx 30rpx;
  text-align: center;
  color: #666;
      font-size: 28rpx;
}

/* 次卡专区样式 */
.card-section {
  padding: 0 30rpx 30rpx;
  
  .section-header {
    padding: 30rpx 0 20rpx;
    
    .section-title {
      font-size: 40rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .section-subtitle {
      font-size: 28rpx;
      color: #999;
    }
  }
  
  .cards-scroll {
    white-space: nowrap;
    
    .card-item {
      display: inline-block;
      width: 540rpx;
      height: 320rpx;
      margin-right: 30rpx;
      padding: 30rpx;
      border-radius: 24rpx;
      position: relative;
      overflow: hidden;
      vertical-align: top;
      
      &.new-user {
        background: linear-gradient(135deg, #ff9800, #ffc107);
      }
      
      &.normal-card {
        background: linear-gradient(135deg, #667eea, #764ba2);
      }
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(0,0,0,0.05), transparent);
      }
      
      .card-badge {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        background: rgba(255, 255, 255, 0.3);
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        z-index: 1;
        
        text {
          font-size: 22rpx;
          color: #fff;
          font-weight: 600;
        }
      }
      
      .card-title {
        font-size: 36rpx;
        font-weight: 700;
        color: #fff;
        margin-bottom: 12rpx;
        white-space: normal;
        line-height: 1.3;
        max-height: 94rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .card-desc {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 16rpx;
        white-space: normal;
        line-height: 1.4;
        max-height: 67rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .card-price-row {
        display: flex;
        align-items: baseline;
        gap: 12rpx;
        margin-bottom: 12rpx;
        
        .price-actual {
          font-size: 44rpx;
          font-weight: 700;
          color: #fff;
        }
        
        .price-original {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: line-through;
        }
      }
      
      .card-meta {
        font-size: 22rpx;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 16rpx;
      }
      
      .card-btn {
        position: absolute;
        bottom: 30rpx;
        left: 30rpx;
        right: 30rpx;
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
        border: none;
        border-radius: 40rpx;
        height: 64rpx;
        line-height: 64rpx;
        font-size: 28rpx;
        font-weight: 600;
        
        &::after {
          border: none;
        }
        
        &:active {
          background: rgba(255, 255, 255, 0.35);
        }
      }
    }
  }
}

/* 登录提示弹窗样式 */
.popup-content {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.popup-icon {
  margin-bottom: 30rpx;
  display: flex;
  justify-content: center;
}

.popup-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.popup-message {
  font-size: 32rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 40rpx;
}

.popup-actions {
  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 50rpx;
    padding: 28rpx;
    font-size: 36rpx;
    font-weight: 600;
    box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
    transition: all 0.3s;
    
    &::after {
      border: none;
    }
    
    &:active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.4);
    }
  }
}

</style>