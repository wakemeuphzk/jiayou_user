<template>
  <view class="rating-page">
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

    <!-- 阿姨信息 -->
    <view class="staff-info-card" v-if="staffInfo.name">
      <view class="staff-content">
        <image :src="staffInfo.avatar || '/static/images/avatar_def.png'" class="staff-avatar"></image>
        <view class="staff-detail">
          <text class="staff-name">{{ staffInfo.name }}</text>
          <view class="staff-rating">
            <text class="rating-text">⭐ {{ staffInfo.rating || 5.0 }}</text>
            <text class="service-count">已服务{{ staffInfo.orderCount || 0 }}次</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 综合评分 -->
    <view class="rating-section">
      <view class="section-title">
        <text class="title-text">综合评分</text>
        <text class="required">*</text>
      </view>
      <view class="star-rating">
        <view 
          v-for="star in 5" 
          :key="star"
          class="star"
          :class="{ active: star <= form.score }"
          @click="setScore(star)"
        >
          ★
        </view>
      </view>
      <view class="score-desc">{{ scoreDescriptions[form.score] }}</view>
    </view>

    <!-- 详细评分 -->
    <view class="detail-rating-section">
      <view class="section-title">
        <text class="title-text">详细评分</text>
        <text class="tip-text">（可选，填写可获得积分奖励）</text>
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
        <text class="tip-text">（可选）</text>
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
        <text class="tip-text">（可选）</text>
        <text class="char-count">{{ form.content.length }}/500</text>
      </view>
      <textarea 
        v-model="form.content"
        placeholder="说说您的服务体验吧，10字以上可获得积分奖励"
        maxlength="500"
        class="content-input"
        auto-height
      ></textarea>
    </view>

    <!-- 图片上传 -->
    <view class="images-section">
      <view class="section-title">
        <text class="title-text">上传图片</text>
        <text class="tip-text">（可选，最多9张，上传图片可获得积分）</text>
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

    <!-- 积分奖励提示 -->
    <view class="reward-tips">
      <view class="tips-title">🎁 积分奖励规则</view>
      <view class="tip-item">
        <text class="tip-icon">✓</text>
        <text class="tip-text">基础评价：+5积分</text>
      </view>
      <view class="tip-item">
        <text class="tip-icon">✓</text>
        <text class="tip-text">文字评价10字以上：+10积分</text>
      </view>
      <view class="tip-item">
        <text class="tip-icon">✓</text>
        <text class="tip-text">上传图片：+5积分</text>
      </view>
      <view class="tip-item">
        <text class="tip-icon">✓</text>
        <text class="tip-text">填写详细评分：+5积分</text>
      </view>
      <view class="tip-item highlight">
        <text class="tip-icon">💎</text>
        <text class="tip-text">优质评价（50字+3图）：+20积分</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button 
        class="submit-btn"
        :disabled="!canSubmit || submitting"
        @click="submitRating"
      >
        {{ submitting ? '提交中...' : '提交评价' }}
      </button>
    </view>

    <!-- 底部占位 -->
    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

// 数据
const orderId = ref(null);
const orderInfo = ref({});
const staffInfo = ref({});
const availableTags = ref([]);
const submitting = ref(false);

const form = ref({
  score: 5,
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

// 计算属性
const canSubmit = computed(() => {
  return form.value.score > 0 && !submitting.value;
});

// 方法
const loadOrderInfo = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const res = await request({
      url: `/user/order/${orderId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      orderInfo.value = res.data;
      staffInfo.value = res.data.staffInfo || res.data.staff || {};
    } else {
      uni.showToast({
        title: res.message || '加载订单信息失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载订单信息失败:', error);
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

const setScore = (score) => {
  form.value.score = score;
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
      // 直接使用临时文件路径，实际应用中需要上传到服务器
      form.value.images.push(...res.tempFilePaths);
      
      // TODO: 上传图片到服务器
      // uploadImages(res.tempFilePaths);
    }
  });
};

const removeImage = (index) => {
  form.value.images.splice(index, 1);
};

const onAnonymousChange = (e) => {
  form.value.isAnonymous = e.detail.value.length > 0;
};

const submitRating = async () => {
  if (!canSubmit.value) return;
  
  submitting.value = true;
  uni.showLoading({ title: '提交中...' });
  
  try {
    const requestData = {
      score: form.value.score,
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
      method: 'POST',
      data: requestData
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      // 立即触发事件通知订单详情页刷新
      uni.$emit('orderRated', { orderId: orderId.value });
      
      // 显示积分奖励
      const pointsReward = res.data?.pointsReward || 0;
      const rewardReason = res.data?.rewardReason || '评价奖励';
      
      if (pointsReward > 0) {
        uni.showModal({
          title: '评价成功',
          content: `感谢您的评价！\n获得 ${pointsReward} 积分奖励\n（${rewardReason}）`,
          showCancel: false,
          success: () => {
            uni.navigateBack();
          }
        });
      } else {
        uni.showToast({
          title: '评价成功',
          icon: 'success'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    } else {
      uni.showToast({
        title: res.message || '提交失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('提交评价失败:', error);
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

onLoad((options) => {
  orderId.value = options.orderId;
  if (orderId.value) {
    loadOrderInfo();
    loadTags();
  } else {
    uni.showToast({
      title: '订单ID不存在',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style lang="scss" scoped>
.rating-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20rpx;
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

/* 阿姨信息卡片 */
.staff-info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.staff-content {
  display: flex;
  align-items: center;
}

.staff-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.staff-detail {
  flex: 1;
}

.staff-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.staff-rating {
  display: flex;
  align-items: center;
}

.rating-text {
  font-size: 26rpx;
  color: #ff9900;
  margin-right: 20rpx;
}

.service-count {
  font-size: 24rpx;
  color: #999;
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

.required {
  color: #ff4d4f;
  margin-left: 4rpx;
  font-size: 28rpx;
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

/* 积分奖励提示 */
.reward-tips {
  background: linear-gradient(135deg, #FFF7E6 0%, #FFF3CC 100%);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid #FFD966;
}

.tips-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #FA8C16;
  margin-bottom: 20rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  padding: 8rpx 0;
}

.tip-icon {
  font-size: 24rpx;
  color: #FA8C16;
  margin-right: 12rpx;
  font-weight: bold;
}

.tip-item .tip-text {
  font-size: 26rpx;
  color: #595959;
  margin-left: 0;
}

.tip-item.highlight {
  background: linear-gradient(135deg, #FFE7BA 0%, #FFD966 100%);
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  margin-top: 12rpx;
}

.tip-item.highlight .tip-icon {
  font-size: 28rpx;
}

.tip-item.highlight .tip-text {
  font-weight: bold;
  color: #8B5A00;
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
