<template>
  <view class="container">
    <!-- 头部导航 -->
    <view class="header">
      <view class="header-left" @click="goBack">
        <image class="back-icon" src="/static/images/ic_arrow_p.png" />
      </view>
      <text class="header-title">地址管理</text>
      <view class="header-right" @click="goToAddAddress">
        <text class="add-text">添加</text>
      </view>
    </view>

    <!-- 地址列表 -->
    <view class="address-list" v-if="addresses.length > 0">
      <view 
        v-for="address in addresses" 
        :key="address.id" 
        class="address-item"
      >
        <view class="address-content" @click="isSelectMode ? selectAddress(address) : editAddress(address)">
          <view class="address-header">
            <image class="location-icon" src="/static/images/ic_loc.png" />
            <text class="address-name">{{ address.addressName }}</text>
            <view class="default-badge" v-if="address.isDefault">
              默认
            </view>
          </view>
          <view class="contact-info">
            <text class="contact-name">{{ address.name }}</text>
            <text class="contact-phone">{{ address.phone }}</text>
          </view>
          <text class="address-detail">{{ address.fullAddress }}</text>
        </view>
        
        <view class="address-actions">
          <button 
            class="action-btn default-btn" 
            :class="address.isDefault ? 'disabled' : ''"
            @click="setDefault(address)"
            :disabled="address.isDefault"
          >
            {{ address.isDefault ? '默认地址' : '设为默认' }}
          </button>
          <button class="action-btn delete-btn" @click="deleteAddress(address)">
            删除
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image class="empty-icon" src="/static/images/empty/address.png" />
      <text class="empty-text">暂无收货地址</text>
      <text class="empty-desc">添加收货地址，方便预约服务</text>
      <button class="add-address-btn" @click="goToAddAddress">
        添加地址
      </button>
    </view>

    <!-- 地址编辑弹窗 -->
    <uni-popup ref="editPopup" type="bottom" :is-mask-click="true">
      <view class="edit-form">
        <view class="form-header">
          <text class="form-title">{{ isEditing ? '编辑地址' : '添加地址' }}</text>
          <image class="close-icon" src="/static/images/icon_close.png" @click="closeEditForm" />
        </view>
        
        <view class="form-content">
          <!-- 快速选择地址（放在最前面，新增时显示） -->
          <view class="form-item" v-if="!isEditing">
            <button class="quick-select-btn-primary" @click="chooseWechatAddress">
              <image class="wx-icon" src="/static/images/push_wx.png" />
              <text>从微信地址簿选择</text>
            </button>
            <view class="tips">推荐使用微信地址，自动填充联系人和电话</view>
          </view>
          
          <!-- 分隔线 -->
          <view class="divider" v-if="!isEditing">
            <text class="divider-text">或手动填写</text>
          </view>
          
          <view class="form-item">
            <text class="label">联系人</text>
            <input 
              class="input" 
              v-model="editForm.name" 
              placeholder="收货人姓名"
              maxlength="20"
            />
          </view>
          
          <view class="form-item">
            <text class="label">联系电话</text>
            <input 
              class="input" 
              v-model="editForm.phone" 
              placeholder="手机号码"
              type="number"
              maxlength="11"
            />
          </view>
          
          <view class="form-item">
            <text class="label">所在区域</text>
            <input 
              class="input" 
              v-model="editForm.region" 
              placeholder="省市区"
              maxlength="50"
            />
          </view>
          
          <view class="form-item">
            <text class="label">详细地址</text>
            <textarea 
              class="textarea" 
              v-model="editForm.detail" 
              placeholder="街道、门牌号等"
              maxlength="100"
            />
          </view>
          
          <view class="form-item">
            <text class="label">地址标签</text>
            <input 
              class="input" 
              v-model="editForm.addressName" 
              placeholder="如：家、公司（可选）"
              maxlength="20"
            />
          </view>
          
          <!-- 设为默认地址 -->
          <view class="form-item form-switch">
            <text class="label">设为默认地址</text>
            <switch :checked="editForm.isDefault" @change="handleDefaultChange" color="#667eea" />
          </view>
        </view>
        
        <view class="form-actions">
          <button class="cancel-btn" @click="closeEditForm">取消</button>
          <button class="save-btn" @click="saveAddress" :disabled="!canSave">保存</button>
        </view>
      </view>
    </uni-popup>

    <!-- 确认删除弹窗 -->
    <uni-popup ref="deletePopup" type="center" :is-mask-click="false">
      <view class="delete-confirm">
        <text class="confirm-title">确认删除</text>
        <text class="confirm-text">删除后将无法恢复，确定要删除这个地址吗？</text>
        <view class="confirm-actions">
          <button class="cancel-btn" @click="closeDeleteConfirm">取消</button>
          <button class="confirm-btn" @click="confirmDelete">删除</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '../../api/request';

