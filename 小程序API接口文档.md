# 家政平台小程序 API 接口文档

## 基本信息

- **接口版本**: v1.2.0
- **基础URL**: `http://localhost:38081/mini`
- **认证方式**: JWT Token (Bearer Token)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **最后更新**: 2025-10-13

## 版本更新日志

### v1.3.0 (2024-10-15)
- ✅ **消息通知系统**: 完整的多渠道消息推送功能
- ✅ **站内消息**: 消息列表、统计、已读/未读状态管理
- ✅ **微信订阅消息**: 订阅授权管理和消息推送
- ✅ **智能分级推送**: 根据消息优先级自动选择推送渠道（站内+微信+短信）
- ✅ **8种消息类型**: ORDER、SERVICE、PAYMENT、SETTLEMENT、AUDIT、SYSTEM、ACTIVITY、REFERRAL
- ✅ **消息跳转**: 支持消息点击跳转到相关业务页面
- ✅ **异步推送**: 不阻塞主业务流程

### v1.2.0 (2025-10-13)
- ✅ **订单取消二次确认**: 新增违约金计算接口，支持取消前预览费用
- ✅ **完善取消订单流程**: 新增取消订单新版接口（POST /user/order/cancel）
- ✅ **违约金阶梯规则**: 
  - 待支付/待接单：免费取消
  - 已接单 >4小时：5%违约金 + 扣5积分
  - 已接单 2-4小时：20%违约金 + 扣10积分
  - 已接单 <2小时：不可取消
- ✅ **订单取消记录**: 完整记录取消详情（违约金、退款、责任方、积分扣除）
- ✅ **退款状态查询**: 新增退款记录查询接口
- ✅ **取消记录列表**: 支持查询用户/阿姨的所有取消记录

### v1.1.0 (2025-10-13)
- ✅ 优化评价修改规则：15天内可修改，仅限1次，综合评分不可修改
- ✅ 优化评价删除规则：15天内可删除，改为逻辑删除
- ✅ 新增评价修改记录字段：editCount, editTime, isEdited
- ✅ 新增评价状态：DELETED（已删除）
- ✅ 评价列表自动排除已删除评价
- ✅ 评分统计自动排除已删除评价

### v1.0.0 (2025-10-10)
- ✅ 初始版本发布
- ✅ 完成评价评分体系基础功能
- ✅ 支持订单评价、商品评分、阿姨评分
- ✅ 支持评价标签、图片上传、积分奖励

## 通用响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 通用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 用户端认证 (User Authentication)

### 1.1 微信登录（微信小程序一键登录）
- **接口**: `POST /user/auth/wechat-login`
- **描述**: 用户通过微信授权登录，支持微信小程序一键登录功能，通过微信授权码和手机号授权码获取用户信息并完成登录
- **权限**: 无需认证
- **请求体**: WechatLoginRequest对象
```json
{
  "code": "微信授权码",
  "phoneCode": "手机号授权码",
  "userType": 4
}
```
- **响应**: LoginResponse对象
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "JWT令牌",
    "tokenType": "Bearer",
    "userId": 123456,
    "userType": 4,
    "nickname": "用户12345678",
    "avatar": "头像URL",
    "isFirstLogin": true,
    "authStatus": 1
  }
}
```

**实现特性：**
- 通过微信授权码获取用户的openid和unionid
- 通过手机号授权码获取用户手机号
- 支持新用户自动注册和老用户登录
- 新用户自动创建账号，生成8位随机编号
- 支持多手机号绑定（用逗号分隔）
- 自动更新登录时间和IP地址
- 使用JWT生成访问令牌，Token存储在Redis中，有效期7天

**错误处理：**
- `code参数缺失!`: 缺少微信授权码
- `phoneCode参数缺失!`: 缺少手机号授权码
- `微信登录失败，请重试`: 微信API调用失败
- `手机号信息获取失败`: 手机号解析失败

### 1.2 退出登录
- **接口**: `POST /user/auth/logout`
- **描述**: 用户退出登录
- **权限**: 需要用户登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 成功消息

### 1.3 刷新Token
- **接口**: `POST /user/auth/refresh-token`
- **描述**: 刷新访问令牌
- **权限**: 需要用户登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 新的JWT Token字符串

### 1.4 完善个人信息
- **接口**: `POST /user/auth/complete-profile`
- **描述**: 首次登录完善个人信息
- **权限**: 需要用户登录
- **请求体**: UserProfileUpdateRequest对象
```json
{
  "nickname": "用户昵称",
  "realName": "真实姓名",
  "phone": "手机号",
  "avatar": "头像URL",
  "gender": 1,
  "age": 25,
  "birthday": "1999-01-01",
  "address": "详细地址"
}
```
- **响应**: 成功消息

**实现状态**: ✅ 已完成 - 通过UserAuthController实现

---

## 2. 用户资料管理 (User Profile)

### 2.1 获取用户资料
- **接口**: `GET /user/profile`
- **描述**: 获取当前用户的详细资料
- **权限**: 需要用户登录
- **响应**: UserProfileResponse对象
```json
{
  "id": 123,
  "openid": "wx_openid",
  "nickname": "用户昵称",
  "realName": "真实姓名",
  "phone": "13800138000",
  "avatar": "头像URL",
  "gender": 1,
  "birthday": "1990-01-01",
  "age": 34,
  "address": "详细地址",
  "points": 1000,
  "availablePoints": 800,
  "walletBalance": "299.50",
  "authStatus": 1,
  "status": 1,
  "createTime": "2024-01-01T10:00:00",
  "registerTime": "2024-01-01T10:00:00",
  "lastLoginTime": "2024-01-01T15:30:00",
  "totalOrders": 25,
  "completedOrders": 20,
  "totalSpent": "5000.00"
}
```

### 2.1A 地址列表响应示例
```json
{
  "code": 200,
  "message": "获取地址列表成功",
  "data": [
    {
      "id": 1,
      "name": "张先生",
      "phone": "13800138000",
      "province": "北京市",
      "city": "北京市", 
      "district": "朝阳区",
      "address": "望京街道1号",
      "fullAddress": "北京市北京市朝阳区望京街道1号",
      "longitude": 116.407394,
      "latitude": 39.909211,
      "isDefault": true,
      "createdTime": "2024-01-01T10:00:00",
      "updatedTime": "2024-01-01T10:00:00"
    }
  ]
}
```

### 2.2 更新用户资料
- **接口**: `PUT /user/profile`
- **描述**: 更新用户基本信息
- **权限**: 需要用户登录
- **请求体**: UserProfileUpdateRequest对象
```json
{
  "nickname": "新昵称",
  "realName": "真实姓名",
  "phone": "13800138000",
  "avatar": "头像URL",
  "gender": 1,
  "birthday": "1990-01-01",
  "age": 34,
  "address": "详细地址"
}
```
- **响应**: 成功消息

### 2.3 上传头像
- **接口**: `POST /user/profile/avatar`
- **描述**: 上传用户头像
- **权限**: 需要用户登录
- **请求体**: multipart/form-data
- **参数**: `file` - 头像文件（支持jpg, png格式，大小不超过2MB）
- **响应**: 头像URL字符串

**实现状态**: ✅ 已完成 - 通过UserProfileController实现

---

## 3. 用户地址管理 (User Address)

### 3.1 获取地址列表
- **接口**: `GET /user/address/list`
- **描述**: 获取用户所有地址
- **权限**: 需要用户登录
- **响应**: UserAddressResponse对象数组
```json
{
  "code": 200,
  "message": "获取地址列表成功",
  "data": [
    {
      "id": 1,
      "userId": 123,
      "addressName": "家",
      "name": "张三",
      "phone": "13800138000",
      "provinceId": 110000,
      "provinceName": "北京市",
      "cityId": 110100,
      "cityName": "北京市",
      "cityCode": "110100",
      "districtId": 110101,
      "districtName": "东城区",
      "detailAddress": "王府井大街1号",
      "fullAddress": "北京市北京市东城区王府井大街1号",
      "longitude": 116.407394,
      "latitude": 39.909211,
      "isDefault": true,
      "createdTime": "2024-01-01T00:00:00",
      "updatedTime": "2024-01-01T00:00:00"
    }
  ]
}
```

### 3.2 获取默认地址
- **接口**: `GET /user/address/default`
- **描述**: 获取用户默认地址
- **权限**: 需要用户登录
- **响应**: UserAddressResponse对象

### 3.3 获取地址详情
- **接口**: `GET /user/address/{addressId}`
- **描述**: 根据地址ID获取地址详情
- **权限**: 需要用户登录
- **响应**: UserAddressResponse对象

### 3.4 添加地址
- **接口**: `POST /user/address`
- **描述**: 添加新地址
- **权限**: 需要用户登录
- **请求体**: UserAddressRequest对象
```json
{
  "addressName": "家",
  "name": "张三",
  "phone": "13800138000",
  "provinceId": 110000,
  "provinceName": "北京市",
  "cityId": 110100,
  "cityName": "北京市",
  "cityCode": "110100",
  "districtId": 110101,
  "districtName": "东城区",
  "detailAddress": "王府井大街1号",
  "longitude": 116.407394,
  "latitude": 39.909211,
  "isDefault": false
}
```
- **响应**: UserAddressResponse对象

### 3.5 更新地址
- **接口**: `PUT /user/address/{addressId}`
- **描述**: 更新指定地址
- **权限**: 需要用户登录
- **请求体**: UserAddressRequest对象
- **响应**: UserAddressResponse对象

### 3.6 删除地址
- **接口**: `DELETE /user/address/{addressId}`
- **描述**: 删除指定地址
- **权限**: 需要用户登录
- **响应**: 成功消息

### 3.7 设置默认地址
- **接口**: `POST /user/address/{addressId}/set-default`
- **描述**: 将指定地址设为默认地址
- **权限**: 需要用户登录
- **响应**: 成功消息

### 3.8 根据名称查询地址
- **接口**: `GET /user/address/by-name/{addressName}`
- **描述**: 根据地址名称查询地址
- **权限**: 需要用户登录
- **响应**: UserAddressResponse对象

### 3.9 根据城市查询地址
- **接口**: `GET /user/address/by-city/{cityCode}`
- **描述**: 根据城市编码查询地址列表
- **权限**: 需要用户登录
- **响应**: UserAddressResponse对象数组

### 3.10 查询附近地址
- **接口**: `GET /user/address/nearby`
- **描述**: 根据经纬度查询附近的地址
- **权限**: 需要用户登录
- **参数**:
  - `longitude`: 经度（必填）
  - `latitude`: 纬度（必填）
  - `radius`: 半径，单位公里（必填）
- **响应**: UserAddressResponse对象数组

**字段说明：**
- `addressName`: 地址名称，如"家"、"公司"等，可选
- `provinceId/cityId/districtId`: 地区ID，关联al_dev_region表
- `provinceName/cityName/districtName`: 地区名称
- `cityCode`: 城市编码，用于城市筛选
- `detailAddress`: 详细地址，必填
- `fullAddress`: 完整地址，系统自动生成
- `longitude/latitude`: 经纬度，用于距离计算和地图定位
- `isDefault`: 是否默认地址，每个用户只能有一个默认地址

**业务规则：**
- 用户最多可以添加10个地址
- 每个用户只能有一个默认地址
- 第一个添加的地址自动设为默认地址
- 删除默认地址时，自动将第一个地址设为默认
- 支持地址名称、城市编码、经纬度等多种查询方式

**实现状态**: ✅ 已完成 - 通过UserAddressController实现，包含完整的地址CRUD操作和高级查询功能

---

## 4. 服务类型管理 (Service Types)

### 4.1 获取服务类型列表
- **接口**: `GET /user/service/types`
- **描述**: 获取所有服务类型
- **权限**: 无需认证
- **参数**:
  - `category`: 服务分类筛选（可选）
- **响应**: ServiceTypeResponse对象列表

### 4.2 获取服务类型详情
- **接口**: `GET /user/service/types/{id}`
- **描述**: 获取服务类型详细信息
- **权限**: 无需认证
- **响应**: ServiceTypeResponse对象，包含详细的服务项目和价格信息

### 4.3 获取热门服务
- **接口**: `GET /user/service/hot`
- **描述**: 获取热门服务列表
- **权限**: 无需认证
- **响应**: ServiceTypeResponse对象列表，按热度排序

### 4.4 搜索服务
- **接口**: `GET /user/service/search`
- **描述**: 根据关键词搜索服务
- **权限**: 无需认证
- **参数**:
  - `keyword`: 搜索关键词（必填）
- **响应**: ServiceTypeResponse对象列表，匹配关键词的服务

### 4.5 获取城市价格信息
- **接口**: `GET /user/service/pricing`
- **描述**: 获取指定城市和服务的价格
- **权限**: 无需认证
- **参数**:
  - `cityId`: 城市ID（必填）
  - `serviceTypeId`: 服务类型ID（必填）
- **响应**: 价格信息对象，包含基础价格、计费单位等

**实现状态**: ✅ 已完成 - 通过UserServiceController实现，包含完整的服务类型管理功能

---

## 5. 用户订单管理 (User Orders)

### 5.1 创建订单
- **接口**: `POST /user/order`
- **描述**: 创建新的服务订单
- **权限**: 需要用户登录
- **请求头**: 
  - `Authorization`: Bearer {token}

#### 请求体

```json
{
  "serviceTypeId": 1,
  "addressId": 1,
  "appointmentTime": "2024-01-01T10:00:00",
  "duration": 4,
  "requirements": "服务要求说明",
  "staffId": 123,
  "couponId": 1,
  "usePoints": 100,
  "paymentMethod": 1,
  "estimatedPrice": 200.00
}
```

#### 响应

- **订单创建结果**: 包含订单ID和支付信息

#### 🔐 核验码生成机制

**核验码是在阿姨接单时生成的**，而不是订单创建或支付时生成。具体流程如下：

1. **订单创建** → 订单状态为 `PENDING`（待接单），`verification_code` 为空
2. **用户支付** → 订单状态仍为 `PENDING`，`verification_code` 仍为空
3. **阿姨接单** → 系统自动生成6位数字核验码，订单状态变为 `ACCEPTED`（已接单）

**核验码生成逻辑**:
```java
// 生成6位纯数字核验码
String verificationCode = VerificationCodeUtil.generateOrderVerificationCode();
// 示例: "123456", "789012"

// 更新订单
order.setVerificationCode(verificationCode);
order.setVerificationStatus("UNUSED"); // 未使用
order.setAcceptedTime(LocalDateTime.now()); // 接单时间
```

**核验码通知**:
- 阿姨接单后，系统会通过短信将核验码发送给用户
- 短信内容: "【家加油】您的订单{订单号}已被阿姨{阿姨姓名}接单！服务时间：{时间}，地址：{地址}，核验码：{核验码}（请妥善保管），如有疑问请联系客服。"

**核验码属性**:
- **长度**: 6位纯数字
- **生成方式**: 随机生成（使用 `SecureRandom`）
- **有效期**: 24小时（从接单时间开始计算，可通过配置项 `order.verification_code.expire_hours` 调整）
- **状态**: `UNUSED`（未使用）、`USED`（已使用）、`EXPIRED`（已过期）
- **用途**: 用户在服务开始时向阿姨出示核验码，阿姨验证后确认身份

**核验码状态流转**:
```
UNUSED（未使用）
    ↓ 阿姨验证核验码
USED（已使用）

UNUSED（未使用）
    ↓ 超过24小时
