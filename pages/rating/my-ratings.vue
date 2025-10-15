<template>
  <view class="my-ratings-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">‹</text>
        </view>
        <view class="navbar-title">我的评价</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- 主内容区 -->
    <scroll-view scroll-y class="content" @scrolltolower="loadMore">
      <!-- 加载中 -->
      <view v-if="loading && ratings.length === 0" class="loading-box">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 评价列表 -->
      <view v-else-if="ratings.length > 0" class="ratings-list">
        <view 
          v-for="rating in ratings" 
          :key="rating.id"
          class="rating-card"
        >
          <!-- 订单信息 -->
          <view class="order-info">
            <text class="order-no">订单号：{{ rating.orderNo }}</text>
            <text class="order-status">{{ rating.statusDesc }}</text>
          </view>

          <!-- 服务信息 -->
          <view class="service-info">
            <text class="service-name">{{ rating.productName }}</text>
            <view class="rating-score">
              <view class="stars">
                <text 
                  v-for="star in 5" 
                  :key="star"
                  class="star"
                  :class="{ active: star <= rating.score }"
                >
                  ★
                </text>
              </view>
              <text v-if="rating.editCount > 0" class="edited-tag">（已编辑）</text>
            </view>
          </view>

          <!-- 阿姨信息 -->
          <view class="staff-info" v-if="rating.staffInfo">
            <image :src="rating.staffInfo.avatar || '/static/images/avatar_def.png'" class="staff-avatar"></image>
            <text class="staff-name">{{ rating.staffInfo.name }}</text>
          </view>

          <!-- 评价内容 -->
          <view v-if="rating.content" class="rating-content">
            <text class="content-text">{{ rating.content }}</text>
          </view>

          <!-- 评价图片 -->
          <view v-if="rating.images && rating.images.length > 0" class="rating-images">
            <image 
              v-for="(image, index) in rating.images" 
              :key="index"
              :src="image"
              mode="aspectFill"
              class="rating-image"
              @click="previewImage(rating.images, index)"
            ></image>
          </view>

          <!-- 评价标签 -->
          <view v-if="rating.tags && rating.tags.length > 0" class="rating-tags">
            <view 
              v-for="(tag, index) in rating.tags" 
              :key="index"
              class="tag-item"
            >
              {{ tag }}
            </view>
          </view>

          <!-- 评价时间 -->
          <view class="rating-time">
            <text class="time-text">{{ formatTime(rating.createdTime) }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="rating-actions">
            <button 
              v-if="canEdit(rating)" 
              class="action-btn edit-btn"
              @click="editRating(rating)"
            >
              修改
            </button>
            <button 
              v-if="canDelete(rating)" 
              class="action-btn delete-btn"
              @click="deleteRating(rating)"
            >
              删除
            </button>
            <view v-if="!canEdit(rating) && !canDelete(rating)" class="expired-tip">
              已过期（15天内可修改/删除）
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-box">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无评价</text>
        <text class="empty-tip">完成订单后可进行评价</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="load-more">
        <text class="load-more-text">加载更多...</text>
      </view>
      
      <view v-if="!hasMore && ratings.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import request from '../../api/request';

// 数据
const ratings = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(10);
const total = ref(0);
const hasMore = ref(true);

// 计算是否可以编辑（15天内且修改次数<1）
const canEdit = (rating) => {
  if (!rating.createdTime) return false;
  
  const createTime = new Date(rating.createdTime).getTime();
  const now = Date.now();
  const daysPassed = (now - createTime) / (1000 * 60 * 60 * 24);
  
  return daysPassed <= 15 && (rating.editCount || 0) < 1 && rating.status === 'PUBLISHED';
};

// 计算是否可以删除（15天内）
const canDelete = (rating) => {
  if (!rating.createdTime) return false;
  
  const createTime = new Date(rating.createdTime).getTime();
  const now = Date.now();
  const daysPassed = (now - createTime) / (1000 * 60 * 60 * 24);
  
  return daysPassed <= 15 && rating.status === 'PUBLISHED';
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 加载评价列表
const loadRatings = async (isLoadMore = false) => {
  if (loading.value) return;

  try {
    loading.value = true;

    const res = await request({
      url: '/user/ratings',
      method: 'GET',
      data: {
        page: page.value,
        size: size.value
      }
    });

    if (res.code === 200 && res.data) {
      const data = res.data;
      const records = data.records || [];

      if (isLoadMore) {
        ratings.value = [...ratings.value, ...records];
      } else {
        ratings.value = records;
      }

      total.value = data.total || 0;
      hasMore.value = data.hasNext || false;
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载评价列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadRatings(true);
};

// 修改评价
const editRating = (rating) => {
  uni.navigateTo({
    url: `/pages/rating/edit?orderId=${rating.orderId}&ratingId=${rating.id}`
  });
};

// 删除评价
const deleteRating = (rating) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这条评价吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' });
          
          const deleteRes = await request({
            url: `/user/order/${rating.orderId}/rating`,
            method: 'DELETE'
          });
          
          uni.hideLoading();
          
          if (deleteRes.code === 200) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 刷新列表
            page.value = 1;
            loadRatings();
          } else {
            uni.showToast({
              title: deleteRes.message || '删除失败',
              icon: 'none'
            });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('删除评价失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 预览图片
const previewImage = (images, current) => {
  uni.previewImage({
    urls: images,
    current: current
  });
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

onLoad(() => {
  loadRatings();
});

onShow(() => {
  // 从编辑页返回时刷新
  page.value = 1;
  loadRatings();
});
</script>

<style lang="scss" scoped>
.my-ratings-page {
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

/* 加载中 */
.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 空状态 */
.empty-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #bbb;
}

/* 评价列表 */
.ratings-list {
  padding-bottom: 20rpx;
}

/* 评价卡片 */
.rating-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 订单信息 */
.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 24rpx;
  color: #007aff;
}

/* 服务信息 */
.service-info {
  margin-bottom: 20rpx;
}

.service-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.rating-score {
  display: flex;
  align-items: center;
}

.stars {
  display: flex;
}

.star {
  font-size: 32rpx;
  color: #ddd;
  margin-right: 4rpx;
}

.star.active {
  color: #ff9900;
}

.edited-tag {
  font-size: 22rpx;
  color: #ff9900;
  margin-left: 12rpx;
}

/* 阿姨信息 */
.staff-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.staff-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.staff-name {
  font-size: 28rpx;
  color: #666;
}

/* 评价内容 */
.rating-content {
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

/* 评价图片 */
.rating-images {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.rating-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
  margin-bottom: 16rpx;
}

/* 评价标签 */
.rating-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.tag-item {
  padding: 8rpx 20rpx;
  background: #f0f7ff;
  color: #007aff;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
}

/* 评价时间 */
.rating-time {
  margin-bottom: 20rpx;
}

.time-text {
  font-size: 24rpx;
  color: #999;
}

/* 操作按钮 */
.rating-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  border-radius: 40rpx;
  border: none;
  margin-left: 16rpx;
}

.action-btn::after {
  border: none;
}

.edit-btn {
  background: #e6f2ff;
  color: #007aff;
}

.delete-btn {
  background: #fff1f0;
  color: #ff4d4f;
}

.expired-tip {
  font-size: 24rpx;
  color: #bbb;
}

/* 加载更多 */
.load-more,
.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}

.load-more-text,
.no-more-text {
  font-size: 26rpx;
  color: #999;
}
</style>
