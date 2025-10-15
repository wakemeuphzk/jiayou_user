<template>
  <view class="login-container">
    <!-- 登录方式切换 -->
    <view class="login-type">
	   <text
		  :class="['type-item', loginType === 'phone' ? 'active' : '']"
		  @click="loginType = 'phone'"
		>
		  手机登录
		</text>
      <text
        :class="['type-item', loginType === 'account' ? 'active' : '']"
        @click="loginType = 'account'"
      >
        账号登录
      </text> 
    </view>

    <!-- 用户名密码登录 -->
    <view v-if="loginType === 'account'" class="login-form">
      <input v-model="username" placeholder="请输入用户名" />
      <input v-model="password" placeholder="请输入密码" type="password" />
      <button @click="handleLogin">登录</button>
    </view>

    <!-- 手机号验证码登录 -->
    <view v-if="loginType === 'phone'" class="login-form">
      <input v-model="phone" placeholder="请输入手机号" />
      <view class="code-input">
        <input v-model="code" placeholder="请输入验证码" />
        <button @click="handleGetCode" :disabled="isCodeButtonDisabled">
          {{ codeButtonText }}
        </button>
      </view>
      <button @click="handlePhoneLogin">登录</button>
    </view>

    <!-- 一键登录（微信） -->
    <view class="quick-login">
      <view class="divider">
        <text class="divider-text">或使用以下方式登录</text>
      </view>
      <button class="wechat-login-btn" @click="handleWechatLogin">
        <uni-icons type="weixin" size="24" color="#fff"></uni-icons>
        <text>微信一键登录</text>
      </button>
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

    <!-- 跳转到注册页面 -->
    <view class="register-link">
      <text>还没有账号？</text>
      <text class="link" @click="handleRegister">立即注册</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 登录方式：account（账号密码）或 phone（手机验证码）
const loginType = ref('account');

// 用户名密码登录相关
const username = ref('');
const password = ref('');

// 手机号验证码登录相关
const phone = ref('');
const code = ref('');
const codeButtonText = ref('获取验证码');
const isCodeButtonDisabled = ref(false);

// 服务协议和隐私政策
const agreed = ref(false);

// 处理微信一键登录
const handleWechatLogin = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先同意服务协议和隐私政策', icon: 'none' });
    return;
  }

  try {
    // 1. 获取微信登录 code
    const loginRes = await uni.login({ provider: 'weixin' });
    const code = loginRes.code;

    // 2. 获取用户信息（需用户授权）
    const userInfo = await uni.getUserProfile({
      desc: '获取用户信息用于登录'
    });

    // 3. 调用后端接口完成登录
    const res = await uni.request({
      url: 'https://your-api-domain.com/login/wechat',
      method: 'POST',
      data: {
        code: code,
        userInfo: userInfo
      }
    });

    // 4. 登录成功处理
    if (res.data.code === 200) {
      uni.showToast({ title: '登录成功' });
      uni.setStorageSync('token', res.data.token);
      uni.switchTab({ url: '/pages/index/index' });
    } else {
      uni.showToast({ title: res.data.message || '登录失败', icon: 'none' });
    }
  } catch (err) {
    console.error('微信登录失败:', err);
    uni.showToast({ title: '登录失败，请重试', icon: 'none' });
  }
};


</script>

<style lang="scss" scoped>
.quick-login {
  margin-top: 40rpx;

  .divider {
    display: flex;
    align-items: center;
    margin: 30rpx 0;
    color: #999;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: #eee;
    }

    .divider-text {
      padding: 0 20rpx;
      font-size: 26rpx;
    }
  }

  .wechat-login-btn {
    background-color: #09bb07;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    border-radius: 50rpx;

    &::after {
      border: none;
    }
  }
}
</style>