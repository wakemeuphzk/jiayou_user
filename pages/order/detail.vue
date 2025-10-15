<template>
  <view class="order-detail">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @click="goBack">
        <uni-icons type="left" size="20" color="#333"></uni-icons>
      </view>
      <view class="navbar-title">订单详情</view>
    </view>
    
    <scroll-view scroll-y class="detail-content" v-if="order">
      <!-- 支付超时倒计时 -->
      <view v-if="order.status === 'PENDING_PAYMENT' && paymentRemaining > 0" class="payment-countdown" :class="countdownClass">
        <view class="countdown-header">
          <text class="icon">⏰</text>
          <text class="text">请在 {{ paymentCountdownText }} 内完成支付，否则订单将自动取消</text>
        </view>
        <view class="countdown-time">{{ formatCountdown(paymentRemaining) }}</view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: paymentProgressWidth }"></view>
        </view>
      </view>
      
      <!-- 等待接单倒计时 -->
      <view v-if="order.status === 'PENDING' && acceptRemaining > 0" class="accept-countdown">
        <view class="countdown-header">
          <text class="icon">⏳</text>
          <text class="title">正在为您匹配阿姨...</text>
        </view>
        <view class="countdown-info">
          <text>若 {{ formatTime(acceptRemaining) }} 内无人接单，将自动取消并全额退款</text>
        </view>
        <view class="progress-wrapper">
          <progress :percent="acceptProgress" stroke-width="8" activeColor="#1890FF" backgroundColor="#f0f0f0" />
        </view>
      </view>
      
      <!-- 服务超时警告 -->
      <view v-if="order.status === 'ACCEPTED' && isServiceTimeout" class="timeout-warning">
        <view class="warning-header">
          <text class="icon">⚠️</text>
          <text>服务已超时，系统将自动取消订单并退款</text>
        </view>
        <view class="warning-actions">
          <button class="btn-warning" @click="contactStaff">联系阿姨</button>
        </view>
      </view>
      
      <!-- 取消原因友好提示 -->
      <view v-if="order.status === 'CANCELLED'" class="cancel-reason-tip">
        <!-- 支付超时 -->
        <view v-if="order.cancelReason === 'SYSTEM_PAYMENT_TIMEOUT'" class="reason-content">
          <view class="reason-header">
            <text class="icon">💳</text>
            <text class="title">支付超时</text>
          </view>
          <text class="desc">订单已自动取消，如需服务请重新下单</text>
        </view>
        
        <!-- 无人接单 -->
        <view v-else-if="order.cancelReason === 'SYSTEM_NO_STAFF'" class="reason-content">
          <view class="reason-header">
            <text class="icon">😔</text>
            <text class="title">暂无阿姨接单</text>
          </view>
          <text class="desc">款项将在1-3个工作日内原路退回</text>
        </view>
        
        <!-- 服务超时 -->
        <view v-else-if="order.cancelReason === 'SYSTEM_TIMEOUT'" class="reason-content">
          <view class="reason-header">
            <text class="icon">⏰</text>
            <text class="title">服务超时</text>
          </view>
          <text class="desc">阿姨未按时到达，已为您全额退款</text>
        </view>
        
        <!-- 用户主动取消 -->
        <view v-else-if="order.cancelReason && order.cancelReason.startsWith('USER_')" class="reason-content">
          <view class="reason-header">
            <text class="icon">📋</text>
            <text class="title">订单已取消</text>
          </view>
          <text class="desc">{{ getCancelReasonText(order.cancelReason) }}</text>
          <text v-if="order.cancelDesc && order.cancelDesc !== order.cancelReason" class="extra-desc">{{ order.cancelDesc }}</text>
        </view>
      </view>
      
      <!-- 订单状态 -->
      <view class="status-section" :class="getStatusClass()">
        <view class="status-icon">
          <uni-icons :type="getStatusIcon()" size="60" color="#fff"></uni-icons>
        </view>
        <view class="status-info">
          <view class="status-text">{{ getStatusText() }}</view>
          <view class="status-desc">{{ getStatusDesc() }}</view>
        </view>
      </view>
      
      <!-- 服务信息 -->
      <view class="info-card">
        <view class="card-title">服务信息</view>
        <view class="info-row">
          <text class="label">服务项目</text>
          <text class="value">{{ order.serviceTypeName }}</text>
        </view>
        <view class="info-row">
          <text class="label">服务时长</text>
          <text class="value">{{ order.duration }}小时</text>
        </view>
        <view class="info-row">
          <text class="label">服务时间</text>
          <text class="value">{{ formatDateTime(order.appointmentTime) }}</text>
        </view>
        <view class="info-row">
          <text class="label">服务地址</text>
          <text class="value">{{ order.addressInfo?.address || order.address }}</text>
        </view>
        <view class="info-row" v-if="order.requirements">
          <text class="label">服务要求</text>
          <text class="value">{{ order.requirements }}</text>
        </view>
      </view>
      
      <!-- 阿姨信息（已接单后显示） -->
      <view class="info-card" v-if="order.staffInfo || order.staff">
        <view class="card-title">服务人员</view>
        <view class="staff-info">
          <image :src="staffAvatar" class="staff-avatar"></image>
          <view class="staff-detail">
            <view class="staff-name">{{ staffName }}</view>
            <view class="staff-rating">
              <text class="rating">⭐ {{ staffRating }}</text>
              <text class="service-count">已服务{{ staffOrderCount }}次</text>
            </view>
          </view>
          <button class="btn-contact" @click="contactStaff">
            <uni-icons type="phone" size="18" color="#007aff"></uni-icons>
            <text>联系</text>
          </button>
        </view>
      </view>
      
      <!-- 核验码显示（已接单和服务中状态） -->
      <view class="info-card verification-card" v-if="order.verificationCode">
        <view class="verification-header">
          <text class="verification-icon">🔐</text>
          <text class="verification-title">服务核验码</text>
        </view>
        <view class="verification-content">
          <text class="code-number">{{ order.verificationCode }}</text>
        </view>
        <view class="verification-tip">
          <text class="tip-text">请向阿姨提供此核验码以确认服务</text>
        </view>
      </view>
      
      <!-- 价格明细 -->
      <view class="info-card">
        <view class="card-title">价格明细</view>
        <view class="price-row">
          <text class="label">服务费</text>
          <text class="value">¥{{ order.totalPrice || 0 }}</text>
        </view>
        <view class="price-row total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ order.paidAmount || order.totalPrice || 0 }}</text>
        </view>
      </view>
      
      <!-- 取消信息卡片（已取消订单显示） -->
      <view v-if="order.status === 'CANCELLED' && cancellationInfo" class="info-card cancel-info-card">
        <view class="card-title cancel-title">
          <view class="title-left">
            <text class="icon">📋</text>
            <text class="text">取消信息</text>
          </view>
          <text class="refund-status" :class="'status-' + cancellationInfo.refundStatus">
            {{ cancellationInfo.refundStatusDesc }}
          </text>
        </view>
        
        <view class="cancel-info-row">
          <text class="label">取消时间</text>
          <text class="value">{{ formatDateTime(cancellationInfo.cancelTime) }}</text>
        </view>
        
        <view class="cancel-info-row">
          <text class="label">取消原因</text>
          <text class="value">{{ cancellationInfo.cancelDesc }}</text>
        </view>
        
        <view class="cancel-amount-box">
          <view class="amount-box-header">
            <text class="icon">💰</text>
            <text>费用明细</text>
          </view>
          
          <view class="amount-row">
            <text class="label">订单金额</text>
            <text class="value">¥{{ cancellationInfo.orderAmount }}</text>
          </view>
          
          <view v-if="cancellationInfo.penaltyAmount > 0" class="amount-row warning">
            <text class="label">违约金</text>
            <text class="value">-¥{{ cancellationInfo.penaltyAmount }}</text>
          </view>
          
          <view class="amount-row highlight">
            <text class="label">退款金额</text>
            <text class="value refund-amount">¥{{ cancellationInfo.refundAmount }}</text>
          </view>
        </view>
        
        <view v-if="cancellationInfo.refundNo" class="cancel-info-row">
          <text class="label">退款流水号</text>
          <text class="value small">{{ cancellationInfo.refundNo }}</text>
        </view>
        
        <view v-if="cancellationInfo.creditScoreDeduction > 0" class="credit-warning">
          <uni-icons type="info" size="14" color="#ff6b6b"></uni-icons>
          <text>信用分扣除：{{ cancellationInfo.creditScoreDeduction }}分</text>
        </view>
      </view>
      
      <!-- 订单信息 -->
      <view class="info-card">
        <view class="card-title">订单信息</view>
        <view class="info-row">
          <text class="label">订单号</text>
          <text class="value">{{ order.orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="label">创建时间</text>
          <text class="value">{{ formatDateTime(order.createTime) }}</text>
        </view>
        <view class="info-row" v-if="order.paymentTime">
          <text class="label">支付时间</text>
          <text class="value">{{ formatDateTime(order.paymentTime) }}</text>
        </view>
      </view>
      
      <!-- 取消说明（待接单或已接单时显示） -->
      <view class="cancel-policy" v-if="canCancel">
        <view class="policy-title">
          <uni-icons type="info" size="16" color="#ff9900"></uni-icons>
          <text>取消说明</text>
        </view>
        <view class="policy-content">
          <view class="policy-item">• 距服务开始大于4小时：扣除5%违约金</view>
          <view class="policy-item">• 距服务开始2-4小时：扣除20%违约金</view>
          <view class="policy-item">• 距服务开始小于2小时：不可取消</view>
        </view>
      </view>
      
      <!-- 底部占位 -->
      <view style="height: 140rpx;"></view>
    </scroll-view>
    
    <!-- 取消订单确认弹窗 -->
    <view v-if="showCancelModal" class="cancel-modal-mask" @click="closeCancelModal">
      <view class="cancel-modal" @click.stop>
        <view class="modal-header">
          <text class="title">确认取消订单</text>
          <text class="close-btn" @click="closeCancelModal">×</text>
        </view>
        
        <scroll-view scroll-y class="modal-body">
          <!-- 违约金信息 -->
          <view v-if="cancelPenalty" class="penalty-info">
            <view class="penalty-header">
              <text class="icon">💰</text>
              <text class="title">费用说明</text>
            </view>
            
            <view class="info-row">
              <text class="label">订单金额</text>
              <text class="value">¥{{ cancelPenalty.orderAmount }}</text>
            </view>
            
            <view v-if="cancelPenalty.penaltyAmount > 0" class="info-row warning">
              <text class="label">违约金 ({{ (cancelPenalty.penaltyRate * 100).toFixed(0) }}%)</text>
              <text class="value">-¥{{ cancelPenalty.penaltyAmount }}</text>
            </view>
            
            <view class="info-row highlight">
              <text class="label">退款金额</text>
              <text class="value">¥{{ cancelPenalty.refundAmount }}</text>
            </view>
            
            <view v-if="cancelPenalty.pointsDeduction > 0" class="info-row warning">
              <text class="label">信用分扣除</text>
              <text class="value">-{{ cancelPenalty.pointsDeduction }}分</text>
            </view>
          </view>
          
          <!-- 温馨提示 -->
          <view v-if="cancelPenalty && cancelPenalty.tips && cancelPenalty.tips.length > 0" class="tips-box">
            <view class="tips-title">
              <text class="icon">💡</text>
              <text>温馨提示</text>
            </view>
            <view class="tips-list">
              <view v-for="(tip, index) in cancelPenalty.tips" :key="index" class="tip-item">
                {{ tip }}
              </view>
            </view>
          </view>
          
          <!-- 取消原因选择 -->
          <view class="reason-section">
            <text class="section-title">请选择取消原因 <text class="required">*</text></text>
            <view class="reason-list">
              <view 
                v-for="reason in cancelReasons" 
                :key="reason.value"
                class="reason-item"
                :class="{ selected: selectedReason === reason.value }"
                @click="selectReason(reason.value)"
              >
                <text class="reason-text">{{ reason.label }}</text>
                <text v-if="selectedReason === reason.value" class="check-icon">✓</text>
              </view>
            </view>
          </view>
          
          <!-- 补充说明 -->
          <view class="desc-section">
            <text class="section-title">补充说明（选填）</text>
            <textarea 
              class="desc-input"
              placeholder="请输入取消原因补充说明"
              maxlength="200"
              v-model="cancelDesc"
            />
          </view>
        </scroll-view>
        
        <view class="modal-footer">
          <button class="btn btn-cancel" @click="closeCancelModal">
            再想想
          </button>
          <button class="btn btn-confirm" @click="confirmCancel">
            确认取消
          </button>
        </view>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="order">
      <!-- 待支付 -->
      <template v-if="order.status === 'PENDING_PAYMENT'">
        <button class="btn-secondary" @click="cancelOrder">取消订单</button>
        <button class="btn-primary" @click="payOrder">立即支付</button>
      </template>
      
      <!-- 待接单 -->
      <template v-else-if="order.status === 'PENDING'">
        <button class="btn-secondary" @click="cancelOrder">取消订单</button>
      </template>
      
      <!-- 已接单 -->
      <template v-else-if="order.status === 'ACCEPTED'">
        <button class="btn-secondary" @click="cancelOrder">取消订单</button>
        <button class="btn-primary" @click="contactStaff">联系阿姨</button>
      </template>
      
      <!-- 服务中 -->
      <template v-else-if="order.status === 'STARTED'">
        <button class="btn-primary full" @click="contactStaff">联系阿姨</button>
      </template>
      
      <!-- 已完成 -->
      <template v-else-if="order.status === 'COMPLETED'">
        <button class="btn-secondary" v-if="!order.reviewed && !hasRated" @click="reviewOrder">评价订单</button>
        <button class="btn-primary" @click="bookAgain">再次预约</button>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import request from '../../api/request';

const orderId = ref(null);
const order = ref(null);
const cancellationInfo = ref(null); // 取消记录信息
const hasRated = ref(false); // 本地评价状态

// 取消订单相关
const showCancelModal = ref(false);
const cancelPenalty = ref(null);
const selectedReason = ref('');
const cancelDesc = ref('');

// 取消原因列表
const cancelReasons = ref([
  { value: 'USER_NO_NEED', label: '我不需要了' },
  { value: 'USER_TIME_CONFLICT', label: '时间有冲突' },
  { value: 'USER_PRICE_HIGH', label: '价格太贵' },
  { value: 'USER_FOUND_ALTERNATIVE', label: '找到其他服务' },
  { value: 'USER_PERSONAL_REASON', label: '个人原因' },
  { value: 'USER_OTHER', label: '其他原因' }
]);

// 获取取消原因文本
const getCancelReasonText = (reason) => {
  const reasonMap = {
    'USER_NO_NEED': '我不需要了',
    'USER_TIME_CONFLICT': '时间有冲突',
    'USER_PRICE_HIGH': '价格太贵',
    'USER_FOUND_ALTERNATIVE': '找到其他服务',
    'USER_PERSONAL_REASON': '个人原因',
    'USER_OTHER': '其他原因',
    'STAFF_CANCEL': '阿姨取消',
    'PLATFORM_CANCEL': '平台取消'
  };
  return reasonMap[reason] || '订单已取消';
};

// 倒计时相关
const paymentRemaining = ref(0); // 支付倒计时（秒）
const acceptRemaining = ref(0); // 接单倒计时（秒）
const countdownTimer = ref(null); // 倒计时定时器
const pollingTimer = ref(null); // 轮询定时器

// 是否可以取消
const canCancel = computed(() => {
  if (!order.value) return false;
  return ['PENDING', 'ACCEPTED'].includes(order.value.status);
});

// 支付倒计时文本
const paymentCountdownText = computed(() => {
  if (paymentRemaining.value <= 0) return '即将超时';
  const minutes = Math.floor(paymentRemaining.value / 60);
  return minutes > 0 ? `${minutes}分钟` : '1分钟';
});

// 格式化倒计时
const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 格式化时间（分钟）
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  return `${m}分钟`;
};

// 格式化日期时间（时间戳 → yyyy-MM-dd HH:mm）
const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 接单进度
const acceptProgress = computed(() => {
  const total = 30 * 60; // 30分钟
  if (acceptRemaining.value <= 0) return 100;
  const progress = 100 - (acceptRemaining.value / total * 100);
  return progress > 0 ? progress : 0;
});

// 是否服务超时
const isServiceTimeout = computed(() => {
  if (!order.value || order.value.status !== 'ACCEPTED') return false;
  
  const serviceTime = new Date(order.value.serviceTime || order.value.appointmentTime).getTime();
  const now = Date.now();
  const elapsed = now - serviceTime;
  const timeout = 60 * 60 * 1000; // 1小时
  
  return elapsed > timeout;
});

// 倒计时样式类
const countdownClass = computed(() => {
  if (paymentRemaining.value < 5 * 60) return 'countdown-urgent'; // < 5分钟
  if (paymentRemaining.value < 10 * 60) return 'countdown-warning'; // < 10分钟
  return 'countdown-normal';
});

// 支付进度条宽度
const paymentProgressWidth = computed(() => {
  if (paymentRemaining.value <= 0) return '0%';
  const total = 15 * 60; // 15分钟
  const percent = (paymentRemaining.value / total) * 100;
  return (percent > 0 ? percent : 0) + '%';
});

// 阿姨信息相关 computed
const staffAvatar = computed(() => {
  return order.value?.staffInfo?.avatar || order.value?.staff?.avatar || '/static/images/avatar_def.png';
});

const staffName = computed(() => {
  return order.value?.staffInfo?.name || order.value?.staff?.name || '';
});

const staffRating = computed(() => {
  return order.value?.staffInfo?.rating || order.value?.staff?.rating || 5.0;
});

const staffOrderCount = computed(() => {
  return order.value?.staffInfo?.orderCount || order.value?.staff?.orderCount || 0;
});

// 获取状态样式类
const getStatusClass = () => {
  if (!order.value) return '';
  const statusMap = {
    'PENDING_PAYMENT': 'status-warning',
    'PENDING': 'status-info',
    'ACCEPTED': 'status-success',
    'STARTED': 'status-processing',
    'COMPLETED': 'status-completed',
    'CANCELLED': 'status-cancelled',
    'REFUNDED': 'status-refunded'
  };
  return statusMap[order.value.status] || 'status-default';
};

// 获取状态图标
const getStatusIcon = () => {
  if (!order.value) return 'info';
  const iconMap = {
    'PENDING_PAYMENT': 'wallet',
    'PENDING': 'clock',
    'ACCEPTED': 'checkmarkempty',
    'STARTED': 'gear',
    'COMPLETED': 'star',
    'CANCELLED': 'close',
    'REFUNDED': 'undo'
  };
  return iconMap[order.value.status] || 'info';
};

// 获取状态文本
const getStatusText = () => {
  if (!order.value) return '';
  const textMap = {
    'PENDING_PAYMENT': '待支付',
    'PENDING': '待接单',
    'ACCEPTED': '已接单',
    'STARTED': '服务中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'REFUNDED': '已退款'
  };
  return textMap[order.value.status] || '未知状态';
};

// 获取状态描述
const getStatusDesc = () => {
  if (!order.value) return '';
  const descMap = {
    'PENDING_PAYMENT': '请在15分钟内完成支付',
    'PENDING': '正在为您匹配合适的阿姨',
    'ACCEPTED': '阿姨已接单，将按时为您服务',
    'STARTED': '阿姨正在为您服务',
    'COMPLETED': '服务已完成，期待再次为您服务',
    'CANCELLED': '订单已取消',
    'REFUNDED': '退款已原路返回'
  };
  return descMap[order.value.status] || '';
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 加载订单详情
const loadOrderDetail = async (showLoading = true) => {
  try {
    if (showLoading) {
      uni.showLoading({ title: '加载中...' });
    }
    
    const res = await request({
      url: `/user/order/${orderId.value}`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      const oldStatus = order.value?.status;
      order.value = res.data;
      
      // 更新本地评价状态
      hasRated.value = order.value.reviewed || false;
      
      // 计算倒计时
      calculateCountdowns();
      
      // 如果订单已取消，加载取消记录
      if (order.value.status === 'CANCELLED') {
        loadCancellationInfo();
      }
      
      // 状态变化时提示用户
      if (oldStatus && oldStatus !== order.value.status) {
        handleStatusChange(oldStatus, order.value.status);
      }
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('加载订单详情失败:', error);
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    });
  } finally {
    if (showLoading) {
      uni.hideLoading();
    }
  }
};

// 加载取消记录信息
const loadCancellationInfo = async () => {
  try {
    const res = await request({
      url: `/user/order/${orderId.value}/cancellation`,
      method: 'GET'
    });
    
    if (res.code === 200) {
      cancellationInfo.value = res.data;
    }
  } catch (error) {
    console.error('加载取消记录失败:', error);
    // 静默处理，不影响订单详情显示
  }
};

// 计算倒计时
const calculateCountdowns = () => {
  if (!order.value) return;
  
  const now = Date.now();
  
  // 支付超时倒计时（15分钟）
  if (order.value.status === 'PENDING_PAYMENT' && order.value.createdTime) {
    const createdTime = new Date(order.value.createdTime).getTime();
    const elapsed = Math.floor((now - createdTime) / 1000);
    paymentRemaining.value = Math.max(0, 15 * 60 - elapsed);
  } else {
    paymentRemaining.value = 0;
  }
  
  // 接单超时倒计时（30分钟）
  if (order.value.status === 'PENDING' && order.value.paidTime) {
    const paidTime = new Date(order.value.paidTime).getTime();
    const elapsed = Math.floor((now - paidTime) / 1000);
    acceptRemaining.value = Math.max(0, 30 * 60 - elapsed);
  } else {
    acceptRemaining.value = 0;
  }
};

// 开始倒计时
const startCountdown = () => {
  stopCountdown(); // 先停止之前的
  
  countdownTimer.value = setInterval(() => {
    // 支付倒计时
    if (paymentRemaining.value > 0) {
      paymentRemaining.value--;
      
      if (paymentRemaining.value === 0) {
        uni.showToast({
          title: '订单已超时，正在取消...',
          icon: 'none'
        });
        setTimeout(() => {
          loadOrderDetail(false); // 刷新订单状态，不显示loading
        }, 2000);
      }
    }
    
    // 接单倒计时
    if (acceptRemaining.value > 0) {
      acceptRemaining.value--;
      
      if (acceptRemaining.value === 0) {
        uni.showToast({
          title: '订单已超时取消',
          icon: 'none'
        });
        setTimeout(() => {
          loadOrderDetail(false);
        }, 2000);
      }
    }
    
    // 如果没有需要倒计时的了，停止定时器
    if (paymentRemaining.value === 0 && acceptRemaining.value === 0) {
      stopCountdown();
    }
  }, 1000);
};

// 停止倒计时
const stopCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
};

// 开始轮询订单状态（30秒一次）
const startPolling = () => {
  stopPolling(); // 先停止之前的
  
  pollingTimer.value = setInterval(() => {
    // 只在特定状态下轮询
    if (order.value && ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED'].includes(order.value.status)) {
      loadOrderDetail(false); // 静默刷新
    } else {
      stopPolling();
    }
  }, 30000); // 30秒
};

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
};

