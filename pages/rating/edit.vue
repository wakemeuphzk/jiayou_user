<template>
  <view class="rating-edit-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">‹</text>
        </view>
        <view class="navbar-title">修改评价</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 主内容区 -->
    <scroll-view scroll-y class="content">
      <!-- 修改提示 -->
      <view class="edit-notice">
        <view class="notice-icon">ℹ️</view>
        <view class="notice-content">
          <text class="notice-title">修改说明</text>
          <text class="notice-text">• 评价创建后15天内可修改，仅限1次</text>
          <text class="notice-text">• 综合评分不可修改</text>
          <text class="notice-text">• 可修改：文字、图片、标签、详细评分、匿名状态</text>
          <text class="notice-text" v-if="remainingEditDays > 0">• 距离修改期限还有 {{ remainingEditDays }} 天</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="order-info-card">
        <view class="card-header">
          <text class="header-title">订单信息</text>
        </view>
        <view class="order-detail">
          <view class="detail-row">
            <text class="label">订单号</text>
            <text class="value">{{ orderInfo.orderNo }}</text>
          </view>
          <view class="detail-row">
            <text class="label">服务项目</text>
            <text class="value">{{ orderInfo.serviceTypeName }}</text>
          </view>
          <view class="detail-row">
            <text class="label">服务时长</text>
            <text class="value">{{ orderInfo.duration }}小时</text>
          </view>
        </view>
      </view>

      <!-- 综合评分（不可修改） -->
      <view class="rating-section disabled">
        <view class="section-title">
          <text class="title-text">综合评分</text>
          <text class="disabled-tag">（不可修改）</text>
        </view>
        <view class="star-rating">
          <view 
            v-for="star in 5" 
            :key="star"
            class="star"
            :class="{ active: star <= originalRating.score }"
          >
            ★
          </view>
        </view>
        <view class="score-desc">{{ scoreDescriptions[originalRating.score] }}</view>
      </view>

      <!-- 详细评分 -->
      <view class="detail-rating-section">
        <view class="section-title">
          <text class="title-text">详细评分</text>
          <text class="tip-text">（可修改）</text>
        </view>
        
        <view class="rating-item">
          <text class="item-label">服务态度</text>
          <view class="star-rating small">
            <view 
              v-for="star in 5" 
              :key="star"
              class="star"
              :class="{ active: star <= (form.serviceAttitudeScore || 0) }"
              @click="form.serviceAttitudeScore = star"
            >
              ★
            </view>
          </view>
        </view>

        <view class="rating-item">
          <text class="item-label">服务质量</text>
          <view class="star-rating small">
            <view 
              v-for="star in 5" 
              :key="star"
              class="star"
              :class="{ active: star <= (form.serviceQualityScore || 0) }"
              @click="form.serviceQualityScore = star"
            >
              ★
            </view>
          </view>
        </view>

        <view class="rating-item">
          <text class="item-label">准时性</text>
          <view class="star-rating small">
            <view 
              v-for="star in 5" 
              :key="star"
              class="star"
              :class="{ active: star <= (form.punctualityScore || 0) }"
              @click="form.punctualityScore = star"
            >
              ★
            </view>
          </view>
        </view>

        <view class="rating-item">
          <text class="item-label">清洁度</text>
          <view class="star-rating small">
            <view 
              v-for="star in 5" 
              :key="star"
              class="star"
              :class="{ active: star <= (form.cleanlinessScore || 0) }"
              @click="form.cleanlinessScore = star"
            >
              ★
            </view>
          </view>
        </view>
      </view>

      <!-- 评价标签 -->
      <view class="tags-section">
        <view class="section-title">
          <text class="title-text">选择标签</text>
          <text class="tip-text">（可修改）</text>
        </view>
        <view class="tags-list">
          <view 
            v-for="tag in availableTags" 
            :key="tag.id"
            class="tag-item"
            :class="{ 
              active: form.tags.includes(tag.tagName),
              positive: tag.tagType === 'POSITIVE',
              negative: tag.tagType === 'NEGATIVE'
            }"
            @click="toggleTag(tag.tagName)"
          >
            {{ tag.tagName }}
          </view>
        </view>
      </view>

      <!-- 文字评价 -->
      <view class="content-section">
        <view class="section-title">
          <text class="title-text">文字评价</text>
          <text class="tip-text">（可修改）</text>
          <text class="char-count">{{ form.content.length }}/500</text>
        </view>
        <textarea 
          v-model="form.content"
          placeholder="说说您的服务体验吧"
          maxlength="500"
          class="content-input"
          auto-height
        ></textarea>
      </view>

      <!-- 图片上传 -->
      <view class="images-section">
        <view class="section-title">
          <text class="title-text">上传图片</text>
          <text class="tip-text">（可修改，最多9张）</text>
        </view>
        <view class="images-list">
          <view 
            v-for="(image, index) in form.images" 
            :key="index"
            class="image-item"
          >
            <image :src="image" mode="aspectFill" class="preview-image"></image>
            <view class="delete-btn" @click="removeImage(index)">×</view>
          </view>
          <view 
            v-if="form.images.length < 9"
            class="upload-btn"
            @click="chooseImage"
          >
            <text class="upload-icon">+</text>
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </view>

      <!-- 匿名选项 -->
      <view class="anonymous-section">
        <checkbox-group @change="onAnonymousChange">
          <label class="anonymous-label">
            <checkbox :checked="form.isAnonymous" color="#007aff" />
            <text class="anonymous-text">匿名评价</text>
          </label>
        </checkbox-group>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button 
          class="submit-btn"
          :disabled="submitting"
          @click="submitEdit"
        >
          {{ submitting ? '提交中...' : '保存修改' }}
        </button>
      </view>

      <!-- 底部占位 -->
      <view style="height: 40rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

