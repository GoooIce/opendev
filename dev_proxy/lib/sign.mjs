let wasm;

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = null;

/**
 * 获取或初始化 Uint8Array 类型的内存缓冲区
 * 
 * @returns {Uint8Array} WebAssembly 内存缓冲区的 Uint8Array 视图
 * @throws {Error} 当 WebAssembly 模块未初始化时可能抛出错误
 */
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

const cachedTextEncoder =
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder('utf-8')
    : {
        encode: () => {
          throw Error('TextEncoder not available');
        },
      };

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length,
        };
      };

/**
 * 将 JavaScript 字符串传递给 WebAssembly 内存
 * 
 * @param {string} arg - 要传递的字符串
 * @param {Function} malloc - WebAssembly 内存分配函数
 * @param {Function} realloc - WebAssembly 内存重分配函数
 * @returns {number} 字符串在 WebAssembly 内存中的指针
 */
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

let cachedInt32Memory0 = null;

/**
 * 获取或初始化 Int32Array 类型的内存缓冲区
 * 
 * @returns {Int32Array} WebAssembly 内存缓冲区的 Int32Array 视图
 * @throws {Error} 当 WebAssembly 模块未初始化时可能抛出错误
 */
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

const cachedTextDecoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
    : {
        decode: () => {
          throw Error('TextDecoder not available');
        },
      };

if (typeof TextDecoder !== 'undefined') {
  cachedTextDecoder.decode();
}

/**
 * 从 WebAssembly 内存中读取字符串
 * 
 * @param {number} ptr - 字符串在 WebAssembly 内存中的指针
 * @param {number} len - 字符串的长度
 * @returns {string} 解码后的字符串
 */
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
/**
 * 使用 WebAssembly 实现的签名生成函数
 * 
 * @param {string} nonce - 用于防止重放攻击的随机字符串
 * @param {string} timestamp - 请求时的时间戳
 * @param {string} device_id - 发起请求的设备唯一标识符
 * @param {string} query - 需要签名的查询字符串
 * @returns {string} 生成的签名字符串
 * @throws {Error} 当 WebAssembly 模块未正确初始化时抛出错误
 * @example
 * const signature = sign(
 *   "abc123", // 随机字符串
 *   "1648169156", // 时间戳
 *   "device_xyz", // 设备ID
 *   "param1=value1&param2=value2" // 查询字符串
 * );
 */
export function sign(nonce, timestamp, device_id, query) {
  let deferred5_0;
  let deferred5_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(
      nonce,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      timestamp,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(
      device_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(
      query,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len3 = WASM_VECTOR_LEN;
    wasm.sign(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    deferred5_0 = r0;
    deferred5_1 = r1;
    return getStringFromWasm0(r0, r1);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
  }
}

/**
 * 异步加载并实例化 WebAssembly 模块
 * 
 * @param {WebAssembly.Module|Response} module - WebAssembly 模块或 Response 对象
 * @param {Object} imports - 导入对象
 * @returns {Promise<{instance: WebAssembly.Instance, module: WebAssembly.Module}>} WebAssembly 实例和模块
 */
async function __wbg_load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}

/**
 * 获取 WebAssembly 模块的导入对象
 * 
 * @returns {Object} 包含必要导入的对象
 */
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};

  return imports;
}

/**
 * 初始化 WebAssembly 模块的内存
 * 
 * @param {Object} imports - 导入对象
 * @param {WebAssembly.Memory} [maybe_memory] - 可选的内存对象
 */
function __wbg_init_memory(imports, maybe_memory) {}

/**
 * 完成 WebAssembly 模块的初始化
 * 
 * @param {WebAssembly.Instance} instance - WebAssembly 实例
 * @param {WebAssembly.Module} module - WebAssembly 模块
 * @returns {Object} WebAssembly 导出对象
 */
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = null;
  cachedUint8Memory0 = null;

  return wasm;
}

/**
 * 同步初始化 WebAssembly 模块
 * 
 * @param {WebAssembly.Module} module - WebAssembly 模块
 * @returns {Object} WebAssembly 导出对象
 */
function initSync(module) {
  if (wasm !== undefined) return wasm;

  const imports = __wbg_get_imports();

  __wbg_init_memory(imports);

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }

  const instance = new WebAssembly.Instance(module, imports);

  return __wbg_finalize_init(instance, module);
}

/**
 * 异步初始化 WebAssembly 模块
 * 
 * @param {string|URL|Request|undefined} input - WebAssembly 模块的来源
 * @returns {Promise<Object>} WebAssembly 导出对象
 */
async function __wbg_init(input) {
  if (wasm !== undefined) return wasm;

  if (typeof input === 'undefined') {
    // input = new URL('sign_bg.wasm', import.meta.url);
    input = new URL('sign_bg.wasm', 'https://static.devv.ai');
  }
  const imports = __wbg_get_imports();

  if (
    typeof input === 'string' ||
    (typeof Request === 'function' && input instanceof Request) ||
    (typeof URL === 'function' && input instanceof URL)
  ) {
    input = fetch(input);
  }

  __wbg_init_memory(imports);

  const { instance, module } = await __wbg_load(await input, imports);

  return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