// 处理状态变化
const handleStatusChange = (oldStatus, newStatus) => {
  if (newStatus === 'CANCELLED' && order.value.cancelReason) {
    const messages = {
      'SYSTEM_PAYMENT_TIMEOUT': '订单因支付超时已自动取消',
      'SYSTEM_NO_STAFF': '订单因无人接单已自动取消并退款',
      'SYSTEM_TIMEOUT': '订单因服务超时已自动取消并退款'
    };
    
    const message = messages[order.value.cancelReason];
    if (message) {
      uni.showModal({
        title: '订单已取消',
        content: message,
        showCancel: false
      });
    }
  }
};

// 用户点击取消订单按钮（统一入口）
const cancelOrder = async () => {
  try {
    uni.showLoading({ title: '计算中...' });
    
    // 1. 调用违约金计算接口
    const res = await request({
      url: `/user/order/${orderId.value}/cancel-penalty`,
      method: 'GET'
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      const penalty = res.data;
      
      // 2. 检查是否可以取消
      if (!penalty.canCancel) {
        uni.showModal({
          title: '无法取消',
          content: penalty.tips ? penalty.tips.join('\n') : '当前订单无法取消，如有疑问请联系客服',
          showCancel: false
        });
        return;
      }
      
      // 3. 保存违约金信息并显示确认弹窗
      cancelPenalty.value = penalty;
      showCancelModal.value = true;
    } else {
      uni.showToast({
        title: res.message || '获取失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('计算违约金失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};

// 选择取消原因
const selectReason = (reason) => {
  selectedReason.value = reason;
};

// 关闭取消确认弹窗
const closeCancelModal = () => {
  showCancelModal.value = false;
  selectedReason.value = '';
  cancelDesc.value = '';
  cancelPenalty.value = null;
};

// 确认取消订单
const confirmCancel = async () => {
  // 验证必填项
  if (!selectedReason.value) {
    uni.showToast({
      title: '请选择取消原因',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    // 提交取消请求
    const result = await request({
      url: '/user/order/cancel',
      method: 'POST',
      data: {
        orderId: orderId.value,
        cancelReason: selectedReason.value,
        cancelDesc: cancelDesc.value || selectedReason.value
      }
    });
    
    uni.hideLoading();
    
    if (result.code === 200) {
      // 关闭弹窗
      closeCancelModal();
      
      // 显示成功提示
      uni.showToast({
        title: '取消成功',
        icon: 'success'
      });
      
      // 延迟刷新订单详情
      setTimeout(() => {
        loadOrderDetail();
      }, 1500);
    } else {
      uni.showToast({
        title: result.message || '取消失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('取消订单失败:', error);
    uni.showToast({
      title: error.message || '取消失败',
      icon: 'none'
    });
  }
};

// 支付订单
const payOrder = () => {
  // TODO: 调起支付
  uni.showModal({
    title: '提示',
    content: '支付功能开发中，是否模拟支付成功？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '支付成功',
          icon: 'success'
        });
        setTimeout(() => {
          loadOrderDetail();
        }, 1500);
      }
    }
  });
};

// 联系阿姨
const contactStaff = () => {
  const staff = order.value.staffInfo || order.value.staff;
  if (!staff || !staff.phone) {
    uni.showToast({
      title: '暂无联系方式',
      icon: 'none'
    });
    return;
  }
  
  uni.showActionSheet({
    itemList: [`拨打电话：${staff.phone}`],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.makePhoneCall({
          phoneNumber: staff.phone
        });
      }
    }
  });
};

// 评价订单
const reviewOrder = () => {
  // 防重复评价检查
  if (hasRated.value || order.value.reviewed) {
    uni.showToast({
      title: '该订单已评价',
      icon: 'none'
    });
    return;
  }
  
  // 检查订单状态
  if (order.value.status !== 'COMPLETED') {
    uni.showToast({
      title: '订单未完成，无法评价',
      icon: 'none'
    });
    return;
  }
  
  uni.navigateTo({
    url: `/pages/rating/create?orderId=${orderId.value}`
  });
};

// 再次预约
const bookAgain = () => {
  // 跳转到服务详情页
  if (order.value.serviceTypeId) {
    uni.navigateTo({
      url: `/pages/service/detail?id=${order.value.serviceTypeId}`
    });
  }
};

onLoad((options) => {
  orderId.value = options.id;
  
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
        } else {
          uni.navigateBack();
        }
      }
    });
    return;
  }
  
  // 监听评价完成事件
  uni.$on('orderRated', (data) => {
    if (data.orderId === orderId.value) {
      // 立即设置本地评价状态，防止重复评价
      hasRated.value = true;
      // 刷新订单详情
      loadOrderDetail();
    }
  });
  
  loadOrderDetail().then(() => {
    // 启动倒计时
    if (paymentRemaining.value > 0 || acceptRemaining.value > 0) {
      startCountdown();
    }
    
    // 启动轮询
    startPolling();
  });
});

