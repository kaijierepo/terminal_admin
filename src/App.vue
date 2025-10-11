<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

// 语音合成状态
const isPlaying = ref(false)
const isMuted = ref(false)
const currentText = ref('')
const speechSynthesis = window.speechSynthesis
let currentUtterance: SpeechSynthesisUtterance | null = null

// 语音合成配置
const speechConfig = {
  rate: 1,        // 语速
  pitch: 1,       // 音调
  volume: 0.8,    // 音量
  lang: 'zh-CN'   // 语言
}

// 创建语音合成实例
const createUtterance = (text: string) => {
  if (currentUtterance) {
    speechSynthesis.cancel()
  }
  
  currentUtterance = new SpeechSynthesisUtterance(text)
  currentUtterance.rate = speechConfig.rate
  currentUtterance.pitch = speechConfig.pitch
  currentUtterance.volume = isMuted.value ? 0 : speechConfig.volume
  currentUtterance.lang = speechConfig.lang
  
  // 播放开始事件
  currentUtterance.onstart = () => {
    isPlaying.value = true
    console.log('语音播放开始')
  }
  
  // 播放结束事件
  currentUtterance.onend = () => {
    isPlaying.value = false
    console.log('语音播放结束')
  }
  
  // 播放错误事件
  currentUtterance.onerror = (event) => {
    isPlaying.value = false
    console.error('语音播放错误:', event.error)
  }
  
  return currentUtterance
}

// 播放语音
const playSpeech = (text: string) => {
  if (!text || text.trim() === '') {
    console.warn('播放文本为空')
    return
  }
  
  // 如果当前有播放，先停止
  if (isPlaying.value) {
    stopSpeech()
  }
  
  currentText.value = text
  console.log('currentText', currentText.value)
  const utterance = createUtterance(text)
  speechSynthesis.speak(utterance)
}

// 停止语音
const stopSpeech = () => {
  speechSynthesis.cancel()
  isPlaying.value = false
  currentUtterance = null
}

// 暂停语音
const pauseSpeech = () => {
  if (isPlaying.value) {
    speechSynthesis.pause()
    isPlaying.value = false
  }
}

// 恢复语音
const resumeSpeech = () => {
  if (!isPlaying.value && currentUtterance) {
    speechSynthesis.resume()
    isPlaying.value = true
  }
}

// 切换静音
const toggleMute = () => {
  isMuted.value = !isMuted.value
  
  if (currentUtterance) {
    currentUtterance.volume = isMuted.value ? 0 : speechConfig.volume
  }
  
  console.log('静音状态:', isMuted.value ? '已静音' : '取消静音')
}

// 设置语音参数
const setSpeechConfig = (config: Partial<typeof speechConfig>) => {
  Object.assign(speechConfig, config)
  console.log('语音配置已更新:', speechConfig)
}

// 获取可用语音列表
const getVoices = () => {
  return speechSynthesis.getVoices()
}

// 设置语音
const setVoice = (voiceName: string) => {
  const voices = getVoices()
  const voice = voices.find(v => v.name === voiceName)
  if (voice && currentUtterance) {
    currentUtterance.voice = voice
    console.log('语音已设置为:', voiceName)
  }
}

// 监测文本变化并自动播放
const watchTextAndPlay = (text: string) => {
  if (text !== currentText.value) {
    console.log('检测到文本变化，自动播放新文本')
    playSpeech(text)
  }
}