EXPIRED（已过期）
```

### 5.2 获取订单列表
- **接口**: `GET /user/order`
- **描述**: 获取用户订单列表，支持按状态筛选和分页
- **权限**: 需要用户登录
- **请求头**: 
  - `Authorization`: Bearer {token}

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `status` | String | 否 | null | 订单状态筛选（不传则查询全部） |
| `page` | Integer | 否 | 1 | 页码 |
| `size` | Integer | 否 | 10 | 每页大小 |

#### 订单状态枚举

| 状态值 | 描述 | 说明 |
|--------|------|------|
| `PENDING_PAYMENT` | 待支付 | 订单已创建，等待用户支付 |
| `PENDING` | 待接单 | 已支付，等待阿姨接单 |
| `ACCEPTED` | 已接单 | 阿姨已接单，等待服务开始 |
| `STARTED` | 服务中 | 阿姨已开始服务 |
| `COMPLETED` | 已完成 | 服务已完成 |
| `CANCELLED` | 已取消 | 订单已取消 |

#### 响应示例

```json
{
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "records": [
      {
        "id": 123,
        "orderNo": "JY17603580614740855",
        "serviceTypeName": "深度保洁",
        "serviceTime": "2025-10-17T10:00:00",
        "serviceAddress": "广东省广州市天河区新港中路397号",
        "serviceHours": 5,
        "totalAmount": 250.00,
        "status": "PENDING",
        "statusDesc": "待接单",
        "paymentStatus": "PAID",
        "createTime": "2025-10-13T15:30:00",
        "staffInfo": {
          "id": 456,
          "name": "张阿姨",
          "phone": "138****5678",
          "avatar": "https://example.com/avatar.jpg"
        },
        "verificationCode": "123456",
        "verificationStatus": "UNUSED",
        "verificationTime": null,
        "canCancel": true,
        "canConfirm": false,
        "canReview": false,
        "canReorder": false
      },
      {
        "id": 124,
        "orderNo": "JY17603580614740856",
        "serviceTypeName": "日常保洁",
        "serviceTime": "2025-10-18T14:00:00",
        "serviceAddress": "广东省广州市天河区体育西路189号",
        "serviceHours": 3,
        "totalAmount": 150.00,
        "status": "ACCEPTED",
        "statusDesc": "已接单",
        "paymentStatus": "PAID",
        "createTime": "2025-10-13T16:00:00",
        "staffInfo": {
          "id": 457,
          "name": "李阿姨",
          "phone": "139****9999",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "verificationCode": "789012",
        "verificationStatus": "USED",
        "verificationTime": "2025-10-18T13:45:00",
        "canCancel": true,
        "canConfirm": false,
        "canReview": false,
        "canReorder": false
      }
    ],
    "total": 25,
    "current": 1,
    "size": 10,
    "pages": 3,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

#### 响应字段说明

**订单基本信息**:
- `id`: 订单ID
- `orderNo`: 订单编号
- `serviceTypeName`: 服务类型名称
- `serviceTime`: 预约服务时间
- `serviceAddress`: 服务地址
- `serviceHours`: 服务时长（小时）
- `totalAmount`: 订单总金额
- `status`: 订单状态（英文枚举）
- `statusDesc`: 订单状态描述（中文）
- `paymentStatus`: 支付状态
- `createTime`: 订单创建时间

**阿姨信息**（如果已分配阿姨）:
- `staffInfo.id`: 阿姨ID
- `staffInfo.name`: 阿姨姓名
- `staffInfo.phone`: 阿姨手机号（脱敏）
- `staffInfo.avatar`: 阿姨头像

**核验码信息**（如果已生成）:
- `verificationCode`: 6位数字核验码（仅在阿姨接单后生成）
- `verificationStatus`: 核验码状态（UNUSED-未使用, USED-已使用, EXPIRED-已过期）
- `verificationTime`: 核验码使用时间（未使用时为null）

**核验码显示逻辑**:
- 订单状态为 `PENDING`（待接单）或 `PENDING_PAYMENT`（待支付）时，核验码字段不返回
- 订单状态为 `ACCEPTED`（已接单）及以后状态时，返回核验码信息
- 前端可根据核验码是否存在来判断是否显示核验码相关UI

**操作权限标识**:
- `canCancel`: 是否可以取消订单
- `canConfirm`: 是否可以确认完成
- `canReview`: 是否可以评价
- `canReorder`: 是否可以再次预约

**分页信息**:
- `total`: 总记录数
- `current`: 当前页码
- `size`: 每页大小
- `pages`: 总页数
- `hasPrevious`: 是否有上一页
- `hasNext`: 是否有下一页

### 5.3 获取订单详情
- **接口**: `GET /user/order/{id}`
- **描述**: 获取订单详细信息
- **权限**: 需要用户登录
- **响应**: OrderDetailResponse对象，包含完整的订单信息、服务地址、阿姨信息等

### 5.4 🚨 计算取消违约金（二次确认第一步）
- **接口**: `GET /user/order/{id}/cancel-penalty`
- **描述**: 取消订单前必须先调用此接口计算违约金和退款金额，用于展示二次确认弹窗
- **权限**: 需要用户登录
- **路径参数**:
  - `id`: 订单ID
- **响应**: CancelPenaltyResponse对象
```json
{
  "code": 200,
  "message": "计算成功",
  "data": {
    "canCancel": true,
    "timeDiff": 6.50,
    "penaltyRate": 0.05,
    "orderAmount": 220.00,
    "penaltyAmount": 11.00,
    "refundAmount": 209.00,
    "pointsDeduction": -5,
    "tips": "取消订单将扣除5%违约金",
    "warningMessage": "已有阿姨接单，取消会扣除5积分"
  }
}
```

**字段说明**:
- `canCancel`: 是否可以取消（距服务开始<2小时则不可取消）
- `timeDiff`: 距离服务开始时间（小时）
- `penaltyRate`: 违约金率（0-1之间，例如0.05表示5%）
- `orderAmount`: 订单金额
- `penaltyAmount`: 违约金金额（订单金额 × 违约金率）
- `refundAmount`: 退款金额（订单金额 - 违约金）
- `pointsDeduction`: 积分扣除（负数表示扣除）
- `tips`: 提示信息
- `warningMessage`: 风险提示

**违约金规则**:
1. **待支付/待接单状态**: 免费取消，违约金0%，积分扣除0
2. **已接单状态**:
   - 距服务开始 **> 4小时**: 违约金5%，扣除5积分
   - 距服务开始 **2-4小时**: 违约金20%，扣除10积分
   - 距服务开始 **< 2小时**: 不允许取消，扣除20积分（如强制取消）
3. **其他状态**: 不允许取消

**前端实现流程**:
1. 用户点击"取消订单"按钮
2. 调用此接口获取违约金信息
3. 展示二次确认弹窗，显示订单金额、违约金、退款金额、积分扣除
4. 用户确认后，调用5.4B接口提交取消请求

### 5.4A 取消订单（旧版 - 保持兼容）
- **接口**: `PUT /user/order/{id}/cancel`
- **描述**: 取消订单（保持向后兼容的旧版接口）
- **权限**: 需要用户登录
- **参数**:
  - `reason`: 取消原因（必填）
- **响应**: 成功消息
- **⚠️ 建议**: 新前端请使用5.4和5.4B的组合实现二次确认流程

### 5.4B 取消订单（新版 - 推荐使用）
- **接口**: `POST /user/order/cancel`
- **描述**: 取消订单（新版接口，支持完整的取消原因和描述）
- **权限**: 需要用户登录
- **请求体**: OrderCancelRequest对象
```json
{
  "orderId": 123,
  "cancelReason": "USER_NO_NEED",
  "cancelDesc": "临时有事，无法在家接受服务"
}
```
- **响应**: 成功消息
```json
{
  "code": 200,
  "message": "订单取消成功",
  "data": null
}
```

**取消原因类型**:
- `USER_TIME_CONFLICT`: 时间冲突
- `USER_ADDRESS_CHANGE`: 地址变更
- `USER_NO_NEED`: 不再需要
- `USER_WRONG_ORDER`: 下错订单
- `USER_OTHER`: 其他原因

**业务逻辑**:
1. 自动计算违约金并创建取消记录
2. 更新订单状态为已取消
3. 如需退款，自动创建退款记录（状态为PENDING）
4. 如有积分扣除，自动创建积分变动记录
5. 记录详细的取消信息到order_cancellation表

**错误处理**:
- 订单不存在
- 无权操作此订单
- 订单状态不允许取消
- 距服务开始不足2小时（根据违约金计算结果）

### 5.4C 查询订单退款状态
- **接口**: `GET /user/order/{id}/refund`
- **描述**: 获取订单的退款记录和状态
- **权限**: 需要用户登录
- **路径参数**:
  - `id`: 订单ID
- **响应**: OrderRefundResponse对象
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "refundNo": "RF1760358062000",
    "orderNo": "JY17603580614740855",
    "refundAmount": 209.00,
    "status": "PENDING",
    "statusDesc": "退款处理中",
    "applyTime": "2025-10-13T20:21:24",
    "processTime": null,
    "successTime": null,
    "estimatedArrivalTime": "1-7个工作日到账",
    "refundChannel": "原路退回",
    "refundReason": "用户主动取消"
  }
}
```

**退款状态**:
- `PENDING`: 待退款
- `PROCESSING`: 退款处理中
- `SUCCESS`: 退款成功
- `FAILED`: 退款失败

### 5.5 确认服务完成
- **接口**: `PUT /user/order/{id}/confirm`
- **描述**: 确认服务完成（仅限服务中状态）
- **权限**: 需要用户登录
- **响应**: 成功消息，触发阿姨收益结算

### 5.6 评价订单
- **接口**: `POST /user/order/review`
- **描述**: 对完成的订单进行评价
- **权限**: 需要用户登录
- **请求体**: OrderReviewRequest对象
```json
{
  "orderId": 123,
  "rating": 5,
  "score": 5,
  "content": "服务很好",
  "images": ["图片URL1", "图片URL2"],
  "serviceRating": 5,
  "skillRating": 5,
  "punctualityRating": 5
}
```
- **响应**: 成功消息

### 5.7 再次预约
- **接口**: `POST /user/order/{id}/reorder`
- **描述**: 基于历史订单再次预约（仅限已完成的订单）
- **权限**: 需要用户登录
- **响应**: 新订单的创建结果

### 5.8 获取订单取消记录
- **接口**: `GET /user/order/{id}/cancellation`
- **描述**: 获取指定订单的取消详情
- **权限**: 需要用户登录
- **路径参数**:
  - `id`: 订单ID
- **响应**: OrderCancellationResponse对象
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "orderId": 21,
    "orderNo": "JY17603580614740855",
    "cancelBy": "USER",
    "cancelByDesc": "用户",
    "cancelReason": "USER_NO_NEED",
    "cancelDesc": "用户主动取消",
    "cancelTime": "2025-10-13T20:21:24",
    "serviceTime": "2025-10-17T00:00:00",
    "timeDiffHours": 75.63,
    "refundRequired": true,
    "orderAmount": 250.00,
    "refundAmount": 250.00,
    "penaltyAmount": 0.00,
    "penaltyRate": 0.00,
    "refundStatus": "PENDING",
    "refundStatusDesc": "待退款",
    "refundNo": null,
    "responsibleParty": "USER",
    "responsiblePartyDesc": "用户",
    "creditScoreDeduction": 0,
    "createdTime": "2025-10-13T20:21:24"
  }
}
```

**字段说明**:
- `cancelBy`: 取消发起方（USER-用户, STAFF-阿姨, SYSTEM-系统）
- `cancelReason`: 取消原因类型
- `cancelDesc`: 取消原因描述
- `timeDiffHours`: 距离服务时间的小时数
- `refundRequired`: 是否需要退款
- `penaltyAmount`: 违约金金额
- `penaltyRate`: 违约金率（%）
- `refundStatus`: 退款状态（PENDING-待退款, PROCESSING-退款中, SUCCESS-已退款, FAILED-退款失败）
- `responsibleParty`: 责任方（USER-用户, STAFF-阿姨, PLATFORM-平台, NONE-无）
- `creditScoreDeduction`: 信用分扣除

### 5.9 获取我的取消记录列表
- **接口**: `GET /user/order/cancellations`
- **描述**: 获取用户的所有订单取消记录（支持分页）
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的取消记录列表
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "orderId": 21,
        "orderNo": "JY17603580614740855",
        "cancelBy": "USER",
        "cancelByDesc": "用户",
        "cancelReason": "USER_NO_NEED",
        "cancelDesc": "用户主动取消",
        "cancelTime": "2025-10-13T20:21:24",
        "serviceTime": "2025-10-17T00:00:00",
        "timeDiffHours": 75.63,
        "refundRequired": true,
        "orderAmount": 250.00,
        "refundAmount": 250.00,
        "penaltyAmount": 0.00,
        "penaltyRate": 0.00,
        "refundStatus": "PENDING",
        "refundStatusDesc": "待退款",
        "responsibleParty": "USER",
        "responsiblePartyDesc": "用户",
        "creditScoreDeduction": 0,
        "createdTime": "2025-10-13T20:21:24"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 10,
    "pages": 1
  }
}
```

**业务说明**:
- **取消记录作用**: 详细记录每次订单取消的完整信息，包括违约金、退款详情、责任判定等
- **与order表的区别**: 
  - order表: 记录订单核心状态（`cancelled_time`, `cancel_reason`）
  - order_cancellation表: 记录取消的详细业务逻辑和审计信息
- **数据分析**: 支持取消原因统计、用户/阿姨取消率分析、违约金收入统计等

**实现状态**: ✅ 已完成 - 通过UserOrderController实现，包含完整的订单生命周期管理和取消记录查询

---

## 6. 用户钱包管理 (User Wallet)

### 6.1 获取钱包信息
- **接口**: `GET /user/wallet`
- **描述**: 获取用户钱包详细信息
- **权限**: 需要用户登录
- **响应**: 钱包信息对象，包含余额、冻结金额等
- **备注**: 需要实现

### 6.2 充值
- **接口**: `POST /user/wallet/recharge`
- **描述**: 钱包充值
- **权限**: 需要用户登录
- **参数**:
  - `amount`: 充值金额
  - `paymentMethod`: 支付方式（1-微信支付，2-支付宝）
- **响应**: 充值订单信息，包含支付参数
- **备注**: 需要实现

### 6.3 获取交易记录
- **接口**: `GET /user/wallet/transactions`
- **描述**: 获取交易记录
- **权限**: 需要用户登录
- **参数**:
  - `type`: 交易类型筛选（可选）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的交易记录列表
- **备注**: 需要实现

### 6.4 获取余额变动明细
- **接口**: `GET /user/wallet/balance-changes`
- **描述**: 获取余额变动明细
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的余额变动记录

**实现状态**: ✅ 已完成 - 通过UserWalletController实现，包含钱包信息、充值、交易记录等功能

---

## 7. 优惠券管理 (User Coupons)

⚠️ **重要变更**: 优惠券现在只能通过积分兑换获得，不再支持直接领取。

### 7.1 获取优惠券列表
- **接口**: `GET /user/coupon`
- **描述**: 获取用户优惠券列表（通过积分兑换获得的）
- **权限**: 需要用户登录
- **参数**:
  - `status`: 状态筛选（UNUSED-未使用, USED-已使用, EXPIRED-已过期）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 7.2 获取可兑换的优惠券商品
- **接口**: `GET /user/coupon/exchangeable`
- **描述**: 获取可以用积分兑换的优惠券类型商品
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 7.3 使用优惠券
- **接口**: `POST /user/coupon/{userCouponId}/use`
- **描述**: 使用用户的优惠券
- **权限**: 需要用户登录
- **参数**:
  - `orderId`: 订单ID

**实现状态**: ✅ 已完成 - 通过UserCouponController实现，支持积分兑换优惠券和使用优惠券功能

---

## 7A. 新用户奖励 (New User Rewards)

### 7A.1 检查新用户奖励状态
- **接口**: `GET /user/reward/new-user/check`
- **描述**: 检查当前用户的新用户奖励状态
- **权限**: 需要用户登录
- **响应**: 包含新用户状态和奖励领取情况
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "isNewUser": true,
    "hasReceived": false,
    "canClaim": true
  }
}
```

**响应字段说明**:
- `isNewUser`: boolean - 是否为新用户
- `hasReceived`: boolean - 是否已经获得过新用户奖励
- `canClaim`: boolean - 是否可以领取奖励（新用户且未获得过奖励）

### 7A.2 手动领取新用户奖励
- **接口**: `POST /user/reward/new-user/claim`
- **描述**: 手动领取新用户奖励（通常在注册时自动发放）
- **权限**: 需要用户登录
- **响应**: 成功消息
```json
{
  "code": 200,
  "message": "新用户奖励领取成功",
  "data": null
}
```

**新用户奖励机制说明：**
- **自动发放**: 用户首次注册时系统自动异步发放新用户奖励
- **奖励内容**: 默认200积分（可通过system_config配置调整）
- **配置键**: `user.new_user_reward_points` - 新用户注册奖励积分数量
- **新用户标识**: 用户保持新用户状态，is_new字段不会因为领取奖励而改变
- **手动领取**: 如果自动发放失败，用户可通过手动领取接口获得奖励
- **防重复机制**: 系统通过检查积分记录来判断是否已发放过新用户奖励，避免重复发放

**实现状态**: ✅ 已完成 - 通过UserRewardController和NewUserRewardService实现，包含自动发放和手动领取功能

---

## 8. 积分管理 (User Points)

### 8.1 获取积分信息
- **接口**: `GET /user/points`
- **描述**: 获取用户积分信息
- **权限**: 需要用户登录

### 8.2 获取积分记录
- **接口**: `GET /user/points/records`
- **描述**: 获取积分变动记录
- **权限**: 需要用户登录
- **参数**:
  - `type`: 积分类型筛选（可选）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8.3 获取兑换商品列表
- **接口**: `GET /user/points/exchange/products`
- **描述**: 获取可兑换的商品列表
- **权限**: 需要用户登录
- **参数**:
  - `category`: 商品分类筛选（可选）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8.4 积分兑换
- **接口**: `POST /user/points/exchange`
- **描述**: 使用积分兑换商品（包括优惠券、实物商品、服务券等）
- **权限**: 需要用户登录
- **参数**:
  - `productId`: 商品ID
  - `quantity`: 兑换数量
- **说明**: 兑换优惠券类型商品时会自动发放到用户优惠券列表

### 8.5 获取兑换记录
- **接口**: `GET /user/points/exchange/records`
- **描述**: 获取积分兑换记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8.6 每日签到
- **接口**: `POST /user/points/checkin`
- **描述**: 每日签到获取积分
- **权限**: 需要用户登录

### 8.7 获取兑换商品分类
- **接口**: `GET /user/points/exchange/categories`
- **描述**: 获取积分商品分类列表
- **权限**: 需要用户登录
- **响应**: 商品分类列表

### 8.8 获取签到记录
- **接口**: `GET /user/points/checkin/records`
- **描述**: 获取用户签到记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8.9 获取积分规则
- **接口**: `GET /user/points/rules`
- **描述**: 获取积分获取规则说明
- **权限**: 需要用户登录
- **响应**: 积分规则配置信息

### 8.10 获取积分统计
- **接口**: `GET /user/points/statistics`
- **描述**: 获取用户积分统计信息
- **权限**: 需要用户登录
- **响应**: 包含今日、本月、总计等统计数据

### 8.11 检查兑换限制
- **接口**: `GET /user/points/exchange/check-limit`
- **描述**: 检查用户对指定商品的兑换限制
- **权限**: 需要用户登录
- **参数**:
  - `productId`: 商品ID
- **响应**: 兑换限制信息

### 8.12 预览兑换
- **接口**: `POST /user/points/exchange/preview`
- **描述**: 预览积分兑换，不实际执行
- **权限**: 需要用户登录
- **参数**:
  - `productId`: 商品ID
  - `quantity`: 兑换数量，默认1
- **响应**: 兑换预览信息，包含所需积分、获得物品等

**实现状态**: ✅ 已完成 - 通过UserPointsController实现，包含完整的积分体系：获取积分信息、积分记录、兑换商品、每日签到、积分规则、统计信息等12个核心功能

---

## 8A. 用户会员体系 (User Membership)

### 8A.1 获取会员信息
- **接口**: `GET /user/membership`
- **描述**: 获取当前用户的会员信息
- **权限**: 需要用户登录
- **响应**: 用户会员信息，包含等级、权益、升级进度等
```json
{
  "levelCode": "SILVER",
  "levelName": "白银会员",
  "totalPoints": 1200,
  "totalOrders": 8,
  "totalAmount": 800.00,
  "currentLevelBenefits": {
    "discountRate": 0.05,
    "pointsMultiplier": 1.2,
    "freeCancellations": 2
  },
  "upgradeProgress": {
    "pointsProgress": 80,
    "ordersProgress": 60,
    "amountProgress": 75,
    "overallProgress": 60
  },
  "nextLevel": {
    "levelCode": "GOLD",
    "levelName": "黄金会员",
    "requiredPoints": 1500,
    "requiredOrders": 15,
    "requiredAmount": 1500.00
  }
}
```

### 8A.2 获取所有会员等级
- **接口**: `GET /user/membership/levels`
- **描述**: 获取所有会员等级配置
- **权限**: 需要用户登录
- **响应**: 会员等级列表，包含各等级权益详情

### 8A.3 获取会员权益
- **接口**: `GET /user/membership/benefits`
- **描述**: 获取指定等级的会员权益详情
- **权限**: 需要用户登录
- **参数**:
  - `levelCode`: 等级代码（可选，默认当前等级）
- **响应**: 会员权益详情

### 8A.4 获取升级记录
- **接口**: `GET /user/membership/upgrade-records`
- **描述**: 获取用户会员升级历史记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8A.5 获取权益使用记录
- **接口**: `GET /user/membership/benefit-usage`
- **描述**: 获取用户会员权益使用记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 8A.6 使用会员权益
- **接口**: `POST /user/membership/use-benefit`
- **描述**: 使用指定的会员权益
- **权限**: 需要用户登录
- **参数**:
  - `benefitType`: 权益类型
  - `orderId`: 订单ID（可选）

### 8A.7 检查会员权益
- **接口**: `GET /user/membership/check-benefit`
- **描述**: 检查用户是否享有某项会员权益
- **权限**: 需要用户登录
- **参数**:
  - `benefitType`: 权益类型
- **响应**: 权益可用性信息

### 8A.8 获取会员折扣
- **接口**: `GET /user/membership/discount`
- **描述**: 获取用户当前的会员折扣率
- **权限**: 需要用户登录
- **响应**: 折扣率信息

### 8A.9 获取积分倍率
- **接口**: `GET /user/membership/points-multiplier`
- **描述**: 获取用户当前的积分获取倍率
- **权限**: 需要用户登录
- **响应**: 积分倍率信息

### 8A.10 升级到付费会员
- **接口**: `POST /user/membership/upgrade-paid`
- **描述**: 用户升级到付费会员
- **权限**: 需要用户登录
- **参数**:
  - `paidLevel`: 付费等级
  - `months`: 购买月数

### 8A.11 检查付费会员状态
- **接口**: `GET /user/membership/paid-status`
- **描述**: 检查用户付费会员状态
- **权限**: 需要用户登录
- **响应**: 付费会员状态信息

### 8A.12 获取升级进度
- **接口**: `GET /user/membership/upgrade-progress`
- **描述**: 获取用户会员升级进度
- **权限**: 需要用户登录
- **响应**: 升级进度详情

### 8A.13 获取会员统计
- **接口**: `GET /user/membership/statistics`
- **描述**: 获取用户会员相关统计信息
- **权限**: 需要用户登录
- **响应**: 会员统计数据

### 8A.14 重新计算会员等级
- **接口**: `POST /user/membership/recalculate`
- **描述**: 触发重新计算用户会员等级
- **权限**: 需要用户登录

**实现状态**: ✅ 已完成 - 通过UserMembershipController实现，包含完整的会员体系：会员等级、权益管理、升级进度、付费会员、折扣率、积分倍率等14个核心功能

---

## 9. 阿姨端认证 (Staff Authentication)

