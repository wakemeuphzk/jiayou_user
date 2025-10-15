<template>
  <view class="login-container">
    <!-- 登录方式切换 -->
    <view class="login-type">
		<text
		  :class="['type-item', loginType === 'phone' ? 'active' : '']"
		  @click="loginType = 'phone'"
		>
		  手机号登录
		</text>
      <text
        :class="['type-item', loginType === 'account' ? 'active' : '']"
        @click="loginType = 'account'"
      >
        账号登录
      </text>
    </view>
	
	<!-- 手机号验证码登录 -->
	<view v-if="loginType === 'phone'" class="login-form">
	  <input v-model="phone" placeholder="请输入手机号" />
	  <view class="code-input">
	    <input v-model="code" placeholder="请输入验证码" style="flex: 1.5;" />
	    <button @click="handleGetCode" :disabled="isCodeButtonDisabled" style="flex: 1.2;">
	      {{ codeButtonText }}
	    </button>
	  </view>
	  <button @click="handlePhoneLogin">登录</button>
	</view>

    <!-- 用户名密码登录 -->
    <view v-if="loginType === 'account'" class="login-form">
      <input v-model="username" placeholder="请输入用户名" />
      <input v-model="password" placeholder="请输入密码" type="password" />
      <button @click="handleLogin">登录</button>
    </view>
	
	<!-- 一键登录（微信） -->
	<view class="quick-login">
	  <view class="divider">
	    <text class="divider-text">或使用以下方式登录</text>
	  </view>
	 <!-- <button class="wechat-login-btn" @click="handleWechatLogin">
	    <uni-icons type="weixin" size="24" color="#fff"></uni-icons>
	    <text>微信一键登录</text>
	  </button> -->
	  <button
	    class="wechat-login-btn" 
	    @click="handleWechatLogin"
	    v-if="!hasUserAuth"
	  >
	    <uni-icons type="weixin" size="24" color="#fff"></uni-icons>
	    <text>微信一键登录</text>
	  </button>
	  
	  <view v-else class="auth-tips">
	    <text>您已拒绝授权，请</text>
	    <text class="link" @click="handleWechatLogin">点击这里</text>
	    <text>重新授权</text>
	  </view>
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

// 登录方式：account（用户名密码）或 phone（手机号验证码）
const loginType = ref('phone');

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

import { onLoad } from '@dcloudio/uni-app';

// 处理用户名密码登录
const handleLogin = () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意服务协议和隐私政策',
      icon: 'none',
    });
    return;
  }
  if (!username.value || !password.value) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none',
    });
    return;
  }
  // todo 这里处理用户名密码登录逻辑
  console.log('用户名密码登录', username.value, password.value);
  // const res = await uni.request({
  //   url: 'http://localhost:8083/front/api/login/check',
  //   method: 'POST',
  //   data: {
  // 	  scene: 'account',
  //     username: username.value,
  //     password: password.value
  //   }
  // });

  this.$request.get('/api/login/check',  {
  	  scene: 'account',
      username: username.value,
      password: password.value
    }).then( res =>{
  	uni.setStorageSync('token', res.data.token);
	uni.navigateTo({
	  url: '/pages/index/index',
	});
  }).catch(err => {
  	console.error('登录失败:', err);
	uni.showToast({ title: '登录失败，请重试', icon: 'none' });
  })
};

// 处理获取验证码
const handleGetCode = () => {
  if (!phone.value) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    });
    return;
  }
  
  this.$request.post('/api/sms/send',  {
    	  scene: '101',
    	  mobile: phone.value
      }).then( res =>{

    }).catch(err => {
    	console.error('短信发送失败:', err);
  	    uni.showToast({ title: '短信发送失败，请重试', icon: 'none' });
    })

  // 禁用按钮并开始倒计时
  isCodeButtonDisabled.value = true;
  let count = 60;
  codeButtonText.value = `${count}秒后重新获取`;
  const timer = setInterval(() => {
    count--;
    codeButtonText.value = `${count}秒后重新获取`;
    if (count <= 0) {
      clearInterval(timer);
      codeButtonText.value = '获取验证码';
      isCodeButtonDisabled.value = false;
    }
  }, 1000);
};

// 处理手机号登录
const handlePhoneLogin = () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意服务协议和隐私政策',
      icon: 'none',
    });
    return;
  }
  if (!phone.value || !code.value) {
    uni.showToast({
      title: '请输入手机号和验证码',
      icon: 'none',
    });
    return;
  }
  // todo 这里处理手机号登录逻辑
  console.log('手机号登录', phone.value, code.value);
  // const res = await uni.request({
  //   url: 'http://localhost:8083/front/api/login/check',
  //   method: 'POST',
  //   data: {
  // 	  scene: 'mobile',
  //     code: code.value,
  //     phone: phone.value
  //   }
  // });
  this.$request.get('/api/login/check',  {
    	  scene: 'mobile',
    	  code: code.value,
    	  phone: phone.value
      }).then( res =>{
    	uni.setStorageSync('token', res.data.token);
		// res.data.isNew 是否新客
     	uni.navigateTo({
  	       url: '/pages/index/index',
  	    });
    }).catch(err => {
    	console.error('登录失败:', err);
  	    uni.showToast({ title: '登录失败，请重试', icon: 'none' });
    })
};

