import request from "@/utils/request";
import { createService } from "@/utils/request";
import axios from "axios";

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
        method: "getUnOkAlarm",
        params: {},
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
      return res.data && Array.isArray(res.data.params)
        ? {
            ...res.data,
            params: res.data.params.map((item) => ({
              ...item,
              stationName: options.name,
            })),
          }
        : {};
    });
};