// 响应式数据
const addresses = ref([]);
const editPopup = ref(null);
const deletePopup = ref(null);
const isEditing = ref(false);
const currentAddress = ref(null);
const deleteTarget = ref(null);
const isSelectMode = ref(false); // 是否为选择模式

// 编辑表单数据
const editForm = reactive({
  id: null,
  addressName: '',
  name: '',
  phone: '',
  region: '',
  detail: '',
  latitude: '',
  longitude: '',
  isDefault: false,
  // 后端需要的字段
  provinceId: null,
  cityId: null,
  districtId: null,
  provinceName: '',
  cityName: '',
  districtName: '',
  cityCode: ''
});

// 计算属性 - 简化验证，地址标签改为可选
const canSave = computed(() => {
  return editForm.name.trim() && 
         editForm.phone.trim() && 
         editForm.region.trim() && 
         editForm.detail.trim();
});

// 生命周期
onMounted(() => {
  loadAddresses();
});

// 加载地址列表
const loadAddresses = async () => {
  try {
    const res = await request({
      url: '/user/address/list',
      method: 'GET'
    });
    
    if (res.code === 200) {
      addresses.value = res.data || [];
    } else {
      uni.showToast({
        title: res.message || '获取地址失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取地址列表失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};

// 选择地址（选择模式下）
const selectAddress = (address) => {
  // 获取当前页面栈
  const pages = getCurrentPages();
  // 获取上一页
  const prevPage = pages[pages.length - 2];
  
  // 触发上一页的事件
  if (prevPage) {
    // 使用 eventChannel 传递数据
    const eventChannel = prevPage.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.emit('selectAddress', address);
    }
  }
  
  // 返回上一页
  uni.navigateBack();
};

// 页面加载
onLoad((options) => {
  // 检查是否为选择模式
  if (options.mode === 'select') {
    isSelectMode.value = true;
  }
  
  loadAddresses();
});

// 返回上一页
const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    // 如果是第一个页面，导航到首页
    uni.reLaunch({
      url: '/pages/index/index'
    });
  }
};

// 跳转到添加地址
const goToAddAddress = () => {
  resetEditForm();
  isEditing.value = false;
  editPopup.value.open();
};

// 原始地址数据（用于比较是否有变化）
const originalAddress = ref(null);

// 编辑地址
const editAddress = (address) => {
  currentAddress.value = address;
  isEditing.value = true;
  
  // 保存原始地址信息，用于比较
  originalAddress.value = {
    region: `${address.provinceName || ''}${address.cityName || ''}${address.districtName || ''}`,
    detail: address.detailAddress
  };
  
  // 填充表单数据
  editForm.id = address.id;
  editForm.addressName = address.addressName || '';
  editForm.name = address.name || '';
  editForm.phone = address.phone || '';
  editForm.region = `${address.provinceName || ''}${address.cityName || ''}${address.districtName || ''}`;
  editForm.detail = address.detailAddress || '';
  editForm.latitude = address.latitude || '';
  editForm.longitude = address.longitude || '';
  editForm.isDefault = address.isDefault || false;
  
  // 填充省市区ID
  editForm.provinceId = address.provinceId || null;
  editForm.cityId = address.cityId || null;
  editForm.districtId = address.districtId || null;
  editForm.provinceName = address.provinceName || '';
  editForm.cityName = address.cityName || '';
  editForm.districtName = address.districtName || '';
  editForm.cityCode = address.cityCode || '';
  
  editPopup.value.open();
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.id = null;
  editForm.addressName = '';
  editForm.name = '';
  editForm.phone = '';
  editForm.region = '';
  editForm.detail = '';
  editForm.latitude = '';
  editForm.longitude = '';
  editForm.isDefault = false;
  editForm.provinceId = null;
  editForm.cityId = null;
  editForm.districtId = null;
  editForm.provinceName = '';
  editForm.cityName = '';
  editForm.districtName = '';
  editForm.cityCode = '';
  currentAddress.value = null;
  originalAddress.value = null;
};

// 关闭编辑表单
const closeEditForm = () => {
  editPopup.value.close();
  resetEditForm();
};

// 处理默认地址开关变化
const handleDefaultChange = (e) => {
  editForm.isDefault = e.detail.value;
};

// 保存地址
const saveAddress = async () => {
  if (!canSave.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }

  // 验证手机号格式
  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(editForm.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    });
    return;
  }

  try {
    // 显示保存中状态
    uni.showLoading({
      title: isEditing.value ? '更新中...' : '保存中...'
    });

    // 如果没有provinceId，尝试手动解析region
    if (!editForm.provinceId && editForm.region) {
      await parseManualRegion();
    }

    // 检查是否需要进行地址逆解析
    let needGeocode = false;
    
    if (isEditing.value) {
      // 编辑模式：检查地址信息是否发生变化
      const currentRegion = editForm.region.trim();
      const currentDetail = editForm.detail.trim();
      const originalRegion = originalAddress.value?.region || '';
      const originalDetail = originalAddress.value?.detail || '';
      
      needGeocode = (currentRegion !== originalRegion) || (currentDetail !== originalDetail);
      
      if (needGeocode) {
        console.log('地址信息发生变化，需要重新解析经纬度');
      }
    } else {
      // 新增模式：总是进行地址逆解析
      needGeocode = true;
    }
    
    if (needGeocode) {
      const fullAddress = `${editForm.region}${editForm.detail}`;
      await getLocationByAddress(fullAddress);
    }

    // 如果没有地址标签，自动生成一个
    const addressName = editForm.addressName.trim() || 
                       (editForm.isDefault ? '默认地址' : `地址${addresses.value.length + 1}`);
    
    const requestData = {
      addressName: addressName,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      detailAddress: editForm.detail.trim(),
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
      isDefault: editForm.isDefault
    };

    // 添加省市区ID（如果有的话）
    if (editForm.provinceId) {
      requestData.provinceId = editForm.provinceId;
      requestData.provinceName = editForm.provinceName;
    }
    if (editForm.cityId) {
      requestData.cityId = editForm.cityId;
      requestData.cityName = editForm.cityName;
      requestData.cityCode = editForm.cityCode;
    }
    if (editForm.districtId) {
      requestData.districtId = editForm.districtId;
      requestData.districtName = editForm.districtName;
    }

    let res;
    
    if (isEditing.value && editForm.id) {
      // 编辑模式：调用修改接口
      res = await request({
        url: `/user/address/${editForm.id}`,
        method: 'PUT',
        data: requestData
      });
    } else {
      // 新增模式：调用创建接口
      res = await request({
        url: '/user/address',
        method: 'POST',
        data: requestData
      });
    }

    uni.hideLoading();

    if (res.code === 200) {
      uni.showToast({
        title: isEditing.value ? '更新成功' : '添加成功',
        icon: 'success'
      });
      
      closeEditForm();
      loadAddresses(); // 重新加载列表
    } else {
      uni.showToast({
        title: res.message || '操作失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('保存地址失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};

// 设置默认地址
const setDefault = async (address) => {
  if (address.isDefault) {
    return;
  }

  try {
    const res = await request({
      url: `/user/address/${address.id}/set-default`,
      method: 'POST'
    });

    if (res.code === 200) {
      uni.showToast({
        title: '设置成功',
        icon: 'success'
      });
      
      loadAddresses(); // 重新加载列表
    } else {
      uni.showToast({
        title: res.message || '操作失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('设置默认地址失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};

// 删除地址
const deleteAddress = (address) => {
  deleteTarget.value = address;
  deletePopup.value.open();
};

// 关闭删除确认弹窗
const closeDeleteConfirm = () => {
  deletePopup.value.close();
  deleteTarget.value = null;
};

// 确认删除
const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  try {
    const res = await request({
      url: `/user/address/${deleteTarget.value.id}`,
      method: 'DELETE'
    });

    if (res.code === 200) {
      uni.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
      closeDeleteConfirm();
      loadAddresses(); // 重新加载列表
    } else {
      uni.showToast({
        title: res.message || '删除失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('删除地址失败:', error);
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    });
  }
};

// 选择微信地址
const chooseWechatAddress = () => {
  // #ifdef MP-WEIXIN
  wx.chooseAddress({
    success: async (res) => {
      console.log('选择的地址信息:', res);
      
      // 填充表单数据 - 联系人和电话
      if (res.userName) {
        editForm.name = res.userName;
        // 如果地址标签为空，自动生成（如："张三的地址"）
        if (!editForm.addressName) {
          editForm.addressName = `${res.userName}的地址`;
        }
      }
      
      if (res.telNumber) {
        editForm.phone = res.telNumber;
      }
      
      // 保存省市区名称
      editForm.provinceName = res.provinceName;
      editForm.cityName = res.cityName;
      editForm.districtName = res.countyName;
      
      // 组合省市区信息用于显示
      const region = `${res.provinceName}${res.cityName}${res.countyName}`;
      editForm.region = region;
      
      // 详细地址
      editForm.detail = res.detailInfo;
      
      // 获取省市区ID
      await getRegionIds(res.provinceName, res.cityName, res.countyName);
      
      // 获取地址的经纬度
      await getLocationByAddress(`${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`);
      
      uni.showToast({
        title: '地址信息已填充',
        icon: 'success'
      });
    },
    fail: (err) => {
      console.error('选择地址失败:', err);
      
      if (err.errMsg.includes('cancel')) {
        // 用户取消选择
        return;
      } else if (err.errMsg.includes('auth deny')) {
        // 用户拒绝授权
        uni.showModal({
          title: '授权提示',
          content: '需要获取您的地址信息，请在设置中开启地址权限',
          confirmText: '去设置',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.address']) {
                    uni.showToast({
                      title: '授权成功，请重新选择',
                      icon: 'success'
                    });
                  }
                }
              });
            }
          }
        });
      } else {
        uni.showToast({
          title: '获取地址失败',
          icon: 'none'
        });
      }
    }
  });
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '此功能仅在微信小程序中可用',
    icon: 'none'
  });
  // #endif
};

