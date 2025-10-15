<template>
  <view class="service-detail">
    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <uni-icons type="spinner-cycle" size="40" color="#007aff"></uni-icons>
      <text>加载中...</text>
    </view>
    
    <view v-else-if="service">
      <!-- 服务头部 -->
      <view class="service-header">
        <swiper :indicator-dots="true" :autoplay="true" class="service-swiper">
          <swiper-item v-for="(img, index) in getServiceImages()" :key="index">
            <image :src="img" mode="aspectFill" class="service-image"></image>
          </swiper-item>
        </swiper>
        
        <view class="service-info">
          <view class="service-name">{{ service.serviceName || service.name }}</view>
          <view class="service-rating">
            <text class="rating-text">⭐⭐⭐⭐⭐ 5.0</text>
            <text class="service-count">已服务{{ service.orderCount || 0 }}次</text>
          </view>
        </view>
      </view>
      
      <!-- 价格信息 -->
      <view class="price-section">
        <view class="price-main">
          <text class="price-label">价格</text>
          <text class="price-value">¥{{ currentPrice }}</text>
          <text class="price-unit">/{{ service.unit || '小时' }}</text>
        </view>
        <view class="price-range" v-if="service.minHours">
          最低{{ service.minHours }}{{ service.unit || '小时' }}起
        </view>
      </view>
      
      <!-- 服务时长选择 -->
      <view class="duration-section">
        <view class="section-title">选择服务时长</view>
        <view class="duration-hint" v-if="durationLimitText">{{ durationLimitText }}</view>
        <view class="duration-list">
          <view 
            class="duration-item" 
            :class="{ active: selectedDuration === duration }"
            v-for="duration in durationOptions" 
            :key="duration"
            @click="selectDuration(duration)"
          >
            <view class="duration-label">{{ duration }}小时</view>
            <view class="duration-price">¥{{ getDurationPrice(duration) }}</view>
          </view>
        </view>
      </view>
      
      <!-- 服务说明 -->
      <view class="service-description">
        <view class="section-title">服务内容</view>
        <view class="description-content">{{ service.description || '专业的家政服务' }}</view>
        
        <view class="section-title">服务特色</view>
        <view class="feature-list">
          <view class="feature-item">
            <text class="feature-icon">✓</text>
            <text class="feature-text">专业培训持证上岗</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">✓</text>
            <text class="feature-text">统一管理服务标准</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">✓</text>
            <text class="feature-text">服务不满意免费重做</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">✓</text>
            <text class="feature-text">意外保险全程保障</text>
          </view>
        </view>
        
        <view class="section-title">服务须知</view>
        <view class="notice-list">
          <view class="notice-item">1. 请提前2小时预约服务</view>
          <view class="notice-item">2. 服务人员将提前与您电话确认</view>
          <view class="notice-item">3. 如需取消请提前4小时通知</view>
          <view class="notice-item">4. 服务完成后请及时确认并评价</view>
        </view>
      </view>
      
      <!-- 用户评价 -->
      <view class="ratings-section" v-if="service">
        <view class="ratings-header">
          <view class="section-title">用户评价</view>
          <view class="rating-summary">
            <text class="rating-score">{{ service.rating || 5.0 }}</text>
            <text class="rating-count">（{{ service.reviewCount || 0 }}条评价）</text>
          </view>
        </view>
        
        <!-- 评价列表 -->
        <view class="rating-list" v-if="ratings.length > 0">
          <view 
            class="rating-item" 
            v-for="rating in ratings" 
            :key="rating.id"
          >
            <!-- 用户信息 -->
            <view class="user-info">
              <image 
                :src="rating.userInfo?.avatar || '/static/images/avatar_def.png'" 
                class="user-avatar"
              ></image>
              <view class="user-details">
                <view class="user-name">{{ rating.isAnonymous ? '匿名用户' : (rating.userInfo?.nickname || '用户') }}</view>
                <view class="rating-stars">
                  <text class="star" v-for="n in 5" :key="n" :class="{ active: n <= rating.score }">★</text>
                </view>
              </view>
              <view class="rating-time">{{ formatRatingTime(rating.createdTime) }}</view>
            </view>
            
            <!-- 评价内容 -->
            <view class="rating-content" v-if="rating.content">
              {{ rating.content }}
            </view>
            
            <!-- 评价图片 -->
            <view class="rating-images" v-if="rating.images && rating.images.length > 0">
              <image 
                v-for="(image, index) in rating.images.slice(0, 3)" 
                :key="index"
                :src="image" 
                mode="aspectFill"
                class="rating-image"
                @click="previewRatingImage(rating.images, index)"
              ></image>
            </view>
            
            <!-- 评价标签 -->
            <view class="rating-tags" v-if="rating.tags && rating.tags.length > 0">
              <view class="tag" v-for="tag in rating.tags" :key="tag">
                {{ tag }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 查看更多 -->
        <view class="view-more" v-if="ratings.length > 0" @click="viewAllRatings">
          查看全部评价 >
        </view>
        
        <!-- 空状态 -->
        <view class="empty-ratings" v-if="ratings.length === 0">
          <text>暂无评价</text>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="footer-bar">
      <view class="price-summary">
        <text class="price-label">预估价格</text>
        <text class="price-value">¥{{ estimatedPrice }}</text>
      </view>
      <button class="btn-book-now" @click="goToBook">立即预定</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

const serviceId = ref(null);
const cityCode = ref(null);
const service = ref(null);
const cityPrice = ref(null);
const selectedSku = ref(null);
const loading = ref(true);

// 服务时长相关
const selectedDuration = ref(null); // 选中的时长（小时）
const durationOptions = ref([2, 3, 4, 6, 8]); // 默认时长选项

// 时长限制提示词
const durationLimitText = computed(() => {
  const name = service.value?.name || service.value?.serviceName || '';
  const min = service.value?.minHours || service.value?.duration;
  const max = service.value?.maxHours;
  if (!min) return '';
  if (max) {
    return `${name}最少服务时长为 ${min} 小时，最多 ${max} 小时，请将时长设置在 ${min}–${max} 之间。`;
  }
  return `${name}最少服务时长为 ${min} 小时，请将时长设置为不小于 ${min} 小时。`;
});

// 评价相关
const ratings = ref([]); // 评价列表

// 当前价格（城市定价优先）
const currentPrice = computed(() => {
  if (cityPrice.value) {
    return cityPrice.value;
  }
  if (service.value) {
    return service.value.basePrice || service.value.hourlyPrice || service.value.unitPrice || 0;
  }
  return 0;
});

// 预估价格（根据选中的时长）
const estimatedPrice = computed(() => {
  if (selectedDuration.value && currentPrice.value) {
    return (currentPrice.value * selectedDuration.value).toFixed(2);
  }
  if (service.value && service.value.minHours) {
    return (currentPrice.value * service.value.minHours).toFixed(2);
  }
  return (currentPrice.value * 2).toFixed(2); // 默认2小时
});

// 选择服务时长
const selectDuration = (duration) => {
  selectedDuration.value = duration;
};

// 计算时长对应的价格
const getDurationPrice = (duration) => {
  const price = currentPrice.value;
  if (!price || price === 0) {
    console.log('价格为0，请检查:', {
      cityPrice: cityPrice.value,
      service: service.value,
      basePrice: service.value?.basePrice,
      hourlyPrice: service.value?.hourlyPrice,
      unitPrice: service.value?.unitPrice
    });
    return '0.00';
  }
  return (price * duration).toFixed(2);
};

// 获取服务图片（如果没有则使用默认图）
const getServiceImages = () => {
  if (service.value && service.value.imageUrl) {
    try {
      // 如果是JSON字符串数组
      if (typeof service.value.imageUrl === 'string' && service.value.imageUrl.startsWith('[')) {
        return JSON.parse(service.value.imageUrl);
      }
      // 如果是单个URL
      return [service.value.imageUrl];
    } catch (e) {
      return ['/static/images/ic_serve.png'];
    }
  }
  return ['/static/images/ic_serve.png'];
};

// 选择SKU
const selectSku = (sku) => {
  selectedSku.value = sku;
};

// 加载服务详情
const loadServiceDetail = async () => {
  try {
    loading.value = true;
    
    const res = await request({
      url: `/user/service/types/${serviceId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      service.value = res.data;
      
      console.log('服务详情加载成功:', {
        id: service.value.id,
        name: service.value.name,
        basePrice: service.value.basePrice,
        hourlyPrice: service.value.hourlyPrice,
        unitPrice: service.value.unitPrice,
        duration: service.value.duration,
        minHours: service.value.minHours,
        maxHours: service.value.maxHours
      });
      
      // 根据服务的 minHours/duration 与 maxHours 设置时长选项
      const min = service.value.minHours || service.value.duration || 1;
      const max = service.value.maxHours || null;
      if (max && max >= min) {
        const options = [];
        const step = (max - min) > 10 ? 2 : 1;
        for (let i = min; i <= max; i += step) options.push(i);
        durationOptions.value = options;
        selectedDuration.value = min;
      } else {
        // 无上限，仅保障不低于最小值，给出一组从最小值起的可选项
        const count = 5; // 展示5档：min, min+1, ...
        const options = [];
        for (let i = 0; i < count; i++) options.push(min + i);
        durationOptions.value = options;
        selectedDuration.value = min;
      }
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载服务详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载城市定价
const loadCityPricing = async () => {
  if (!cityCode.value || !serviceId.value) return;
  
  try {
    const res = await request({
      url: '/user/service/pricing',
      method: 'GET',
      data: {
        cityId: cityCode.value,
        serviceTypeId: serviceId.value
      }
    });
    
    if (res.code === 200 && res.data && res.data.hourlyPrice) {
      cityPrice.value = res.data.hourlyPrice;
    }
  } catch (error) {
    console.log('获取城市定价失败，使用默认价格', error);
  }
};

// 加载评价列表
const loadRatings = async () => {
  try {
    const res = await request({
      url: `/user/products/${serviceId.value}/ratings`,
      method: 'GET',
      data: {
        page: 1,
        size: 3 // 只显示前3条
      }
    });
    
    if (res.code === 200) {
      ratings.value = res.data.records || [];
    }
  } catch (error) {
    console.error('加载评价列表失败:', error);
  }
};

// 格式化评价时间
const formatRatingTime = (timeStr) => {
  if (!timeStr) return '';
  
  const time = new Date(timeStr);
  const now = new Date();
  const diff = now - time;
  
  // 1天内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      return '刚刚';
    }
    return `${hours}小时前`;
  }
  
  // 7天内
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 其他
  return `${time.getMonth() + 1}-${time.getDate()}`;
};

// 预览评价图片
const previewRatingImage = (images, index) => {
  uni.previewImage({
    urls: images,
    current: index
  });
};

// 查看全部评价
const viewAllRatings = () => {
  // TODO: 跳转到评价列表页
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

// 立即预定 → 跳转到订单填写页面
const goToBook = () => {
  // 检查是否选择了时长
  if (!selectedDuration.value) {
    uni.showToast({
      title: '请选择服务时长',
      icon: 'none'
    });
    return;
  }

  // 保护性校验：若小于最小或大于最大，自动纠正并提示
  const min = service.value?.minHours || service.value?.duration;
  const max = service.value?.maxHours;
  if (min && selectedDuration.value < min) {
    selectedDuration.value = min;
    uni.showToast({ title: durationLimitText.value, icon: 'none', duration: 2500 });
  } else if (max && selectedDuration.value > max) {
    selectedDuration.value = max;
    uni.showToast({ title: durationLimitText.value, icon: 'none', duration: 2500 });
  }
  
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
        }
      }
    });
    return;
  }
  
  // 跳转到订单填写页面，传递服务ID、时长和城市代码
  uni.navigateTo({
    url: `/pages/order/create?serviceId=${serviceId.value}&duration=${selectedDuration.value}&cityCode=${cityCode.value || ''}`
  });
};

onLoad((options) => {
  serviceId.value = options.id;
  cityCode.value = options.cityCode || uni.getStorageSync('cityCode');
  
  loadServiceDetail();
  loadCityPricing();
  loadRatings(); // 加载评价列表
});
</script>

<style scoped>
.service-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
}

/* 服务头部 */
.service-header {
  background-color: #fff;
  margin-bottom: 20rpx;
}

.service-swiper {
  width: 100%;
  height: 500rpx;
}

.service-image {
  width: 100%;
  height: 100%;
}

.service-info {
  padding: 30rpx;
}

.service-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.service-rating {
  display: flex;
  align-items: center;
}

.rating-text {
  font-size: 28rpx;
  color: #ff9900;
  margin-right: 20rpx;
}

.service-count {
  font-size: 24rpx;
  color: #999;
}

/* 价格信息 */
.price-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.price-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.price-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 20rpx;
}

.price-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #ff4444;
}

.price-unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}

.price-range {
  font-size: 24rpx;
  color: #999;
}

/* 服务时长选择 */
.duration-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.duration-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
  margin-right: -20rpx;
  margin-bottom: -20rpx;
}

.duration-hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.duration-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  width: calc(33.333% - 20rpx);
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}

.duration-item.active {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.duration-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.duration-item.active .duration-label {
  color: #667eea;
  font-weight: bold;
}

.duration-price {
  font-size: 24rpx;
  color: #ff4444;
  font-weight: bold;
}

.duration-item.active .duration-price {
  color: #667eea;
}

/* SKU选择 */
.sku-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.sku-list {
  display: flex;
  flex-wrap: wrap;
  margin-right: -20rpx;
  margin-bottom: -20rpx;
}

.sku-item {
  flex: 1;
  min-width: 200rpx;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  text-align: center;
  transition: all 0.3s;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.sku-item.active {
  border-color: #007aff;
  background-color: #e6f2ff;
}

.sku-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.sku-price {
  display: flex;
  align-items: center;
  justify-content: center;
}

.price-actual {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4444;
  margin-right: 10rpx;
}

.price-original {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

/* 服务说明 */
.service-description {
  background-color: #fff;
  padding: 30rpx;
}

.description-content {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
  margin-bottom: 30rpx;
}

.feature-list,
.notice-list {
  margin-bottom: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.feature-icon {
  width: 40rpx;
  height: 40rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-size: 24rpx;
}

.feature-text {
  font-size: 28rpx;
  color: #666;
}

.notice-item {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
  margin-bottom: 10rpx;
}

/* 底部操作栏 */
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background-color: #fff;
  border-top: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  z-index: 999;
}

.price-summary {
  display: flex;
  flex-direction: column;
}

.price-summary .price-label {
  font-size: 24rpx;
  color: #999;
}

.price-summary .price-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4444;
}

.btn-book-now {
  flex: 1;
  max-width: 400rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 40rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 30rpx;
}

/* 评价部分 */
.ratings-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 140rpx;
}

.ratings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.rating-summary {
  display: flex;
  align-items: baseline;
}

.rating-score {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff9900;
  margin-right: 10rpx;
}

.rating-count {
  font-size: 24rpx;
  color: #999;
}

.rating-list {
  margin-top: 20rpx;
}

.rating-item {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.rating-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.rating-stars {
  display: flex;
}

.rating-stars .star {
  font-size: 24rpx;
  color: #ddd;
  margin-right: 3rpx;
}

.rating-stars .star.active {
  color: #ff9900;
}

.rating-time {
  font-size: 24rpx;
  color: #999;
}

.rating-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.rating-images {
  display: flex;
  margin-bottom: 20rpx;
}

.rating-images .rating-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 10rpx;
  margin-right: 15rpx;
}

.rating-tags {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15rpx;
  margin-bottom: -15rpx;
}

.rating-tags .tag {
  padding: 8rpx 20rpx;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-right: 15rpx;
  margin-bottom: 15rpx;
}

.view-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #667eea;
  cursor: pointer;
}

.empty-ratings {
  text-align: center;
  padding: 60rpx 0;
  font-size: 28rpx;
  color: #999;
}
</style>

