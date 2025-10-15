<template>
  <view class="login-container">
    <!-- 推荐码提示 -->
    <view v-if="showReferralTip" class="referral-tip">
      <view class="tip-header">
        <text class="tip-icon">🎉</text>
        <text class="tip-title">推荐邀请</text>
      </view>
      <view class="tip-content">
        来自 <text class="referrer-name">{{ referralInfo.referrerName }}</text> 的推荐
      </view>
      <view class="tip-code">推荐码：{{ referralInfo.referralCode }}</view>
      <view class="tip-actions">
        <button class="clear-btn" @click="onClearReferralCode">清除</button>
      </view>
    </view>
    
    <!-- 登录按钮 -->
    <view class="login-buttons">
      <button 
        class="login-btn user-btn" 
        open-type="getPhoneNumber" 
        @getphonenumber="onUserLogin"
        :disabled="!agreed"
      >
        <uni-icons type="weixin" size="20" color="#fff"></uni-icons>
	    <text>微信一键登录</text>
	  </button> 
	</view>

    <!-- 手动输入推荐码 -->
    <view v-if="!showReferralTip" class="referral-input">
      <view class="input-label">推荐码（可选）</view>
      <input 
        class="referral-code-input" 
        placeholder="请输入推荐码" 
        v-model="referralCode"
        maxlength="10"
        @input="onReferralCodeInput"
      />
      <view class="input-tip">输入推荐码可获得推荐奖励</view>
	</view>

    <!-- 服务协议和隐私政策 -->
    <view class="agreement">
      <checkbox-group @change="handleAgreementChange">
        <label>
          <checkbox :checked="agreed" /> 我已阅读并同意
          <text class="link" @click="handleServiceAgreement">《服务协议》</text> 和
          <text class="link" @click="handlePrivacyPolicy">《隐私政策》</text>
        </label>
      </checkbox-group>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import request from '../../api/request';

// 响应式数据
const agreed = ref(false);
const referralCode = ref('');
const referralInfo = ref(null);
const showReferralTip = ref(false);

// 页面加载
onLoad((options) => {
  checkReferralCode(options);
});

onShow(() => {
  checkStoredReferralCode();
});

// 检查推荐码
const checkReferralCode = (options) => {
  let code = null;
  
  // 从页面参数获取推荐码
  if (options && options.referralCode) {
    code = options.referralCode;
  }
  
  // 从本地存储获取推荐码
  if (!code) {
    code = uni.getStorageSync('referralCode');
  }
  
  if (code) {
    referralCode.value = code;
    validateAndShowReferralInfo(code);
  }
};

// 检查本地存储的推荐码
const checkStoredReferralCode = () => {
  const storedReferralInfo = uni.getStorageSync('referralInfo');
  if (storedReferralInfo && storedReferralInfo.referralCode) {
    referralCode.value = storedReferralInfo.referralCode;
    referralInfo.value = storedReferralInfo;
    showReferralTip.value = true;
  }
};

