/**
 * IP地址验证工具函数
 * 支持IPv4和IPv6地址格式验证
 */

// IPv4 格式验证正则
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

// IPv6 格式验证正则（支持常见格式）
const IPV6_REGEX = /^(?:[0-9a-f]{1,4}:){1,7}(?:(:[0-9a-f]{0,4}){1,7}|::)$/i;

/**
 * 验证IPv4地址格式和范围
 * @param {string} ip - IPv4地址
 * @returns {boolean} 是否为有效的IPv4地址
 */
export const isValidIPv4 = (ip) => {
  if (!IPV4_REGEX.test(ip)) {
    return false;
  }
  
  // 验证每个段是否在 0-255 范围内
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * 验证IPv6地址格式
 * @param {string} ip - IPv6地址
 * @returns {boolean} 是否为有效的IPv6地址
 */
export const isValidIPv6 = (ip) => {
  return IPV6_REGEX.test(ip);
};

/**
 * 验证IP地址（支持IPv4和IPv6）
 * @param {string} ip - IP地址
 * @returns {object} 验证结果 { isValid: boolean, type: 'ipv4'|'ipv6'|null, message: string }
 */
export const validateIP = (ip) => {
  if (!ip || typeof ip !== 'string') {
    return {
      isValid: false,
      type: null,
      message: 'IP地址不能为空'
    };
  }

  const trimmedIP = ip.trim();
  
  if (isValidIPv4(trimmedIP)) {
    return {
      isValid: true,
      type: 'ipv4',
      message: 'IPv4地址格式正确'
    };
  }
  
  if (isValidIPv6(trimmedIP)) {
    return {
      isValid: true,
      type: 'ipv6',
      message: 'IPv6地址格式正确'
    };
  }
  
  return {
    isValid: false,
    type: null,
    message: '请输入正确的IPv4或IPv6地址格式'
  };
};

/**
 * 检查IP地址是否为IPv6格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为IPv6地址
 */
export const isIPv6 = (ip) => {
  return isValidIPv6(ip);
};

/**
 * 检查IP地址是否为IPv4格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为IPv4地址
 */
export const isIPv4 = (ip) => {
  return isValidIPv4(ip);
};

/**
 * 格式化IP地址用于URL（IPv6需要方括号）
 * @param {string} ip - IP地址
 * @returns {string} 格式化后的IP地址
 */
export const formatIPForURL = (ip) => {
  if (isIPv4(ip)) {
    return ip;
  }
  return `[${ip}]`;
};

/**
 * 批量验证IP地址列表
 * @param {Array<string>} ipList - IP地址列表
 * @returns {object} 验证结果 { valid: Array, invalid: Array }
 */
export const validateIPList = (ipList) => {
  const valid = [];
  const invalid = [];
  
  ipList.forEach(ip => {
    const result = validateIP(ip);
    if (result.isValid) {
      valid.push({ ip, ...result });
    } else {
      invalid.push({ ip, ...result });
    }
  });
  
  return { valid, invalid };
};

// 默认导出主要验证函数
export default validateIP;
