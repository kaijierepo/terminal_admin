<template>
  <div 
    class="file-upload-area"
    :class="{ 'drag-over': isDragOver }"
    @drop="handleFileDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @click="triggerFileInput">
    <input 
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      style="display: none"
      @change="handleFileSelect">
    <div class="upload-content">
      <el-icon class="upload-icon"><Upload /></el-icon>
      <p class="upload-text">{{ uploadText }}</p>
      <p class="upload-hint">{{ uploadHint }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileUpload',
  
  props: {
    // 接受的文件类型
    accept: {
      type: String,
      default: '.ini,.txt,.zip'
    },
    // 上传提示文字
    uploadText: {
      type: String,
      default: '拖拽文件到此处，或点击选择文件'
    },
    // 上传提示说明
    uploadHint: {
      type: String,
      default: '支持 .ini、.txt 和 .zip 格式'
    },
    // 最大文件大小（字节）
    maxSize: {
      type: Number,
      default: 50 * 1024 * 1024 // 50MB
    },
    // 允许的文件扩展名
    allowedExtensions: {
      type: Array,
      default: () => ['.ini', '.txt', '.zip']
    },
    // 是否支持多文件上传
    multiple: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['file-uploaded', 'files-uploaded', 'upload-error'],
  
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
        if (this.multiple) {
          this.processMultipleFiles(files)
        } else {
          this.processFile(files[0])
        }
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
        if (this.multiple) {
          this.processMultipleFiles(files)
        } else {
          this.processFile(files[0])
        }
      }
    },
    
    // 处理文件
    processFile(file) {
      // 检查文件类型
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!this.allowedExtensions.includes(fileExtension)) {
        const errorMsg = `只支持 ${this.allowedExtensions.join('、')} 格式的文件`
        this.$emit('upload-error', errorMsg)
        return
      }
      
      // 检查文件大小
      if (file.size > this.maxSize) {
        const errorMsg = `文件大小不能超过 ${this.formatFileSize(this.maxSize)}`
        this.$emit('upload-error', errorMsg)
        return
      }
      
      // 读取文件内容
      this.readFileContent(file)
    },
    
    // 处理多个文件
    processMultipleFiles(files) {
      const validFiles = []
      const errors = []
      
      files.forEach(file => {
        // 检查文件类型
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        
        if (!this.allowedExtensions.includes(fileExtension)) {
          errors.push(`文件 "${file.name}" 格式不支持，只支持 ${this.allowedExtensions.join('、')} 格式`)
          return
        }
        
        // 检查文件大小
        if (file.size > this.maxSize) {
          errors.push(`文件 "${file.name}" 大小超过限制，不能超过 ${this.formatFileSize(this.maxSize)}`)
          return
        }
        
        validFiles.push(file)
      })
      
      if (errors.length > 0) {
        this.$emit('upload-error', errors.join('\n'))
      }
      
      if (validFiles.length > 0) {
        this.readMultipleFilesContent(validFiles)
      }
    },
    
    // 读取文件内容
    readFileContent(file) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target.result
          this.$emit('file-uploaded', {
            file,
            content,
            fileName: file.name,
            fileSize: file.size
          })
        } catch (error) {
          console.error('读取文件失败:', error)
          this.$emit('upload-error', '读取文件失败')
        }
      }
      
      reader.onerror = () => {
        this.$emit('upload-error', '读取文件失败')
      }
      
      reader.readAsText(file, 'UTF-8')
    },
    
    // 读取多个文件内容
    readMultipleFilesContent(files) {
      const filePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          
          reader.onload = (e) => {
            try {
              const content = e.target.result
              resolve({
                file,
                content,
                fileName: file.name,
                fileSize: file.size
              })
            } catch (error) {
              reject(new Error(`读取文件 "${file.name}" 失败: ${error.message}`))
            }
          }
          
          reader.onerror = () => {
            reject(new Error(`读取文件 "${file.name}" 失败`))
          }
          
          reader.readAsText(file, 'UTF-8')
        })
      })
      
      Promise.all(filePromises)
        .then(fileDataArray => {
          this.$emit('files-uploaded', fileDataArray)
        })
        .catch(error => {
          this.$emit('upload-error', error.message)
        })
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
.file-upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
  
  &:hover {
    border-color: #409eff;
    background-color: #f0f9ff;
  }
  
  &.drag-over {
    border-color: #409eff;
    background-color: #f0f9ff;
    transform: scale(1.02);
  }
  
  .upload-content {
    .upload-icon {
      font-size: 48px;
      color: #c0c4cc;
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