// 数据
const orderId = ref(null);
const ratingId = ref(null);
const orderInfo = ref({});
const originalRating = ref({});
const availableTags = ref([]);
const submitting = ref(false);

const form = ref({
  serviceAttitudeScore: null,
  serviceQualityScore: null,
  punctualityScore: null,
  cleanlinessScore: null,
  content: '',
  images: [],
  tags: [],
  isAnonymous: false
});

const scoreDescriptions = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意'
};

// 计算剩余可修改天数
const remainingEditDays = computed(() => {
  if (!originalRating.value.createdTime) return 0;
  
  const createTime = new Date(originalRating.value.createdTime).getTime();
  const now = Date.now();
  const daysPassed = (now - createTime) / (1000 * 60 * 60 * 24);
  const remaining = Math.ceil(15 - daysPassed);
  
  return remaining > 0 ? remaining : 0;
});

// 方法
const loadOrderInfo = async () => {
  try {
    const res = await request({
      url: `/user/order/${orderId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      orderInfo.value = res.data;
    }
  } catch (error) {
    console.error('加载订单信息失败:', error);
  }
};

const loadExistingRating = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    
    const res = await request({
      url: `/user/order/${orderId.value}/rating`,
      method: 'GET'
    });
    
    if (res.code === 200 && res.data) {
      originalRating.value = res.data;
      
      // 填充表单数据（不包括综合评分）
      form.value = {
        serviceAttitudeScore: res.data.serviceAttitudeScore || null,
        serviceQualityScore: res.data.serviceQualityScore || null,
        punctualityScore: res.data.punctualityScore || null,
        cleanlinessScore: res.data.cleanlinessScore || null,
        content: res.data.content || '',
        images: res.data.images || [],
        tags: res.data.tags || [],
        isAnonymous: res.data.isAnonymous || false
      };
    } else {
      uni.showToast({
        title: '评价不存在',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  } catch (error) {
    console.error('加载评价失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    uni.hideLoading();
  }
};

const loadTags = async () => {
  try {
    const res = await request({
      url: '/user/ratings/tags',
      method: 'GET'
    });
    
    if (res.code === 200) {
      availableTags.value = res.data || [];
    }
  } catch (error) {
    console.error('加载标签失败:', error);
  }
};

const toggleTag = (tagName) => {
  const index = form.value.tags.indexOf(tagName);
  if (index > -1) {
    form.value.tags.splice(index, 1);
  } else {
    form.value.tags.push(tagName);
  }
};

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - form.value.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      form.value.images.push(...res.tempFilePaths);
    }
  });
};

const removeImage = (index) => {
  form.value.images.splice(index, 1);
};

const onAnonymousChange = (e) => {
  form.value.isAnonymous = e.detail.value.length > 0;
};

const submitEdit = async () => {
  submitting.value = true;
  uni.showLoading({ title: '提交中...' });
  
  try {
    // 注意：不包括 score 字段
    const requestData = {
      content: form.value.content || null,
      images: form.value.images.length > 0 ? form.value.images : null,
      serviceAttitudeScore: form.value.serviceAttitudeScore || null,
      serviceQualityScore: form.value.serviceQualityScore || null,
      punctualityScore: form.value.punctualityScore || null,
      cleanlinessScore: form.value.cleanlinessScore || null,
      tags: form.value.tags.length > 0 ? form.value.tags : null,
      isAnonymous: form.value.isAnonymous
    };
    
    const res = await request({
      url: `/user/order/${orderId.value}/rating`,
      method: 'PUT',
      data: requestData
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      uni.showToast({
        title: '修改成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({
        title: res.message || '修改失败',
        icon: 'none',
        duration: 3000
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('修改评价失败:', error);
    uni.showToast({
      title: error.message || '修改失败',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};

onLoad((options) => {
  orderId.value = options.orderId;
  ratingId.value = options.ratingId;
  
  if (orderId.value) {
    loadOrderInfo();
    loadExistingRating();
    loadTags();
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style lang="scss" scoped>
.rating-edit-page {
  min-height: 100vh;
  background: #f7f8fa;
}

/* 自定义导航栏 */
.custom-navbar {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
  padding-top: env(safe-area-inset-top);
}

.navbar-left {
  width: 80rpx;
}

.back-icon {
  font-size: 48rpx;
  color: #333;
  font-weight: bold;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.navbar-right {
  width: 80rpx;
}

/* 内容区 */
.content {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 20rpx;
}

/* 修改提示 */
.edit-notice {
  display: flex;
  background: linear-gradient(135deg, #E6F2FF 0%, #CCE5FF 100%);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border-left: 6rpx solid #007aff;
}

.notice-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.notice-content {
  flex: 1;
}

.notice-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #007aff;
  margin-bottom: 12rpx;
}

.notice-text {
  display: block;
  font-size: 24rpx;
  color: #0056b3;
  line-height: 1.8;
  margin-bottom: 6rpx;
}

/* 订单信息卡片 */
.order-info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.order-detail {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.detail-row .label {
  font-size: 28rpx;
  color: #666;
}

.detail-row .value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 评分区块 */
.rating-section,
.detail-rating-section,
.tags-section,
.content-section,
.images-section,
.anonymous-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 禁用状态 */
.rating-section.disabled {
  background: #f9f9f9;
  border: 2rpx dashed #d9d9d9;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.disabled-tag {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-left: 8rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.char-count {
  margin-left: auto;
  font-size: 24rpx;
  color: #999;
}

/* 星级评分 */
.star-rating {
  display: flex;
  justify-content: center;
  margin: 20rpx 0;
}

.star {
  font-size: 60rpx;
  color: #ddd;
  margin: 0 10rpx;
  transition: all 0.3s;
}

.star.active {
  color: #ff9900;
}

.rating-section.disabled .star {
  cursor: not-allowed;
  opacity: 0.6;
}

.star-rating.small .star {
  font-size: 40rpx;
  margin: 0 6rpx;
}

.score-desc {
  text-align: center;
  font-size: 28rpx;
  color: #666;
  margin-top: 10rpx;
}

/* 详细评分 */
.rating-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
}

.item-label {
  font-size: 28rpx;
  color: #333;
  width: 160rpx;
}

/* 标签列表 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.tag-item {
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  margin-bottom: 16rpx;
  border-radius: 40rpx;
  border: 2rpx solid #e5e5e5;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;
}

.tag-item.active {
  border-color: #007aff;
  background: #e6f2ff;
  color: #007aff;
}

.tag-item.positive.active {
  border-color: #52c41a;
  background: #f6ffed;
  color: #52c41a;
}

.tag-item.negative.active {
  border-color: #ff4d4f;
  background: #fff1f0;
  color: #ff4d4f;
}

/* 文字评价 */
.content-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  background: #fafafa;
}

/* 图片上传 */
.images-list {
  display: flex;
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 44rpx;
  height: 44rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  line-height: 1;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.upload-icon {
  font-size: 60rpx;
  color: #999;
  line-height: 1;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

/* 匿名选项 */
.anonymous-label {
  display: flex;
  align-items: center;
}

.anonymous-text {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #333;
}

/* 提交按钮 */
.submit-section {
  padding: 30rpx 0;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #007aff 0%, #0056d6 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  box-shadow: 0 8rpx 16rpx rgba(0, 122, 255, 0.3);
}

.submit-btn::after {
  border: none;
}

.submit-btn[disabled] {
  background: #d9d9d9;
  color: #fff;
  box-shadow: none;
}
</style>