// 处理服务协议和隐私政策勾选
const handleAgreementChange = (e) => {
  agreed.value = e.detail.value.length > 0;
};

// 跳转到服务协议页面
const handleServiceAgreement = () => {
  uni.navigateTo({
    url: '/pages/serviceAgreement',
  });
};

// 跳转到隐私政策页面
const handlePrivacyPolicy = () => {
  uni.navigateTo({
    url: '/pages/privacyPolicy',
  });
};

// 跳转到注册页面
const handleRegister = () => {
  uni.navigateTo({
    url: '/pages/register/register',
  });
};

// 新增：用户授权状态
const hasUserAuth = ref(false);

// 微信一键登录方法
const handleWechatLogin = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先同意服务协议和隐私政策', icon: 'none' });
    return;
  }

  try {
    // 第一步：立即获取用户信息（必须在点击事件中同步触发）
    const userInfo = await uni.getUserProfile({
      desc: '获取用户信息用于登录',
      lang: 'zh_CN'
    });
    hasUserAuth.value = true;
	console.log(1);

    // 第二步：获取微信code（在用户授权后执行）
    const loginRes = await uni.login({
      provider: 'weixin',
      onlyAuthorize: true
    });
	console.log(2);

    // 第三步：调用后端接口
  //   const res = await uni.request({
  //     url: 'http://localhost:8083/front/api/login/check',
  //     method: 'POST',
  //     data: {
		// scene: 'mnp',
  //       code: loginRes.code,
  //       userInfo: userInfo
  //     }
  //   });
	
	this.$request.get('/api/login/check',  {
	  	  scene: 'mnp',
	  	  code: loginRes.code,
	  	  userInfo: userInfo
	    }).then( res =>{
	  	uni.setStorageSync('token', res.data.token);
	   	uni.navigateTo({
		       url: '/pages/index/index',
		    });
	  }).catch(err => {
	  	console.error('登录失败:', err);
		    uni.showToast({ title: '登录失败，请重试', icon: 'none' });
	  })

    
  } catch (err) {
    console.error('登录失败:', err);
    
    // 处理授权拒绝的情况
    if (err.errMsg.includes('auth deny') || err.errMsg.includes('fail auth deny')) {
      // 引导用户打开设置页
      uni.showModal({
        title: '权限提醒',
        content: '需要您授权用户信息才能登录，是否前往设置？',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userInfo']) {
                  hasUserAuth.value = true;
                }
              }
            });
          }
        }
      });
    } else {
      uni.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  }
};

// 新增：页面加载时检查历史授权状态
onLoad(() => {
  uni.getSetting({
    success(res) {
      hasUserAuth.value = res.authSetting['scope.userInfo'] || false;
    }
  });
});

</script>

<style scoped>
.login-container {
  padding: 20px;
}

.login-type {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.type-item {
  margin: 0 10px;
  padding: 5px 10px;
  color: #666;
  font-size: 16px;
  cursor: pointer;
}

.type-item.active {
  color: #007aff;
  border-bottom: 2px solid #007aff;
}

.login-form {
  margin-bottom: 20px;
  /* transition: all 0.3s ease; */
}

.login-form input {
  width: 95%;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 0 10px;
}

.code-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code-input input {
  flex: 1;
}

.code-input button {
  width: 120px;
  height: 40px;
  background-color: #007aff;
  color: #fff;
  border-radius: 5px;
}

.login-form button {
  width: 100%;
  height: 40px;
  background-color: #007aff;
  color: #fff;
  border-radius: 5px;
  margin-bottom: 10px;
}

.agreement {
  margin-top: 20px;
}

.link {
  color: #007aff;
  text-decoration: underline;
}

.register-link {
  margin-top: 20px;
  text-align: center;
}

  .quick-login {
  margin-top: 40rpx;
  }
  
  .divider {
    display: flex;
    align-items: center;
    margin: 30rpx 0;
    color: #999;
  }
  
  
  .divider::before,
  ::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #eee;
  }
	
  .divider-text {
    padding: 0 20rpx;
    font-size: 26rpx;
  }

  .wechat-login-btn {
    background-color: #09bb07;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    border-radius: 50rpx;
  }
  
  .wechat-login-btn::after {
    border: none;
  }
  
  .auth-tips {
    text-align: center;
    color: #666;
  }
  .link {
    color: #007aff;
    text-decoration: underline;
    margin: 0 8rpx;
  }

</style>