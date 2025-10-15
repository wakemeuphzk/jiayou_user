<template>
	<view>
		<!-- 通知栏 -->
		<view style="margin-top: 10rpx;">
			<view class="weui-cell" style="background-color: #fff9eb;">
				<view class="weui-cell__hd">
					<image src="/static/images/ic_myapp.png"
						style="display:block;width:40rpx;height:40rpx;margin-right:14rpx;"></image>
				</view>
				<view class="weui-cell__bd">
					<text style="color:#be9719;font-size:26rpx;">{{ notice }}</text>
				</view>
				<view class="weui-cell__ft">
					<image src="/static/images/modal_closer.png"
						style="display:block;width:30rpx;height:30rpx;"></image>
				</view>
			</view>
		</view>
		<view>
		    <map id="map" longitude="121.578465" latitude="31.217073‌" scale="14" controls="[]" show-location style="width: 100%; height: 300px;"></map>
		</view>
		<view class="weui-cells op-cells" style="margin-top: 20rpx">
			<view class="weui-cell weui-cell_access" hover-class="weui-cell_active" @tap="toServiceManager">
				<view class="weui-cell__hd">
					<image src="/static/images/ic_clients.png"
						style="display: block; margin-right: 20rpx; width: 20px; height: 20px"></image>
				</view>
				<view class="weui-cell__bd"> 您的附近有 <text style="color:red">{{ nearbyNum }}</text> 位阿姨 </view>
				<view class="weui-cell__ft weui-cell__ft_in-access"></view>
			</view>
		</view>
		<view class="nav-list">
			<block v-for="(item,index) in navs" :key="item.id">
				<view class="nav-item" @click="goPage(item.stype_link)">
					<view class="nav-pic">
						<image :src="item.pic_image_url" mode="widthFix"></image>
					</view>
					<view class="nav-text" :style="'color:'+item.tcolor ? item.tcolor: ''">
						{{ item.title }}
					</view>
				</view>
			</block>
		</view>
		<view>
			<view class="description">
				<view>
					价格: {{ price }}  会员价: {{ vipPrice }}
				</view>

				<view style="margin-top: 20rpx;" >
					服务介绍: {{ description }}
				</view>
				
				<view style="display: flex;" class="empty-bottom">
					<button 
						style="color: #ffffff;background-color: #007aff; flex: 1;" 
					>
						去预约
					</button>
					
					<button  @click="goToPoster"
					    style="margin-left: 10rpx; color: #ffffff;background-color: orange; flex: 1.5;"
					>
					    开通会员立省30%！
					</button>
				</view>
				
			</view>
		    
		</view>
	</view>
</template>

<script setup>
	import {
		onLoad
	} from "@dcloudio/uni-app"
	import {
		ref,
		reactive,
		computed
	} from "vue"
	
	const notice = ref('点击右上角“添加到我的小程序”，方便下次找到!')
	const app = getApp() // 获取uniapp实例
	
	// const nav2s = ref([]) // 2个导航
	const navs = ref([{
		id: 1,
		pic_image_url: '/static/images/od_10.png',
		stype_link: '',
		tcolor: 'red',
		title: '钟点工'
	},{
		id: 2,
		pic_image_url: '/static/images/od_20.png',
		stype_link: '',
		tcolor: 'red',
		title: '做饭'
	},{
		id: 3,
		pic_image_url: '/static/images/od_30.png',
		stype_link: '',
		tcolor: 'red',
		title: '开荒保洁'
	},{
		id: 4,
		pic_image_url: '/static/images/od_40.png',
		stype_link: '',
		tcolor: 'red',
		title: '包月'
	}]) // 多个导航
	
	const nearbyNum = ref(3);
	
	const price = ref(' 55元/小时 ')
	const vipPrice = ref(' 50元/小时 ')
	const description = ref(' 保洁  洗衣  家务')
	onLoad(() => {
		//  this.$request.get('/api/config').then(res => {
		//        if(null != res.notice){
		// 	         notice = res.notice
		//         }
		//  })
		// 获取用户当前定位，并打点
		uni.getLocation({
		    type: 'wgs84',
			geocode: true,
		    success: function (res) {
		        console.log('当前位置的经度：' + res.longitude);
		        console.log('当前位置的纬度：' + res.latitude);
				console.log('当前位置：' + res.address);
				const lon = res.longitude;
				const lat = res.latitude;	
				// 获取附近阿姨个数
				// this.$request.get('/api/nearby?lon=' + lon + '&lat=' + lat + '&meters=5000',).then(res => {
				//     console.log(res.size);
				// 	nearbyNum = res.size;
				// })
		    },
			fail(result) {
			    console.log('获取地理位置失败：' + result)
			}
		});
		
		// 调用绑定在全局实例对象上的公共工具函数
		// app.globalData.utils.getUserInfo()
		// 先获取地区码
		console.log('load')
		
		// console.log(app.globalData.utils, 'app.globalData.utils');
	})
	
	// 导航跳转
	const goPage = (url) => {
		uni.navigateTo({
			url
		})
	}
	
	// 跳转到会员权益页面
	const goToPoster = () => {
	  uni.navigateTo({
	    url: '/pages/poster/poster',
	  });
	};

