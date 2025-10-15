<template>
	<view>
		<view class="op-cells"
			style="background-color: #ffffff; padding: 0 0 60rpx 0; overflow: hidden; text-align: center">
			<view style="margin-top: 40rpx">
				<view
					style="display: inline-block; width: 150rpx; height: 150rpx; border-radius: 200rpx; overflow: hidden">
					<block v-if="mine.avatar">
						<image :src="mine.avatar_url" style="width: 150rpx; height: 150rpx" />
					</block>
					<block v-else>
						<image src="/static/images/avatar.jpg" style="width: 150rpx; height: 150rpx" />
					</block>
				</view>
			</view>
			<view style="padding-top: 20rpx">
				<text class="user-nickname">{{ mine.nickname ? mine.nickname : '用户' + mine._id }}</text>
			</view>
		</view>
		<view class="weui-cells op-cells" style="margin-top: 20rpx">
			<view class="weui-cell">
				<view class="weui-cell__bd">我的订单</view>
				<view class="weui-cell__ft"><text @tap="toOrders('')" style="font-size: 26rpx">全部</text></view>
			</view>
			<view class="weui-cell" style="padding: 0">
				<view class="weui-cell__bd">
					<view class="data-cell" hover-class="weui-cell_active" @tap="toOrders(1)">
						<view class="data-icon">
							<image src="/static/images/od_10.png" mode="widthFix" />
						</view>
						<view class="data-txt">待支付</view>
						<text v-if="statistic.topays > 0"
							class="data-cell-hint data-cell-hint-red">{{ statistic.topays }}</text>
					</view>
				</view>
				<view class="weui-cell__bd">
					<view class="data-cell" hover-class="weui-cell_active" @tap="toOrders(2)">
						<view class="data-icon">
							<image src="/static/images/od_20.png" mode="widthFix" />
						</view>
						<view class="data-txt">待服务</view>
						<text v-if="statistic.todos > 0"
							class="data-cell-hint data-cell-hint-red">{{ statistic.todos }}</text>
					</view>
				</view>
				<view class="weui-cell__bd">
					<view class="data-cell" hover-class="weui-cell_active" @tap="toOrders(3)">
						<view class="data-icon">
							<image src="/static/images/od_30.png" mode="widthFix" />
						</view>
						<view class="data-txt">已完成</view>
					</view>
				</view>
				<view class="weui-cell__bd">
					<view class="data-cell" hover-class="weui-cell_active" @tap="toOrders(4)">
						<view class="data-icon">
							<image src="/static/images/od_40.png" mode="widthFix" />
						</view>
						<view class="data-txt">已取消</view>
					</view>
				</view>
			</view>
		</view>
		<view class="weui-cells op-cells" style="margin-top: 20rpx">
			<view class="weui-cell weui-cell_access" hover-class="weui-cell_active" @tap="toServiceManager">
				<view class="weui-cell__hd">
					<image src="/static/images/ic_clients.png"
						style="display: block; float: left; margin-right: 20rpx; width: 20px; height: 20px"></image>
				</view>
				<view class="weui-cell__bd">服务对象管理</view>
				<view class="weui-cell__ft weui-cell__ft_in-access"></view>
			</view>
			<view class="weui-cell weui-cell_access" hover-class="weui-cell_active" @tap="showShareModal">
				<view class="weui-cell__hd">
					<image src="/static/images/ic_share.png"
						style="display: block;  float: left; margin-right: 20rpx; width: 20px; height: 20px"></image>
				</view>
				<view class="weui-cell__bd">分享转发</view>
				<view class="weui-cell__ft weui-cell__ft_in-access"></view>
			</view>
		</view>
		<share :shareModal="clone_shareModal"></share>

		<!-- 手机登录弹窗 -->
		<uni-popup ref="popup" type="center" :is-mask-click="false" background-color="#fff">
			<view class="login-container">
			  <!-- 用户名密码登录 -->
			  <view class="login-form">
			    <input v-model="username" placeholder="请输入用户名" />
			    <input v-model="password" placeholder="请输入密码" type="password" />
			    <button @click="handleLogin">登录</button>
			  </view>
			
			  <!-- 手机号验证码登录 -->
			  <view class="login-form">
			    <input v-model="phone" placeholder="请输入手机号" />
			    <input v-model="code" placeholder="请输入验证码" />
			    <button @click="handleGetCode">获取验证码</button>
			    <button @click="handlePhoneLogin">手机号登录</button>
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
		</uni-popup>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';
	
	