### 9.1 微信登录（微信小程序一键登录）
- **接口**: `POST /staff/auth/wechat-login`
- **描述**: 阿姨通过微信授权登录，支持微信小程序一键登录功能，通过微信授权码和手机号授权码获取用户信息并完成登录
- **权限**: 无需认证
- **请求体**: WechatLoginRequest对象
```json
{
  "code": "微信授权码",
  "phoneCode": "手机号授权码",
  "userType": 3
}
```
- **响应**: LoginResponse对象（userType为3）
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "JWT令牌",
    "tokenType": "Bearer",
    "userId": 123456,
    "userType": 3,
    "nickname": "员工12345678",
    "avatar": "头像URL",
    "isFirstLogin": true,
    "authStatus": 0
  }
}
```

**实现特性：**
- 通过微信授权码获取用户的openid和unionid
- 通过手机号授权码获取用户手机号
- 支持新用户自动注册和老用户登录
- 新用户自动创建账号，生成8位随机编号
- 支持多手机号绑定（用逗号分隔）
- 自动更新登录时间和IP地址
- 使用JWT生成访问令牌，Token存储在Redis中，有效期7天

**使用流程：**
1. 小程序端调用微信登录API：获取微信授权码（wx.login）和手机号授权码（button open-type="getPhoneNumber"）
2. 发送登录请求：将code和phoneCode发送到后端API
3. 后端处理流程：通过code获取用户openid和unionid，通过phoneCode获取用户手机号，查找或创建用户记录，生成JWT Token并存储到Redis，返回登录响应
4. 后续请求：在请求头中携带Bearer Token，后端通过JWT过滤器验证Token有效性

**错误处理：**
- `code参数缺失!`: 缺少微信授权码
- `phoneCode参数缺失!`: 缺少手机号授权码
- `微信登录失败，请重试`: 微信API调用失败
- `手机号信息获取失败`: 手机号解析失败

### 9.2 退出登录
- **接口**: `POST /staff/auth/logout`
- **描述**: 阿姨退出登录
- **权限**: 需要阿姨登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 成功消息

### 9.3 刷新Token
- **接口**: `POST /staff/auth/refresh-token`
- **描述**: 刷新访问令牌
- **权限**: 需要阿姨登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 新的JWT Token字符串

### 9.4 上传认证资料
- **接口**: `POST /staff/auth/certification`
- **描述**: 阿姨上传身份认证资料，用于实名认证
- **权限**: 需要阿姨登录
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: StaffCertificationRequest对象
```json
{
  "submitId": "unique_submit_id_20241201",
  "name": "张三",
  "birthday": "1990-01-01",
  "gender": 1,
  "regionId": 110000,
  "bornRegionId": 120000,
  "healthPath": "https://example.com/health.jpg",
  "idCardFrontPath": "https://example.com/id_front.jpg",
  "idCardBackPath": "https://example.com/id_back.jpg",
  "avatar": "https://example.com/avatar.jpg"
}
```
- **响应**: 成功消息
```json
{
  "code": 200,
  "message": "认证资料提交成功",
  "data": null
}
```

**字段说明：**
- `submitId`: 提交唯一标识，用于防重复提交
- `name`: 真实姓名
- `gender`: 性别 1-男 2-女
- `birthday`: 生日，格式：yyyy-MM-dd
- `regionId`: 所在地区ID
- `bornRegionId`: 出生地区ID
- `healthPath`: 健康证照片路径
- `idCardFrontPath`: 身份证正面照片路径
- `idCardBackPath`: 身份证背面照片路径
- `avatar`: 头像路径

**错误处理：**
- `请勿重复提交`: submitId重复
- `生日格式错误，请使用yyyy-MM-dd格式`: 生日格式不正确
- `认证资料提交失败`: 其他系统错误

### 9.5 获取认证状态
- **接口**: `GET /staff/auth/certification/status`
- **描述**: 获取当前阿姨的认证状态
- **权限**: 需要阿姨登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 认证状态描述
```json
{
  "code": 200,
  "message": "操作成功",
  "data": "认证中"
}
```

**状态说明：**
- `未认证`: 尚未提交认证资料
- `认证中`: 认证资料已提交，等待审核
- `已认证`: 认证通过
- `认证失败`: 认证被拒绝

### 9.6 获取最新认证记录
- **接口**: `GET /staff/auth/certification/last`
- **描述**: 获取当前阿姨最新的认证申请记录
- **权限**: 需要阿姨登录
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 认证记录详情
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "submitId": "unique_submit_id_20241201",
    "submitterId": 123456,
    "submitterSn": "87654321",
    "submitterName": "staff123",
    "realName": "张三",
    "healthPath": "https://example.com/health.jpg",
    "idCardFrontPath": "https://example.com/id_front.jpg",
    "avatorPath": "https://example.com/avatar.jpg",
    "idCardBackPath": "https://example.com/id_back.jpg",
    "regionId": 110000,
    "bornRegionId": 120000,
    "birthday": "1990-01-01",
    "gender": 1,
    "systemAdminId": null,
    "systemAdminName": null,
    "status": 0,
    "reason": null,
    "createTime": 1701234567,
    "submitTime": 1701234567,
    "approveTime": null
  }
}
```

**状态值说明：**
- `0`: 认证中
- `1`: 认证通过
- `2`: 认证不通过

**实现状态**: ✅ 已完成 - 通过StaffAuthController实现，包含微信登录、退出登录、Token刷新、认证资料上传、认证状态查询等6个核心功能

---

## 10. 阿姨资料管理 (Staff Profile)

### 10.1 获取阿姨资料
- **接口**: `GET /staff/profile`
- **描述**: 获取当前阿姨的详细资料
- **权限**: 需要阿姨登录
- **响应**: StaffProfileResponse对象
```json
{
  "id": 123,
  "openid": "wx_openid",
  "name": "张阿姨",
  "realName": "张三",
  "phone": "13800138000",
  "avatar": "头像URL",
  "gender": 2,
  "age": 35,
  "hometown": "湖南长沙",
  "address": "北京市朝阳区",
  "idCard": "43010219890101****",
  "idCardFront": "身份证正面照URL",
  "idCardBack": "身份证背面照URL",
  "healthCertificate": "健康证URL",
  "workExperience": "5年家政经验",
  "serviceTypes": ["家庭保洁", "月嫂服务"],
  "skills": ["深度清洁", "婴儿护理"],
  "introduction": "个人简介",
  "certificationStatus": "已认证",
  "rejectReason": null,
  "authStatus": 2,
  "status": 1,
  "registerTime": "2024-01-01T10:00:00",
  "certificationTime": "2024-01-02T15:00:00",
  "totalOrders": 50,
  "completedOrders": 48,
  "averageRating": 4.8,
  "totalEarnings": "15000.00"
}
```

### 11.2 更新阿姨资料
- **接口**: `PUT /staff/profile`
- **描述**: 更新阿姨基本信息
- **权限**: 需要阿姨登录
- **请求体**: StaffProfileUpdateRequest对象
```json
{
  "realName": "张三",
  "avatar": "头像URL",
  "introduction": "个人简介",
  "serviceTypes": ["家庭保洁", "月嫂服务"],
  "skills": ["深度清洁", "婴儿护理"],
  "workExperience": "5年家政经验",
  "idCardFront": "身份证正面照URL",
  "idCardBack": "身份证背面照URL",
  "healthCertificate": "健康证URL",
  "serviceArea": "服务区域",
  "acceptOrder": 1,
  "expectedSalary": "期望薪资",
  "emergencyContactName": "紧急联系人姓名",
  "emergencyContactPhone": "紧急联系人电话"
}
```
- **响应**: 成功消息

### 11.3 上传头像
- **接口**: `POST /staff/profile/avatar`
- **描述**: 上传阿姨头像
- **权限**: 需要阿姨登录
- **请求体**: multipart/form-data
- **参数**: `file` - 头像文件（支持jpg, png格式，大小不超过2MB）
- **响应**: 头像URL字符串

### 11.4 切换接单状态
- **接口**: `PUT /staff/profile/accept-order`
- **描述**: 切换是否接单状态
- **权限**: 需要阿姨登录
- **参数**:
  - `acceptOrder`: 接单状态（1-接单，0-不接单）
- **响应**: 成功消息

### 11.5 获取认证状态
- **接口**: `GET /staff/profile/auth-status`
- **描述**: 获取阿姨认证状态详情
- **权限**: 需要阿姨登录
- **响应**: 认证状态详细信息，包含各项认证材料的审核状态

### 11.6 获取服务评价
- **接口**: `GET /staff/profile/reviews`
- **描述**: 获取收到的服务评价
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的评价列表，包含评分、评价内容、用户信息等

**实现状态**: ✅ 已完成 - 通过StaffProfileController实现，包含获取资料、更新资料、上传头像、切换接单状态、认证状态、服务评价等6个核心功能

---

## 10A. 阿姨地址管理 (Staff Address)

### 10A.1 获取地址信息
- **接口**: `GET /staff/address`
- **描述**: 获取当前阿姨的接单地址信息
- **权限**: 需要阿姨登录
- **响应**: StaffAddressResponse对象
```json
{
  "id": 1,
  "addressName": "家附近",
  "province": {
    "id": 110000,
    "name": "北京市",
    "code": null
  },
  "city": {
    "id": 110100,
    "name": "北京市",
    "code": "110100"
  },
  "district": {
    "id": 110101,
    "name": "东城区",
    "code": null
  },
  "detailAddress": "王府井大街1号",
  "fullAddress": "北京市北京市东城区王府井大街1号",
  "location": {
    "longitude": 116.407394,
    "latitude": 39.909211
  },
  "isActive": true,
  "createdTime": "2024-09-25T10:00:00",
  "updatedTime": "2024-09-25T10:00:00"
}
```

### 10A.2 创建或更新服务地址
- **接口**: `POST /staff/address`
- **描述**: 创建或更新阿姨的接单地址（每个阿姨只能有一个地址）
- **权限**: 需要阿姨登录
- **请求体**: StaffAddressCreateRequest对象
```json
{
  "addressName": "家附近",
  "provinceId": 110000,
  "cityId": 110100,
  "districtId": 110101,
  "detailAddress": "王府井大街1号",
  "longitude": 116.407394,
  "latitude": 39.909211
}
```
- **响应**: StaffAddressResponse对象

### 10A.3 删除服务地址
- **接口**: `DELETE /staff/address`
- **描述**: 删除当前阿姨的接单地址
- **权限**: 需要阿姨登录
- **响应**: 成功消息

### 10A.4 启用/禁用地址
- **接口**: `PUT /staff/address/toggle`
- **描述**: 切换地址的启用状态
- **权限**: 需要阿姨登录
- **响应**: 成功消息

### 10A.5 获取地址详情
- **接口**: `GET /staff/address/detail`
- **描述**: 获取地址详细信息
- **权限**: 需要阿姨登录
- **响应**: StaffAddressResponse对象

**实现状态**: ✅ 已完成 - 通过StaffAddressController实现，包含获取地址、创建或更新地址、删除地址、启用/禁用地址、获取详情等5个核心功能

**特性说明**:
- 每个阿姨只能设置一个接单地址
- 支持省市区三级联动选择
- 集成al_dev_region表获取地区信息
- 支持经纬度位置信息存储
- 自动构建完整地址字符串

---

## 11. 阿姨订单管理 (Staff Orders)

### 11.1 获取可接订单列表
- **接口**: `GET /staff/order/available`
- **描述**: 获取可接订单列表（仅显示PENDING状态的订单）
- **权限**: 需要阿姨登录
- **参数**:
  - `serviceTypeId`: 服务类型ID筛选（可选）
  - `maxDistance`: 最大距离筛选（可选，单位：公里，默认从配置读取）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: AvailableOrderResponse对象列表，包含订单基本信息、服务地址、预估收益、真实距离等
```json
{
  "code": 200,
  "message": "获取可接订单列表成功",
  "data": [
    {
      "id": 123,
      "orderNo": "JY202409260001",
      "serviceTypeName": "日常保洁",
      "serviceTime": "2024-09-26T14:00:00",
      "serviceAddress": "北京市朝阳区望京街道1号",
      "serviceHours": 4,
      "totalPrice": 200.00,
      "staffEarnings": 160.00,
      "requirements": "需要深度清洁",
      "distance": 2.5,
      "createTime": "2024-09-26T10:00:00",
      "userInfo": {
        "nickname": "张先生",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

**实现增强：**
- 支持真实地理位置距离计算（Haversine公式）
- 根据系统配置动态过滤距离范围
- 支持按阿姨等级进行订单优先级排序
- 缓存订单列表提升性能

### 12.2 抢单
- **接口**: `POST /staff/order/accept`
- **描述**: 阿姨抢单操作，系统会自动生成核验码并通知用户
- **权限**: 需要阿姨登录
- **请求头**: 
  - `Authorization`: Bearer {token}

#### 请求体

```json
{
  "orderId": 123,
  "remark": "接单备注",
  "estimatedArrivalTime": 30
}
```

#### 业务逻辑

1. **验证阿姨资格**: 检查阿姨状态为活跃且已认证
2. **验证订单状态**: 订单必须是待接单（PENDING）状态
3. **检查时间冲突**: 验证该时间段阿姨是否有其他订单
4. **生成核验码**: 自动生成6位数字核验码（如：123456）
5. **更新订单**: 
   - 订单状态改为 `ACCEPTED`（已接单）
   - 设置 `verification_code`（核验码）
   - 设置 `verification_status` 为 `UNUSED`（未使用）
   - 记录 `accepted_time`（接单时间）
6. **通知用户**: 通过短信将核验码发送给用户

#### 核验码生成示例

```java
// 抢单时自动执行
String verificationCode = VerificationCodeUtil.generateOrderVerificationCode();
// 生成6位随机数字，例如: "123456", "789012", "456789"

order.setVerificationCode(verificationCode);
order.setVerificationStatus(VerificationStatusEnum.UNUSED.getCode());
order.setAcceptedTime(LocalDateTime.now());
```

#### 用户收到的短信通知

```
【家加油】您的订单JY17603580614740855已被阿姨张阿姨接单！
服务时间：10月17日 10:00
地址：广东省广州市天河区新港中路397号
核验码：123456（请妥善保管）
如有疑问请联系客服。
```

#### 响应

```json
{
  "code": 200,
  "message": "抢单成功"
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "服务时间冲突，请选择其他订单"
}
// 或
{
  "code": 400,
  "message": "订单已被其他阿姨接单"
}
```

#### 核验码用途

- **身份验证**: 用户在服务开始时向阿姨出示核验码
- **安全保障**: 防止冒充阿姨提供服务
- **服务确认**: 阿姨通过验证核验码确认开始服务
- **有效期**: 从接单时间起24小时内有效

### 12.3 获取我的订单列表
- **接口**: `GET /staff/order/my`
- **描述**: 获取阿姨的订单列表
- **权限**: 需要阿姨登录
- **参数**:
  - `status`: 订单状态筛选（可选）- ACCEPTED(已接单), STARTED(服务中), COMPLETED(已完成), CANCELLED(已取消)
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的订单列表，包含订单基本信息和可执行操作

### 12.4 获取订单详情
- **接口**: `GET /staff/order/{id}`
- **描述**: 获取订单详细信息
- **权限**: 需要阿姨登录
- **响应**: OrderDetailResponse对象，包含完整的订单信息、用户信息、服务地址等

### 12.5 开始服务
- **接口**: `PUT /staff/order/{id}/start`
- **描述**: 标记服务开始（仅限已接单状态）
- **权限**: 需要阿姨登录
- **响应**: 成功消息

### 12.6 完成服务
- **接口**: `PUT /staff/order/complete`
- **描述**: 标记服务完成（仅限服务中状态）
- **权限**: 需要阿姨登录
- **请求体**: ServiceCompleteRequest对象
```json
{
  "orderId": 123,
  "summary": "服务总结",
  "completionImages": ["完成照片1", "完成照片2"],
  "actualDuration": 240,
  "extraServiceNote": "额外服务说明"
}
```
- **响应**: 成功消息

### 12.7 取消订单
- **接口**: `PUT /staff/order/{id}/cancel`
- **描述**: 取消订单（仅限已接单状态，且距离服务开始时间超过1小时）
- **权限**: 需要阿姨登录
- **参数**:
  - `reason`: 取消原因（必填）
- **响应**: 成功消息

### 12.8 申请改期
- **接口**: `PUT /staff/order/{id}/reschedule`
- **描述**: 申请订单改期
- **权限**: 需要阿姨登录
- **参数**:
  - `newAppointmentTime`: 新的预约时间
  - `reason`: 改期原因
- **响应**: 成功消息

### 12.9 验证核验码
- **接口**: `POST /staff/order/verify-code`
- **描述**: 验证订单核验码，用于确认服务身份和开始服务
- **权限**: 需要阿姨登录
- **请求头**: 
  - `Authorization`: Bearer {token}

#### 请求体

```json
{
  "orderId": 123,
  "verificationCode": "123456",
  "verifyType": "START_SERVICE"
}
```

#### 字段说明

- `orderId`: 订单ID（必填）
- `verificationCode`: 6位数字核验码（必填）
- `verifyType`: 验证类型（可选）- START_SERVICE(开始服务), COMPLETE_SERVICE(完成服务)

#### 验证逻辑

1. **订单归属验证**: 订单必须是当前阿姨接的单
2. **核验码匹配**: 输入的核验码必须与订单中的一致
3. **状态检查**: 核验码状态必须是 `UNUSED`（未使用）
4. **有效期检查**: 从接单时间起24小时内有效（可配置）
5. **更新状态**: 验证成功后，核验码状态改为 `USED`（已使用）

#### 成功响应

```json
{
  "code": 200,
  "message": "核验码验证成功"
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "核验码不匹配"
}
// 或
{
  "code": 400,
  "message": "核验码已使用"
}
// 或
{
  "code": 400,
  "message": "核验码已过期"
}
// 或
{
  "code": 403,
  "message": "无权验证此订单核验码"
}
```

#### 核验码状态说明

| 状态 | 英文 | 说明 |
|------|------|------|
| 未使用 | UNUSED | 核验码已生成，等待验证 |
| 已使用 | USED | 核验码已验证通过，服务已开始 |
| 已过期 | EXPIRED | 超过24小时未使用，核验码失效 |

#### 业务流程

```
1. 用户下单 → 用户支付
2. 阿姨抢单 → 生成核验码（UNUSED）
3. 用户收到短信（包含核验码）
4. 阿姨到达现场 → 用户出示核验码
5. 阿姨验证核验码 → 状态改为USED
6. 开始服务
```

#### 核验码有效期配置

- **配置项**: `order.verification_code.expire_hours`
- **默认值**: 24小时
- **计算起点**: 从 `accepted_time`（接单时间）开始
- **过期处理**: 超过有效期后自动标记为 `EXPIRED`

#### 代码示例

```java
// 验证核验码
public boolean verifyCode(Long orderId, String verificationCode, String verifyType) {
    // 1. 验证订单归属
    // 2. 验证核验码匹配
    // 3. 检查核验码状态（UNUSED/USED/EXPIRED）
    // 4. 检查有效期（24小时）
    // 5. 验证成功，更新状态为USED
    order.setVerificationStatus("USED");
    order.setVerificationTime(LocalDateTime.now());
    return true;
}
```

### 12.10 获取阿姨订单统计信息
- **接口**: `GET /staff/order/stats`
- **描述**: 获取阿姨端"我的订单"页面统计信息
- **权限**: 需要阿姨登录
- **响应**: StaffOrderStatsResponse对象
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "pendingServiceCount": 3,
    "completedCount": 15,
    "settledCount": 15,
    "totalCount": 18,
    "pendingEarnings": "450.00",
    "settledEarnings": "2250.00",
    "totalEarnings": "2700.00"
  }
}
```

**字段说明：**
- `pendingServiceCount`: 待上钟订单数量（已接单状态）
- `completedCount`: 已完成订单数量
- `settledCount`: 已到账订单数量（当前与已完成相同）
- `totalCount`: 总订单数量
- `pendingEarnings`: 待收益金额
- `settledEarnings`: 已到账金额
- `totalEarnings`: 总收益金额

### 12.11 获取最近订单列表
- **接口**: `GET /staff/order/recent`
- **描述**: 获取阿姨最近的订单列表（首页显示用）
- **权限**: 需要阿姨登录
- **参数**:
  - `limit`: 限制数量，默认3条