// 手动解析地区信息
const parseManualRegion = async () => {
  const region = editForm.region.trim();
  if (!region) return;

  try {
    // 简单的地区解析逻辑
    let provinceName = '';
    let cityName = '';
    let districtName = '';

    // 检查是否包含常见的省份后缀
    const provinceKeywords = ['省', '市', '自治区', '特别行政区'];
    const municipalityKeywords = ['北京', '上海', '天津', '重庆'];
    
    // 检查是否为直辖市
    const municipality = municipalityKeywords.find(m => region.startsWith(m));
    if (municipality) {
      provinceName = municipality + '市';
      cityName = municipality + '市';
      districtName = region.replace(municipality, '').replace('市', '');
    } else {
      // 尝试解析省份
      for (const keyword of provinceKeywords) {
        const index = region.indexOf(keyword);
        if (index > 0) {
          provinceName = region.substring(0, index + 1);
          const remaining = region.substring(index + 1);
          
          // 解析城市和区县
          const cityIndex = remaining.indexOf('市') > 0 ? remaining.indexOf('市') + 1 : 
                          remaining.indexOf('州') > 0 ? remaining.indexOf('州') + 1 :
                          remaining.indexOf('盟') > 0 ? remaining.indexOf('盟') + 1 : 0;
          
          if (cityIndex > 0) {
            cityName = remaining.substring(0, cityIndex);
            districtName = remaining.substring(cityIndex);
          } else {
            cityName = remaining;
          }
          break;
        }
      }
    }

    if (provinceName) {
      await getRegionIds(provinceName, cityName, districtName);
    }
  } catch (error) {
    console.error('解析地区信息失败:', error);
  }
};