// 页面卸载时清理定时器和事件监听
onUnload(() => {
  stopCountdown();
  stopPolling();
  uni.$off('orderRated');
});
</script>

<style scoped>
.order-detail {
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

.detail-content {
  margin-top: 88rpx;
  height: calc(100vh - 88rpx - 120rpx);
  padding-bottom: 20rpx;
}

/* 支付超时倒计时 */
.payment-countdown {
  background: #FFF7E6;
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  border: 2rpx solid #FFD591;
}

.payment-countdown.countdown-urgent {
  background: #FFF1F0;
  border-color: #FFCCC7;
  animation: blink 1s infinite;
}

.payment-countdown.countdown-warning {
  background: #FFF7E6;
  border-color: #FFE7BA;
}

.payment-countdown.countdown-normal {
  background: #E6F7FF;
  border-color: #91D5FF;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.7; }
}

.countdown-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.countdown-header .icon {
  font-size: 36rpx;
  margin-right: 15rpx;
}

.countdown-header .text {
  flex: 1;
  font-size: 28rpx;
  color: #FF6B00;
  line-height: 1.5;
}

.countdown-time {
  font-size: 64rpx;
  font-weight: bold;
  color: #FF4D4F;
  text-align: center;
  margin: 30rpx 0;
  letter-spacing: 4rpx;
}

.countdown-urgent .countdown-time {
  color: #FF4D4F;
}

.countdown-warning .countdown-time {
  color: #FF6B00;
}

.countdown-normal .countdown-time {
  color: #1890FF;
}

.progress-bar {
  height: 12rpx;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B00 0%, #FF9966 100%);
  border-radius: 6rpx;
  transition: width 0.3s;
}

/* 等待接单倒计时 */
.accept-countdown {
  background: #E6F7FF;
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  border: 2rpx solid #91D5FF;
}

.accept-countdown .countdown-header {
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 25rpx;
}

.accept-countdown .icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.accept-countdown .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890FF;
}

