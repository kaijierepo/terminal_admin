<template>
  <div 
    class="excel-file-upload"
    :class="{ 'drag-over': isDragOver }"
    @drop="handleFileDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @click="triggerFileInput">
    <input 
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleFileSelect">
    <div class="upload-content">
      <el-icon class="upload-icon" size="36"><Document /></el-icon>
      <p class="upload-text">{{ uploadText }}</p>
      <p class="upload-hint">{{ uploadHint }}</p>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'

export default {
  name: 'ExcelFileUpload',
  
  props: {
    // 上传提示文字
    uploadText: {
      type: String,
      default: '点击选择 Excel 文件'
    },
    // 上传提示说明
    uploadHint: {
      type: String,
      default: '支持 .xlsx 和 .xls 格式'
    },
    // 最大文件大小（字节）
    maxSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    }
  },
  
  emits: ['excel-uploaded', 'upload-error'],
  
  data() {
    return {
      isDragOver: false
    }
  },
  
  methods: {
    // 触发文件选择
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    
    // 处理文件选择
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    // 处理拖拽进入
    handleDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    // 处理拖拽离开
    handleDragLeave(event) {
      event.preventDefault()
      this.isDragOver = false
    },
    
    // 处理拖拽悬停
    handleDragOver(event) {
      event.preventDefault()
    },
    
    // 处理文件拖拽放置
    handleFileDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    // 处理文件
    processFile(file) {
      // 检查文件类型
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      const allowedExtensions = ['.xlsx', '.xls']
      
      if (!allowedExtensions.includes(fileExtension)) {
        const errorMsg = `只支持 ${allowedExtensions.join('、')} 格式的文件`
        this.$emit('upload-error', errorMsg)
        return
      }
      
      // 检查文件大小
      if (file.size > this.maxSize) {
        const errorMsg = `文件大小不能超过 ${this.formatFileSize(this.maxSize)}`
        this.$emit('upload-error', errorMsg)
        return
      }
      
      // 读取并解析 Excel 文件
      this.readExcelFile(file)
    },
    
    // 读取 Excel 文件
    readExcelFile(file) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: "array" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          this.$emit('excel-uploaded', {
            file,
            fileName: file.name,
            fileSize: file.size,
            data: jsonData,
            workbook
          })
        } catch (error) {
          console.error('解析 Excel 文件失败:', error)
          this.$emit('upload-error', '文件解析失败，请检查文件格式')
        }
      }
      
      reader.onerror = () => {
        this.$emit('upload-error', '读取文件失败')
      }
      
      reader.readAsArrayBuffer(file)
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style lang="scss" scoped>
.excel-file-upload {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #67c23a;
    background-color: #f0f9ff;
  }
  
  &.drag-over {
    border-color: #67c23a;
    background-color: #f0f9ff;
    transform: scale(1.02);
  }
  
  .upload-content {
    .upload-icon {
      font-size: 48px;
      color: #67c23a;
      margin-bottom: 16px;
    }
    
    .upload-text {
      margin: 0 0 8px 0;
      color: #606266;
      font-size: 16px;
      font-weight: 500;
    }
    
    .upload-hint {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
