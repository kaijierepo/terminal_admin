/**
 * 驼峰转横杠
 */
export const humpToDash = (str) => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * 查找数组对象的某个下标
 * @param {Array} ary 查找的数组
 * @param {Functon} fn 判断的方法
 */
// eslint-disable-next-line
export const findIndex = (ary, fn) => {
  if (ary.findIndex) {
    return ary.findIndex(fn)
  }
  let index = -1
  ary.some((item, i, ary) => {
    const ret = fn(item, i, ary)
    if (ret) {
      index = i
      return ret
    }
  })
  return index
}

/**
 * 首字母大写
 */
export function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

export function formatNumberWithUnit(number, unit = 'w') {
  const units = {
    'w': 10000,
    'y': 100000000
  };

  if (!units[unit]) {
    throw new Error('Unsupported unit');
  }

  const unitValue = units[unit];
  const formattedNumber = (number / unitValue).toFixed(2); // 保留两位小数
  const [integerPart, decimalPart] = formattedNumber.split('.');

  // 在整数部分添加逗号
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${formattedInteger}${decimalPart ? `.${decimalPart} ${unit}` : ` ${unit}`}`;
}