.countdown-info {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 25rpx;
}

.progress-wrapper {
  padding: 10rpx 0;
}

/* 服务超时警告 */
.timeout-warning {
  background: #FFF7E6;
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  border: 2rpx solid #FFD591;
}

.warning-header {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
}

.warning-header .icon {
  font-size: 36rpx;
  margin-right: 15rpx;
}

.warning-header text {
  flex: 1;
  font-size: 28rpx;
  color: #FF6B00;
  font-weight: bold;
}

.warning-actions {
  display: flex;
  gap: 20rpx;
}

.btn-warning {
  flex: 1;
  height: 70rpx;
  background: linear-gradient(135deg, #FF9966 0%, #FF6B00 100%);
  color: #fff;
  border: none;
  border-radius: 35rpx;
  font-size: 28rpx;
}

/* 取消原因提示 */
.cancel-reason-tip {
  background: linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%);
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 16rpx;
  border-left: 6rpx solid #ff6b6b;
}

.reason-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.reason-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.reason-header .icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.reason-header .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.reason-content .desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  padding-left: 55rpx;
}

.reason-content .extra-desc {
  font-size: 26rpx;
  color: #999;
  line-height: 1.5;
  padding-left: 55rpx;
  margin-top: 10rpx;
}

.reason-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.reason-text .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.reason-text .desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 订单状态 */
.status-section {
  padding: 50rpx 30rpx;
  margin: 20rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.status-warning {
  background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
}

.status-info {
  background: linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%);
}