</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
	
	.nav2-list {
		margin: 110rpx 20rpx 0 20rpx;
	}
	
	.nav2-list::after {
		content: '';
		display: block;
		height: 0;
		line-height: 0;
		clear: both;
		visibility: hidden;
	}
	
	.nav2-item {
		float: left;
		margin-top: 20rpx;
		width: 50%;
		text-align: center;
		box-sizing: border-box;
		padding: 0 5rpx;
	}
	
	.nav2-pic {
		width: 100%;
	}
	
	.nav2-pic image {
		display: block;
		width: 100%;
	}
	
	.nav-list::after {
		content: '';
		display: block;
		height: 0;
		line-height: 0;
		clear: both;
		visibility: hidden;
	}
	
	.nav-item {
		float: left;
		margin-top: 20rpx;
		width: 20%;
		text-align: center;
		padding: 10rpx 10rpx;
	}
	
	.nav-pic image {
		display: block;
		margin: 0 auto;
		width: 110rpx;
		height: 110rpx;
	}
	

.weui-cells {
    position: relative;
    margin-top: 1.17647059em;
    background-color: #fff;
    line-height: 1.41176471;
    font-size: 17px;
}

.weui-cells:before {
    content: ' ';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    height: 1px;
    border-top: 1rpx solid #e6e6e6;
    color: #e6e6e6;
}

.weui-cells:after {
    content: ' ';
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 0px;
    border-bottom: 0rpx solid #e6e6e6;
    color: #e6e6e6;
}

.weui-cells__title {
    margin-top: 0.77em;
    margin-bottom: 0.3em;
    padding-left: 15px;
    padding-right: 15px;
    color: #999;
    font-size: 14px;
}

.weui-cells_after-title {
    margin-top: 0;
}

.weui-cells__tips {
    margin-top: 0.3em;
    color: #999;
    padding-left: 15px;
    padding-right: 15px;
    font-size: 14px;
}

.weui-cell {
    padding: 10px 15px;
    position: relative;
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    -webkit-box-align: center;
    -webkit-align-items: center;
    align-items: center;
}

.weui-cell:before {
    content: ' ';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    height: 1px;
    border-top: 1rpx solid #e6e6e6;
    color: #e6e6e6;
}

.weui-cell:first-child:before {
    display: none;
}

.weui-cell_active {
    background-color: #ececec;
}

	
/** weui override **/
.weui-cells__title {
	font-size: 22rpx;
	color: #bbbbbb;
	margin-top: 20rpx;
}

.wx-switch-input {
	background: #0bb584 !important;
	border-color: #0bb584 !important;
}

.empty {
    padding-top: 200rpx;
}

.empty-bottom {
    width: 90vw;
    margin-top: 30rpx;
}

.description {
	margin-top: 20rpx;
	text-align: center;
	box-sizing: border-box;
	padding: 0 5rpx;
}
</style>
