import { createService } from "@/utils/request";

// 请求完整参数：
// {
//   "jsonrpc": "2.0",
//   "method": "db.select",
//   "params": {
//      "tag": "W118#.W118#J1.扳动录像",
//      "time": "2025-08",
//      "aggr": "count",
//       "groupby": "day",
//      "d-sort": "time"
//   }
// }
// 获取某个月下的天数列表
// 返回值：
// [
//   {
//      "time": "2025-08-01",
//      "count": 44,
//      "tag": ""
//   }
// ]

export const requestDBDayList = (ip, { tag, time }) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "db.select",
      "params": {
        tag,
        time,
        groupby: 'day',
        aggr: 'count',
        'd-sort': 'time',
      },
    },
  });
}

// 请求参数：
// {
//   "jsonrpc": "2.0",
//   "method": "db.select",
//   "params": {
//      "tag": "W118#.W118#J1.扳动录像",
//      "time": "2025-08-01",
//      "d-sort": "time"
//   }
// }
// 返回：
// [
//   {
//      "data_attr": {
//         "name": "switch_dir",
//         "label": "转换方向",
//         "tag": "",
//         "value": "定到反"
//      },
//      "time": "2025-08-01 15:13:25.000",
//      "tag": "W118#.W118#J1.扳动录像"
//   },
// ]
export const requestDBData = (ip, { tag, time }) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/rpc`,
    method: "post",
    data: {
      "jsonrpc": "2.0",
      "method": "db.select",
      "params": {
        tag,
        time,
        'd-sort': 'time',
      },
    },
  });
}