.status-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.status-processing {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.status-completed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.status-cancelled,
.status-refunded {
  background: linear-gradient(135deg, #bbb 0%, #999 100%);
}

.status-icon {
  width: 100rpx;
  height: 100rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-info {
  flex: 1;
  color: #fff;
}

.status-text {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.status-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

/* 信息卡片 */
.info-card {
  background-color: #fff;
  padding: 30rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 25rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  width: 160rpx;
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.info-row .value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
}

/* 阿姨信息 */
.staff-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.staff-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.staff-detail {
  flex: 1;
}

.staff-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.staff-rating {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.rating {
  color: #ff9900;
}

.btn-contact {
  padding: 15rpx 30rpx;
  background-color: #e6f2ff;
  color: #007aff;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

/* 核验码卡片 */
.verification-card {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-left: 6rpx solid #4CAF50;
}

.verification-card .verification-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx dashed #81C784;
}

.verification-card .verification-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.verification-card .verification-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2E7D32;
}

.verification-card .verification-content {
  background: #fff;
  border-radius: 12rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(46, 125, 50, 0.2);
}

.verification-card .code-number {
  font-size: 64rpx;
  font-weight: bold;
  color: #1B5E20;
  letter-spacing: 10rpx;
  font-family: 'Courier New', monospace;
}

.verification-card .verification-tip {
  text-align: center;
}

.verification-card .tip-text {
  font-size: 26rpx;
  color: #558B2F;
  line-height: 1.6;
}

/* 价格明细 */
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

.price-row.total {
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 10rpx;
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

/* 取消说明 */
.cancel-policy {
  background-color: #fff8e6;
  padding: 25rpx;
  margin: 0 20rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #ffe7ba;
}

.policy-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #ff9900;
  margin-bottom: 15rpx;
}

.policy-content {
  padding-left: 30rpx;
}

.policy-item {
  font-size: 24rpx;
  color: #666;
  line-height: 2;
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
  justify-content: flex-end;
  padding: 0 30rpx;
  gap: 20rpx;
  z-index: 999;
}

.btn-secondary,
.btn-primary {
  height: 70rpx;
  padding: 0 40rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: bold;
}

.btn-primary.full {
  flex: 1;
}

/* 取消订单确认弹窗 */
.cancel-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-modal {
  width: 90%;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 40rpx 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header .title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
  padding: 0 10rpx;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30rpx 40rpx;
  max-height: 60vh;
}

/* 违约金信息 */
.penalty-info {
  background: linear-gradient(135deg, #F7F9FC 0%, #EDF1F7 100%);
  border: 2rpx solid #E8ECF1;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.penalty-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx dashed #D5DCE6;
}

.penalty-header .icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.penalty-header .title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.penalty-info .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.penalty-info .info-row.warning {
  color: #ff6b6b;
}

.penalty-info .info-row.highlight {
  border-top: 2rpx dashed #ddd;
  padding-top: 30rpx;
  margin-top: 10rpx;
}

.penalty-info .highlight .label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.penalty-info .highlight .value {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6b6b;
}

/* 温馨提示 */
.tips-box {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%);
  border: 2rpx solid #FFD966;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 173, 20, 0.1);
}

.tips-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: bold;
  color: #FA8C16;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx dashed #FFD966;
}

.tips-title .icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.tips-list {
  display: block;
}

.tip-item {
  position: relative;
  padding-left: 24rpx;
  font-size: 28rpx;
  color: #595959;
  line-height: 1.8;
  margin-bottom: 16rpx;
  display: block;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item::before {
  content: '•';
  position: absolute;
  left: 0;
  top: 0;
  color: #FA8C16;
  font-weight: bold;
  font-size: 32rpx;
  line-height: 1.8;
}

/* 取消原因 */
.reason-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.required {
  color: #ff6b6b;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.reason-item {
  flex: 0 0 calc(50% - 10rpx);
  background: #f7f8fa;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
  position: relative;
  transition: all 0.3s;
  box-sizing: border-box;
}

.reason-item.selected {
  background: #fff1f0;
  border-color: #ff6b6b;
}

.reason-text {
  font-size: 26rpx;
  color: #666;
}

.reason-item.selected .reason-text {
  color: #ff6b6b;
  font-weight: bold;
}

.check-icon {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  color: #ff6b6b;
  font-size: 28rpx;
}

/* 补充说明 */
.desc-section {
  margin-bottom: 20rpx;
}

.desc-input {
  width: 100%;
  min-height: 160rpx;
  background: #f7f8fa;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
}

/* 弹窗底部 */
.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 40rpx;
  border-top: 1px solid #f0f0f0;
}

.modal-footer .btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.modal-footer .btn-cancel {
  background: #f7f8fa;
  color: #666;
}

.modal-footer .btn-confirm {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  color: #fff;
}

/* 取消信息卡片 */
.cancel-info-card {
  border-left: 6rpx solid #ff6b6b;
  background: linear-gradient(135deg, #FFFAFA 0%, #FFF5F5 100%);
}

.cancel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  padding-bottom: 20rpx;
  margin: -30rpx -30rpx 0 -30rpx;
  border-bottom: 2rpx dashed #FFE5E5;
  margin-bottom: 10rpx;
}

.cancel-title .title-left {
  display: flex;
  align-items: center;
}

.cancel-title .icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.cancel-title .text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.refund-status {
  font-size: 24rpx;
  padding: 8rpx 18rpx;
  border-radius: 20rpx;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.refund-status.status-PENDING {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%);
  color: #FA8C16;
  border: 1rpx solid #FFD966;
}

.refund-status.status-PROCESSING {
  background: linear-gradient(135deg, #E6F7FF 0%, #CCE9FF 100%);
  color: #1890FF;
  border: 1rpx solid #91D5FF;
}

.refund-status.status-SUCCESS {
  background: linear-gradient(135deg, #F6FFED 0%, #E6F7E0 100%);
  color: #52C41A;
  border: 1rpx solid #95DE64;
}

.refund-status.status-FAILED {
  background: linear-gradient(135deg, #FFF1F0 0%, #FFE5E5 100%);
  color: #FF4D4F;
  border: 1rpx solid #FFA39E;
}

.cancel-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.cancel-info-row .label {
  font-size: 28rpx;
  color: #666;
  width: 160rpx;
  flex-shrink: 0;
}

.cancel-info-row .value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
  word-break: break-all;
}

.cancel-info-row .value.small {
  font-size: 24rpx;
  color: #999;
}

.cancel-amount-box {
  background: linear-gradient(135deg, #F7F9FC 0%, #EDF1F7 100%);
  border: 2rpx solid #E8ECF1;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin: 20rpx 30rpx;
}

.amount-box-header {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx dashed #D5DCE6;
}

.amount-box-header .icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.cancel-amount-box .amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 0;
  font-size: 28rpx;
}

.cancel-amount-box .amount-row.warning {
  color: #ff6b6b;
  font-weight: 500;
}

.cancel-amount-box .amount-row.highlight {
  border-top: 2rpx dashed #D5DCE6;
  margin-top: 15rpx;
  padding-top: 15rpx;
  background: linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%);
  border-radius: 8rpx;
  padding: 15rpx;
  margin-left: -12rpx;
  margin-right: -12rpx;
}

.cancel-amount-box .amount-row.highlight .label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.cancel-amount-box .refund-amount {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.credit-warning {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%);
  border: 2rpx solid #FFA39E;
  padding: 18rpx 24rpx;
  border-radius: 12rpx;
  margin: 15rpx 30rpx 0 30rpx;
  font-size: 26rpx;
  color: #ff6b6b;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.1);
}

.credit-warning .uni-icons {
  margin-right: 10rpx;
}
</style>