- **响应**: 最近订单列表
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 123,
      "orderNo": "JY202409260001",
      "serviceTypeName": "日常保洁",
      "serviceAddress": "北京市朝阳区望京街道1号",
      "serviceTime": "2024-09-26T14:00:00",
      "status": "ACCEPTED",
      "statusDesc": "已接单",
      "totalAmount": "200.00",
      "staffEarnings": "160.00",
      "verificationCode": "123456",
      "createTime": "2024-09-26T10:00:00",
      "userInfo": {
        "nickname": "张先生",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

**业务逻辑：**
- 优先显示待上钟的订单
- 如果没有待上钟的，显示最近已完成的订单
- 按创建时间倒序排列

### 12.12 获取分类订单列表
- **接口**: `GET /staff/order/list`
- **描述**: 根据tab分类获取订单列表（支持分页）
- **权限**: 需要阿姨登录
- **参数**:
  - `tabType`: 分类类型，默认PENDING_SERVICE
    - `PENDING_SERVICE`: 待上钟（已接单状态）
    - `COMPLETED`: 已完成
    - `SETTLED`: 已到账（当前与已完成相同）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页订单列表
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 123,
        "orderNo": "JY202409260001",
        "serviceTypeName": "日常保洁",
        "serviceAddress": "北京市朝阳区望京街道1号",
        "serviceTime": "2024-09-26T14:00:00",
        "status": "ACCEPTED",
        "statusDesc": "已接单",
        "totalAmount": "200.00",
        "staffEarnings": "160.00",
        "verificationCode": "123456",
        "createTime": "2024-09-26T10:00:00",
        "userInfo": {
          "nickname": "张先生",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "total": 10,
    "page": 1,
    "size": 10,
    "pages": 1
  }
}
```

**Tab分类说明：**
- **待上钟**: 阿姨已接单但尚未开始服务的订单
- **已完成**: 服务已完成的订单
- **已到账**: 收益已到账的订单（当前与已完成相同，后续可根据财务流程调整）

**实现状态**: ✅ 已完成 - 通过StaffOrderController实现，包含获取可接订单、抢单、我的订单、订单详情、开始服务、完成服务、取消订单、申请改期、验证核验码、订单统计、最近订单、分类订单列表等12个核心功能

### 11.9 阿姨首页接单数据（新增）
- **接口**: `GET /staff/home/orders`
- **描述**: 根据右上角地址位置获取附近5km的订单列表（距离从system_config配置读取）
- **权限**: 需要阿姨登录
- **参数**:
  - `longitude`: 经度（必填）
  - `latitude`: 纬度（必填）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 首页接单数据，包含订单列表和分页信息
```json
{
  "code": 200,
  "message": "获取首页数据成功",
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNo": "JY202409260001",
        "serviceTypeName": "日常保洁",
        "serviceTime": "2024-09-26T14:00:00",
        "serviceAddress": "北京市朝阳区望京街道",
        "distance": 2.5,
        "totalPrice": 150.00,
        "staffEarnings": 120.00,
        "duration": 3,
        "priority": "normal",
        "userInfo": {
          "nickname": "张先生",
          "avatar": "avatar_url"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 11.10 获取开通城市列表（新增）
- **接口**: `GET /staff/home/cities/available`
- **描述**: 获取左上角城市选择器的开通城市列表（从system_config配置读取）
- **权限**: 需要阿姨登录
- **响应**: 开通城市列表
```json
{
  "code": 200,
  "message": "获取开通城市列表成功",
  "data": [
    {
      "id": 110100,
      "name": "北京市",
      "isAvailable": true
    },
    {
      "id": 310100,
      "name": "上海市",
      "isAvailable": true
    },
    {
      "id": 440100,
      "name": "广州市",
      "isAvailable": true
    },
    {
      "id": 440300,
      "name": "深圳市",
      "isAvailable": true
    }
  ]
}
```

### 11.11 获取默认城市（新增）
- **接口**: `GET /staff/home/cities/default`
- **描述**: 获取左上角默认显示的城市（从system_config配置读取，默认上海）
- **权限**: 需要阿姨登录
- **响应**: 默认城市信息
```json
{
  "code": 200,
  "message": "获取默认城市成功",
  "data": {
    "id": 310100,
    "name": "上海市",
    "isAvailable": true
  }
}
```

**重要说明 - 新的业务逻辑**:

🎯 **核心逻辑**:
1. **左上角城市选择**: 显示开通城市列表，默认选中上海，仅用于展示
2. **右上角地址选择**: 阿姨当前位置，可手动选择，用于订单距离计算
3. **订单列表**: 基于右上角地址位置的附近5km订单（可配置）
4. **地址城市不一致提醒**: 前端检测右上角地址城市与左上角选择城市不一致时进行提醒

🔧 **System Config配置项**:
- `staff.available_cities`: 开通城市ID列表，逗号分隔
- `staff.default_city`: 默认显示城市ID
- `staff.order.max_distance`: 订单搜索最大距离（公里）

### 11.12 批量获取首页配置（新增）
- **接口**: `GET /staff/home/config`
- **描述**: 一次性获取首页需要的所有系统配置，减少请求次数
- **权限**: 需要阿姨登录
- **响应**: 配置键值对映射
```json
{
  "code": 200,
  "message": "获取首页配置成功",
  "data": {
    "staff.order.max_distance": "5",
    "staff.available_cities": "110100,310100,440100,440300",
    "staff.default_city": "310100",
    "staff.order.enable_geo_calculation": "true",
    "app_version": "1.0.0",
    "service_phone": "400-123-4567"
  }
}
```

### 11.13 自定义批量获取配置（新增）
- **接口**: `POST /staff/home/config/batch`
- **描述**: 根据指定的配置键列表批量获取配置值
- **权限**: 需要阿姨登录
- **参数**: 配置键列表
```json
[
  "staff.order.max_distance",
  "staff.available_cities",
  "custom.config.key"
]
```
- **响应**: 配置键值对映射
```json
{
  "code": 200,
  "message": "批量获取配置成功",
  "data": {
    "staff.order.max_distance": "5",
    "staff.available_cities": "110100,310100,440100,440300",
    "custom.config.key": "default_value"
  }
}
```

## 📱 阿姨端首页完整调用示例

### 🎯 页面初始化流程

```javascript
// 1. 一次性获取所有首页配置（推荐方式）
async function initHomePage() {
  try {
    // 批量获取配置，减少请求次数
    const configResponse = await fetch('/mini/staff/home/config', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type': 'application/json'
      }
    });
    
    const configData = await configResponse.json();
    const config = configData.data;
    
    console.log('首页配置:', config);
    /*
    {
      "staff.order.max_distance": "5",
      "staff.available_cities": "110100,310100,440100,440300", 
      "staff.default_city": "310100",
      "staff.order.enable_geo_calculation": "true",
      "app_version": "1.0.0",
      "service_phone": "400-123-4567"
    }
    */
    
    // 解析配置
    const maxDistance = parseFloat(config['staff.order.max_distance']);
    const availableCityIds = config['staff.available_cities'].split(',').map(id => parseInt(id.trim()));
    const defaultCityId = parseInt(config['staff.default_city']);
    const enableGeoCalculation = config['staff.order.enable_geo_calculation'] === 'true';
    
    // 2. 获取开通城市详细信息
    const citiesResponse = await fetch('/mini/staff/home/cities/available', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type': 'application/json'
      }
    });
    
    const citiesData = await citiesResponse.json();
    console.log('开通城市列表:', citiesData.data);
    /*
    [
      { "id": 110100, "name": "北京市", "isAvailable": true },
      { "id": 310100, "name": "上海市", "isAvailable": true },
      { "id": 440100, "name": "广州市", "isAvailable": true },
      { "id": 440300, "name": "深圳市", "isAvailable": true }
    ]
    */
    
    // 3. 设置左上角城市选择器
    const defaultCity = citiesData.data.find(city => city.id === defaultCityId);
    setupCitySelector(citiesData.data, defaultCity);
    
    // 4. 获取当前定位
    const location = await getCurrentLocation();
    console.log('当前位置:', location);
    // { longitude: "121.473701", latitude: "31.230416" }
    
    // 5. 检查地址城市与选择城市是否一致
    const addressCity = await getCityByLocation(location);
    if (addressCity.id !== defaultCityId) {
      showLocationWarning(defaultCity, addressCity);
    }
    
    // 6. 获取订单列表
    await loadOrderList(location.longitude, location.latitude, 1, 10);
    
  } catch (error) {
    console.error('初始化首页失败:', error);
    showErrorMessage('页面初始化失败，请重试');
  }
}

// 获取订单列表
async function loadOrderList(longitude, latitude, page = 1, size = 10) {
  try {
    const response = await fetch(`/mini/staff/home/orders?longitude=${longitude}&latitude=${latitude}&page=${page}&size=${size}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('订单列表:', data.data);
    /*
    {
      "orders": [
        {
          "id": 123,
          "orderNo": "JY202409260001",
          "serviceTypeName": "日常保洁",
          "serviceTime": "2024-09-26T14:00:00",
          "serviceAddress": "上海市浦东新区陆家嘴街道",
          "distance": 2.5,
          "totalPrice": 150.00,
          "staffEarnings": 120.00,
          "duration": 3,
          "priority": "normal",
          "userInfo": {
            "nickname": "张先生",
            "avatar": "https://example.com/avatar.jpg"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "size": 10,
        "total": 25,
        "pages": 3
      }
    }
    */
    
    // 渲染订单列表
    renderOrderList(data.data.orders);
    renderPagination(data.data.pagination);
    
  } catch (error) {
    console.error('获取订单列表失败:', error);
    showErrorMessage('获取订单列表失败，请重试');
  }
}

// 地址城市不一致警告
function showLocationWarning(selectedCity, currentCity) {
  const message = `您选择的城市是${selectedCity.name}，但当前位置在${currentCity.name}。订单列表将显示${currentCity.name}附近的订单。`;
  
  showDialog({
    title: '位置提醒',
    message: message,
    buttons: [
      {
        text: '知道了',
        action: () => {
          // 继续使用当前位置
        }
      },
      {
        text: '切换到' + currentCity.name,
        action: () => {
          // 切换城市选择器到当前城市
          switchCitySelector(currentCity.id);
        }
      }
    ]
  });
}

// 获取当前定位
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            longitude: position.coords.longitude.toString(),
            latitude: position.coords.latitude.toString()
          });
        },
        error => {
          console.error('定位失败:', error);
          // 使用默认位置（上海市中心）
          resolve({
            longitude: "121.473701",
            latitude: "31.230416"
          });
        }
      );
    } else {
      // 浏览器不支持定位，使用默认位置
      resolve({
        longitude: "121.473701",
        latitude: "31.230416"
      });
    }
  });
}

// 根据经纬度获取城市信息（调用第三方API或后端接口）
async function getCityByLocation(location) {
  try {
    const response = await fetch('/mini/region/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lng: location.longitude,
        lat: location.latitude
      })
    });
    
    const data = await response.json();
    return {
      id: data.data.id,
      name: data.data.name
    };
  } catch (error) {
    console.error('获取城市信息失败:', error);
    // 返回默认城市
    return { id: 310100, name: "上海市" };
  }
}
```

### 🔄 用户交互流程

```javascript
// 城市切换
async function onCityChange(newCityId) {
  console.log('切换城市:', newCityId);
  
  // 获取当前位置
  const location = await getCurrentLocation();
  
  // 检查新选择的城市与当前位置是否一致
  const addressCity = await getCityByLocation(location);
  const selectedCity = getCityById(newCityId);
  
  if (addressCity.id !== newCityId) {
    showLocationWarning(selectedCity, addressCity);
  }
  
  // 重新加载订单列表（基于位置，不是基于城市选择）
  await loadOrderList(location.longitude, location.latitude, 1, 10);
}

// 地址位置变更
async function onLocationChange(newLocation) {
  console.log('位置变更:', newLocation);
  
  // 重新加载订单列表
  await loadOrderList(newLocation.longitude, newLocation.latitude, 1, 10);
  
  // 检查新位置与选择城市是否一致
  const addressCity = await getCityByLocation(newLocation);
  const selectedCityId = getCurrentSelectedCityId();
  const selectedCity = getCityById(selectedCityId);
  
  if (addressCity.id !== selectedCityId) {
    showLocationWarning(selectedCity, addressCity);
  }
}

// 分页加载
async function onPageChange(page) {
  const location = getCurrentLocation();
  await loadOrderList(location.longitude, location.latitude, page, 10);
}

