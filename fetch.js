class Headers {
  constructor(init = {}) {
    // 使用一个纯净的对象来存储 header 数据
    this.map = Object.create(null);

    if (init instanceof Headers) {
      // 如果传入的 init 是 Headers 实例，则复制其内容
      init.forEach((value, key) => {
        this.append(key, value);
      });
    } else if (typeof init === 'object' && init !== null) {
      // 如果传入的是一个普通对象，则将其中的键值对加入 Headers
      Object.keys(init).forEach(key => {
        this.append(key, init[key]);
      });
    }
  }

  // 添加 header，如果已经存在则合并成逗号分隔的字符串
  append(name, value) {
    name = name.toLowerCase();
    if (this.map[name]) {
      this.map[name] += ', ' + value;
    } else {
      this.map[name] = String(value);
    }
  }

  // 设置 header，直接覆盖旧值
  set(name, value) {
    this.map[name.toLowerCase()] = String(value);
  }

  // 获取 header 的值，若不存在则返回 null
  get(name) {
    return this.map[name.toLowerCase()] || null;
  }

  // 判断 header 是否存在
  has(name) {
    return Object.prototype.hasOwnProperty.call(this.map, name.toLowerCase());
  }

  // 删除指定的 header
  delete(name) {
    delete this.map[name.toLowerCase()];
  }

  // 遍历所有 header
  forEach(callback) {
    for (let key in this.map) {
      callback(this.map[key], key, this);
    }
  }
}

// 模拟的 ReadableStream（简化版）
// 此处仅返回一个包含整体 body 内容的 chunk
class SimulatedReadableStream {
  constructor(content) {
    this._content = content;
    this.locked = false;
  }
  getReader() {
    if (this.locked) {
      throw new Error("Stream is already locked");
    }
    this.locked = true;
    let done = false;
    return {
      read: () => {
        if (!done) {
          done = true;
          return Promise.resolve({ value: this._content, done: false });
        } else {
          return Promise.resolve({ done: true });
        }
      },
      releaseLock: () => {
        this.locked = false;
      },
      cancel: () => {
        this.locked = false;
        return Promise.resolve();
      }
    };
  }
}

// 模拟的 Response 类
class Response {
  /**
   * @param {*} body 响应体内容，可以是字符串、对象或 ArrayBuffer 等
   * @param {Object} options 配置项
   *   - status: HTTP 状态码，默认为 200
   *   - statusText: 状态描述，默认为 'OK'
   *   - headers: 响应头对象
   *   - url: 响应的 URL
   */
  constructor(body, options = {}) {
    this._bodyContent = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this.ok = this.status >= 200 && this.status < 300;

    // 标记 body 是否已被消费
    this.bodyUsed = false;

    // 模拟 body 属性：如果有 body 则创建一个可读取的流
    if (body != null) {
      let content;
      if (typeof body === 'string') {
        content = new TextEncoder().encode(body);
      } else if (body instanceof ArrayBuffer) {
        content = new Uint8Array(body)
      } else if (typeof body === 'object') {
        // 对象转为 JSON 字符串
        const _content = JSON.stringify(body);
        content = new TextEncoder().encode(_content)
      } else {
        content = new TextEncoder().encode(_content);
      }
      this.body = new SimulatedReadableStream(content);
    } else {
      this.body = null;
    }
  }

  // 内部方法：消费 body，确保只能读取一次
  _consumeBody() {
    if (this.bodyUsed) {
      return Promise.reject(new TypeError("Body has already been consumed."));
    }
    this.bodyUsed = true;
    if (!this.body) {
      return Promise.resolve('');
    }
    const reader = this.body.getReader();
    // 这里假设 stream 仅返回一次整体内容
    return reader.read().then(result => {
      reader.releaseLock();
      return result.value || '';
    });
  }

  /**
   * 将响应体解析为文本，返回 Promise
   */
  text() {
    return this._consumeBody();
  }

  /**
   * 将响应体解析为 JSON 对象，返回 Promise
   */
  json() {
    return this.text().then(text => {
      try {
        return JSON.parse(text);
      } catch (error) {
        return Promise.reject(new Error("Invalid JSON: " + error.message));
      }
    });
  }

  /**
   * 将响应体转换为 ArrayBuffer，返回 Promise
   */
  arrayBuffer() {
    return this.text().then(text => {
      const buffer = new ArrayBuffer(text.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < text.length; i++) {
        view[i] = text.charCodeAt(i);
      }
      return buffer;
    });
  }
}


function Fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
      const headers = options.headers.reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
      const responseType = headers["Accept"]  === "application/octet-stream"? "arraybuffer": "text";
      const dataType = headers["Content-Type"] === "application/json" ? "json" : ""
      wx.request({
          url,
          method: options.method || 'GET',
          data: options.body || {},
          header: headers,
          dataType: dataType,
          responseType: "arraybuffer",
          success(res) {
              const response = new Response(res.data, {
                status: res.statusCode,
                statusText: res.errMsg,
                headers: res.header,
              });
              resolve(response);
          },
          fail(err) {
              reject(err);
          }
      });
  });
}

// 判断全局环境并挂载 fetch
GameGlobal.fetch = Fetch;
GameGlobal.Headers = Headers;
GameGlobal.Response = Response;