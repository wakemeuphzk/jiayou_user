<!-- pages/recharge/confirm.vue -->
<template>
  <view class="container">
    <view class="order-card">
      <view class="order-item">
        <text class="label">充值金额</text>
        <text class="value">¥{{ rechargeAmount }}</text>
      </view>
      <view class="order-item">
        <text class="label">实际支付</text>
        <text class="value">¥{{ paymentAmount }}</text>
      </view>
      <view class="order-item">
        <text class="label">支付方式</text>
        <view class="payment-methods">
          <view 
            class="method-item"
            :class="{ active: paymentMethod === 'wechat' }"
            @click="paymentMethod = 'wechat'"
          >
            <uni-icons type="weixin" size="40" color="#09bb07"></uni-icons>
            <text>微信支付</text>
          </view>
          <view 
            class="method-item"
            :class="{ active: paymentMethod === 'alipay' }"
            @click="paymentMethod = 'alipay'"
          >
            <uni-icons type="alipay" size="40" color="#00a0e9"></uni-icons>
            <text>支付宝支付</text>
          </view>
        </view>
      </view>
    </view>

    <button class="pay-btn" @click="handlePayment">确认支付</button>
<!-- 	todo 先验证是否登录，没有登录跳转至登录页面 -->
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const rechargeAmount = ref(0);
const paymentAmount = ref(0);
const paymentMethod = ref('wechat');

onLoad((options) => {
  rechargeAmount.value = options.recharge;
  paymentAmount.value = options.payment;
});

// const handlePayment = async () => {
//   try {
//     // 调用后端创建充值订单
//     const res = await uni.request({
//       url: 'https://your-api.com/recharge/create',
//       method: 'POST',
//       data: {
//         recharge: rechargeAmount.value,
//         payment: paymentAmount.value,
//         method: paymentMethod.value
//       }
//     });

//     // 调用支付接口
//     uni.requestPayment({
//       provider: paymentMethod.value,
//       orderInfo: res.data.paymentInfo,
//       success: () => {
//         uni.redirectTo({
//           url: `/pages/recharge/result?status=success&amount=${rechargeAmount.value}`
//         });
//       },
//       fail: (err) => {
//         uni.redirectTo({
//           url: `/pages/recharge/result?status=fail&msg=${err.errMsg}`
//         });
//       }
//     });
//   } catch (error) {
//     uni.showToast({ title: '支付失败，请重试', icon: 'none' });
//   }
// };

// 支付按钮点击事件
const handlePayment = async () => {
  try {
    // 1. 请求后端创建订单
    const orderRes = await uni.request({
      url: '/api/recharge/createOrder',
      method: 'POST',
      data: {
        rechargeAmount: rechargeAmount.value,
        payAmount: paymentAmount.value
      }
    });
    
    // 2. 获取支付参数
    const payParams = orderRes.data;
    
    // 3. 调用微信支付
    const [err, res] = await uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: 'RSA',
      paySign: payParams.paySign
    });
    
    // 4. 处理支付结果
    if (res.errMsg === 'requestPayment:ok') {
      // 轮询支付结果
      const checkInterval = setInterval(async () => {
        const statusRes = await checkPaymentStatus(payParams.outTradeNo);
        if (statusRes.paid) {
          clearInterval(checkInterval);
          uni.showToast({ title: '支付成功' });
		  uni.redirectTo({
		    url: `/pages/recharge/result?status=success&amount=${rechargeAmount.value}`
		  });
        }
      }, 2000);
    }
  } catch (error) {
    uni.showToast({ title: '支付失败，请重试', icon: 'error' });
  }
}

// 查询支付状态
const checkPaymentStatus = async (outTradeNo) => {
  const res = await uni.request({
    url: `/api/recharge/checkPayment?outTradeNo=${outTradeNo}`
  });
  return res.data;
}
</script>

<style lang="scss" scoped>
.container {
  padding: 40rpx;
}

.order-info {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #eee;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      font-size: 30rpx;
      color: #666;
    }
    
    .value {
      font-size: 32rpx;
      color: #333;
      
      &.amount {
        color: #ff5722;
        font-weight: 500;
      }
    }
  }
}

.payment-methods {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  
  .section-title {
    display: block;
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }
  
  .method-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    border: 2rpx solid #eee;
    transition: all 0.3s;
    
    &.active {
      border-color: #007aff;
      background: #f0f7ff;
    }
    
    .method-name {
      flex: 1;
      font-size: 32rpx;
      margin-left: 20rpx;
    }
  }
}

.pay-btn {
  margin-top: 60rpx;
  background: linear-gradient(135deg, #007aff, #00a8ff);
  color: #fff;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 32rpx;
}
</style>