// 下拉刷新
async function onRefresh() {
  const location = await getCurrentLocation();
  await loadOrderList(location.longitude, location.latitude, 1, 10);
}
```

**实现状态**: ✅ 已完成 - 基于地址位置的阿姨首页接单功能，支持批量配置获取和完整的前端调用示例

---

## 12. 阿姨钱包管理 (Staff Wallet)

### 12.1 获取钱包信息
- **接口**: `GET /staff/wallet`
- **描述**: 获取阿姨钱包详细信息，包含余额、收入统计、信誉评分等
- **权限**: 需要阿姨登录
- **响应**: StaffWalletResponse对象
```json
{
  "balance": 1500.50,
  "frozenAmount": 0.00,
  "totalEarnings": 25000.00,
  "totalWithdraw": 8000.00,
  "incomeStatistics": {
    "salaryIncome": 12000.00,
    "orderIncome": 10000.00,
    "staffReferralIncome": 2000.00,
    "customerReferralIncome": 1000.00,
    "penaltyAmount": 100.00,
    "monthlyIncome": 2500.00,
    "dailyIncome": 150.00
  },
  "creditScore": 785,
  "bankCardCount": 2,
  "updatedTime": "2024-09-25T10:00:00"
}
```

### 12.2 获取收入明细
- **接口**: `GET /staff/wallet/income-details`
- **描述**: 获取详细收入记录，包括工资、接单、推荐等各类收入
- **权限**: 需要阿姨登录
- **参数**:
  - `incomeType`: 收入类型筛选（可选）- SALARY(工资), ORDER(接单), STAFF_REFERRAL(推荐阿姨), CUSTOMER_REFERRAL(推荐客户)
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的收入明细列表
```json
{
  "records": [
    {
      "id": 1,
      "incomeType": "ORDER",
      "incomeTypeDesc": "接单收入",
      "amount": 150.00,
      "orderNo": "JY202409250001",
      "orderId": 123,
      "description": "订单服务收入",
      "status": "SUCCESS",
      "statusDesc": "已到账",
      "paidTime": "2024-09-25T10:00:00",
      "createdTime": "2024-09-25T08:00:00"
    }
  ],
  "total": 50,
  "page": 1,
  "size": 10,
  "pages": 5
}
```

### 12.3 获取收入统计
- **接口**: `GET /staff/wallet/income-statistics`
- **描述**: 获取收入统计信息
- **权限**: 需要阿姨登录
- **参数**:
  - `period`: 统计周期（可选）- today(今日), week(本周), month(本月), year(本年), all(全部)，默认month
- **响应**: 收入统计对象

### 12.4 获取信誉评分
- **接口**: `GET /staff/wallet/credit-score`
- **描述**: 获取当前信誉评分，基于服务质量、完成率、投诉率等综合计算
- **权限**: 需要阿姨登录
- **响应**: 信誉评分（300-950分）
- **算法说明**: 
  - 基础分数：600分
  - 服务评分权重：30%（评分*100*0.3）
  - 完成率权重：25%（完成率*0.25）
  - 投诉率权重：20%（负向，投诉率*0.2）
  - 订单量权重：15%（订单数*2，最高100分*0.15）
  - 经验权重：10%（固定50分*0.1）
```json
{
  "code": 200,
  "message": "获取成功",
  "data": 785
}
```

### 12.5 获取银行卡列表
- **接口**: `GET /staff/wallet/bank-cards`
- **描述**: 获取绑定的银行卡列表
- **权限**: 需要阿姨登录
- **响应**: 银行卡列表
```json
[
  {
    "id": 1,
    "cardNumber": "6217****1234",
    "cardHolderName": "张三",
    "bankName": "中国工商银行",
    "bankCode": "ICBC",
    "branchName": "北京朝阳支行",
    "cardType": "DEBIT",
    "cardTypeDesc": "储蓄卡",
    "isDefault": true,
    "status": "ACTIVE",
    "statusDesc": "正常",
    "createdTime": "2024-09-25T10:00:00"
  }
]
```

### 12.6 添加银行卡
- **接口**: `POST /staff/wallet/bank-cards`
- **描述**: 添加银行卡
- **权限**: 需要阿姨登录
- **请求体**: StaffBankCardCreateRequest对象
```json
{
  "cardNumber": "6217000012341234",
  "cardHolderName": "张三",
  "bankName": "中国工商银行",
  "bankCode": "ICBC",
  "branchName": "北京朝阳支行",
  "cardType": "DEBIT",
  "isDefault": false
}
```
- **响应**: 银行卡信息

### 12.7 删除银行卡
- **接口**: `DELETE /staff/wallet/bank-cards/{bankCardId}`
- **描述**: 删除银行卡
- **权限**: 需要阿姨登录
- **响应**: 成功消息

### 12.8 设置默认银行卡
- **接口**: `PUT /staff/wallet/bank-cards/{bankCardId}/default`
- **描述**: 设置默认银行卡
- **权限**: 需要阿姨登录
- **响应**: 成功消息

### 12.9 获取提现方式
- **接口**: `GET /staff/wallet/withdraw-methods`
- **描述**: 获取可用的提现方式列表，包含微信零钱、支付宝余额、银行卡三种方式
- **权限**: 需要阿姨登录
- **响应**: 提现方式和银行卡信息
```json
{
  "availableMethods": [
    {
      "methodCode": "WECHAT",
      "methodName": "微信零钱", 
      "description": "直接转到微信零钱包，秒到账",
      "feeRate": 0.006,
      "minAmount": 1.00,
      "maxAmount": 20000.00,
      "arrivalTime": "实时到账",
      "enabled": true,
      "iconUrl": "https://example.com/wechat.png",
      "recommendLevel": 5
    },
    {
      "methodCode": "ALIPAY",
      "methodName": "支付宝余额",
      "description": "转到支付宝余额，费率最低", 
      "feeRate": 0.001,
      "minAmount": 1.00,
      "maxAmount": 100000.00,
      "arrivalTime": "2小时内到账",
      "enabled": true,
      "iconUrl": "https://example.com/alipay.png",
      "recommendLevel": 4
    },
    {
      "methodCode": "BANK_CARD",
      "methodName": "银行卡",
      "description": "直接转到银行卡，支持大额提现",
      "feeRate": 0.003,
      "minAmount": 10.00,
      "maxAmount": 500000.00,
      "arrivalTime": "1-3个工作日",
      "enabled": true,
      "iconUrl": "https://example.com/bank.png",
      "recommendLevel": 3
    }
  ],
  "bankCards": [
    {
      "id": 1,
      "cardNumber": "6217****1234",
      "bankName": "中国工商银行",
      "isDefault": true
    }
  ]
}
```

### 12.10 申请提现
- **接口**: `POST /staff/wallet/withdraw`
- **描述**: 申请提现，支持三种提现方式：微信零钱、支付宝余额、银行卡
- **权限**: 需要阿姨登录
- **请求体**: StaffWithdrawRequest对象
```json
{
  "amount": 500.00,
  "withdrawMethod": "WECHAT",
  "bankCardId": 1,
  "wechatOpenId": "wx_user_openid_123",
  "alipayAccount": "13800138000", 
  "alipayRealName": "张三",
  "remark": "提现备注"
}
```
- **字段说明**:
  - `withdrawMethod`: 提现方式，WECHAT-微信零钱, ALIPAY-支付宝, BANK_CARD-银行卡
  - `bankCardId`: 银行卡ID（选择BANK_CARD时必填）
  - `wechatOpenId`: 微信OpenID（选择WECHAT时必填，可从登录信息获取）
  - `alipayAccount`: 支付宝账号（选择ALIPAY时必填）
  - `alipayRealName`: 支付宝真实姓名（选择ALIPAY时必填）
- **响应**: 提现记录信息
```json
{
  "id": 1,
  "withdrawNo": "WD1727234567890",
  "amount": 500.00,
  "fee": 5.00,
  "actualAmount": 495.00,
  "bankCardInfo": "中国工商银行 6217****1234",
  "cardNumber": "6217****1234",
  "bankName": "中国工商银行",
  "status": "PENDING",
  "statusDesc": "处理中",
  "createdTime": "2024-09-25T10:00:00",
  "remark": "提现备注"
}
```

**处理流程**:
1. **同步验证**: 验证余额、银行卡信息、提现限额等
2. **余额扣减**: 立即从钱包扣减提现金额
3. **异步处理**: 后台异步调用银行接口处理提现
4. **状态更新**: 根据银行处理结果更新提现状态
5. **失败处理**: 提现失败时自动退回余额到钱包

**状态说明**:
- `PENDING`: 处理中，已扣减余额，等待银行处理
- `PROCESSING`: 已提交到银行，等待最终结果
- `SUCCESS`: 提现成功，资金已到账
- `FAILED`: 提现失败，余额已退回钱包

**支持的提现渠道**:
- 微信企业付款 (费率0.6%, 2小时内到账)
- 支付宝转账 (费率0.1%, 2小时内到账)  
- 银联代付 (费率0.3%, 1个工作日到账)
- 连连支付 (费率0.2%, 实时到账)

### 12.11 获取提现记录
- **接口**: `GET /staff/wallet/withdraw-records`
- **描述**: 获取提现记录列表
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的提现记录列表
```json
{
  "records": [
    {
      "id": 1,
      "withdrawNo": "WD1727234567890",
      "amount": 500.00,
      "fee": 5.00,
      "actualAmount": 495.00,
      "bankCardInfo": "中国工商银行 6217****1234",
      "status": "SUCCESS",
      "statusDesc": "已完成",
      "createdTime": "2024-09-25T10:00:00",
      "processedTime": "2024-09-25T11:00:00",
      "arrivedTime": "2024-09-25T12:00:00"
    }
  ],
  "total": 10,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

**实现状态**: ✅ 已完成 - 通过StaffWalletController和StaffBankCardController实现，包含完整的钱包管理功能：钱包信息、收入明细、收入统计、信誉评分、银行卡管理、多方式提现等14个核心接口

**特性说明**:
- **多种提现方式**: 支持微信零钱、支付宝余额、银行卡三种提现方式选择
- **智能提现推荐**: 根据提现金额智能推荐最优提现方式
- **费率对比透明**: 清晰显示各种提现方式的费率、限额、到账时间
- **用户体验优化**: 微信零钱实时到账，支付宝费率最低，银行卡限额最高
- 支持多种收入类型统计：工资、接单、推荐阿姨、推荐客户收入
- 智能信誉评分计算，采用固定权重算法，计算简单高效
- 完整的银行卡管理，支持多卡绑定和默认卡设置
- 银行卡智能识别和验证，支持Luhn算法校验和银行信息识别
- 安全的提现功能，包含异步处理、手续费计算和状态跟踪
- 多渠道提现支持，包含微信、支付宝、银联、连连支付等主流渠道
- 详细的收入明细记录，支持按类型筛选
- 灵活的统计周期，支持今日、本周、本月、本年等维度
- 微信小程序快速绑卡支持，优化用户体验
- 银行四要素验证预留接口，支持真实银行API集成
- 提现风控机制，包含限额检查、频率控制等安全措施
- 完整的回调处理机制，确保提现状态准确同步

### 12.12 银行卡信息识别
- **接口**: `GET /staff/bank-card/bank-info?cardPrefix={cardPrefix}`
- **描述**: 根据银行卡号前缀识别银行信息
- **权限**: 需要阿姨登录
- **参数**: 
  - `cardPrefix`: 银行卡号前6-8位
- **响应**: 银行信息对象
```json
{
  "code": 200,
  "message": "识别成功",
  "data": {
    "bankName": "中国工商银行",
    "bankCode": "ICBC",
    "logoUrl": "https://example.com/icbc.png"
  }
}
```

### 12.13 银行卡格式验证
- **接口**: `POST /staff/bank-card/validate-format`
- **描述**: 验证银行卡号格式是否正确
- **权限**: 需要阿姨登录
- **参数**: 
  - `cardNumber`: 银行卡号
- **响应**: 验证结果
```json
{
  "code": 200,
  "message": "验证完成",
  "data": true
}
```

### 12.14 快速验证银行卡
- **接口**: `POST /staff/bank-card/quick-validate`
- **描述**: 快速验证银行卡信息（包含格式验证和银行验证）
- **权限**: 需要阿姨登录
- **参数**:
  - `cardNumber`: 银行卡号
  - `cardHolderName`: 持卡人姓名
- **响应**: 详细验证结果
```json
{
  "code": 200,
  "message": "验证完成",
  "data": {
    "valid": true,
    "message": "验证成功",
    "bankName": "中国工商银行",
    "bankCode": "ICBC",
    "cardType": "DEBIT"
  }
}
```

**实现状态**: ✅ 已完成 - 通过StaffBankCardController实现，包含完整的银行卡验证功能

---

## 12C. 银行卡验证服务架构 (Bank Card Validation Architecture)

### 🏗️ 系统架构设计

采用**依赖反转原则**，实现模块间解耦：

```
┌─────────────────────────────────────────┐
│           jiayou-miniprogram-service    │
│  ┌─────────────────────────────────────┐ │
│  │ BankCardThirdPartyValidatorImpl     │ │ ← 具体实现 (依赖Web)
│  │ - RestTemplate                      │ │
│  │ - 聚合数据API                        │ │
│  │ - 易源数据API                        │ │
│  └─────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ implements
┌─────────────────▼───────────────────────┐
│              jiayou-common              │
│  ┌─────────────────────────────────────┐ │
│  │ BankCardThirdPartyValidator         │ │ ← 抽象接口
│  │ (interface)                         │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ BankCardValidationServiceImpl       │ │ ← 核心服务
│  │ - 本地BIN码验证                      │ │
│  │ - 可选注入第三方验证器                │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ BankBinCodeManager                  │ │ ← 本地数据管理
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 🔧 核心组件说明

#### 1. jiayou-common (无Web依赖)
- `BankCardValidationService` - 主要服务接口
- `BankCardThirdPartyValidator` - 第三方验证抽象接口
- `BankBinCodeManager` - 本地BIN码数据管理
- `BankCardValidationServiceImpl` - 核心验证逻辑
- `VerificationStatusEnum` - 验证状态枚举
- `StatusConstants` - 状态常量定义

#### 2. jiayou-miniprogram-service (包含Web实现)
- `BankCardThirdPartyValidatorImpl` - 第三方API具体实现
- 使用`@ConditionalOnProperty`条件注册
- 通过依赖注入提供给common模块

### 📋 银行归属识别方案对比

| 方案 | 响应速度 | 准确性 | 成本 | 维护成本 | 推荐场景 |
|------|---------|--------|------|----------|----------|
| **本地BIN码** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 基础识别 |
| **聚合数据API** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 精准验证 |
| **易源数据API** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 备选方案 |
| **混合方案** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | **推荐** |

### 🎛️ 配置说明

#### 基础配置
```yaml
# 银行卡验证配置
bankcard:
  validation:
    # 是否启用第三方验证 (默认关闭，需要时开启)
    enable-third-party: false
    
    # 第三方验证配置
    third-party:
      # 服务提供商 (JUHE, YIYUAN)
      provider: JUHE
      
      # API密钥 (需要申请)
      api-key: ${BANKCARD_API_KEY:}
      
      # API端点
      endpoint: http://apis.juhe.cn
      
      # 超时配置（毫秒）
      timeout: 5000
```

#### 环境变量配置
```bash
# 开发环境：仅本地验证
export BANKCARD_API_KEY=""

# 生产环境：启用第三方验证
export BANKCARD_API_KEY="your-juhe-api-key"
```

### 🔍 验证流程说明

#### 本地验证流程
1. **格式验证**: 13-19位数字格式检查
2. **Luhn算法**: 标准银行卡号校验算法
3. **BIN码识别**: 根据前4-8位识别银行
4. **卡类型判断**: 储蓄卡/信用卡识别

#### 第三方验证流程 (可选)
1. **三要素验证**: 卡号+姓名+身份证
2. **四要素验证**: 卡号+姓名+身份证+手机号
3. **银行信息查询**: 实时获取银行信息
4. **状态更新**: 动态更新本地BIN码库

### 🛡️ 安全措施

#### 数据安全
- **输入验证**: 严格的参数格式验证
- **敏感信息保护**: 卡号脱敏显示
- **错误信息控制**: 避免泄露系统内部信息

#### 业务安全
- **频率限制**: 防止恶意验证攻击
- **缓存机制**: 减少重复验证请求
- **失败重试**: 网络异常时的重试机制

### 🚀 性能优化

#### 缓存策略
- **BIN码缓存**: 本地内存缓存，启动时预加载
- **验证结果缓存**: 短期缓存验证成功的结果
- **银行信息缓存**: 缓存银行信息，减少查询次数

#### 异步处理
- **非阻塞验证**: 第三方验证失败不影响本地验证
- **后台更新**: 异步更新BIN码库
- **批量处理**: 定时批量更新银行信息

### 📊 监控指标

#### 关键指标
- **验证成功率**: 整体验证成功率
- **响应时间**: 验证接口平均响应时间
- **第三方调用率**: 第三方API调用频率
- **错误分类**: 验证失败原因分类统计

#### 告警机制
- **成功率告警**: 成功率低于95%时告警
- **响应时间告警**: 平均响应时间超过2秒时告警
- **第三方异常**: 第三方API连续失败时告警

**特性说明**:
- **智能银行识别**: 根据银行卡号前缀自动识别银行信息
- **格式验证**: 支持16-19位银行卡号格式验证  
- **Luhn算法校验**: 标准银行卡号校验算法验证
- **四要素验证**: 预留真实银行API验证接口（银行卡号、持卡人姓名、身份证号、手机号）
- **微信小程序优化**: 针对微信小程序用户体验优化，无需身份证验证
- **银行信息自动填充**: 验证成功后自动返回银行名称、银行编码、卡类型等信息

**支持的银行**:
- 中国工商银行 (ICBC) - 6217**, 6222**
- 中国农业银行 (ABC) - 6228**, 6230**  
- 中国建设银行 (CCB) - 6225**, 6227**
- 中国银行 (BOC) - 6212**, 6216**
- 招商银行 (CMB) - 6215**, 6214**
- 更多银行持续扩展中...

**错误处理**:
- 银行卡号格式不正确
- 银行卡号校验失败 (Luhn算法)
- 不支持的银行卡类型
- 持卡人姓名不符合要求
- 银行四要素验证失败

---

## 12B. 提现系统技术实现 (Withdraw System Implementation)

### 💡 系统设计理念

提现系统采用异步处理架构，确保用户体验与资金安全的平衡：
- **用户无感知**: 提现申请立即响应，后台异步处理
- **资金安全**: 失败自动退回，多重验证机制
- **多渠道支持**: 灵活配置不同支付渠道
- **状态透明**: 完整的状态流转和进度跟踪

### 🔧 核心技术组件

| 组件 | 功能 | 实现类 |
|------|------|--------|
| 银行卡验证服务 | 格式验证、银行识别、Luhn校验 | `BankCardValidationService` |
| 提现处理服务 | 异步处理、状态管理、回调处理 | `WithdrawProcessService` |
| 风控服务 | 限额检查、频率控制、风险评估 | `WithdrawRiskControlService` |
| 多渠道适配 | 微信、支付宝、银联等渠道封装 | `WechatPayService`, `AlipayTransferService` |

### 🏦 支持的银行和渠道

#### 银行卡识别支持
- **中国工商银行** (ICBC): 6217**, 6222**
- **中国农业银行** (ABC): 6228**, 6230**
- **中国建设银行** (CCB): 6225**, 6227**
- **中国银行** (BOC): 6212**, 6216**
- **招商银行** (CMB): 6215**, 6214**
- **更多银行**: 持续扩展主流银行支持

#### 提现渠道对比

| 渠道 | 费率 | 到账时间 | 单笔限额 | 适用场景 |
|------|------|----------|----------|----------|
| 微信企业付款 | 0.6% | 2小时内 | 2万元 | 小额快速提现 |
| 支付宝转账 | 0.1% | 2小时内 | 10万元 | 通用提现首选 |
| 银联代付 | 0.3% | 1个工作日 | 50万元 | 大额批量提现 |
| 连连支付 | 0.2% | 实时 | 5万元 | 实时到账需求 |

### 🔒 安全机制

#### 数据安全
- **银行卡号加密存储**: AES加密算法保护敏感信息
- **脱敏显示**: 前4后4位显示，中间****遮挡
- **传输加密**: HTTPS + Token双重保护

#### 风控策略
- **日限额控制**: 根据用户等级设置不同限额
- **月限额管理**: 防止异常大额提现
- **频率限制**: 1小时内限制重复提现
- **异常监控**: 实时监控异常提现行为

#### 业务安全
- **余额锁定**: 提现时立即扣减，防止重复提现
- **失败回退**: 提现失败自动退回余额
- **状态同步**: 多渠道状态统一管理
- **幂等处理**: 防止重复回调导致的数据异常

### 📊 监控与告警

#### 关键指标
- **提现成功率**: 按渠道统计成功率
- **处理时长**: 从申请到到账的时间分布
- **失败原因分析**: 分类统计失败原因
- **资金流水**: 实时监控资金流向

#### 告警机制
- **成功率告警**: 成功率低于95%时告警
- **大额提现**: 单笔超过限额时人工审核
- **异常频率**: 异常提现频率时风控拦截
- **系统异常**: 接口异常时实时通知

### 🚀 性能优化

#### 异步处理
- **消息队列**: 使用RabbitMQ处理提现任务
- **批量处理**: 小额提现定时批量处理
- **缓存策略**: 银行卡信息、用户等级缓存
- **连接池**: 优化第三方接口连接池

#### 用户体验
- **即时反馈**: 申请后立即返回结果
- **状态推送**: WebSocket实时推送状态变化
- **智能推荐**: 根据历史推荐提现金额
- **一键提现**: 保存用户提现偏好

### 🔧 开发者集成指南

#### 前端集成示例
```javascript
// 1. 获取银行卡列表
const bankCards = await getBankCards();

// 2. 验证银行卡信息
const validation = await validateBankCard(cardNumber, holderName);

// 3. 提交提现申请
const result = await submitWithdraw({
  amount: 500.00,
  bankCardId: validation.bankCardId,
  remark: '提现申请'
});

// 4. 轮询或监听状态变化
const status = await getWithdrawStatus(result.withdrawNo);
```

#### 后端回调处理
```java
// 回调接口统一处理
@PostMapping("/callback/withdraw/{channel}")
public String handleCallback(@PathVariable String channel, 
                           @RequestBody String data) {
    // 1. 验证签名
    if (!verifySignature(channel, data)) {
        return "FAIL";
    }
    
    // 2. 解析回调数据
    CallbackData callback = parseCallback(channel, data);
    
    // 3. 更新提现状态
    withdrawService.updateStatus(callback);
    
    return "SUCCESS";
}
```

### 📈 未来规划

#### 功能增强
- **更多银行支持**: 扩展至全国主要银行
- **智能路由**: 根据成本和速度智能选择渠道
- **批量提现**: 支持批量提现操作
- **定时提现**: 支持定时自动提现

#### 技术升级
- **区块链技术**: 提现记录上链，增强透明度
- **AI风控**: 机器学习识别异常提现行为
- **多币种支持**: 支持数字货币提现
- **国际化**: 支持跨境提现服务

---

## 12A. 阿姨等级体系 (Staff Level System)

### 13A.1 获取等级信息
- **接口**: `GET /staff/level`
- **描述**: 获取当前阿姨的等级信息
- **权限**: 需要阿姨登录
- **响应**: 阿姨等级信息，包含等级、特权、升级进度等
```json
{
  "levelCode": "INTERMEDIATE",
  "levelName": "中级阿姨",
  "totalOrders": 45,
  "completedOrders": 43,
  "averageRating": 4.3,
  "completionRate": 95.56,
  "complaintRate": 2.22,
  "totalEarnings": 12500.00,
  "currentLevelPrivileges": {
    "serviceFeeRate": 0.80,
    "orderPriority": 3,
    "marketingSupport": true,
    "trainingAccess": "高级"
  },
  "upgradeProgress": {
    "ordersProgress": 90,
    "ratingProgress": 86,
    "completionProgress": 100,
    "complaintProgress": 100,
    "overallProgress": 86
  },
  "nextLevel": {
    "levelCode": "SENIOR",
    "levelName": "高级阿姨",
    "requiredOrders": 150,
    "requiredRating": 4.5,
    "requiredCompletionRate": 95.0,
    "maxComplaintRate": 10.0
  }
}
```

### 13A.2 获取所有等级配置
- **接口**: `GET /staff/level/all`
- **描述**: 获取所有阿姨等级配置
- **权限**: 需要阿姨登录
- **响应**: 等级配置列表，包含各等级特权详情

### 13A.3 获取等级特权
- **接口**: `GET /staff/level/privileges`
- **描述**: 获取指定等级的特权详情
- **权限**: 需要阿姨登录
- **参数**:
  - `levelCode`: 等级代码（可选，默认当前等级）
- **响应**: 等级特权详情

### 13A.4 获取升级记录
- **接口**: `GET /staff/level/upgrade-records`
- **描述**: 获取阿姨等级升级历史记录
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 13A.5 获取特权使用记录
- **接口**: `GET /staff/level/privilege-usage`
- **描述**: 获取阿姨等级特权使用记录
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 13A.6 使用等级特权
- **接口**: `POST /staff/level/use-privilege`
- **描述**: 使用指定的等级特权
- **权限**: 需要阿姨登录
- **参数**:
  - `privilegeType`: 特权类型
  - `orderId`: 订单ID（可选）

### 13A.7 检查等级特权
- **接口**: `GET /staff/level/check-privilege`
- **描述**: 检查阿姨是否享有某项等级特权
- **权限**: 需要阿姨登录
- **参数**:
  - `privilegeType`: 特权类型
- **响应**: 特权可用性信息

### 13A.8 获取服务费率
- **接口**: `GET /staff/level/service-fee-rate`
- **描述**: 获取阿姨当前的服务费率
- **权限**: 需要阿姨登录
- **响应**: 服务费率信息

### 13A.9 获取订单优先级
- **接口**: `GET /staff/level/order-priority`
- **描述**: 获取阿姨当前的订单优先级
- **权限**: 需要阿姨登录
- **响应**: 订单优先级信息

### 13A.10 获取等级排行榜
- **接口**: `GET /staff/level/ranking`
- **描述**: 获取阿姨等级排行榜
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认20
  - `sortBy`: 排序字段，默认level
- **响应**: 阿姨等级排行榜

### 13A.11 获取升级进度
- **接口**: `GET /staff/level/upgrade-progress`
- **描述**: 获取阿姨等级升级进度
- **权限**: 需要阿姨登录
- **响应**: 升级进度详情

### 13A.12 获取等级统计
- **接口**: `GET /staff/level/statistics`
- **描述**: 获取阿姨等级相关统计信息
- **权限**: 需要阿姨登录
- **响应**: 等级统计数据

### 13A.13 更新服务统计
- **接口**: `POST /staff/level/update-stats`
- **描述**: 更新阿姨服务统计数据
- **权限**: 需要阿姨登录
- **参数**:
  - `orderId`: 订单ID（可选）
  - `eventType`: 事件类型

### 13A.14 重新计算等级
- **接口**: `POST /staff/level/recalculate`
- **描述**: 触发重新计算阿姨等级
- **权限**: 需要阿姨登录

### 13A.15 获取下一等级要求
- **接口**: `GET /staff/level/next-level-requirements`
- **描述**: 获取升级到下一等级的要求
- **权限**: 需要阿姨登录
- **响应**: 下一等级要求详情

### 13A.16 获取等级成长建议
- **接口**: `GET /staff/level/growth-suggestions`
- **描述**: 获取等级提升建议
- **权限**: 需要阿姨登录
- **响应**: 个性化成长建议

**实现状态**: ✅ 已完成 - 通过StaffLevelController实现，包含完整的等级体系：等级信息、等级配置、特权管理、升级记录、排行榜、服务费率、订单优先级、升级进度、等级统计、成长建议等16个核心功能

---

## 12D. 阿姨推荐体系 (Staff Referral System)

### 12D.1 获取推荐统计信息
- **接口**: `GET /staff/referral/stats`
- **描述**: 获取阿姨的推荐统计信息，包含推荐阿姨的数量、收益等
- **权限**: 需要阿姨登录
- **响应**: StaffReferralStatsResponse对象
```json
{
  "code": 200,
  "message": "获取推荐统计成功",
  "data": {
    "staffReferralCount": 5,
    "totalReferralCount": 5,
    "staffReferralIncome": 250.00,
    "totalReferralIncome": 250.00,
    "monthlyReferralIncome": 100.00,
    "dailyReferralIncome": 50.00,
    "myReferralCode": "S1A2B3C",
    "referralCodeUsedCount": 5
  }
}
```

### 12D.2 获取我的推荐码
- **接口**: `GET /staff/referral/my-code`
- **描述**: 获取当前阿姨的专属推荐码
- **权限**: 需要阿姨登录
- **响应**: 推荐码字符串
```json
{
  "code": 200,
  "message": "获取推荐码成功",
  "data": "JY0002"
}
```

### 12D.3 推荐阿姨
- **接口**: `POST /staff/referral`
- **描述**: 阿姨推荐新的阿姨加入平台
- **权限**: 需要阿姨登录
- **请求体**: StaffReferralRequest对象
```json
{
  "phone": "13800138000",
  "name": "张三",
  "remark": "推荐备注"
}
```
- **响应**: StaffReferralResponse对象
```json
{
  "code": 200,
  "message": "推荐成功",
  "data": {
    "id": 1,
    "referralType": "STAFF",
    "refereeId": null,
    "refereeName": "张阿姨",
    "refereePhone": "138****8000",
    "referralCode": "S1A2B3C",
    "status": "ACTIVE",
    "statusDesc": "已推荐",
    "createdTime": "2024-09-30T10:00:00",
    "totalIncome": "0.00",
    "monthlyIncome": "0.00",
    "isRegistered": false,
    "registerTime": null
  }
}
```

### 12D.4 获取推荐列表
- **接口**: `GET /staff/referral/list`
- **描述**: 获取阿姨的推荐阿姨列表（支持分页）
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的推荐列表
```json
{
  "code": 200,
  "message": "获取推荐列表成功",
  "data": {
    "records": [
      {
        "id": 1,
        "referralType": "STAFF",
        "refereeId": 123,
        "refereeName": "张阿姨",
        "refereePhone": "138****8000",
        "refereeAvatar": "https://example.com/avatar.jpg",
        "referralCode": "ABC123",
        "status": "ACTIVE",
        "statusDesc": "已推荐",
        "createdTime": "2024-09-30T10:00:00",
        "totalIncome": "150.00",
        "monthlyIncome": "50.00",
        "isRegistered": true,
        "registerTime": "2024-09-30T12:00:00"
      }
    ],
    "total": 17,
    "page": 1,
    "size": 10,
    "pages": 2
  }
}
```

### 12D.5 获取推荐收益记录
- **接口**: `GET /staff/referral/income-records`
- **描述**: 获取推荐阿姨收益的详细记录
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的收益记录列表
```json
{
  "code": 200,
  "message": "获取推荐收益记录成功",
  "data": {
    "records": [
      {
        "id": 1,
        "referralType": "STAFF",
        "referralTypeDesc": "推荐阿姨",
        "refereeName": "张阿姨",
        "refereePhone": "138****8000",
        "incomeType": "SIGNUP",
        "incomeTypeDesc": "注册奖励",
        "amount": 50.00,
        "orderNo": null,
        "commissionRate": null,
        "status": "SUCCESS",
        "statusDesc": "已发放",
        "paidTime": "2024-09-30T10:00:00",
        "createdTime": "2024-09-30T10:00:00"
      }
    ],
    "total": 25,
    "page": 1,
    "size": 10,
    "pages": 3
  }
}
```

### 12D.6 验证推荐码
- **接口**: `GET /staff/referral/validate-code`
- **描述**: 验证推荐码是否有效
- **权限**: 需要阿姨登录
- **参数**:
  - `referralCode`: 推荐码（必填）
- **响应**: 推荐人信息
```json
{
  "code": 200,
  "message": "推荐码验证成功",
  "data": {
    "refereeId": 123,
    "refereeName": "李阿姨",
    "refereePhone": "139****9000",
    "refereeAvatar": "https://example.com/avatar.jpg",
    "referralCode": "JY0123",
    "status": "ACTIVE",
    "statusDesc": "有效"
  }
}
```

### 12D.7 获取推荐阿姨列表
- **接口**: `GET /staff/referral/staff-list`
- **描述**: 专门获取推荐阿姨的列表
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 推荐阿姨列表

### 12D.8 获取推荐客户列表
- **接口**: `GET /staff/referral/customer-list`
- **描述**: 专门获取推荐客户的列表
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 推荐客户列表

### 12D.9 获取推荐阿姨收益记录
- **接口**: `GET /staff/referral/staff-income-records`
- **描述**: 专门获取推荐阿姨的收益记录
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

### 12D.10 获取推荐客户收益记录
- **接口**: `GET /staff/referral/customer-income-records`
- **描述**: 专门获取推荐客户的收益记录
- **权限**: 需要阿姨登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10

**实现状态**: ✅ 已完成 - 通过StaffReferralController实现，包含完整的推荐体系：推荐统计、推荐码管理、推荐阿姨、推荐列表、收益记录、推荐码验证等10个核心功能

### 🎯 推荐体系业务逻辑

#### 推荐奖励机制
1. **阿姨推荐阿姨**: 被推荐阿姨认证通过+首单完成后，推荐人获得50元奖励
2. **用户推荐用户**: 被推荐用户注册+首单完成后，推荐人获得20元奖励
3. **奖励配置**: 奖励金额可通过system_config表配置调整

#### 推荐码规则

##### **个人推荐码**
- **阿姨推荐码**: S + 6位随机字符 (如: S1A2B3C)
- **用户推荐码**: U + 6位随机字符 (如: U4D5E6F)
- **字符集**: A-Z, 1-9 (排除0和O避免混淆)
- **有效期**: 永久有效
- **唯一性**: 全平台唯一，不会重复

##### **分享推荐码**
- **阿姨分享码**: JYS + 4位数字 (如: JYS0001)
- **用户分享码**: JYU + 4位数字 (如: JYU0001)
- **生成规则**: 基于用户ID生成，用于小程序码分享
- **用途**: 主要用于小程序码和分享链接

##### **使用限制**
- 每个被推荐人只能被推荐一次
- 推荐码全平台唯一，阿姨和用户推荐码不会冲突

#### 收益发放规则
- **阿姨推荐阿姨**: 
  - 注册时：建立推荐关系，不发放奖励
  - 认证通过时：创建待发放奖励记录
  - 首单完成时：发放50元奖励到阿姨钱包
- **用户推荐用户**: 
  - 注册时：建立推荐关系，不发放奖励
  - 首单完成时：发放20元奖励到用户钱包

#### 数据统计维度
- **推荐数量**: 阿姨统计推荐阿姨数量，用户统计推荐用户数量
- **收益统计**: 总收益、月收益、日收益
- **推荐状态**: 已注册/未注册、活跃状态
- **收益明细**: 按收益类型、时间维度查看详细记录

**特性说明**:
- **同端推荐**: 阿姨只能推荐阿姨，用户只能推荐用户
- **智能推荐码**: 自动生成唯一推荐码，支持个人码和临时码
- **实时统计**: 推荐数据和收益实时更新
- **收益透明**: 详细的收益记录和发放状态
- **防重复推荐**: 系统自动检测防止重复推荐
- **灵活配置**: 奖励金额和佣金比例可通过系统配置调整

---

## 12E. 用户推荐体系 (User Referral System)

### 12E.1 获取推荐统计信息
- **接口**: `GET /user/referral/stats`
- **描述**: 获取用户的推荐统计信息，包含推荐用户的数量、收益等
- **权限**: 需要用户登录
- **响应**: UserReferralStatsResponse对象
```json
{
  "code": 200,
  "message": "获取推荐统计成功",
  "data": {
    "userReferralCount": 3,
    "totalReferralIncome": "60.00",
    "monthlyReferralIncome": "20.00",
    "dailyReferralIncome": "0.00",
    "myReferralCode": "U4D5E6F",
    "completedFirstOrderCount": 3,
    "pendingFirstOrderCount": 0,
    "pendingReward": "0.00"
  }
}
```

### 12E.2 获取我的推荐码
- **接口**: `GET /user/referral/my-code`
- **描述**: 获取当前用户的专属推荐码
- **权限**: 需要用户登录
- **响应**: 推荐码字符串
```json
{
  "code": 200,
  "message": "获取推荐码成功",
  "data": "U4D5E6F"
}
```

### 12E.3 推荐用户
- **接口**: `POST /user/referral`
- **描述**: 用户推荐新的用户加入平台
- **权限**: 需要用户登录
- **请求体**: UserReferralRequest对象
```json
{
  "phone": "13800138000",
  "name": "张先生",
  "remark": "推荐备注"
}
```
- **响应**: UserReferralResponse对象
```json
{
  "code": 200,
  "message": "推荐成功",
  "data": {
    "id": 1,
    "referrerId": 123,
    "referrerName": "推荐用户",
    "refereeId": null,
    "refereeName": "张先生",
    "refereePhone": "138****8000",
    "referralCode": "U4D5E6F",
    "status": "PENDING",
    "statusDesc": "已推荐",
    "isRegistered": false,
    "registerTime": null,
    "createdTime": "2024-10-09T10:00:00",
    "remark": "推荐备注",
    "totalIncome": "0.00",
    "monthlyIncome": "0.00"
  }
}
```

### 12E.4 获取推荐列表
- **接口**: `GET /user/referral/list`
- **描述**: 获取用户的推荐用户列表（支持分页）
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的推荐列表

### 12E.5 获取推荐收益记录
- **接口**: `GET /user/referral/income-records`
- **描述**: 获取推荐用户收益的详细记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的收益记录列表

### 12E.6 获取分享内容
- **接口**: `GET /user/referral/share-content`
- **描述**: 获取用户推荐分享内容
- **权限**: 需要用户登录
- **响应**: 分享内容对象
```json
{
  "code": 200,
  "message": "获取分享内容成功",
  "data": {
    "referralCode": "U4D5E6F",
    "title": "加入家政平台，享受优质服务",
    "desc": "使用推荐码 U4D5E6F 注册，获得新手优惠",
    "path": "/pages/login/login?referralCode=U4D5E6F",
    "imageUrl": "/images/referral-banner.jpg"
  }
}
```

### 12E.7 验证推荐码
- **接口**: `POST /user/referral/validate-code`
- **描述**: 验证推荐码是否有效
- **权限**: 需要用户登录
- **参数**:
  - `referralCode`: 推荐码（必填）
- **响应**: 推荐人信息

**实现状态**: ✅ 已完成 - 通过UserReferralController实现，包含完整的推荐体系：推荐统计、推荐码管理、推荐用户、推荐列表、收益记录、分享内容、推荐码验证等7个核心功能

---

## 13. 公共接口 (Common APIs)

### 13.1 发送短信验证码
- **接口**: `POST /common/sms/send`
- **描述**: 发送短信验证码
- **权限**: 无需认证
- **参数**:
  - `phone`: 手机号
  - `type`: 验证码类型（register, login, reset_password等）
- **响应**: 成功消息

### 14.2 验证短信验证码
- **接口**: `POST /common/sms/verify`
- **描述**: 验证短信验证码
- **权限**: 无需认证
- **参数**:
  - `phone`: 手机号
  - `code`: 验证码
  - `type`: 验证码类型
- **响应**: 验证结果（布尔值）

### 14.3 上传文件
- **接口**: `POST /common/upload`
- **描述**: 上传文件到云存储
- **权限**: 无需认证
- **请求体**: multipart/form-data
- **参数**:
  - `file`: 文件（支持图片、文档等格式，单个文件不超过10MB）
  - `fileType`: 文件类型（可选，avatar, cert, order_image等）
- **响应**: 文件URL字符串

### 14.4 获取城市列表
- **接口**: `GET /common/cities`
- **描述**: 获取支持的城市列表
- **权限**: 无需认证
- **参数**:
  - `provinceCode`: 省份代码（可选）
- **响应**: 城市列表数组

### 14.5 获取系统配置
- **接口**: `GET /common/config`
- **描述**: 获取系统配置信息
- **权限**: 无需认证
- **参数**:
  - `configKey`: 配置键
- **响应**: 配置值

### 14.6 获取版本信息
- **接口**: `GET /common/version`
- **描述**: 获取应用版本信息
- **权限**: 无需认证
- **响应**: 版本信息对象

### 14.7 意见反馈
- **接口**: `POST /common/feedback`
- **描述**: 提交意见反馈
- **权限**: 无需认证
- **参数**:
  - `content`: 反馈内容
  - `contact`: 联系方式（可选）
  - `type`: 反馈类型（可选）
- **响应**: 成功消息

### 14.8 获取帮助文档
- **接口**: `GET /common/help`
- **描述**: 获取帮助文档
- **权限**: 无需认证
- **参数**:
  - `category`: 文档分类（可选）
- **响应**: 帮助文档内容

**实现状态**: ✅ 已完成 - 通过CommonController实现，包含短信验证码、文件上传、城市列表、系统配置、版本信息、意见反馈、帮助文档等8个核心功能。另外还有单独的UploadController提供优化的文件上传服务（支持并发控制和文件验证）

---

## 13A. 地区管理 (Region Management)

### 13A.1 获取省份列表
- **接口**: `GET /region/provinces`
- **描述**: 获取所有省份列表
- **权限**: 无需认证
- **响应**: 省份列表数组

### 13A.2 获取城市列表
- **接口**: `GET /region/cities`
- **描述**: 根据省份ID获取城市列表
- **权限**: 无需认证
- **参数**:
  - `provinceId`: 省份ID（可选）
- **响应**: 城市列表数组

### 13A.3 获取区县列表
- **接口**: `GET /region/districts`
- **描述**: 根据城市ID获取区县列表
- **权限**: 无需认证
- **参数**:
  - `cityId`: 城市ID（可选）
- **响应**: 区县列表数组

### 13A.4 根据地区名称搜索
- **接口**: `GET /region/search`
- **描述**: 根据地区名称关键字搜索
- **权限**: 无需认证
- **参数**:
  - `name`: 地区名称关键字（必填）
- **响应**: 匹配的地区列表

### 13A.5 获取城市字母分组
- **接口**: `GET /region/cities/grouped`
- **描述**: 获取按首字母分组的城市列表
- **权限**: 无需认证
- **响应**: 按字母分组的城市列表

### 13A.6 根据经纬度获取地区
- **接口**: `POST /region/location`
- **描述**: 根据经纬度获取地区信息
- **权限**: 无需认证
- **参数**:
  - `lng`: 经度（必填）
  - `lat`: 纬度（必填）
- **响应**: 地区信息对象

**实现状态**: ✅ 已完成 - 通过RegionController实现，包含完整的地区管理功能：省市区三级联动、地区搜索、字母分组、经纬度定位、地区统计等11个核心功能

---

## 14. 系统信息 (System Info)

### 14.1 服务状态检查
- **接口**: `GET /`
- **描述**: 检查服务运行状态
- **权限**: 无需认证
- **响应**: Result包装的服务信息
```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "service": "jiayou-miniprogram-service",
    "status": "running",
    "version": "1.0.0",
    "timestamp": "2024-01-01T10:00:00",
    "description": "家政平台小程序服务"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 15.2 健康检查
- **接口**: `GET /health`
- **描述**: 服务健康检查
- **权限**: 无需认证
- **响应**: Result包装的健康状态
```json
{
  "code": 200,
  "message": "服务健康",
  "data": {
    "status": "UP",
    "timestamp": "2024-01-01T10:00:00"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**实现状态**: ✅ 已完成 - 通过IndexController实现，提供服务状态检查和健康检查功能

---

## 实现状态说明

### ✅ 已实现的功能模块

#### 用户端 (User) - 已完成100%
- **用户认证**: 微信一键登录（支持手机号授权）、退出登录、刷新Token、完善个人信息 ✅
- **用户资料管理**: 获取资料、更新资料、上传头像 ✅
- **用户地址管理**: 地址CRUD操作、设置默认地址 ✅
- **用户订单管理**: 创建订单、获取订单列表、获取订单详情、取消订单、确认完成、评价订单、再次预约 ✅
- **用户钱包管理**: 钱包信息、充值、交易记录、余额变动明细 ✅
- **服务类型**: 获取服务类型列表、获取详情、热门服务、搜索服务、获取价格信息 ✅
- **优惠券管理**: 获取优惠券列表、可兑换优惠券、使用优惠券 ✅
- **新用户奖励**: 新用户检查、手动领取奖励，支持配置化积分奖励（默认200积分） ✅
- **积分管理**: 积分信息、积分记录、积分兑换、签到、兑换商品分类、统计信息、兑换限制检查、预览兑换等12个功能 ✅
- **会员体系**: 会员等级、权益管理、升级进度、升级记录、权益使用记录、付费会员管理等14个功能 ✅

#### 阿姨端 (Staff) - 已完成100%
- **阿姨认证**: 微信一键登录（支持手机号授权）、退出登录、刷新Token、认证资料上传、认证状态查询等6个功能 ✅
- **阿姨资料管理**: 获取资料、更新资料、上传头像、切换接单状态、获取认证状态、获取服务评价等6个功能 ✅
- **阿姨地址管理**: 获取地址、创建或更新地址、删除地址、启用/禁用地址、获取详情等5个功能 ✅
- **阿姨订单管理**: 获取可接订单、抢单、获取我的订单、获取订单详情、开始服务、完成服务、取消订单、申请改期等8个功能 ✅
- **阿姨钱包管理**: 钱包信息、收入明细、收入统计、信誉评分、银行卡管理、提现功能等10个功能 ✅
- **阿姨等级体系**: 等级信息、特权管理、升级进度、排行榜、等级统计、服务费率、订单优先级等16个功能 ✅

#### 公共功能 - 已完成100%
- **系统信息**: 服务状态检查、健康检查 ✅
- **公共接口**: 短信验证码发送/验证、文件上传、获取城市列表、系统配置、版本信息、意见反馈、帮助文档等8个功能 ✅
- **地区管理**: 省市区三级联动、地区搜索、字母分组、经纬度定位、地区统计等11个功能 ✅
- **文件上传**: 优化的文件上传服务（支持并发控制、文件验证、腾讯云COS集成） ✅

### 🎯 待优化和扩展的功能

#### 支付功能
- **支付集成**: 微信支付、支付宝支付接入
- **订单支付**: 创建支付订单、支付回调处理

#### 高级功能
- **实时通知**: WebSocket消息推送
- **地图定位**: 距离计算、路径规划API集成
- **短信服务**: 真实短信服务集成（当前为占位符实现）

#### 性能优化
- **缓存机制**: Redis缓存热门数据
- **数据库优化**: 查询性能优化、索引优化
- **接口限流**: 防止恶意请求和并发控制

### 🔧 技术债务和待优化项目

1. **文件上传**: ✅ 已集成腾讯云COS，支持并发控制和文件验证
2. **距离计算**: 订单距离计算使用固定值，需要集成地图API
3. **支付处理**: 订单支付状态管理需要完善
4. **数据验证**: 部分业务规则验证需要加强
5. **异常处理**: 需要更细致的异常分类和处理
6. **缓存机制**: 热门数据缓存优化
7. **性能优化**: 数据库查询优化、分页性能提升

---

## 数据模型说明

### 主要实体

1. **User**: 小程序用户
2. **Staff**: 阿姨/服务人员
3. **Order**: 订单
4. **ServiceType**: 服务类型
5. **Address**: 用户地址
6. **UserWallet**: 用户钱包
7. **StaffWallet**: 阿姨钱包
8. **Coupon**: 优惠券
9. **UserPoints**: 用户积分
10. **PaymentRecord**: 支付记录

### 状态枚举

- **用户类型**: 3-阿姨，4-用户
- **认证状态**: 0-未认证，1-认证中，2-已认证，3-认证失败
- **用户状态**: 1-正常，2-禁用
- **订单状态**: PENDING(待接单), ACCEPTED(已接单), STARTED(服务中), COMPLETED(已完成), CANCELLED(已取消)
- **支付方式**: 1-微信支付，2-支付宝，3-余额支付
- **优惠券状态**: 0-未使用，1-已使用，2-已过期
- **性别**: 0-未知，1-男，2-女

---

## 接口响应示例

### 用户登录响应
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "userId": 123,
    "userType": 4,
    "nickname": "用户昵称",
    "avatar": "https://example.com/avatar.jpg",
    "isFirstLogin": false,
    "authStatus": 1
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 订单列表响应
```json
{
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "records": [
      {
        "id": 1,
        "orderNo": "JY202401010001",
        "serviceTypeName": "日常保洁",
        "status": "COMPLETED",
        "statusDesc": "已完成",
        "appointmentTime": "2024-01-01T10:00:00",
        "totalPrice": 200.00,
        "createTime": "2024-01-01T08:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 10,
    "pages": 1
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 服务类型列表响应
```json
{
  "code": 200,
  "message": "获取服务类型成功",
  "data": [
    {
      "id": 1,
      "name": "日常保洁",
      "description": "日常家居清洁服务",
      "icon": "https://example.com/cleaning.png",
      "basePrice": 50.00,
      "priceUnit": "小时",
      "duration": 2,
      "category": "CLEANING",
      "isHot": true,
      "sort": 1,
      "details": [
        {
          "id": 1,
          "name": "厨房清洁",
          "description": "包括油烟机、灶台清洁",
          "required": true,
          "extraFee": 0.00
        }
      ]
    }
  ],
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1001 | 参数验证失败 | 检查请求参数格式 |
| 1002 | 业务规则违反 | 查看具体错误信息 |
| 2001 | 认证失败 | 重新登录获取Token |
| 2002 | 权限不足 | 检查用户权限 |
| 3001 | 资源不存在 | 检查资源ID |
| 4001 | 系统内部错误 | 联系技术支持 |

### 错误响应格式
```json
{
  "code": 1001,
  "message": "手机号格式不正确",
  "data": null,
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 注意事项

1. **认证**: 除公共接口和登录接口外，所有接口都需要在请求头中携带有效的JWT Token
2. **权限**: 用户端接口需要用户角色，阿姨端接口需要阿姨角色
3. **分页**: 分页接口统一使用page和size参数，从1开始计数
4. **时间格式**: 统一使用ISO 8601格式 (yyyy-MM-ddTHH:mm:ss)
5. **文件上传**: 支持图片、文档等常见格式，单个文件大小限制为10MB
6. **数据验证**: 所有输入参数都会进行格式和业务规则验证
7. **微信登录**: 需要先通过微信小程序获取code和phoneCode，再调用登录接口

### 微信小程序配置要求

**阿姨端微信登录需要在 `application.yml` 中配置：**
```yaml
# 微信配置
wechat:
  miniprogram:
    app-id: your-miniprogram-app-id
    app-secret: your-miniprogram-app-secret

# JWT配置
jwt:
  secret: jiayou-platform-jwt-secret-key-2024
  expiration: 86400000  # 24小时

# Redis配置
spring:
  data:
    redis:
      host: your-redis-host
      port: 6379
      password: your-redis-password
      database: 1
```

---

## 接口调用示例

### 用户端微信一键登录示例
```javascript
// 小程序端获取微信授权码和手机号授权码
wx.login({
  success: (res) => {
    const code = res.code;
    
    // 获取手机号授权码 (通过button组件的bindgetphonenumber事件)
    // <button open-type="getPhoneNumber" bindgetphonenumber="getPhoneNumber">
    //   授权手机号
    // </button>
    
    // 在getPhoneNumber事件处理函数中：
    getPhoneNumber: function(e) {
      const phoneCode = e.detail.code;
      
      if (phoneCode) {
        // 调用用户端登录接口
        wx.request({
          url: 'http://localhost:38081/mini/user/auth/wechat-login',
          method: 'POST',
          data: {
            code: code,
            phoneCode: phoneCode,
            userType: 4
          },
          success: (loginRes) => {
            if (loginRes.data.code === 200) {
              // 保存token
              wx.setStorageSync('userToken', loginRes.data.data.accessToken);
              wx.setStorageSync('userId', loginRes.data.data.userId);
              wx.setStorageSync('userType', loginRes.data.data.userType);
              
              // 判断是否首次登录
              if (loginRes.data.data.isFirstLogin) {
                wx.showToast({
                  title: '欢迎使用家政平台',
                  icon: 'success'
                });
                // 跳转到完善资料页面
                wx.navigateTo({
                  url: '/pages/profile/complete'
                });
              } else {
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
                // 跳转到首页
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            } else {
              wx.showToast({
                title: loginRes.data.message || '登录失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
        });
      } else {
        wx.showToast({
          title: '需要授权手机号才能登录',
          icon: 'none'
        });
      }
    }
  }
});
```

### 阿姨端微信一键登录示例
```javascript
// 小程序端获取微信授权码和手机号授权码
wx.login({
  success: (res) => {
    const code = res.code;
    
    // 获取手机号授权码 (通过button组件的bindgetphonenumber事件)
    // <button open-type="getPhoneNumber" bindgetphonenumber="getPhoneNumber">
    //   授权手机号
    // </button>
    
    // 在getPhoneNumber事件处理函数中：
    getPhoneNumber: function(e) {
      const phoneCode = e.detail.code;
      
      if (phoneCode) {
        // 调用阿姨端登录接口
        wx.request({
          url: 'http://localhost:38081/mini/staff/auth/wechat-login',
          method: 'POST',
          data: {
            code: code,
            phoneCode: phoneCode,
            userType: 3
          },
          success: (loginRes) => {
            if (loginRes.data.code === 200) {
              // 保存token
              wx.setStorageSync('staffToken', loginRes.data.data.accessToken);
              wx.setStorageSync('userId', loginRes.data.data.userId);
              wx.setStorageSync('userType', loginRes.data.data.userType);
              
              // 判断是否首次登录
              if (loginRes.data.data.isFirstLogin) {
                wx.showToast({
                  title: '欢迎加入家政平台',
                  icon: 'success'
                });
                // 跳转到完善资料页面
                wx.navigateTo({
                  url: '/pages/profile/complete'
                });
              } else {
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
                // 跳转到首页
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            } else {
              wx.showToast({
                title: loginRes.data.message || '登录失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
        });
      } else {
        wx.showToast({
          title: '需要授权手机号才能登录',
          icon: 'none'
        });
      }
    }
  }
});
```

### 创建订单示例
```javascript
wx.request({
  url: 'http://localhost:38081/mini/user/order',
  method: 'POST',
  header: {
    'Authorization': 'Bearer ' + wx.getStorageSync('token')
  },
  data: {
    serviceTypeId: 1,
    addressId: 1,
    appointmentTime: '2024-01-01T10:00:00',
    duration: 4,
    requirements: '需要深度清洁',
    paymentMethod: 1,
    estimatedPrice: 200.00
  },
  success: (res) => {
    console.log('订单创建成功', res.data);
  }
});
```

### 上传文件示例
```javascript
wx.chooseImage({
  count: 1,
  success: (res) => {
    wx.uploadFile({
      url: 'http://localhost:38081/mini/common/upload',
      filePath: res.tempFilePaths[0],
      name: 'file',
      formData: {
        'fileType': 'avatar'  // 可选：指定文件类型
      },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data);
        if (data.code === 200) {
          console.log('上传成功', data.data); // 返回文件URL
        } else {
          console.error('上传失败', data.message);
        }
      }
    });
  }
});
```

---

## 更新日志

### v1.0.0 (2024-09-22)
- ✅ **核心功能实现**: 用户端和阿姨端认证、资料管理、订单管理
- ✅ **微信小程序一键登录**: 支持用户端和阿姨端微信一键登录（含手机号授权），自动注册新用户
- ✅ **订单流程**: 完整的订单创建、接单、服务、完成、评价流程
- ✅ **阿姨注册**: 阿姨注册申请和认证状态管理
- ✅ **积分体系**: 完整的积分获取、兑换、签到功能，包含商品分类、兑换限制检查、预览兑换
- ✅ **会员体系**: 用户会员等级、权益管理、升级机制，包含升级记录、权益使用记录、付费会员管理
- ✅ **阿姨等级体系**: 阿姨等级评定、特权管理、排行榜，包含升级进度、等级统计、服务费率、订单优先级
- ✅ **文件上传**: 腾讯云COS集成，支持并发控制和文件验证
- ✅ **系统监控**: 服务状态检查和健康检查接口
- ✅ **完整功能**: 所有101个接口全部实现完成
- 📝 **API文档**: 完整的接口文档，包含实现状态说明和最新功能

### v1.1.0 (2024-09-24)
- ✅ **全面完成**: 完成所有用户端、阿姨端、公共功能的101个接口
- ✅ **用户地址管理**: 完整的地址CRUD操作
- ✅ **用户钱包管理**: 钱包信息、充值、交易记录、余额变动明细
- ✅ **阿姨收益管理**: 收益概览、明细、提现、银行卡管理
- ✅ **地区管理**: 新增地区管理模块，包含省市区三级联动、搜索、字母分组等11个功能
- ✅ **文件上传优化**: 修复腾讯云COS连接池问题，增强并发控制和错误处理
- 📊 **完成度**: 接口实现度达到100%

### v1.2.0 (2024-09-25)
- ✅ **阿姨钱包体系**: 完整实现"我的钱包"功能，包含钱包余额、各项收入统计、信誉评分等
- ✅ **多元化收入管理**: 支持工资、接单、推荐阿姨、推荐客户等多种收入类型统计
- ✅ **银行卡管理**: 完整的银行卡绑定、管理、设置默认卡功能
- ✅ **提现功能**: 安全的提现申请、手续费计算、状态跟踪
- ✅ **信誉评分系统**: 基于服务质量、完成率、投诉率等综合计算的信誉评分
- ✅ **罚款管理**: 支持各类罚款记录和统计
- ✅ **数据库扩展**: 新增7个钱包相关表，完善数据模型
- 📊 **新增功能**: 阿姨钱包管理14个接口，总接口数达到115个

### v1.2.1 (2024-09-25)
- ✅ **银行卡验证系统**: 实现完整的银行卡验证功能，包含格式验证、Luhn算法校验、银行信息识别
- ✅ **提现系统优化**: 完善异步提现处理机制，支持多渠道提现（微信、支付宝、银联、连连支付）
- ✅ **智能银行识别**: 支持主流银行自动识别，提升用户绑卡体验
- ✅ **提现回调处理**: 完整的回调处理机制，确保提现状态准确同步
- ✅ **风控安全机制**: 实现提现限额、频率控制、数据加密等安全措施
- ✅ **微信小程序优化**: 针对小程序用户体验优化，简化验证流程
- 🔧 **技术架构**: 异步处理架构，支持高并发提现处理
- 📊 **系统监控**: 增加提现成功率、处理时长等关键指标监控

### v1.3.0 (2024-09-25)
- ✅ **多提现方式支持**: 新增三种提现方式选择 - 微信零钱、支付宝余额、银行卡
- ✅ **智能提现推荐**: 根据提现金额智能推荐最优提现方式，优化用户体验
- ✅ **费率透明化**: 清晰展示各种提现方式的费率、限额、到账时间对比
- ✅ **用户体验升级**: 微信零钱实时到账、支付宝费率最低、银行卡限额最高的差异化优势
- ✅ **接口扩展**: 新增获取提现方式接口，支持动态配置提现渠道
- 🎯 **商业价值**: 通过多样化提现方式，满足不同用户需求，提升平台竞争力
- 📊 **数据支持**: 扩展数据库字段，支持多渠道提现记录和统计

### v1.3.1 (2024-09-25)
- ✅ **接口架构优化**: 清理重复的StaffEarnings接口，统一钱包管理功能到StaffWallet
- ✅ **代码结构优化**: 删除StaffEarningsController、StaffEarningsService等重复文件
- ✅ **功能整合**: 银行卡和提现管理功能完全整合到钱包系统
- 📊 **接口精简**: 减少接口重复，提升系统维护性和用户体验一致性

### v1.4.0 (2025-10-09)
- ✅ **新用户奖励系统**: 实现完整的新用户奖励机制，支持自动发放和手动领取
- ✅ **配置化奖励**: 新用户积分奖励支持system_config配置，默认200积分
- ✅ **防重复机制**: 用户只能获得一次新用户奖励，通过is_new字段控制
- ✅ **异步处理**: 新用户奖励异步发放，不影响注册主流程
- ✅ **积分服务扩展**: UserPointsService新增addPoints方法，支持通用积分添加
- ✅ **数据库扩展**: User表新增is_new字段，支持新用户标识
- ✅ **接口完善**: 新增2个新用户奖励相关接口，总接口数达到117个
- 📝 **文档更新**: 完善API文档，新增新用户奖励系统说明

---

## 15. 次卡管理 (Service Card)

### 15.1 获取次卡商品列表
- **接口**: `GET /user/service-cards/products`
- **描述**: 获取所有可购买的次卡商品
- **权限**: 需要用户登录
- **响应**: 次卡商品列表
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "productId": 1,
      "productCode": "SC001",
      "name": "新客专享保洁次卡",
      "cardType": "NEW_USER_EXCLUSIVE",
      "description": "新用户专享优惠，首次购买更实惠",
      "features": ["深度清洁", "专业工具", "满意保障"],
      "validityDays": 90,
      "userTypeLimit": "NEW_USER",
      "refundPolicy": "PROPORTIONAL",
      "maxPurchaseCount": 1,
      "images": ["url1", "url2"],
      "tags": ["新客专享", "热门"],
      "isRecommended": true,
      "isHot": true,
      "applicableServices": [
        {"id": 1, "name": "日常保洁"},
        {"id": 2, "name": "深度清洁"}
      ],
      "skus": [
        {
          "skuId": 1,
          "skuCode": "SC001-3",
          "name": "3次卡",
          "serviceTimes": 3,
          "unitPrice": 299.00,
          "originalPrice": 399.00,
          "discount": "7.5折",
          "singleServiceValue": 150.00,
          "totalValue": 450.00,
          "stock": 100,
          "soldCount": 20,
          "inStock": true
        }
      ],
      "canPurchase": true,
      "purchasedCount": 0,
      "remainingCount": 1
    }
  ]
}
```

### 15.2 获取次卡商品详情
- **接口**: `GET /user/service-cards/products/{productId}`
- **描述**: 获取指定次卡商品的详细信息
- **权限**: 需要用户登录
- **响应**: 次卡商品详情（同上）

### 15.3 购买次卡
- **接口**: `POST /user/service-cards/purchase`
- **描述**: 购买次卡，返回支付参数
- **权限**: 需要用户登录
- **请求体**: ServiceCardPurchaseRequest对象
```json
{
  "skuId": 1,
  "paymentChannel": "WECHAT",
  "remark": "购买备注"
}
```
- **响应**: 支付参数（用于拉起支付）

### 15.4 我的次卡列表
- **接口**: `GET /user/service-cards/my-cards`
- **描述**: 获取用户已购买的次卡列表
- **权限**: 需要用户登录
- **参数**:
  - `status`: 状态筛选（ACTIVE-有效, USED_UP-已用完, EXPIRED-已过期, REFUNDED-已退款）
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的次卡列表
```json
{
  "records": [
    {
      "cardId": 1,
      "cardNo": "SC1234567890",
      "cardName": "新客专享保洁次卡",
      "cardType": "NEW_USER_EXCLUSIVE",
      "totalTimes": 3,
      "usedTimes": 1,
      "remainingTimes": 2,
      "purchaseAmount": 299.00,
      "originalPrice": 399.00,
      "singleServiceValue": 150.00,
      "totalValue": 450.00,
      "usedValue": 150.00,
      "remainingValue": 300.00,
      "status": "ACTIVE",
      "statusDesc": "有效",
      "canUse": true,
      "canRefund": true,
      "paymentTime": "2024-01-01T10:00:00",
      "expireTime": "2024-04-01T10:00:00",
      "daysRemaining": 60
    }
  ],
  "total": 10,
  "page": 1,
  "size": 10
}
```

### 15.5 次卡详情
- **接口**: `GET /user/service-cards/{cardId}`
- **描述**: 获取用户次卡的详细信息
- **权限**: 需要用户登录
- **响应**: 次卡详情（同上）

### 15.6 检查次卡可用性
- **接口**: `POST /user/service-cards/check-availability`
- **描述**: 检查用户有哪些次卡可以用于当前订单
- **权限**: 需要用户登录
- **请求体**: ServiceCardCheckRequest对象
```json
{
  "serviceTypeId": 1,
  "orderAmount": 200.00,
  "appointmentTime": "2024-01-15T10:00:00"
}
```
- **响应**: 可用次卡列表和推荐

### 15.7 次卡使用记录
- **接口**: `GET /user/service-cards/{cardId}/usage-records`
- **描述**: 获取指定次卡的使用记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的使用记录列表

### 15.8 计算退款金额
- **接口**: `GET /user/service-cards/{cardId}/refund-calculation`
- **描述**: 计算次卡退款金额（预览）
- **权限**: 需要用户登录
- **响应**: 退款计算结果
```json
{
  "canRefund": true,
  "refundPolicy": "PROPORTIONAL",
  "totalTimes": 3,
  "usedTimes": 1,
  "remainingTimes": 2,
  "purchaseAmount": 299.00,
  "usedValue": 150.00,
  "remainingValue": 300.00,
  "baseRefundAmount": 199.33,
  "timeAdjustRate": 0.95,
  "refundFeeRate": 0.01,
  "refundFee": 1.99,
  "actualRefundAmount": 197.34,
  "refundRate": 0.66,
  "notes": [
    "已使用 1 次，剩余 2 次，按剩余比例退款",
    "购买超过7天，扣除5%",
    "扣除退款手续费 1.00%"
  ]
}
```

### 15.9 申请退款
- **接口**: `POST /user/service-cards/{cardId}/refund`
- **描述**: 提交次卡退款申请
- **权限**: 需要用户登录
- **请求体**: ServiceCardRefundRequest对象
```json
{
  "reason": "不需要了",
  "reasonType": "PERSONAL_REASON"
}
```
- **响应**: 退款单号

### 15.10 退款记录列表
- **接口**: `GET /user/service-cards/refund-records`
- **描述**: 获取用户的退款记录
- **权限**: 需要用户登录
- **参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
- **响应**: 分页的退款记录列表

### 15.11 退款详情
- **接口**: `GET /user/service-cards/refund-records/{refundNo}`
- **描述**: 获取退款记录详情
- **权限**: 需要用户登录
- **响应**: 退款详情

### 15.12 用户次卡统计
- **接口**: `GET /user/service-cards/statistics`
- **描述**: 获取用户次卡统计数据
- **权限**: 需要用户登录
- **响应**: 统计数据
```json
{
  "cardCount": 5,
  "activeCardCount": 3,
  "totalRemainingTimes": 10,
  "totalRemainingValue": 1500.00
}
```

**实现状态**: ✅ 已完成 - 通过ServiceCardController实现，包含完整的次卡购买、使用、退款功能

---

## 16. 首页接口 (Home)

### 16.1 获取推荐服务列表
- **接口**: `GET /user/home/recommended-services`
- **描述**: 获取首页推荐的普通服务列表，支持城市定价
- **权限**: 需要用户登录
- **参数**:
  - `cityCode`: 城市代码（可选），如 "310100" 表示上海市
- **响应**: RecommendedServiceResponse列表
```json
{
  "code": 200,
  "message": "获取推荐服务成功",
  "data": [
    {
      "productId": 1,
      "serviceName": "基础保洁",
      "description": "日常家居清洁服务",
      "imageUrl": "https://example.com/image.jpg",
      "unit": "HOUR",
      "hourlyPrice": 50.00,
      "minPrice": 100.00,
      "maxPrice": 500.00,
      "minHours": 2,
      "recommended": true,
      "sortOrder": 1,
      "skus": [
        {
          "skuId": 1,
          "skuName": "2小时",
          "serviceHours": 2,
          "originalPrice": 120.00,
          "actualPrice": 100.00,
          "isDefault": true,
          "sortOrder": 1
        },
        {
          "skuId": 2,
          "skuName": "4小时",
          "serviceHours": 4,
          "originalPrice": 240.00,
          "actualPrice": 200.00,
          "isDefault": false,
          "sortOrder": 2
        }
      ]
    }
  ]
}
```

**业务逻辑**:
1. 查询 `is_recommended = 1` 且 `status = 'ACTIVE'` 的普通服务（`product_type = 'SERVICE'`）
2. 如果提供了 `cityCode`，优先使用城市定价（`city_pricing` 表）
3. 否则使用商品基础价格（`product.unit_price`）
4. 返回每个服务的SKU列表（不同时长套餐）
5. 按 `sort_order` 排序

**价格优先级**:
- 城市定价 > 基础价格
- `minPrice` = 起步价（最低消费）
- `hourlyPrice` = 每小时单价
- SKU价格来自 `product_sku` 表

### 16.2 次卡展示说明
- 首页的次卡展示统一由 `/user/service-cards/products` 接口处理
- 该接口会返回所有上架的次卡商品（包括新客专享次卡）
- 前端可根据 `product.user_type_limit` 字段判断是否为新客专享（`NEW_USER` 表示新客专享）
- 新客专享次卡的显示逻辑由前端控制（根据用户的 `is_new` 状态决定是否展示）

---

---

## 17. 评价评分管理 (Rating Management)

### 17.1 提交订单评价
- **接口**: `POST /user/order/{orderId}/rating`
- **描述**: 用户对已完成的订单进行评价
- **权限**: 需要用户登录
- **路径参数**:
  - `orderId`: 订单ID

- **请求体**: OrderRatingRequest
```json
{
  "score": 5,
  "serviceAttitudeScore": 5,
  "serviceQualityScore": 5,
  "punctualityScore": 5,
  "cleanlinessScore": 5,
  "content": "服务很好，阿姨很专业，家里打扫得很干净",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": ["服务好", "很专业", "准时到达"],
  "isAnonymous": false
}
```

- **响应**:
```json
{
  "code": 200,
  "message": "评价成功",
  "data": {
    "ratingId": 123,
    "pointsReward": 20,
    "rewardReason": "订单评价奖励"
  }
}
```

**字段说明**:
- `score`: 综合评分（1-5分，必填）
- `serviceAttitudeScore`: 服务态度评分（1-5分，可选）
- `serviceQualityScore`: 服务质量评分（1-5分，可选）
- `punctualityScore`: 准时性评分（1-5分，可选）
- `cleanlinessScore`: 清洁度评分（1-5分，可选）
- `content`: 评价内容（最多500字，可选）
- `images`: 评价图片URL列表（最多9张，可选）
- `tags`: 评价标签列表（可选）
- `isAnonymous`: 是否匿名（可选，默认false）

**积分奖励规则**:
- 基础评价：+5积分
- 文字评价10字以上：+10积分
- 上传图片：+5积分
- 填写详细评分：+5积分
- 优质评价（50字+3图）：+20积分（替代其他奖励）

---

### 17.2 获取订单评价详情
- **接口**: `GET /user/order/{orderId}/rating`
- **描述**: 获取指定订单的评价详情
- **权限**: 需要用户登录
- **路径参数**:
  - `orderId`: 订单ID

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 123,
    "orderId": 456,
    "orderNo": "JY202410130001",
    "productName": "日常保洁",
    "score": 5.0,
    "serviceAttitudeScore": 5,
    "serviceQualityScore": 5,
    "punctualityScore": 5,
    "cleanlinessScore": 5,
    "content": "服务很好，阿姨很专业",
    "images": ["url1", "url2"],
    "tags": ["服务好", "很专业"],
    "isAnonymous": false,
    "status": "PUBLISHED",
    "editCount": 1,
    "editTime": "2024-10-14T10:00:00",
    "isEdited": true,
    "replyContent": "感谢您的好评",
    "replyTime": "2024-10-13T15:00:00",
    "createdTime": "2024-10-13T14:00:00",
    "staffInfo": {
      "staffId": 789,
      "staffName": "张阿姨",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

**新增字段说明** (v1.1.0):
- `editCount`: 修改次数（0表示未修改）
- `editTime`: 最后编辑时间（未修改时为null）
- `isEdited`: 是否已编辑（true/false）

---

### 17.3 修改订单评价
- **接口**: `PUT /user/order/{orderId}/rating`
- **描述**: 修改已提交的评价
- **权限**: 需要用户登录
- **路径参数**:
  - `orderId`: 订单ID

**修改规则** (v1.1.0 优化):
- ⏰ **15天内**可修改（从评价创建时间算起）
- 🔢 **仅限1次**修改机会
- ❌ **综合评分不可修改**（保证核心指标稳定）
- ✅ 可修改：文字、图片、标签、详细评分、匿名状态
- 💡 修改后显示"已编辑"标签和编辑时间

- **请求体**: OrderRatingRequest（注意：score 字段会被忽略）
```json
{
  "content": "修改后的评价内容",
  "images": ["url1", "url2"],
  "serviceAttitudeScore": 5,
  "serviceQualityScore": 5,
  "punctualityScore": 5,
  "cleanlinessScore": 5,
  "tags": ["服务好", "很专业"],
  "isAnonymous": false
}
```

- **成功响应**:
```json
{
  "code": 200,
  "message": "修改成功"
}
```

- **错误响应**:
```json
{
  "code": 400,
  "message": "评价修改期限已过（15天内可修改）"
}
// 或
{
  "code": 400,
  "message": "评价仅可修改1次，您已达到修改次数上限"
}
// 或
{
  "code": 400,
  "message": "已删除的评价无法修改"
}
```

---

### 17.4 删除订单评价
- **接口**: `DELETE /user/order/{orderId}/rating`
- **描述**: 删除已提交的评价
- **权限**: 需要用户登录
- **路径参数**:
  - `orderId`: 订单ID

**删除规则** (v1.1.0 优化):
- ⏰ **15天内**可删除（从评价创建时间算起）
- 💾 **逻辑删除**（数据保留，状态改为 DELETED）
- ❌ 删除后不可恢复
- 📊 不显示在评价列表中，不计入评分统计
- 🔒 后台保留记录用于数据分析和风控

- **成功响应**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

- **错误响应**:
```json
{
  "code": 400,
  "message": "评价删除期限已过（15天内可删除）"
}
// 或
{
  "code": 400,
  "message": "评价已删除"
}
```

---

### 17.5 获取我的评价列表
- **接口**: `GET /user/ratings`
- **描述**: 获取用户的所有评价记录
- **权限**: 需要用户登录

- **查询参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
  - `status`: 状态筛选（PUBLISHED, HIDDEN）
  - `scoreFilter`: 评分筛选（1-5）

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 123,
        "orderId": 456,
        "orderNo": "JY202410130001",
        "productName": "日常保洁",
        "score": 5.0,
        "content": "服务很好",
        "images": ["url1"],
        "tags": ["服务好"],
        "status": "PUBLISHED",
        "createdTime": "2024-10-13T14:00:00",
        "staffInfo": {
          "staffId": 789,
          "staffName": "张阿姨",
          "avatar": "url"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "size": 10,
    "pages": 5
  }
}
```

---


---

### 17.6 获取评价标签列表
- **接口**: `GET /user/ratings/tags`
- **描述**: 获取可用的评价标签列表
- **权限**: 无需认证

- **查询参数**:
  - `category`: 标签分类（SERVICE, ATTITUDE, QUALITY, PUNCTUALITY）

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "tagName": "服务好",
      "tagType": "POSITIVE",
      "category": "SERVICE",
      "icon": "url"
    },
    {
      "id": 2,
      "tagName": "很专业",
      "tagType": "POSITIVE",
      "category": "SERVICE",
      "icon": "url"
    }
  ]
}
```

**标签类型**:
- `POSITIVE`: 正面标签
- `NEGATIVE`: 负面标签
- `NEUTRAL`: 中性标签

**标签分类**:
- `SERVICE`: 服务类
- `ATTITUDE`: 态度类
- `QUALITY`: 质量类
- `PUNCTUALITY`: 准时性类

---

### 17.7 获取商品评价列表
- **接口**: `GET /user/products/{productId}/ratings`
- **描述**: 获取指定商品的评价列表
- **权限**: 无需认证
- **路径参数**:
  - `productId`: 商品ID

- **查询参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
  - `scoreFilter`: 评分筛选（1-5，可选）
  - `hasImages`: 是否有图片（true/false，可选）
  - `sortBy`: 排序方式（TIME-时间, SCORE-评分）

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "summary": {
      "averageScore": 4.8,
      "totalCount": 100,
      "scoreDistribution": {
        "5": 80,
        "4": 15,
        "3": 3,
        "2": 1,
        "1": 1
      },
      "tagStatistics": [
        {"tagName": "服务好", "count": 50},
        {"tagName": "很专业", "count": 45}
      ]
    },
    "records": [
      {
        "id": 123,
        "score": 5.0,
        "content": "服务很好",
        "images": ["url1"],
        "tags": ["服务好"],
        "isAnonymous": false,
        "createdTime": "2024-10-13T14:00:00",
        "userInfo": {
          "nickname": "张先生",
          "avatar": "url"
        },
        "replyContent": "感谢支持",
        "replyTime": "2024-10-13T15:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  }
}
```