// 获取省市区ID
const getRegionIds = async (provinceName, cityName, districtName) => {
  try {
    // 查询省份ID
    const provinceRes = await request({
      url: '/region/provinces',
      method: 'GET'
    });
    
    if (provinceRes.code === 200) {
      const province = provinceRes.data.find(p => p.name === provinceName);
      if (province) {
        editForm.provinceId = province.id;
        editForm.provinceName = province.name;
        
        // 查询城市ID
        const cityRes = await request({
          url: `/region/cities/${province.id}`,
          method: 'GET'
        });
        
        if (cityRes.code === 200) {
          const city = cityRes.data.find(c => c.name === cityName);
          if (city) {
            editForm.cityId = city.id;
            editForm.cityName = city.name;
            editForm.cityCode = city.code || '';
            
            // 查询区县ID
            if (districtName) {
              const districtRes = await request({
                url: `/region/districts/${city.id}`,
                method: 'GET'
              });
              
              if (districtRes.code === 200) {
                const district = districtRes.data.find(d => d.name === districtName);
                if (district) {
                  editForm.districtId = district.id;
                  editForm.districtName = district.name;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取省市区ID失败:', error);
    // 即使获取ID失败，也允许保存，后端可以根据名称处理
  }
};

// 通过地址获取经纬度（地址逆解析）
const getLocationByAddress = async (address) => {
  try {
    // #ifdef MP-WEIXIN
    // 使用腾讯地图WebService API进行地址解析
    const key = '6XPBZ-MBR3L-6LKP6-MFPQS-N6KAJ-4SBSR'; // 腾讯地图WebService API Key
    const geocodeUrl = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(address)}&key=${key}`;
    
    const result = await new Promise((resolve, reject) => {
      uni.request({
        url: geocodeUrl,
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          console.log('腾讯地图API返回:', res);
          resolve(res);
        },
        fail: (error) => {
          console.error('腾讯地图API请求失败:', error);
          reject(error);
        }
      });
    });
    
    if (result.data && result.data.status === 0 && result.data.result && result.data.result.location) {
      const location = result.data.result.location;
      editForm.latitude = location.lat.toString();
      editForm.longitude = location.lng.toString();
      console.log('腾讯地图解析成功，经纬度:', {
        latitude: location.lat,
        longitude: location.lng,
        address: address
      });
    } else {
      console.warn('腾讯地图解析失败:', result.data);
      await fallbackToCurrentLocation();
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    await fallbackToCurrentLocation();
    // #endif
  } catch (error) {
    console.error('地址解析过程出错:', error);
    await fallbackToCurrentLocation();
  }
};

// 备选方案：获取当前位置
const fallbackToCurrentLocation = async () => {
  try {
    const location = await uni.getLocation({
      type: 'gcj02',
      altitude: false
    });
    
    editForm.latitude = location.latitude.toString();
    editForm.longitude = location.longitude.toString();
    console.log('使用当前位置作为备选:', location);
  } catch (locationError) {
    console.warn('无法获取当前位置:', locationError);
    // 如果都失败了，留空让后端处理
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
  display: flex;
  justify-content: flex-end;
}

.add-text {
  font-size: 32rpx;
  color: #667eea;
}

/* 地址列表 */
.address-list {
  padding: 20rpx 30rpx;
}

.address-item {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.address-content {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.location-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
}

.address-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.default-badge {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.contact-info {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
  gap: 20rpx;
}

.contact-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.contact-phone {
  font-size: 28rpx;
  color: #666;
}

.address-detail {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  padding: 20rpx 30rpx;
}

.action-btn {
  flex: 1;
  height: 70rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  margin: 0 10rpx;
  
  &:first-child {
    margin-left: 0;
  }
  
  &:last-child {
    margin-right: 0;
  }
}

.default-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  
  &.disabled {
    background: #e0e0e0;
    color: #999;
  }
}

.delete-btn {
  background: #fff2f0;
  color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  text-align: center;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 60rpx;
  line-height: 1.5;
}

.add-address-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  height: 80rpx;
  padding: 0 60rpx;
  font-size: 32rpx;
}

/* 编辑表单弹窗 */
.edit-form {
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100rpx;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.close-icon {
  width: 40rpx;
  height: 40rpx;
}

.form-content {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 40rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.input, .textarea {
  width: 100%;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  color: #333;
  
  &::placeholder {
    color: #999;
  }
}

.textarea {
  height: 120rpx;
  resize: none;
}

.quick-select-btn-primary {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  gap: 15rpx;
  box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.3);
  
  &::after {
    border: none;
  }
}

.wx-icon {
  width: 40rpx;
  height: 40rpx;
}

.tips {
  margin-top: 15rpx;
  font-size: 24rpx;
  color: #999;
  text-align: center;
  line-height: 1.5;
}

.divider {
  display: flex;
  align-items: center;
  margin: 40rpx 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1rpx;
    background: #e0e0e0;
  }
}

.divider-text {
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #999;
}

.form-actions {
  display: flex;
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  background: #f8f8f8;
  color: #666;
  border: none;
  border-radius: 12rpx;
  margin-right: 20rpx;
  font-size: 32rpx;
}

.save-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  
  &:disabled {
    background: #ccc;
    color: #999;
  }
}

/* 删除确认弹窗 */
.delete-confirm {
  width: 600rpx;
  background: white;
  border-radius: 16rpx;
  padding: 40rpx 30rpx 30rpx;
  text-align: center;
}

.confirm-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 20rpx;
}

.confirm-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 40rpx;
}

.confirm-actions {
  display: flex;
  gap: 20rpx;
}

.confirm-btn {
  flex: 1;
  height: 70rpx;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>

