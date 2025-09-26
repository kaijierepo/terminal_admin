import { defineStore } from "pinia";
import dayjs from "dayjs";

export const useAlarmStore = defineStore("alarm", {
  state: () => ({
    // 未确认报警列表
    unackAlarms: [],
    // 全局消音状态
    globalMute: false,
    // 语音时间戳（用于标记旧报警为消音状态）
    voiceTimestamp: null,
    // 循环播放状态
    isLoopPlaying: false,
    // 播放间隔（毫秒）
    playInterval: 5000, // 5秒间隔
    // 播放定时器
    playTimer: null,
  }),

  getters: {
    // 获取未确认报警数量
    unackAlarmCount: (state) => state.unackAlarms.length,

    // 获取需要语音播报的报警（基于voiceTimestamp筛选）
    voiceAlarms: (state) => {
      if (!state.voiceTimestamp) {
        // 没有设置语音时间戳，返回所有报警
        return state.unackAlarms;
      }
      
      return state.unackAlarms.filter((alarm) => {
        if (!alarm.time) return true; // 没有时间信息的报警也播放
        
        const alarmTime = dayjs(alarm.time || alarm.timestamp).valueOf();
        // 只播放时间晚于或等于语音时间戳的报警
        return alarmTime >= state.voiceTimestamp;
      });
    },

    // 获取消音的报警（早于voiceTimestamp的报警）
    mutedAlarms: (state) => {
      if (!state.voiceTimestamp) {
        return [];
      }
      
      return state.unackAlarms.filter((alarm) => {
        if (!alarm.time) return false;
        
        const alarmTime = dayjs(alarm.time || alarm.timestamp).valueOf();
        // 时间早于语音时间戳的报警为消音状态
        return alarmTime < state.voiceTimestamp;
      });
    },
  },

  actions: {
    // 更新未确认报警列表
    updateUnackAlarms(newAlarms) {
      console.log("更新未确认报警列表:", newAlarms);
      console.log(
        "语音时间戳:",
        this.voiceTimestamp
          ? new Date(this.voiceTimestamp).toLocaleString()
          : "未设置"
      );

      // 直接更新报警列表，不需要处理 noVoice 字段
      this.unackAlarms = newAlarms;
    },


    // 切换全局消音状态
    toggleGlobalMute() {
      this.globalMute = !this.globalMute;
      console.log("全局消音状态:", this.globalMute ? "已开启" : "已关闭");
    },

    // 设置语音时间戳
    setVoiceTimestamp() {
      this.voiceTimestamp = Date.now();
      // 保存到 localStorage
      localStorage.setItem("voiceTimestamp", this.voiceTimestamp.toString());
      console.log(
        "语音时间戳已设置:",
        new Date(this.voiceTimestamp).toLocaleString()
      );
    },

    // 清除语音时间戳
    clearVoiceTimestamp() {
      this.voiceTimestamp = null;
      // 从 localStorage 中移除
      localStorage.removeItem("voiceTimestamp");
      console.log("语音时间戳已清除");
    },

    // 从 localStorage 加载语音时间戳
    loadVoiceTimestamp() {
      const stored = localStorage.getItem("voiceTimestamp");
      if (stored) {
        this.voiceTimestamp = parseInt(stored, 10);
        console.log(
          "从 localStorage 加载语音时间戳:",
          new Date(this.voiceTimestamp).toLocaleString()
        );
      }
    },


    // 清除所有未确认报警
    clearAllUnackAlarms() {
      this.unackAlarms = [];
      console.log("已清除所有未确认报警");
    },

    // 获取需要语音播报的报警文本
    getVoiceAlarmTexts() {
      return this.voiceAlarms.map((alarm) => {
        const stationName = alarm.stationName || alarm.station || "未知站点";
        const alarmType = alarm.alarmType || alarm.type || "未知类型";
        const time = alarm.time || alarm.timestamp || "无时间";
        const tag = alarm.tag || alarm.device || "未知设备";

        return `${stationName}${tag}${time}发生${alarmType}`
          .replace(/#/g, "号")
          .replace(/X/g, "心")
          .replace(/J/g, "尖");
      });
    },

    // 播放所有需要播报的报警
    playVoiceAlarms() {
      if (this.globalMute) {
        console.log("全局消音已开启，跳过语音播报");
        return;
      }

      const voiceTexts = this.getVoiceAlarmTexts();
      if (voiceTexts.length > 0) {
        // console.log("开始播放报警语音:", voiceTexts);

        // 使用全局语音API播放
        if (window.speechAPI) {
          window.speechAPI.playQueue(voiceTexts);
        } else {
          console.warn("语音API未加载");
        }
      } else {
        console.log("没有需要播报的报警");
      }
    },

    // 开始循环播放
    startLoopPlayback() {
      if (this.isLoopPlaying) {
        console.log("循环播放已在进行中");
        return;
      }

      // 确保清理之前的定时器
      if (this.playTimer) {
        clearInterval(this.playTimer);
        this.playTimer = null;
      }

      this.isLoopPlaying = true;
      console.log("开始循环播放报警语音");

      // 立即播放一次
      this.playVoiceAlarms();

      // 设置定时器循环播放
      this.playTimer = setInterval(() => {
        if (this.voiceAlarms.length > 0 && !this.globalMute) {
          this.playVoiceAlarms();
        } else if (this.voiceAlarms.length === 0) {
          // 没有需要播放的报警，停止循环
          this.stopLoopPlayback();
        }
      }, this.playInterval);
    },

    // 停止循环播放
    stopLoopPlayback() {
      if (this.playTimer) {
        clearInterval(this.playTimer);
        this.playTimer = null;
      }
      this.isLoopPlaying = false;
      console.log("停止循环播放报警语音");
    },

    // 设置播放间隔
    setPlayInterval(interval) {
      this.playInterval = interval;
      console.log(`播放间隔设置为: ${interval}ms`);
      
      // 如果正在循环播放，重新启动以应用新间隔
      if (this.isLoopPlaying) {
        this.stopLoopPlayback();
        this.startLoopPlayback();
      }
    },

  },
});
