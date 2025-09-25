import { createService } from "@/utils/request";
import request from '@/utils/request'

// 获取系统配置
export const requestProjectConf = (ip, data) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "getProjectConf",
      "params": data,
    },
  });
}


export const requestSetProjectConf = (ip, data) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "setProjectConf",
      "params": data,
    },
  });
}

export const requestConfEncodeFile = (ip, data) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "getConfEncodeFile",
      "params": data,
    },
  });
}

export const requestSetConfFile = (ip, data) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "setConfFile",
      "params": data,
    },
  });
}

export const getStationList = () => {
  return request({
    url: `/rpc`,
    method: "post",
    data: {
      jsonrpc: '2.0',
      method: 'getStationTree',
      id: 1,
     },
  });
}

export const requestGetSystemInfo = (ip) => {
  const customRequest = createService(ip, '81', false, 1000);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "getSystemInfo",
      "params": {},
    },
  });
}


export const requestUpgradeVersion = (ip, data) => {
  const customRequest = createService(ip, '81', false, 60000);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "UpgradeVersion",
      "params": data,
    },
  });
}


export const requestUpTopoVer = (ip) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      jsonrpc: '2.0',
      method: 'upgradeTopoVer1',
     },
  });
}