# 消息通知功能使用说明

## 📋 功能概述

用户端消息通知功能已完成，包括：
- ✅ 消息中心页面（notification.vue）
- ✅ 消息通知工具类（notificationUtil.js）
- ✅ 订单创建页面集成订阅授权
- ✅ App.vue 全局消息徽标更新

## 🔧 配置步骤

### 1. 配置微信订阅消息模板ID

在 `utils/notificationUtil.js` 文件中，找到 `TEMPLATE_IDS` 配置对象，将占位符替换为实际的微信模板ID：

```javascript
static TEMPLATE_IDS = {
  // 订单相关
  ORDER_ACCEPTED: 'YOUR_TEMPLATE_ID_1',      // 替换为实际模板ID
  SERVICE_STARTING: 'YOUR_TEMPLATE_ID_2',    // 替换为实际模板ID
  ORDER_COMPLETED: 'YOUR_TEMPLATE_ID_3',     // 替换为实际模板ID
  ORDER_CANCELED: 'YOUR_TEMPLATE_ID_4',      // 替换为实际模板ID
  
  // 支付相关
  PAYMENT_SUCCESS: 'YOUR_TEMPLATE_ID_5',     // 替换为实际模板ID
  REFUND_SUCCESS: 'YOUR_TEMPLATE_ID_6',      // 替换为实际模板ID
  
  // 其他
  COUPON_RECEIVED: 'YOUR_TEMPLATE_ID_7',     // 替换为实际模板ID
  POINTS_CHANGED: 'YOUR_TEMPLATE_ID_8'       // 替换为实际模板ID
}
```

**获取模板ID的步骤：**
1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入"功能" -> "订阅消息"
3. 在"模板库"中选择或创建对应的模板
4. 复制模板ID（格式类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
5. 替换到配置中

### 2. 配置TabBar消息徽标索引

在以下两个文件中，根据实际的TabBar配置调整消息中心的索引：

**App.vue:**
```javascript
await NotificationUtil.updateTabBarBadge(2) // 修改数字为实际索引
```

**pages/notification/notification.vue:**
```javascript
updateTabBarBadge() {
  if (this.stat.unreadCount > 0) {
    uni.setTabBarBadge({
      index: 2, // 修改数字为实际索引
      text: String(this.stat.unreadCount > 99 ? '99+' : this.stat.unreadCount)
    })
  } else {
    uni.removeTabBarBadge({ index: 2 }) // 修改数字为实际索引
  }
}
```

> 提示：TabBar索引从0开始，例如：首页=0，订单=1，消息=2，我的=3

### 3. 配置 pages.json

确保 `pages.json` 中已添加消息中心页面：

```json
{
  "path": "pages/notification/notification",
  "style": {
    "navigationBarTitleText": "消息中心",
    "enablePullDownRefresh": true
  }
}
```

如果消息中心在TabBar中，还需要配置TabBar：

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/order/order",
        "text": "订单"
      },
      {
        "pagePath": "pages/notification/notification",
        "text": "消息",
        "iconPath": "static/tabbar/message.png",
        "selectedIconPath": "static/tabbar/message-selected.png"
      },
      {
        "pagePath": "pages/user/user",
        "text": "我的"
      }
    ]
  }
}
```

## 📱 功能使用

### 1. 消息中心页面

用户可以在消息中心查看所有消息：
- 按类型筛选（全部、订单、服务、支付、系统）
- 查看未读数统计
- 点击消息跳转到详情页
- 全部标记为已读
- 下拉刷新

### 2. 订阅消息授权

用户在以下场景会被请求授权：
- **下单时**：自动请求订单相关的订阅消息授权
  - 订单接单通知
  - 服务开始提醒
  - 服务完成通知

### 3. 消息徽标

- 应用启动时自动更新
- 应用切换到前台时自动更新
- 标记消息已读后自动更新
- 显示未读数量（超过99显示99+）

## 🛠️ API 接口

工具类 `NotificationUtil` 提供以下方法：

```javascript
// 请求订阅消息授权
await NotificationUtil.requestSubscribe(['ORDER_ACCEPTED', 'SERVICE_STARTING'])