---

## 18. 阿姨端评价管理 (Staff Rating Management)

### 18.1 获取我的评价列表
- **接口**: `GET /staff/ratings`
- **描述**: 获取阿姨收到的评价列表
- **权限**: 需要阿姨登录

- **查询参数**:
  - `page`: 页码，默认1
  - `size`: 每页大小，默认10
  - `scoreFilter`: 评分筛选（1-5）

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "summary": {
      "averageScore": 4.8,
      "totalCount": 100,
      "serviceAttitudeRating": 4.9,
      "serviceQualityRating": 4.8,
      "punctualityRating": 4.7,
      "cleanlinessRating": 4.9,
      "scoreDistribution": {
        "5": 80,
        "4": 15,
        "3": 3,
        "2": 1,
        "1": 1
      }
    },
    "records": [
      {
        "id": 123,
        "orderId": 456,
        "orderNo": "JY202410130001",
        "productName": "日常保洁",
        "score": 5.0,
        "content": "服务很好",
        "images": ["url1"],
        "serviceAttitudeScore": 5,
        "serviceQualityScore": 5,
        "punctualityScore": 5,
        "cleanlinessScore": 5,
        "tags": ["服务好", "很专业"],
        "isAnonymous": false,
        "createdTime": "2024-10-13T14:00:00",
        "userInfo": {
          "nickname": "张先生",
          "avatar": "url"
        },
        "replyContent": null,
        "replyTime": null
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  }
}
```

---

### 18.2 回复评价
- **接口**: `POST /staff/ratings/{ratingId}/reply`
- **描述**: 阿姨回复用户评价
- **权限**: 需要阿姨登录
- **路径参数**:
  - `ratingId`: 评价ID

- **请求体**:
```json
{
  "replyContent": "感谢您的好评，期待下次为您服务"
}
```

- **响应**:
```json
{
  "code": 200,
  "message": "回复成功"
}
```

---

### 18.3 获取评价统计
- **接口**: `GET /staff/ratings/statistics`
- **描述**: 获取阿姨的评价统计数据
- **权限**: 需要阿姨登录

- **查询参数**:
  - `period`: 统计周期（WEEK-本周, MONTH-本月, YEAR-本年, ALL-全部）

- **响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "period": "MONTH",
    "averageScore": 4.8,
    "totalCount": 50,
    "serviceAttitudeRating": 4.9,
    "serviceQualityRating": 4.8,
    "punctualityRating": 4.7,
    "cleanlinessRating": 4.9,
    "scoreDistribution": {
      "5": 40,
      "4": 8,
      "3": 1,
      "2": 1,
      "1": 0
    },
    "tagStatistics": [
      {"tagName": "服务好", "count": 30},
      {"tagName": "很专业", "count": 25},
      {"tagName": "准时到达", "count": 20}
    ],
    "trend": [
      {"date": "2024-10-01", "averageScore": 4.7, "count": 10},
      {"date": "2024-10-08", "averageScore": 4.8, "count": 15},
      {"date": "2024-10-15", "averageScore": 4.9, "count": 25}
    ]
  }
}
```

