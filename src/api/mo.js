import { createService } from "@/utils/request";

// 获取缺口转辙机列表
// 返回值
// [
//   {
//      "name": "W118#J1",
//      "tag": "W118#.W118#J1"
//   }
// ]
export const requestGapZzjList = (ip, { withDev }) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "getObj",
      "params": {
        type: 'zzj',
        withDev,
        getConf: false
      },
    },
  });
}