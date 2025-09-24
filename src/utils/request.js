//  src/utils/request.js
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatIPForURL } from './ipValidator';

// 默认IP地址
const DEFAULT_IP = '127.0.0.1';
const DEFAULT_PORT = '81';

// 创建 axios 实例
const createService = (ip = DEFAULT_IP, port = DEFAULT_PORT, isFileUpload = false, timeout = 3000) => {
  const formattedIP = formatIPForURL(ip);
  
  // 根据是否为文件上传设置不同的默认请求头
  const defaultHeaders = isFileUpload 
    ? {
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh,zh-CN;q=0.9',
        'Connection': 'keep-alive'
      }
    : { 'Content-Type': 'application/json;charset=utf-8' };
  
  const instance = axios.create({
    baseURL: `http://${formattedIP}:${port}/api`,
    timeout: timeout,
    headers: defaultHeaders
  });
  
  // 为新创建的实例添加请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 如果是文件上传，确保Content-Type正确设置
      if (isFileUpload && config.data instanceof File) {
        config.headers['Content-Type'] = 'application/octet-stream';
        config.headers['Content-Length'] = config.data.size;
      }
      // 如果是FormData，让浏览器自动设置Content-Type
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 为新创建的实例添加响应拦截器
  instance.interceptors.response.use(
    (response) => {
      const { status, data } = response;
      // 登录成功
      if (status == 200) {
        return data;
      }

      ElMessage.error(data.error || '系统出错');
      return Promise.reject(new Error(data.error || 'Error'));
    },
    (error) => {
      if (error.response?.data) {
        const { data, status } = error.response;
        const { msg } = data;
        switch (status) {
          case 401:
            
          default:
            ElMessage.error(msg || '系统出错');
            break;
        }
      }
      return Promise.reject(error.message);
    }
  );
  
  return instance;
};

// 默认实例
const service = createService();

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    console.log(2222, response)
    const { status, data, result } = response;
    // 登录成功
    if (data?.result || result) {
      return data || result;
    }

    ElMessage.error(data.error || '系统出错');
    return Promise.reject(new Error(data.error || 'Error'));
  },
  (error) => {
    if (error.response.data) {
      const { data, status } = error.response;
      const { msg } = data;
      switch (status) {
        case 401:
          
        default:
          ElMessage.error(msg || '系统出错');
          break;
      }
    }
    return Promise.reject(error.message);
  }
);

// 导出 axios 实例
export default service;

// 导出创建自定义实例的函数
export { createService };

// 导出默认配置
export { DEFAULT_IP, DEFAULT_PORT };

// 导出便捷函数：根据IP创建请求实例
export const createRequestByIP = (ip, port = DEFAULT_PORT, timeout = 3000) => {
  return createService(ip, port, false, timeout);
};

