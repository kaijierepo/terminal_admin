import dayjs from 'dayjs'

/**
 * 处理zip包下载
 * @param {*} response - 接口返回的响应数据
 * @param {number} fileCount - 文件数量
 * @param {string} fileName - 自定义文件名（可选）
 */
export const handleZipDownload = async (response, fileCount, fileName = '') => {
  try {
    // 检查响应是否为blob类型
    let blob
    if (response instanceof Blob) {
      blob = response
    } else if (response.data && response.data instanceof Blob) {
      blob = response.data
    } else if (response.result && response.result instanceof Blob) {
      blob = response.result
    } else {
      // 如果不是blob，尝试转换为blob
      blob = new Blob([response], { type: 'application/zip' })
    }

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    if (!fileName) {
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      fileName = `音频文件_${timestamp}.zip`
    }
    link.download = fileName
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    console.log('zip包下载完成')
    return { success: true, message: `成功下载 ${fileCount} 个音频文件的压缩包` }
  } catch (error) {
    console.error('处理zip包下载失败:', error)
    return { success: false, message: '处理zip包下载失败', error }
  }
}
