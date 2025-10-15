<script>
	import NotificationUtil from '@/utils/notificationUtil.js'
	
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 应用启动时更新消息徽标
			this.updateMessageBadge()
		},
		onShow: function() {
			console.log('App Show')
			// 应用显示时更新消息徽标
			this.updateMessageBadge()
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			/**
			 * 更新消息徽标
			 */
			async updateMessageBadge() {
				try {
					// 检查是否已登录
					const token = uni.getStorageSync('token')
					if (!token) {
						console.log('未登录，跳过消息徽标更新')
						return
					}
					
					// 更新TabBar消息徽标
					await NotificationUtil.updateTabBarBadge(2) // 根据实际TabBar索引调整
					
				} catch (error) {
					console.error('更新消息徽标失败:', error)
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
