import request from "@/utils/request";
import { createService } from "@/utils/request";
import axios from "axios";

// 确认报警 {"user":"","jsonrpc":"2.0","method":"ackAlarm","params":{"uuid":"2025-09-25 12:44:221#.1#J4油压油位采集设备故障未知无位置","ackInfo":"123","time":"2025-09-25 12:44:22","tag":"1#.1#J4","type":"油压油位采集设备故障"},"id":1}
export const requestSimialrAlarm = (
  ip,
  options = { uuid, port: 81, timeout: 10000, name: "" }
) => {
  return axios
    .post(
      `http://${ip}:${options.port || 81}/api/rpc`,
      {
        jsonrpc: "2.0",
        method: "getUnOkHisAlarm",
        params: {
          uuid: options.uuid,
        },
      },
      {
        timeout: options.timeout || 10000, // 10秒超时
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      return res.data;
    });
};

export const requestAckAlarm = (
  ip,
  options = {
    type,
    tag,
    ackInfo,
    time,
    uuid,
    ackType,
    port: 81,
    timeout: 10000,
    name: "",
  }
) => {
  return axios
    .post(
      `http://${ip}:${options.port || 81}/api/rpc`,
      {
        jsonrpc: "2.0",
        method: "ackAlarm",
        params: {
          tag: options.tag,
          ackInfo: options.ackInfo,
          time: options.time,
          type: options.type,
          uuid: options.uuid,
          ...(typeof options.ackType === "number"
            ? { ackType: Number(options.ackType) }
            : { ackType: 0 }),
        },
      },
      {
        timeout: options.timeout || 10000, // 10秒超时
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      return res.data;
    });
};

// 获取当前报警
export const requestUnackAlarmList = (
  ip,
  options = { port: 81, timeout: 10000, name: "" }
) => {
  console.log("-------------------ip", ip);
  return axios
    .post(
      `http://${ip}:${options.port || 81}/api/rpc`,
      {
        jsonrpc: "2.0",
        method: "getAlarmCurrent",
        params: {
          tag: "*",
          "d-sort": "time",
          isAck: false,
        },
        id: new Date().getTime(),
      },
      {
        timeout: options.timeout || 10000, // 10秒超时
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      console.log("res", res.data);
      return res.data && Array.isArray(res.data.result)
        ? {
            ...res.data,
            params: res.data.result.map((item) => ({
              ...item,
              stationName: options.name,
            })),
          }
        : {};
    });
};