// import { showToast } from '@uni/toast';

const username = ref('');
const password = ref('');
const phone = ref('');
const code = ref('');
const agreed = ref(false);


	const app = getApp()
	const mine = ref({}) // 用户信息
	const statistic = ref({}) // 订单数量
	const popup = ref(null) // 登录弹框

	onMounted(() => {
		getUserInfo()
	})

	// 获取个人信息
	const getUserInfo = () => {
		// 如果用户没登录就弹框手机验证码登录
		if (!uni.getStorageSync('token')) {
			return popup.value.open('center')
		}

        const options = {header: {token: uni.getStorageSync('token')}}
		this.$request.get('/User/index', options).then( res =>{
			mine.value = res.data.data.mine
			statistic.value = res.data.data.statistic
		}).catch(err => {
			uni.showToast({
				title: res.msg
			})
		})
	}
	// 去订单列表
	const toOrders = (filt) => {
		// 将选中的订单状态保存到全局，去订单列表时就能直接获取并跳转到对应的tab栏
		app.globalData.filt = filt
		uni.switchTab({
			url: '../order/order'
		})
	}

	const clone_shareModal = ref(false) // 控制转发弹窗的显/隐
	// 展示转发组件
	const showShareModal = () => {
		clone_shareModal.value = !clone_shareModal.value
	}
	// 去服务管理
	const toServiceManager = () => {
		uni.navigateTo({
			url: '../clients/index'
		})
	}

	// 取消弹窗
	const cancal = () => {
		popup.value.close() // 关闭弹窗
	}

	// 确认弹窗
	const ok = () => {
		// 如果手机号为空 或 验证码为空,则提示用户
		
	}
	
	
const handleLogin = () => {
  if (!agreed.value) {
    uni.showToast('请先同意服务协议和隐私政策');
    return;
  }
  // 这里处理用户名密码登录逻辑
  console.log('用户名密码登录', username.value, password.value);
};

const handleGetCode = () => {
  if (!phone.value) {
    uni.showToast('请输入手机号');
    return;
  }
  // 这里处理获取验证码逻辑
  console.log('获取验证码', phone.value);
};

const handlePhoneLogin = () => {
  if (!agreed.value) {
    uni.showToast('请先同意服务协议和隐私政策');
    return;
  }
  if (!phone.value || !code.value) {
    uni.showToast('请输入手机号和验证码');
    return;
  }
  // 这里处理手机号登录逻辑
  console.log('手机号登录', phone.value, code.value);
};

const handleAgreementChange = (e) => {
  agreed.value = e.detail.value.length > 0;
};

const handleServiceAgreement = () => {
  // 跳转到服务协议页面
  uni.navigateTo({
    url: '/pages/serviceAgreement',
  });
};

const handlePrivacyPolicy = () => {
  // 跳转到隐私政策页面
  uni.navigateTo({
    url: '/pages/privacyPolicy',
  });
};

const handleRegister = () => {
  // 跳转到注册页面
  uni.navigateTo({
    url: '/pages/register/register',
  });
};
</script>

<style>
	@import './user.css';
	
	.login-container {
	  padding: 20px;
	}
	
	.login-form {
	  margin-bottom: 20px;
	}
	
	.login-form input {
	  width: 100%;
	  height: 40px;
	  border: 1px solid #ccc;
	  border-radius: 5px;
	  margin-bottom: 10px;
	  padding: 0 10px;
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
</style>