---

## 19. 消息通知管理 (Notification Management)

### v1.3.0 (2024-10-15) ✨ 新增
- ✅ **多渠道消息推送**: 站内消息 + 微信订阅消息 + 短信通知
- ✅ **智能分级推送**: 根据消息优先级自动选择推送渠道
- ✅ **8种消息类型**: ORDER、SERVICE、PAYMENT、SETTLEMENT、AUDIT、SYSTEM、ACTIVITY、REFERRAL
- ✅ **完整功能**: 消息列表、统计、已读/未读、删除、订阅授权管理
- ✅ **异步推送**: 不阻塞主业务流程

### 19.1 获取消息列表
- **接口**: `GET /notification/list`
- **描述**: 获取用户或阿姨的消息列表，支持分页和筛选
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| type | String | 否 | 消息类型：ORDER, SYSTEM, PAYMENT, SETTLEMENT, SERVICE, AUDIT, ACTIVITY, REFERRAL |
| status | String | 否 | 消息状态：UNREAD-未读, READ-已读 |
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页大小，默认10 |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "title": "阿姨已接单",
        "content": "订单#20241015001已被李阿姨接单，核验码：123456",
        "type": "ORDER",
        "typeName": "订单通知",
        "priority": "HIGH",
        "status": "UNREAD",
        "relatedType": "ORDER",
        "relatedId": 10001,
        "jumpUrl": "/pages/order/detail",
        "jumpParams": {
          "orderId": 10001
        },
        "createdTime": "2024-10-15T10:30:00"
      },
      {
        "id": 2,
        "title": "服务即将开始",
        "content": "您的日常保洁服务将于10月16日 09:00开始，请做好准备",
        "type": "SERVICE",
        "typeName": "服务提醒",
        "priority": "HIGH",
        "status": "READ",
        "readTime": "2024-10-15T11:00:00",
        "relatedType": "ORDER",
        "relatedId": 10001,
        "jumpUrl": "/pages/order/detail",
        "jumpParams": {
          "orderId": 10001
        },
        "createdTime": "2024-10-15T09:00:00"
      }
    ],
    "total": 50,
    "size": 10,
    "current": 1,
    "pages": 5
  }
}
```

**消息类型说明**:
| 类型 | 说明 | 场景示例 |
|-----|------|---------|
| ORDER | 订单通知 | 订单接单、订单取消、服务完成 |
| SERVICE | 服务提醒 | 服务开始提醒、服务完成提醒 |
| PAYMENT | 支付通知 | 支付成功、退款到账 |
| SETTLEMENT | 结算通知 | 收益结算、提现到账 |
| AUDIT | 审核通知 | 认证审核结果 |
| SYSTEM | 系统通知 | 平台公告、维护通知 |
| ACTIVITY | 活动通知 | 优惠券发放、营销活动 |
| REFERRAL | 推荐通知 | 推荐奖励、邀请成功 |

---

### 19.2 获取消息统计
- **接口**: `GET /notification/stat`
- **描述**: 获取用户或阿姨的消息统计数据（未读数）
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "unreadCount": 15,
    "orderUnreadCount": 8,
    "systemUnreadCount": 3,
    "otherUnreadCount": 4
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|-----|------|------|
| unreadCount | Long | 总未读消息数 |
| orderUnreadCount | Long | 订单消息未读数 |
| systemUnreadCount | Long | 系统消息未读数 |
| otherUnreadCount | Long | 其他消息未读数 |

---

### 19.3 获取消息详情
- **接口**: `GET /notification/{id}`
- **描述**: 获取指定消息的详情，查看时自动标记为已读
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**路径参数**:
- `id`: 消息ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "阿姨已接单",
    "content": "订单#20241015001已被李阿姨接单，核验码：123456",
    "type": "ORDER",
    "typeName": "订单通知",
    "priority": "HIGH",
    "status": "READ",
    "readTime": "2024-10-15T11:00:00",
    "relatedType": "ORDER",
    "relatedId": 10001,
    "jumpUrl": "/pages/order/detail",
    "jumpParams": {
      "orderId": 10001
    },
    "createdTime": "2024-10-15T10:30:00"
  }
}
```

