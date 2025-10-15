<template>
  <view class="card-detail">
    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <uni-icons type="spinner-cycle" size="40" color="#007aff"></uni-icons>
      <text>加载中...</text>
    </view>
    
    <view v-else-if="card">
      <!-- 次卡头部 -->
      <view class="card-header">
        <image :src="card.imageUrl || '/static/images/card-bg.png'" mode="aspectFill" class="card-image"></image>
        <view class="card-info">
          <view class="card-name">{{ card.name }}</view>
          <view class="card-rating">
            <view class="stars">
              <text class="star" v-for="n in 5" :key="n">⭐</text>
            </view>
            <text class="rating-score">{{ card.rating || 5.0 }}</text>
            <text class="service-count">已服务{{ card.soldCount || 0 }}次</text>
          </view>
          <view class="card-tags">
            <text class="tag-new" v-if="card.isNewCustomerExclusive">新客专享</text>
            <text class="tag-hot" v-if="card.isHot">热门</text>
          </view>
          <view class="card-description">{{ card.description }}</view>
        </view>
      </view>
      
      <!-- SKU规格选择 -->
      <view class="sku-section">
        <view class="section-title">选择规格</view>
        <view class="sku-list">
          <view 
            class="sku-item" 
            :class="{ active: selectedSku && selectedSku.skuId === sku.skuId }"
            v-for="sku in card.skus" 
            :key="sku.skuId"
            @click="selectSku(sku)"
          >
            <view class="sku-main">
              <view class="sku-name">{{ sku.skuName || (sku.serviceTimes + '次卡') }}</view>
              <view class="sku-price">
                <text class="price-current">¥{{ sku.unitPrice }}</text>
                <text class="price-original" v-if="sku.originalPrice && sku.originalPrice > sku.unitPrice">
                  ¥{{ sku.originalPrice }}
                </text>
              </view>
            </view>
            <view class="sku-extra">
              <text class="sku-save" v-if="sku.originalPrice && sku.originalPrice > sku.unitPrice">
                省¥{{ (sku.originalPrice - sku.unitPrice).toFixed(2) }}
              </text>
              <text class="sku-value" v-if="sku.singleServiceValue">
                单次价值¥{{ sku.singleServiceValue }}
              </text>
            </view>
            <view class="sku-badge" v-if="selectedSku && selectedSku.skuId === sku.skuId">
              <uni-icons type="checkmarkempty" size="20" color="#fff"></uni-icons>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 次卡说明 -->
      <view class="card-description-section">
        <view class="section-title">次卡说明</view>
        
        <view class="info-group">
          <view class="info-label">
            <uni-icons type="shop" size="16" color="#007aff"></uni-icons>
            <text>适用服务</text>
          </view>
          <view class="info-value">{{ getApplicableServicesText() }}</view>
        </view>
        
        <view class="info-group">
          <view class="info-label">
            <uni-icons type="calendar" size="16" color="#007aff"></uni-icons>
            <text>有效期</text>
          </view>
          <view class="info-value">{{ selectedSku?.validityDays || 90 }}天</view>
        </view>
        
        <view class="info-group">
          <view class="info-label">
            <uni-icons type="info" size="16" color="#007aff"></uni-icons>
            <text>使用规则</text>
          </view>
          <view class="info-value">
            <view class="rule-item">1. 次卡激活后{{ selectedSku?.validityDays || 90 }}天内有效</view>
            <view class="rule-item">2. 每次预约服务可使用1次</view>
            <view class="rule-item">3. 不可与其他优惠同时使用</view>
            <view class="rule-item">4. 过期后不可使用</view>
          </view>
        </view>
        
        <view class="info-group">
          <view class="info-label">
            <uni-icons type="wallet" size="16" color="#007aff"></uni-icons>
            <text>退款说明</text>
          </view>
          <view class="info-value">{{ getRefundPolicyText() }}</view>
        </view>
      </view>
      
      <!-- 购买须知 -->
      <view class="purchase-notice">
        <view class="section-title">购买须知</view>
        <view class="notice-list">
          <view class="notice-item" v-if="card.isNewCustomerExclusive">
            • 本次卡仅限新客户购买，每人限购{{ card.purchaseLimit || 1 }}次
          </view>
          <view class="notice-item">
            • 购买成功后次卡立即生效
          </view>
          <view class="notice-item">
            • 次卡不可转让，仅限本人使用
          </view>
          <view class="notice-item">
            • 如有疑问，请联系客服
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="card">
      <view class="price-summary">
        <text class="price-label">实付</text>
        <text class="price-value">¥{{ selectedSku ? selectedSku.unitPrice : 0 }}</text>
      </view>
      <button class="btn-purchase" @click="purchaseCard" :disabled="!card.canPurchase">
        {{ getPurchaseButtonText() }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';
import { baseURL } from '../../config/config';

const productId = ref(null);
const card = ref(null);
const selectedSku = ref(null);
const loading = ref(true);
const userInfo = ref(null);

// 选择SKU
const selectSku = (sku) => {
  selectedSku.value = sku;
};

// 获取适用服务文本
const getApplicableServicesText = () => {
  if (selectedSku.value && selectedSku.value.applicableServices && selectedSku.value.applicableServices.length > 0) {
    return selectedSku.value.applicableServices.join('、');
  }
  if (card.value && card.value.applicableServices) {
    return card.value.applicableServices;
  }
  return '全场通用（基础保洁、深度保洁等）';
};

// 获取退款政策文本
const getRefundPolicyText = () => {
  if (!card.value) return '';
  
  const policy = card.value.refundPolicy;
  if (policy === 'PROPORTIONAL') {
    return '按比例退款（未使用次数按比例退款）';
  } else if (policy === 'NO_REFUND') {
    return '不支持退款';
  } else if (policy === 'FULL_REFUND') {
    return '支持全额退款';
  }
  return '按比例退款';
};

// 获取购买按钮文本
const getPurchaseButtonText = () => {
  if (!card.value.canPurchase) {
    if (card.value.isNewCustomerExclusive && userInfo.value && !userInfo.value.isNew) {
      return '仅限新客购买';
    }
    return '已达购买上限';
  }
  return '立即购买';
};

// 加载次卡详情
const loadCardDetail = async () => {
  try {
    loading.value = true;
    
    const res = await request({
      url: `/user/service-cards/products/${productId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      card.value = res.data;
      
      // 处理每个SKU的数据，解析 specifications
      if (card.value.skus && card.value.skus.length > 0) {
        card.value.skus = card.value.skus.map(sku => {
          // 解析 specifications JSON 字符串
          let parsedSpecs = {};
          try {
            if (sku.specifications) {
              parsedSpecs = JSON.parse(sku.specifications);
            }
          } catch (e) {
            console.error('解析SKU规格失败:', e);
          }
          
          // 提取有效期（如 "180天" -> 180）
          let validityDays = 0;
          if (parsedSpecs.validity) {
            const match = parsedSpecs.validity.match(/(\d+)/);
            if (match) {
              validityDays = parseInt(match[1]);
            }
          }
          
          return {
            ...sku,
            serviceTimes: parsedSpecs.times || 0, // 服务次数
            validityDays: validityDays, // 有效天数
            discount: parsedSpecs.discount || '', // 折扣信息
            applicableServices: parsedSpecs.services || [], // 适用服务列表
            unitPrice: sku.originalPrice, // 单价使用 originalPrice
            singleServiceValue: sku.singleServiceValue // 单次价值
          };
        });
        
        // 默认选中第一个SKU
        selectedSku.value = card.value.skus[0];
      }
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载次卡详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await request({
      url: '/user/profile',
      method: 'GET'
    });
    
    if (res.code === 200) {
      userInfo.value = res.data;
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 购买次卡（直接付款，无需填写其他信息）
const purchaseCard = async () => {
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
  
  if (!card.value.canPurchase) {
    uni.showToast({
      title: '无法购买此次卡',
      icon: 'none'
    });
    return;
  }
  
  if (!selectedSku.value) {
    uni.showToast({
      title: '请选择规格',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({ title: '创建订单中...' });
    
    // 直接创建次卡订单并调起支付
    const res = await request({
      url: '/user/service-cards/purchase',
      method: 'POST',
      data: {
        productId: productId.value,
        skuId: selectedSku.value.skuId,
        paymentChannel: 'WECHAT'
      }
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      // 调起微信支付
      callWxPay(res.data);
    } else {
      uni.showToast({
        title: res.message || '购买失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('购买次卡失败:', error);
    uni.showToast({
      title: error.message || '购买失败',
      icon: 'none'
    });
  }
};

// 调起微信支付
const callWxPay = (paymentData) => {
  // 这里简化处理，实际需要根据返回的支付参数调起支付
  uni.showModal({
    title: '提示',
    content: '支付功能开发中，是否模拟支付成功？',
    success: (res) => {
      if (res.confirm) {
        // 模拟支付成功
        uni.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              // 跳转到我的次卡页面
              uni.redirectTo({
                url: '/pages/card/my-cards'
              });
            }, 1500);
          }
        });
      }
    }
  });
  
  // 实际支付代码：
  /*
  uni.requestPayment({
    provider: 'wxpay',
    timeStamp: paymentData.timeStamp,
    nonceStr: paymentData.nonceStr,
    package: paymentData.package,
    signType: paymentData.signType,
    paySign: paymentData.paySign,
    success: () => {
      uni.showToast({
        title: '支付成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/card/my-cards'
            });
          }, 1500);
        }
      });
    },
    fail: (error) => {
      if (error.errMsg !== 'requestPayment:fail cancel') {
        uni.showToast({
          title: '支付失败',
          icon: 'none'
        });
      }
    }
  });
  */
};

onLoad((options) => {
  productId.value = options.id;
  
  loadCardDetail();
  loadUserInfo();
});
</script>

<style scoped>
.card-detail {
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
  gap: 20rpx;
}

/* 次卡头部 */
.card-header {
  background-color: #fff;
  margin-bottom: 20rpx;
}

.card-image {
  width: 100%;
  height: 400rpx;
}

.card-info {
  padding: 30rpx;
}

.card-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.stars {
  display: flex;
  gap: 4rpx;
}

.star {
  font-size: 24rpx;
  color: #FFD700;
}

.rating-score {
  font-size: 26rpx;
  color: #ff6b00;
  font-weight: bold;
}

.service-count {
  font-size: 24rpx;
  color: #999;
}

.card-tags {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.tag-new,
.tag-hot {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #fff;
}

.tag-new {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4444 100%);
}

.tag-hot {
  background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
}

.card-description {
  font-size: 28rpx;
  line-height: 1.6;
  color: #666;
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
  flex-direction: column;
  gap: 20rpx;
}

.sku-item {
  position: relative;
  padding: 25rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.sku-item.active {
  border-color: #007aff;
  background-color: #e6f2ff;
}

.sku-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.sku-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.sku-price {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.price-current {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4444;
}

.price-original {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.sku-extra {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.sku-save {
  font-size: 24rpx;
  color: #ff4444;
}

.sku-value {
  font-size: 24rpx;
  color: #666;
}

.sku-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: #007aff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 次卡说明 */
.card-description-section,
.purchase-notice {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-group {
  margin-bottom: 30rpx;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.info-value {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
  padding-left: 35rpx;
}

.rule-item {
  margin-bottom: 10rpx;
}

/* 购买须知 */
.notice-list {
  padding-left: 10rpx;
}

.notice-item {
  font-size: 28rpx;
  line-height: 2;
  color: #666;
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

.btn-purchase {
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

.btn-purchase[disabled] {
  background: #ccc;
  opacity: 0.6;
}
</style>

