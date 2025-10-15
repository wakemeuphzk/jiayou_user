<template>
  <view class="container">
    <!-- 头部导航 -->
    <view class="header">
      <view class="header-left" @click="goBack">
        <image class="back-icon" src="/static/images/ic_arrow_p.png" />
      </view>
      <text class="header-title">个人信息</text>
      <view class="header-right"></view>
    </view>

    <!-- 个人信息表单 -->
    <view class="profile-form">
      <!-- 头像 -->
      <view class="form-item" @click="chooseAvatar">
        <view class="label">头像</view>
        <view class="avatar-container">
          <image 
            class="avatar" 
            :src="userInfo.avatar || '/static/images/avatar.jpg'" 
            mode="aspectFill"
          />
          <image class="arrow-icon" src="/static/images/ic_arrow.png" />
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <view class="label">昵称</view>
        <input 
          class="input" 
          v-model="userInfo.nickname" 
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <!-- 手机号 -->
      <view class="form-item">
        <view class="label">手机号</view>
        <view class="value">{{ userInfo.phone || '未绑定' }}</view>
      </view>

      <!-- 性别 -->
      <view class="form-item" @click="showGenderPicker">
        <view class="label">性别</view>
        <view class="picker-value">
          <text>{{ genderText }}</text>
          <image class="arrow-icon" src="/static/images/ic_arrow.png" />
        </view>
      </view>

      <!-- 生日 -->
      <view class="form-item">
        <view class="label">生日</view>
        <picker 
          mode="date" 
          :value="userInfo.birthday" 
          @change="onBirthdayChange"
          :end="maxDate"
        >
          <view class="picker-value">
            <text>{{ userInfo.birthday || '请选择生日' }}</text>
            <image class="arrow-icon" src="/static/images/ic_arrow.png" />
          </view>
        </picker>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-container">
      <button class="save-btn" @click="saveProfile">保存</button>
    </view>

    <!-- 性别选择弹窗 -->
    <uni-popup ref="genderPopup" type="bottom" :is-mask-click="true">
      <view class="picker-popup">
        <view class="picker-header">
          <text class="picker-cancel" @click="closeGenderPicker">取消</text>
          <text class="picker-title">选择性别</text>
          <text class="picker-confirm" @click="confirmGender">确定</text>
        </view>
        <view class="picker-content">
          <view 
            v-for="item in genderOptions" 
            :key="item.value"
            class="picker-item"
            :class="{ active: selectedGender === item.value }"
            @click="selectGender(item.value)"
          >
            <text>{{ item.label }}</text>
            <image 
              v-if="selectedGender === item.value"
              class="check-icon" 
              src="/static/images/ic_check.png" 
            />
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';
import { baseURL } from '../../config/config';

// 响应式数据
const userInfo = reactive({
  nickname: '',
  phone: '',
  avatar: '',
  gender: 0,
  birthday: '',
  age: null
});

const genderPopup = ref(null);
const selectedGender = ref(0);

const genderOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 }
];

// 计算属性
const genderText = computed(() => {
  const option = genderOptions.find(item => item.value === userInfo.gender);
  return option ? option.label : '未知';
});

// 最大日期（今天）
const maxDate = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// 生命周期
onMounted(() => {
  loadUserProfile();
});

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const res = await request({
      url: '/user/profile',
      method: 'GET'
    });
    
    if (res.code === 200) {
      Object.assign(userInfo, res.data);
    } else {
      uni.showToast({
        title: res.message || '获取用户信息失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 选择头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      uploadAvatar(tempFilePath);
    }
  });
};

// 上传头像
const uploadAvatar = async (filePath) => {
  uni.showLoading({ title: '上传中...' });
  
  try {
    const uploadRes = await uni.uploadFile({
      url: `${baseURL}/user/profile/avatar`,
      filePath: filePath,
      name: 'file',
      header: {
        'token': uni.getStorageSync('token') || ''
      }
    });
    
    uni.hideLoading();
    
    const data = JSON.parse(uploadRes.data);
    if (data.code === 200) {
      userInfo.avatar = data.data;
      // 更新本地缓存
      const cachedUserInfo = uni.getStorageSync('userInfo');
      if (cachedUserInfo) {
        cachedUserInfo.avatar = data.data;
        uni.setStorageSync('userInfo', cachedUserInfo);
      }
      uni.showToast({
        title: '头像上传成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: data.message || '上传失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('上传头像失败:', error);
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    });
  }
};

// 显示性别选择器
const showGenderPicker = () => {
  selectedGender.value = userInfo.gender;
  genderPopup.value.open();
};

// 关闭性别选择器
const closeGenderPicker = () => {
  genderPopup.value.close();
};

// 选择性别
const selectGender = (value) => {
  selectedGender.value = value;
};

// 确认性别
const confirmGender = () => {
  userInfo.gender = selectedGender.value;
  closeGenderPicker();
};

// 生日变化
const onBirthdayChange = (e) => {
  userInfo.birthday = e.detail.value;
  // 计算年龄
  if (userInfo.birthday) {
    const birthYear = new Date(userInfo.birthday).getFullYear();
    const currentYear = new Date().getFullYear();
    userInfo.age = currentYear - birthYear;
  }
};

// 保存个人信息
const saveProfile = async () => {
  // 验证必填项
  if (!userInfo.nickname || !userInfo.nickname.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({ title: '保存中...' });
    
    const requestData = {
      nickname: userInfo.nickname.trim(),
      avatar: userInfo.avatar || '',
      gender: userInfo.gender,
      birthday: userInfo.birthday || '',
      age: userInfo.age || null
    };

    const res = await request({
      url: '/user/profile',
      method: 'PUT',
      data: requestData
    });

    uni.hideLoading();

    if (res.code === 200) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 更新本地缓存
      uni.setStorageSync('userInfo', userInfo);
      
      // 延迟返回上一页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({
        title: res.message || '保存失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('保存个人信息失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss" scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

/* 头部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-left {
  width: 80rpx;
  display: flex;
  align-items: center;
}

.back-icon {
  width: 40rpx;
  height: 40rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.header-right {
  width: 80rpx;
}

/* 个人信息表单 */
.profile-form {
  margin-top: 20rpx;
  background: white;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.label {
  width: 160rpx;
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.value {
  flex: 1;
  font-size: 30rpx;
  color: #999;
  text-align: right;
}

.input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  text-align: right;
}

.avatar-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 20rpx;
}

.picker-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 30rpx;
  color: #333;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  margin-left: 10rpx;
}

/* 保存按钮 */
.save-container {
  padding: 40rpx 30rpx;
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
  
  &::after {
    border: none;
  }
}

/* 性别选择弹窗 */
.picker-popup {
  background: white;
  border-radius: 24rpx 24rpx 0 0;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100rpx;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-cancel,
.picker-confirm {
  font-size: 32rpx;
  color: #666;
}

.picker-confirm {
  color: #667eea;
}

.picker-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.picker-content {
  padding: 20rpx 0;
  max-height: 600rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  font-size: 32rpx;
  color: #333;
  
  &.active {
    color: #667eea;
  }
}

.check-icon {
  width: 40rpx;
  height: 40rpx;
}
</style>

