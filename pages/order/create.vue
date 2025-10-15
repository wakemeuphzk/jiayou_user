<template>
  <view class="order-create">
    <!-- 导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @click="goBack">
        <uni-icons type="left" size="20" color="#333"></uni-icons>
      </view>
      <view class="navbar-title">填写订单</view>
    </view>
    
    <scroll-view scroll-y class="order-content">
      <!-- 服务信息 -->
      <view class="service-info-card" v-if="serviceInfo">
        <view class="card-title">服务信息</view>
        <view class="info-row">
          <text class="label">服务项目：</text>
          <text class="value">{{ serviceInfo.serviceName || serviceInfo.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">服务时长：</text>
          <text class="value">{{ duration }}小时</text>
        </view>
        <view class="info-row" v-if="durationLimitText">
          <text class="label">时长要求：</text>
          <text class="value">{{ durationLimitText }}</text>
        </view>
      </view>
      
      <!-- 服务时间 -->
      <view class="form-section">
        <view class="section-header">
          <uni-icons type="calendar" size="18" color="#007aff"></uni-icons>
          <text class="section-title">服务时间</text>
          <text class="required">*</text>
        </view>
        <picker mode="date" :value="appointmentDate" :start="minDate" :end="maxDate" @change="onDateChange">
          <view class="time-picker-row">
            <view class="picker-value" :class="{ placeholder: !appointmentDate }">
              {{ appointmentDate || '请选择服务日期' }}
            </view>
            <uni-icons type="right" size="16" color="#999"></uni-icons>
          </view>
        </picker>
        <picker mode="time" :value="appointmentTime" @change="onTimeChange">
          <view class="time-picker-row">
            <view class="picker-value" :class="{ placeholder: !appointmentTime }">
              {{ appointmentTime || '请选择服务时间' }}
            </view>
            <uni-icons type="right" size="16" color="#999"></uni-icons>
          </view>
        </picker>
        <view class="time-hint">最早可预约：{{ minDateHint }}</view>
      </view>
      
      <!-- 服务地址 -->
      <view class="form-section">
        <view class="section-header">
          <uni-icons type="location" size="18" color="#007aff"></uni-icons>
          <text class="section-title">服务地址</text>
          <text class="required">*</text>
        </view>
        <view class="address-selector" @click="selectAddress">
          <view v-if="selectedAddress" class="address-content">
            <view class="address-name">{{ selectedAddress.contactName }} {{ selectedAddress.phone }}</view>
            <view class="address-detail">{{ selectedAddress.fullAddress }}</view>
          </view>
          <view v-else class="address-placeholder">
            <uni-icons type="plus" size="20" color="#999"></uni-icons>
            <text>选择服务地址</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
      
      <!-- 服务要求 -->
      <view class="form-section">
        <view class="section-header">
          <uni-icons type="compose" size="18" color="#007aff"></uni-icons>
          <text class="section-title">服务要求</text>
          <text class="optional">（选填）</text>
        </view>
        <textarea 
          class="requirements-input" 
          v-model="requirements"
          placeholder="请填写特殊要求或注意事项，如家中有宠物、需要注意的地方等"
          maxlength="200"
        ></textarea>
        <view class="char-count">{{ requirements.length }}/200</view>
      </view>
      
      <!-- 优惠选择 -->
      <view class="form-section">
        <view class="section-header">
          <uni-icons type="gift" size="18" color="#007aff"></uni-icons>
          <text class="section-title">优惠</text>
        </view>
        
        <!-- 优惠券 -->
        <view class="discount-row" @click="selectCoupon">
          <view class="discount-label">
            <text>优惠券</text>
            <text class="available-count" v-if="availableCoupons.length > 0">
              ({{ availableCoupons.length }}张可用)
            </text>
          </view>
          <view class="discount-value">
            <text v-if="selectedCoupon">-¥{{ selectedCoupon.amount }}</text>
            <text v-else class="placeholder">{{ availableCoupons.length > 0 ? '请选择' : '暂无可用' }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
        
        <!-- 次卡 -->
        <view class="discount-row" @click="selectServiceCard">
          <view class="discount-label">
            <text>次卡</text>
            <text class="available-count" v-if="availableCards.length > 0">
              ({{ availableCards.length }}张可用)
            </text>
          </view>
          <view class="discount-value">
            <text v-if="selectedCard">{{ selectedCard.name }}</text>
            <text v-else class="placeholder">{{ availableCards.length > 0 ? '请选择' : '暂无可用' }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
      
      <!-- 价格明细 -->
      <view class="price-detail">
        <view class="price-row">
          <text class="label">服务费</text>
          <text class="value">¥{{ servicePrice }}</text>
        </view>
        <view class="price-row" v-if="discountAmount > 0">
          <text class="label">优惠</text>
          <text class="value discount">-¥{{ discountAmount }}</text>
        </view>
        <view class="price-row total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ finalPrice }}</text>
        </view>
      </view>
      
      <!-- 底部占位 -->
      <view style="height: 140rpx;"></view>
    </scroll-view>
    
    <!-- 底部提交 -->
    <view class="footer-bar">
      <view class="total-price">
        <text class="label">实付</text>
        <text class="value">¥{{ finalPrice }}</text>
      </view>
      <button class="btn-submit" @click="submitOrder">提交订单</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';
import NotificationUtil from '../../utils/notificationUtil';

const serviceId = ref(null);
const skuId = ref(null);
const duration = ref(2); // 服务时长（小时）
const serviceInfo = ref(null);
const selectedSku = ref(null);

// 表单数据
const appointmentDate = ref('');
const appointmentTime = ref('');
const selectedAddress = ref(null);
const requirements = ref('');

// 优惠数据
const availableCoupons = ref([]);
const availableCards = ref([]);
const selectedCoupon = ref(null);
const selectedCard = ref(null);

// 最小和最大日期
const minDate = computed(() => {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

const maxDate = computed(() => {
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

// 最小预约时间提示
const minDateHint = computed(() => {
  const minDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return `${minDate.getMonth() + 1}月${minDate.getDate()}日 ${minDate.getHours()}:00`;
});

// 服务价格（根据时长计算）
const servicePrice = computed(() => {
  // 优先使用服务信息中的单价（basePrice或hourlyPrice）
  const hourlyPrice = serviceInfo.value?.basePrice || serviceInfo.value?.hourlyPrice || serviceInfo.value?.unitPrice || 0;
  const hours = duration.value || 2;
  return Number((hourlyPrice * hours).toFixed(2));
});

// 允许的最小/最大服务时长
const minAllowedHours = computed(() => {
  // 接口 duration 可作为默认/最小值
  const min = serviceInfo.value?.minHours ?? serviceInfo.value?.duration ?? 1;
  return Number(min) || 1;
});

const maxAllowedHours = computed(() => {
  // 若接口未返回上限则为 null（不强制上限）
  return serviceInfo.value?.maxHours ?? null;
});

// 动态提示词
const durationLimitText = computed(() => {
  const name = serviceInfo.value?.name || serviceInfo.value?.serviceName || '';
  const min = minAllowedHours.value;
  const max = maxAllowedHours.value;
  if (max) {
    return `${name}最少服务时长为 ${min} 小时，最多 ${max} 小时，请将时长设置在 ${min}–${max} 之间。`;
  }
  return `${name}最少服务时长为 ${min} 小时，请将时长设置为不小于 ${min} 小时。`;
});

// 超出范围则自动纠正并提示
function clampDurationAndToast() {
  const min = minAllowedHours.value;
  const max = maxAllowedHours.value;
  let newVal = duration.value;
  if (newVal < min) newVal = min;
  if (max && newVal > max) newVal = max;
  const adjusted = newVal !== duration.value;
  if (adjusted) {
    duration.value = newVal;
    uni.showToast({
      title: durationLimitText.value,
      icon: 'none',
      duration: 2500
    });
  }
  return adjusted;
}

// 优惠金额
const discountAmount = computed(() => {
  let amount = 0;
  if (selectedCoupon.value) {
    amount += selectedCoupon.value.amount || 0;
  }
  // 次卡抵扣逻辑（这里简化处理，实际可能需要从后端获取）
  if (selectedCard.value && selectedCard.value.singleServiceValue) {
    amount += selectedCard.value.singleServiceValue;
  }
  return amount;
});

// 最终价格
const finalPrice = computed(() => {
  const price = servicePrice.value - discountAmount.value;
  return price > 0 ? price.toFixed(2) : 0;
});

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 日期选择器变化
const onDateChange = (e) => {
  appointmentDate.value = e.detail.value;
};

// 时间选择器变化
const onTimeChange = (e) => {
  appointmentTime.value = e.detail.value;
};

// 选择地址
const selectAddress = () => {
  uni.navigateTo({
    url: '/pages/user/address?mode=select',
    events: {
      // 监听地址选择事件
      selectAddress: (data) => {
        selectedAddress.value = data;
      }
    }
  });
};

// 选择优惠券
const selectCoupon = () => {
  if (availableCoupons.value.length === 0) {
    uni.showToast({
      title: '暂无可用优惠券',
      icon: 'none'
    });
    return;
  }
  
  // 显示优惠券列表（简化处理）
  const itemList = availableCoupons.value.map(c => `${c.name} - ¥${c.amount}`);
  itemList.push('不使用优惠券');
  
  uni.showActionSheet({
    itemList: itemList,
    success: (res) => {
      if (res.tapIndex < availableCoupons.value.length) {
        selectedCoupon.value = availableCoupons.value[res.tapIndex];
      } else {
        selectedCoupon.value = null;
      }
    }
  });
};

// 选择次卡
const selectServiceCard = () => {
  if (availableCards.value.length === 0) {
    uni.showToast({
      title: '暂无可用次卡',
      icon: 'none'
    });
    return;
  }
  
  // 显示次卡列表（简化处理）
  const itemList = availableCards.value.map(c => `${c.name} (剩余${c.remainingTimes}次)`);
  itemList.push('不使用次卡');
  
  uni.showActionSheet({
    itemList: itemList,
    success: (res) => {
      if (res.tapIndex < availableCards.value.length) {
        selectedCard.value = availableCards.value[res.tapIndex];
      } else {
        selectedCard.value = null;
      }
    }
  });
};

// 加载服务信息
const loadServiceInfo = async () => {
  try {
    const res = await request({
      url: `/user/service/types/${serviceId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      serviceInfo.value = res.data;
      
      // 找到对应的SKU
      if (serviceInfo.value.skus && serviceInfo.value.skus.length > 0) {
        selectedSku.value = serviceInfo.value.skus.find(sku => sku.skuId == skuId.value) || serviceInfo.value.skus[0];
      }
    }
  } catch (error) {
    console.error('加载服务信息失败:', error);
  }
};

// 加载地址列表
const loadAddresses = async () => {
  try {
    const res = await request({
      url: '/user/address/list',
      method: 'GET'
    });
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 默认选中默认地址
      selectedAddress.value = res.data.find(addr => addr.isDefault) || res.data[0];
    }
  } catch (error) {
    console.error('加载地址列表失败:', error);
  }
};

// 计算当前应付金额（不小于0）
const currentPayableAmount = computed(() => {
  const price = parseFloat(servicePrice.value) - parseFloat(discountAmount.value || 0);
  return price > 0 ? Number(price.toFixed(2)) : 0;
});

// 加载可用优惠券（使用 GET /user/coupon/available?minAmount=xxx）
const loadAvailableCoupons = async () => {
  try {
    const res = await request({
      url: `/user/coupon/available`,
      method: 'GET',
      data: {
        minAmount: currentPayableAmount.value
      }
    });
    
    if (res.code === 200) {
      availableCoupons.value = res.data || [];
    }
  } catch (error) {
    console.error('加载优惠券失败:', error);
    availableCoupons.value = [];
  }
};

// 加载可用次卡
const loadAvailableCards = async () => {
  try {
    const res = await request({
      url: '/user/service-cards/check-availability',
      method: 'POST',
      data: {
        serviceTypeId: serviceId.value
      }
    });
    
    if (res.code === 200) {
      availableCards.value = res.data || [];
    }
  } catch (error) {
    console.error('加载次卡失败:', error);
    availableCards.value = [];
  }
};

// 提交订单
const submitOrder = async () => {
  // 验证必填项
  if (!appointmentDate.value) {
    uni.showToast({
      title: '请选择服务日期',
      icon: 'none'
    });
    return;
  }
  
  if (!appointmentTime.value) {
    uni.showToast({
      title: '请选择服务时间',
      icon: 'none'
    });
    return;
  }
  
  if (!selectedAddress.value) {
    uni.showToast({
      title: '请选择服务地址',
      icon: 'none'
    });
    return;
  }
  
  // 校验预约时间（至少提前2小时）
  const appointmentDateTime = new Date(`${appointmentDate.value} ${appointmentTime.value}`);
  const now = new Date();
  const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 2) {
    uni.showModal({
      title: '预约时间无效',
      content: '预约时间至少需要提前2小时，请重新选择',
      showCancel: false,
      success: () => {
        // 自动设置为2小时后
        const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        appointmentDate.value = `${minTime.getFullYear()}-${String(minTime.getMonth() + 1).padStart(2, '0')}-${String(minTime.getDate()).padStart(2, '0')}`;
        appointmentTime.value = `${String(minTime.getHours()).padStart(2, '0')}:${String(minTime.getMinutes()).padStart(2, '0')}`;
      }
    });
    return;
  }
  
  // 提交前再次校验并纠正时长
  clampDurationAndToast();
  
  // 请求订阅消息授权（不阻塞提交流程）
  try {
    await NotificationUtil.requestSubscribe([
      'ORDER_ACCEPTED',    // 订单接单通知
      'SERVICE_STARTING',  // 服务开始提醒
      'ORDER_COMPLETED'    // 服务完成通知
    ]);
  } catch (error) {
    console.error('请求订阅授权失败:', error);
    // 即使授权失败也继续提交订单
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    // 构建订单数据
    const orderData = {
      serviceTypeId: serviceId.value,
      skuId: skuId.value,
      appointmentTime: formatAppointmentTime(appointmentDate.value, appointmentTime.value),
      duration: duration.value, // 服务时长
      addressId: selectedAddress.value.id,
      requirements: requirements.value,
      couponId: selectedCoupon.value?.id,
      serviceCardId: selectedCard.value?.id,
      // estimatedPrice = 单价 × 时长（不含优惠）
      estimatedPrice: parseFloat(servicePrice.value)
    };
    
    const res = await request({
      url: '/user/order',
      method: 'POST',
      data: orderData
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      // 订单创建成功，跳转支付页面
      uni.showToast({
        title: '订单创建成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            // 跳转到订单详情页
            uni.redirectTo({
              url: `/pages/order/detail?id=${res.data.orderId}`
            });
          }, 1500);
        }
      });
    } else {
      uni.showToast({
        title: res.message || '订单创建失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('提交订单失败:', error);
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    });
  }
};

// 工具方法：格式化预约时间为 yyyy-MM-dd HH:mm
function formatAppointmentTime(dateStr, timeStr) {
  // dateStr: yyyy-MM-dd, timeStr: HH:mm
  if (!dateStr || !timeStr) return '';
  // 统一转两位数小时分钟
  const [y, m, d] = dateStr.split('-');
  let [hh, mm] = timeStr.split(':');
  hh = String(hh).padStart(2, '0');
  mm = String(mm).padStart(2, '0');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hh}:${mm}`;
}

onLoad((options) => {
  serviceId.value = options.serviceId;
  skuId.value = options.skuId;
  duration.value = parseInt(options.duration) || 2; // 获取服务时长参数
  
  loadServiceInfo();
  loadAddresses();
  loadAvailableCoupons();
  loadAvailableCards();
});
</script>

<style scoped>
.order-create {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  z-index: 1000;
}

.navbar-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-right: 60rpx;
}

.order-content {
  height: calc(100vh - 88rpx - 120rpx);
  margin-top: 88rpx;
  padding: 20rpx 0;
}

/* 服务信息卡片 */
.service-info-card {
  background-color: #fff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.info-row .label {
  font-size: 28rpx;
  color: #666;
  width: 160rpx;
}

.info-row .value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

/* 表单区域 */
.form-section {
  background-color: #fff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-left: 10rpx;
}

.required {
  color: #ff4444;
  margin-left: 5rpx;
}

.optional {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}

/* 时间选择 */
.time-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.picker-value {
  font-size: 28rpx;
  color: #333;
}

.picker-value.placeholder {
  color: #999;
}

.time-hint {
  font-size: 24rpx;
  color: #999;
  padding-left: 10rpx;
}

/* 地址选择 */
.address-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
}

.address-content {
  flex: 1;
}

.address-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.address-detail {
  font-size: 24rpx;
  color: #666;
}

.address-placeholder {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #999;
  font-size: 28rpx;
}

/* 服务要求 */
.requirements-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

/* 优惠选择 */
.discount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.discount-row:last-child {
  border-bottom: none;
}

.discount-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
}

.available-count {
  font-size: 24rpx;
  color: #007aff;
}

.discount-value {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
}

.discount-value .placeholder {
  color: #999;
}

/* 价格明细 */
.price-detail {
  background-color: #fff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.price-row:last-child {
  margin-bottom: 0;
}

.price-row .label {
  font-size: 28rpx;
  color: #666;
}

.price-row .value {
  font-size: 28rpx;
  color: #333;
}

.price-row .value.discount {
  color: #ff4444;
}

.price-row.total .label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.price-row.total .value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4444;
}

/* 底部提交 */
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

.total-price {
  display: flex;
  flex-direction: column;
}

.total-price .label {
  font-size: 24rpx;
  color: #999;
}

.total-price .value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4444;
}

.btn-submit {
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
</style>