// 验证并显示推荐码信息
const validateAndShowReferralInfo = async (code) => {
  try {
    const validation = await validateReferralCode(code);
    
    if (validation.valid) {
      referralInfo.value = {
        referralCode: code,
        referrerName: validation.referrerName,
        referrerType: validation.referrerType
      };
      showReferralTip.value = true;
      
      // 保存到本地存储
      uni.setStorageSync('referralInfo', referralInfo.value);
    } else {
      uni.showToast({
        title: validation.message || '推荐码无效',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('验证推荐码失败:', error);
  }
};

// 验证推荐码
const validateReferralCode = async (code) => {
  try {
    const res = await request({
      url: '/common/validate-referral-code',
      method: 'POST',
      data: { referralCode: code }
    });
    
    return res.code === 200 ? res.data : { valid: false };
  } catch (error) {
    console.error('推荐码验证接口调用失败:', error);
    return { valid: false };
  }
};

// 推荐码输入处理
const onReferralCodeInput = (e) => {
  let code = e.detail.value;
  
  // 如果是纯英文数字，转为大写；如果包含中文，保持原样
  if (/^[a-zA-Z0-9]*$/.test(code)) {
    code = code.toUpperCase();
  }
  
  referralCode.value = code;
  
  // 只要长度大于等于3就尝试验证，不限制字符类型
  // 让后端来判断推荐码的有效性
  if (code.length >= 3) {
    validateAndShowReferralInfo(code);
  }
};

// 清除推荐码
const onClearReferralCode = () => {
  clearReferralCache();
};

// 清除推荐码缓存
const clearReferralCache = () => {
  uni.removeStorageSync('referralCode');
  uni.removeStorageSync('referralInfo');
  referralCode.value = '';
  referralInfo.value = null;
  showReferralTip.value = false;
};

// 用户登录
const onUserLogin = async (e) => {
  const phoneCode = e.detail.code;
  
  if (!phoneCode) {
    uni.showToast({
      title: '您已拒绝授权手机号',
      icon: 'none'
    });
    return;
  }
  
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意服务协议和隐私政策',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({ title: '登录中...' });
    
    // 获取微信授权码
    const loginRes = await uni.login({ provider: 'weixin' });
    
    // 准备登录数据
    const loginData = {
      code: loginRes.code,
      phoneCode: phoneCode,
      userType: 4 // 用户类型
    };
    
    // 如果有推荐码，添加到请求中
    if (referralCode.value) {
      loginData.referralCode = referralCode.value;
    }
    
    const res = await request({
      url: '/user/auth/wechat-login',
      method: 'POST',
      data: loginData
    });
    
    uni.hideLoading();
    
    if (res.code === 200) {
      const loginResult = res.data;
      
      // 保存登录信息
      uni.setStorageSync('token', loginResult.accessToken);
      uni.setStorageSync('userId', loginResult.userId);
      uni.setStorageSync('userType', loginResult.userType);
      uni.setStorageSync('nickname', loginResult.nickname);
      uni.setStorageSync('avatar', loginResult.avatar);
      
      // 如果是首次登录且有推荐码，显示推荐成功提示
      if (loginResult.isFirstLogin && referralCode.value) {
        uni.showModal({
          title: '推荐成功',
          content: '您已成功通过推荐码注册，完成首单后推荐人将获得奖励',
          showCancel: false,
          success: () => {
            clearReferralCache();
            uni.switchTab({ url: '/pages/index/index' });
          }
        });
      } else {
        clearReferralCache();
        uni.showToast({ title: '登录成功', icon: 'success' });
        uni.switchTab({ url: '/pages/index/index' });
      }
    } else {
      uni.showToast({
        title: res.message || '登录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('用户登录失败:', error);
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    });
  }
};

// 处理服务协议和隐私政策勾选
const handleAgreementChange = (e) => {
  agreed.value = e.detail.value.length > 0;
};

// 跳转到服务协议页面
const handleServiceAgreement = () => {
  uni.navigateTo({
    url: '/pages/serviceAgreement'
  });
};

// 跳转到隐私政策页面
const handlePrivacyPolicy = () => {
  uni.navigateTo({
    url: '/pages/privacyPolicy'
  });
};

</script>

<style scoped>
.login-container {
  padding: 40rpx;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 推荐码提示 */
.referral-tip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.tip-icon {
  font-size: 40rpx;
}

.tip-title {
  font-size: 36rpx;
  font-weight: 600;
}

.tip-content {
  font-size: 28rpx;
  margin-bottom: 12rpx;
  opacity: 0.9;
}

.referrer-name {
  font-weight: 600;
  color: #fff;
}

.tip-code {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  letter-spacing: 2rpx;
}

.tip-actions {
  display: flex;
  justify-content: flex-end;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}

.clear-btn::after {
  border: none;
}

/* 推荐码输入 */
.referral-input {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.input-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.referral-code-input {
  width: calc(100% - 48rpx);
  height: 88rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  text-align: center;
  letter-spacing: 4rpx;
  font-weight: 600;
  color: #333;
  background: #f8f9fa;
  box-sizing: border-box;
}

.referral-code-input:focus {
  border-color: #667eea;
  background: #fff;
}

.input-tip {
  font-size: 24rpx;
  color: #666;
  margin-top: 12rpx;
  text-align: center;
}

/* 登录按钮 */
.login-buttons {
  margin-bottom: 32rpx;
  }
  
.login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
    display: flex;
    align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.login-btn::after {
  border: none;
}

.login-btn:disabled {
  opacity: 0.5;
  box-shadow: none;
}

.user-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.login-btn:not(:disabled):active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
}

/* 服务协议 */
.agreement {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  margin-top: 24rpx;
}

.agreement label {
    display: flex;
    align-items: center;
  gap: 12rpx;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.agreement checkbox {
  transform: scale(0.8);
}

  .link {
    color: #007aff;
    text-decoration: underline;
  margin: 0 4rpx;
  }
</style>