// 获取消息统计
const stat = await NotificationUtil.getStat()

// 更新TabBar徽标
await NotificationUtil.updateTabBarBadge(2)

// 标记消息为已读
await NotificationUtil.markAsRead(messageId)

// 批量标记为已读
await NotificationUtil.batchMarkAsRead([id1, id2, id3])

// 标记全部为已读
await NotificationUtil.markAllAsRead('ORDER') // 可选类型参数

// 删除消息
await NotificationUtil.deleteMessage(messageId)

// 获取消息列表
const data = await NotificationUtil.getMessageList({ 
  type: 'ORDER', 
  page: 1, 
  size: 20 
})

// 获取消息详情
const message = await NotificationUtil.getMessageDetail(messageId)

// 处理消息点击（自动标记已读并跳转）
await NotificationUtil.handleMessageClick(message)
```

## 🎨 自定义样式

消息中心页面使用了渐变色主题，可以在 `pages/notification/notification.vue` 中修改：

```scss
// 统计卡片渐变色
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// 选中状态颜色
color: #667eea;

// 未读消息背景
background: linear-gradient(to right, #f0f5ff, #fff);
```

## 📋 后端接口要求

确保后端已实现以下接口：

| 接口 | 方法 | 说明 |
|-----|------|------|
| `/notification/list` | GET | 获取消息列表 |
| `/notification/stat` | GET | 获取消息统计 |
| `/notification/{id}` | GET | 获取消息详情 |
| `/notification/{id}/read` | PUT | 标记为已读 |
| `/notification/batch-read` | PUT | 批量标记为已读 |
| `/notification/read-all` | PUT | 全部标记为已读 |
| `/notification/{id}` | DELETE | 删除消息 |
| `/notification/subscribe` | POST | 保存订阅授权 |

详细接口文档请参考：`小程序消息通知系统设计方案.md`

## 🐛 常见问题

### Q1: 订阅消息授权失败？
**A:** 检查以下几点：
1. 确认模板ID已正确配置（不是占位符）
2. 确认小程序已在微信公众平台配置订阅消息
3. 确认用户未拒绝授权

### Q2: 消息徽标不显示？
**A:** 检查以下几点：
1. 确认TabBar索引配置正确
2. 确认用户已登录（有token）
3. 确认后端接口正常返回数据

### Q3: 消息列表为空？
**A:** 检查以下几点：
1. 确认后端已发送消息
2. 确认request.js中的token正确传递
3. 查看控制台是否有错误信息

### Q4: 点击消息跳转失败？
**A:** 检查以下几点：
1. 确认jumpUrl路径正确
2. 确认目标页面已在pages.json中配置
3. 查看控制台错误信息

## 📝 开发建议

1. **测试订阅授权**：在开发环境中，多次测试订阅授权流程
2. **模拟消息**：可以通过后端接口发送测试消息进行调试
3. **性能优化**：消息列表支持分页加载，避免一次加载过多数据
4. **用户体验**：消息跳转后自动标记已读，提升用户体验

## 🔗 相关文档

- [小程序消息通知系统设计方案](../../小程序消息通知系统设计方案.md)
- [小程序消息通知系统-快速使用指南](../../小程序消息通知系统-快速使用指南.md)
- [小程序消息通知系统-文档索引](../../小程序消息通知系统-文档索引.md)
- [微信订阅消息官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html)

## ✅ 完成清单

- [x] 消息中心页面
- [x] 消息通知工具类
- [x] 订单创建集成订阅授权
- [x] App.vue全局消息监听
- [x] TabBar徽标更新
- [x] 消息列表分页加载
- [x] 消息已读状态管理
- [x] 消息跳转功能

---

**版本**: v1.0  
**更新日期**: 2024-10-15  
**开发者**: AI Assistant