**注意**: 查看消息详情时，如果消息状态为未读，会自动标记为已读。

---

### 19.4 标记消息为已读
- **接口**: `PUT /notification/{id}/read`
- **描述**: 将指定消息标记为已读
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**路径参数**:
- `id`: 消息ID

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功"
}
```

---

### 19.5 批量标记为已读
- **接口**: `PUT /notification/batch-read`
- **描述**: 批量将多条消息标记为已读
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）
- **Content-Type**: `application/json`

**请求体**: 消息ID列表
```json
[1, 2, 3, 4, 5]
```

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功"
}
```

---

### 19.6 标记全部为已读
- **接口**: `PUT /notification/read-all`
- **描述**: 将所有未读消息标记为已读，可按类型筛选
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| type | String | 否 | 消息类型，如果不传则标记所有类型 |

**响应示例**:
```json
{
  "code": 200,
  "message": "操作成功"
}
```

**使用示例**:
- `PUT /notification/read-all` - 标记所有消息为已读
- `PUT /notification/read-all?type=ORDER` - 仅标记订单消息为已读

---

### 19.7 删除消息
- **接口**: `DELETE /notification/{id}`
- **描述**: 删除指定消息（逻辑删除）
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**路径参数**:
- `id`: 消息ID

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

**注意**: 删除采用逻辑删除，数据仍保留在数据库中，用户不可见。

---

### 19.8 保存订阅授权
- **接口**: `POST /notification/subscribe`
- **描述**: 保存用户对微信订阅消息的授权记录
- **权限**: 需要用户或阿姨登录
- **请求头**: 
  - `userId`: 用户ID（用户端传递）
  - `staffId`: 阿姨ID（阿姨端传递）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| templateId | String | 是 | 微信模板ID |
| templateCode | String | 是 | 模板编码（业务标识） |

**响应示例**:
```json
{
  "code": 200,
  "message": "保存成功"
}
```

**模板编码说明**:
| 编码 | 说明 | 用途 |
|-----|------|------|
| ORDER_ACCEPTED | 订单接单通知 | 阿姨接单后通知用户 |
| SERVICE_STARTING | 服务开始提醒 | 服务前2小时提醒 |
| ORDER_COMPLETED | 服务完成通知 | 服务完成后通知 |
| PAYMENT_SUCCESS | 支付成功通知 | 支付成功后通知 |
| NEW_ORDER | 新订单通知 | 通知附近阿姨有新订单 |
| ORDER_ASSIGNED | 派单通知 | 公司派单通知阿姨 |
| INCOME_SETTLED | 收益结算通知 | 订单收益结算通知 |
| REVIEW_RECEIVED | 收到评价通知 | 用户评价后通知阿姨 |

**前端调用示例**:
```javascript
// 小程序请求订阅授权
wx.requestSubscribeMessage({
  tmplIds: ['模板ID1', '模板ID2', '模板ID3'],
  success: (res) => {
    // 保存授权结果
    for (let tmplId in res) {
      if (res[tmplId] === 'accept') {
        uni.request({
          url: '/notification/subscribe',
          method: 'POST',
          data: {
            templateId: tmplId,
            templateCode: '对应的编码'
          }
        });
      }
    }
  }
});
```

---

### 19.9 消息通知功能特性

#### 多渠道推送
- **站内消息**: 所有消息都会保存在消息中心，用户可随时查看
- **微信订阅消息**: 重要消息通过微信订阅消息推送，即使用户未打开小程序也能收到
- **短信通知**: 特别重要的消息通过短信推送（如订单接单、服务开始）

#### 智能分级推送
- **HIGH（高优先级）**: 三渠道全推送（站内+微信+短信）
  - 订单接单、服务开始、订单取消等
- **MEDIUM（中优先级）**: 站内+微信推送
  - 支付成功、收益结算、评价通知等
- **LOW（低优先级）**: 仅站内消息
  - 系统公告、活动通知、优惠券发放等

#### 消息跳转
每条消息都包含跳转信息，点击消息可直接跳转到相关页面：
- 订单消息 → 订单详情页
- 支付消息 → 支付记录页
- 结算消息 → 钱包页面
- 评价消息 → 评价详情页

#### 消息状态管理
- **UNREAD**: 未读（默认状态）
- **READ**: 已读（查看详情或手动标记后）
- **DELETED**: 已删除（逻辑删除，用户不可见）

---

### 19.10 使用场景示例

#### 场景1：用户下单时请求订阅授权
```javascript
// pages/order/create.js
async createOrder() {
  try {
    // 1. 先请求订阅授权
    await this.requestSubscribe();
    
    // 2. 创建订单
    const res = await uni.$http.post('/user/order', this.orderData);
    
    if (res.code === 200) {
      uni.showToast({ title: '下单成功' });
      uni.redirectTo({ 
        url: '/pages/order/detail?id=' + res.data.id 
      });
    }
  } catch (error) {
    console.error('创建订单失败:', error);
  }
}

async requestSubscribe() {
  try {
    const res = await uni.requestSubscribeMessage({
      tmplIds: [
        '订单接单通知模板ID',
        '服务开始提醒模板ID',
        '服务完成通知模板ID'
      ]
    });
    
    // 保存授权结果
    for (let tmplId in res) {
      if (res[tmplId] === 'accept') {
        await uni.$http.post('/notification/subscribe', {
          templateId: tmplId,
          templateCode: this.getTemplateCode(tmplId)
        });
      }
    }
  } catch (error) {
    console.error('订阅授权失败:', error);
  }
}
```

#### 场景2：消息中心页面
```javascript
// pages/notification/index.js
export default {
  data() {
    return {
      stat: { unreadCount: 0 },
      messageList: [],
      page: 1
    };
  },
  
  onLoad() {
    this.loadStat();
    this.loadMessageList();
  },
  
  methods: {
    // 加载统计
    async loadStat() {
      const res = await uni.$http.get('/notification/stat');
      if (res.code === 200) {
        this.stat = res.data;
        // 更新TabBar徽标
        if (res.data.unreadCount > 0) {
          uni.setTabBarBadge({
            index: 2,
            text: String(res.data.unreadCount)
          });
        }
      }
    },
    
    // 加载消息列表
    async loadMessageList() {
      const res = await uni.$http.get('/notification/list', {
        page: this.page,
        size: 20
      });
      if (res.code === 200) {
        this.messageList = res.data.records;
      }
    },
    
    // 点击消息
    async handleClick(item) {
      // 标记为已读
      await uni.$http.put(`/notification/${item.id}/read`);
      
      // 跳转到详情页
      if (item.jumpUrl) {
        const query = Object.keys(item.jumpParams || {})
          .map(key => `${key}=${item.jumpParams[key]}`)
          .join('&');
        
        uni.navigateTo({
          url: `${item.jumpUrl}${query ? '?' + query : ''}`
        });
      }
      
      // 刷新
      this.loadStat();
      this.loadMessageList();
    }
  }
};
```

---

### 19.11 注意事项

#### 微信订阅消息限制
1. **一次授权一次使用**: 微信订阅消息每次授权只能发送一次，使用后需重新授权
2. **需要用户主动触发**: 只能在用户点击、支付等操作后弹出授权框
3. **模板审核**: 需要在微信公众平台申请并通过审核才能使用

#### 用户身份识别
- **用户端**: 请求时在Header中传递 `userId`
- **阿姨端**: 请求时在Header中传递 `staffId`
- 建议使用JWT token统一认证方式

#### 性能优化建议
1. **消息列表分页**: 避免一次加载过多数据
2. **未读数缓存**: 使用Redis缓存未读数，减少数据库查询
3. **异步推送**: 微信和短信推送采用异步方式，不阻塞主业务

#### 数据保留策略
- 建议定期清理30天前的已读消息
- 未读消息和重要消息不自动清理
- 采用逻辑删除，支持数据恢复

---

### 下一版本计划 (v2.0.0)
- 🎯 **支付集成**: 微信支付和支付宝支付
- 🎯 **实时通知**: WebSocket消息推送
- 🎯 **地图服务**: 距离计算、路径规划API集成
- 🎯 **短信服务**: 真实短信验证码服务集成
- 🎯 **性能优化**: 缓存机制、数据库优化、接口限流