// 全局API对象
const speechAPI = {
  // 基础控制
  play: playSpeech,
  stop: stopSpeech,
  pause: pauseSpeech,
  resume: resumeSpeech,
  toggleMute,
  
  // 状态查询
  isPlaying: () => isPlaying.value,
  isMuted: () => isMuted.value,
  getCurrentText: () => currentText.value,
  
  // 配置管理
  setConfig: setSpeechConfig,
  getConfig: () => ({ ...speechConfig }),
  
  // 语音管理
  getVoices,
  setVoice,
  
  // 自动播放
  watchAndPlay: watchTextAndPlay,
  
  // 批量播放
  playQueue: (texts: string[]) => {
    if (!texts || texts.length === 0) {
      console.warn('播放队列为空')
      return
    }
    
    // 使用闭包变量来跟踪当前队列
    const queueId = Date.now()
    let currentIndex = 0
    let isQueueCancelled = false
    
    console.log(`\n🆕 创建新播放队列 #${queueId}，共 ${texts.length} 条`)
    
    const playNext = () => {
      // 检查队列是否已取消
      if (isQueueCancelled) {
        console.log(`❌ 队列 #${queueId} 已取消`)
        return
      }
      
      // 检查索引是否越界
      if (currentIndex >= texts.length) {
        console.log(`🎉 队列 #${queueId} 播放完成`)
        isPlaying.value = false
        currentUtterance = null
        return
      }
      
      const text = texts[currentIndex]
      const index = currentIndex
      const startTime = new Date().toLocaleTimeString()
      console.log(`\n🎵 [队列#${queueId}] 准备播放 [${index + 1}/${texts.length}] - ${startTime}`)
      console.log(`   内容: ${text}`)
      console.log(`   长度: ${text.length} 字符`)
      
      // 创建新的 utterance
      currentText.value = text
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speechConfig.rate
      utterance.pitch = speechConfig.pitch
      utterance.volume = isMuted.value ? 0 : speechConfig.volume
      utterance.lang = speechConfig.lang
      
      currentUtterance = utterance
      
      // 播放开始事件
      utterance.onstart = () => {
        if (isQueueCancelled) return
        isPlaying.value = true
        const actualStartTime = new Date().toLocaleTimeString()
        console.log(`▶️  [队列#${queueId}] 开始播放 [${index + 1}/${texts.length}] - ${actualStartTime}`)
      }
      
      // 播放结束事件
      utterance.onend = () => {
        if (isQueueCancelled) return
        
        isPlaying.value = false
        const endTime = new Date().toLocaleTimeString()
        console.log(`✅ [队列#${queueId}] 播放完成 [${index + 1}/${texts.length}] - ${endTime}`)
        
        // 移动到下一个
        currentIndex++
        
        // 延迟后播放下一个
        if (currentIndex < texts.length) {
          console.log(`⏳ [队列#${queueId}] 等待后播放下一条...`)
          // 使用较短的延迟，因为 onend 已经在播放完成后触发了
          setTimeout(() => {
            if (!isQueueCancelled) {
              playNext()
            }
          }, 500)
        } else {
          console.log(`🎉 [队列#${queueId}] 所有播放完成`)
          currentUtterance = null
        }
      }
      
      // 播放错误事件
      utterance.onerror = (event) => {
        if (isQueueCancelled) return
        
        isPlaying.value = false
        console.error(`❌ [队列#${queueId}] 播放错误 [${index + 1}/${texts.length}]:`, event.error)
        
        // 出错时移动到下一个
        currentIndex++
        
        if (currentIndex < texts.length) {
          setTimeout(() => {
            if (!isQueueCancelled) {
              playNext()
            }
          }, 300)
        } else {
          currentUtterance = null
        }
      }
      
      // 开始播放
      try {
        // 先取消之前所有的播放
        speechSynthesis.cancel()
        // 等待一小段时间确保取消完成
        setTimeout(() => {
          if (!isQueueCancelled) {
            speechSynthesis.speak(utterance)
          }
        }, 100)
      } catch (error) {
        console.error(`❌ [队列#${queueId}] 播放失败:`, error)
        currentIndex++
        if (currentIndex < texts.length) {
          setTimeout(() => playNext(), 300)
        }
      }
    }
    
    // 开始播放队列
    playNext()
    
    // 返回一个取消函数
    return () => {
      console.log(`🛑 取消队列 #${queueId}`)
      isQueueCancelled = true
      speechSynthesis.cancel()
      isPlaying.value = false
      currentUtterance = null
    }
  }
}

// 暴露到全局
onMounted(() => {
  // 将API暴露到window对象
  ;(window as any).speechAPI = speechAPI
  
  console.log('语音合成API已加载到 window.speechAPI')
  console.log('可用方法:', Object.keys(speechAPI))
})

// 组件卸载时清理
onUnmounted(() => {
  stopSpeech()
  delete (window as any).speechAPI
})

// 监听静音状态变化
watch(isMuted, (newVal) => {
  if (currentUtterance) {
    currentUtterance.volume = newVal ? 0 : speechConfig.volume
  }
})
</script>

<template>
  <router-view/>
</template>

<style scoped>
body {
  margin: 0;
}
</style>
