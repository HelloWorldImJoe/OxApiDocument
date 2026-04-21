# Demo API

![image](https://r2.2libra.com/i/146/2026/04/p6XWtxidmtfE.png)

本文档用于演示 HTTP 接口与 WebSocket 接口的描述方式，便于快速了解请求格式、响应结构以及示例数据。

## HTTP 接口示例

### 获取指定待办事项

该接口用于根据待办事项 ID 获取详情。

- 请求方法：GET
- 请求路径：/todos/42
- 请求头：Accept: application/json
- 接口状态：in_progress

响应成功时会返回待办事项的基础信息，包括所属用户、标题以及完成状态。

```api
{
  "method": "GET",
  "url": "/todos/42",
  "status": {
    "key": "in_progress"
  },
  "headers": {
    "Accept": "application/json"
  },
  "responses": {
    "200": {
      "description": {
        "userId(number)": "所属用户 ID",
        "title(string)": "待办事项标题",
        "completed(boolean)": "是否已完成"
      },
      "sample": {
        "userId": 3,
        "id": 42,
        "title": "rerum perferendis error quia ut eveniet",
        "completed": false
      }
    }
  }
}
```

## WebSocket 接口示例

该示例用于展示 WebSocket 连接方式，以及不同消息体的请求与响应结构。

- 连接地址：wss://devnet-rpc.shyft.to?api_key=Q_J-mr252_t3Y7zM
- 是否等待响应：是
- 超时时间：10000ms

说明：以下示例请求体主要用于演示错误响应结构，因此返回 Parse error 属于预期结果。






```websocket
{
  "url": "wss://devnet-rpc.shyft.to?api_key=Q_J-mr252_t3Y7zM",
  "description": "WebSocket 连接测试",
  "waitForResponse": true,
  "timeoutMs": 10000,
  "messages": {
    "default": {
      "request": "{\n\"Ping\"\n}",
      "description": {
        "jsonrpc(string)": "JSON-RPC 协议版本",
        "error(object)": {
          "message(string)": "错误信息"
        }
      },
      "sample": {
        "jsonrpc": "2.0",
        "error": {
          "code": -32700,
          "message": "Parse error"
        },
        "id": null
      },
      "waitForResponse": true,
      "timeoutMs": 10000
    },
    "subscribe": {
      "request": "{\n第二个消息体\n}",
      "description": {
        "jsonrpc(string)": "JSON-RPC 协议版本"
      },
      "sample": {
        "jsonrpc": "2.0",
        "error": {
          "code": -32700,
          "message": "Parse error"
        },
        "id": null
      },
      "waitForResponse": true,
      "timeoutMs": 10000
    }
  }
}
```




## 补充说明

- HTTP 示例展示的是标准查询接口的基本写法，适合用于说明单个资源的获取方式。
- WebSocket 示例展示的是消息级别的交互结构，适合补充连接地址、超时控制以及多种消息类型的说明。
- 如果后续需要扩展文档，建议继续补充错误码说明、字段约束、鉴权方式以及更多请求示例。



