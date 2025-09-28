import { createService } from "@/utils/request";

// 获取阻力详细数据
// 请求：
// http://localhost:81/api/get_zhuanhuan_curve?name=D2701J1&curve_type=1&move_direct=1&time_range=2024-03-27+04:20:33

// 返回值
// {
//   "data": {
//       "title": "扳动曲线：右→左(伸出)",
//       "name": "D2701J1",
//       "curve_type": 1,
//       "move_direct": 1,
//       "time": "2024-03-27 04:20:33",
//       "subtext": "温度25.0℃",
//       "unit": "阻力:N(最大值=2566.0N 参考曲线(2024-03-28 14:39:58 最大值=2737.0N))",
//       "xData": [0, 1, ...],
//       "curve_data": [
//           {
//               "name": "参考曲线",
//               "color": "blue",
//               "data": [0, 1, ...]
//           },
//           {
//               "name": "阻力曲线",
//               "color": "green",
//               "data": [0, 1, ...]
//           },
//           {
//               "name": "电流曲线",
//               "color": "#808000",
//               "data": [0, 1, ...]
//           },
//           {
//               "name": "原始曲线",
//               "color": "#8a2ce2",
//               "data": [0, 1, ...]
//           }
//       ],
//       "markArea": [
//           {
//               "name": "解锁前",
//               "color": "rgba(255, 255, 255,0.6)",
//               "start": "-1000",
//               "end": "0"
//           },
//           ...
//       ],
//       "global_line": [],
//       "area": {},
//       "max": 6000
//   },
//   "code": 200,
//   "msg": ""
// }
export const requestResistanceDetail = (ip, { name, move_direct, time_range }) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/get_zhuanhuan_curve`,
    method: "get",
    params: {
      name,
      curve_type: 1,
      move_direct,
      time_range,
    },
  });
}