import { createService } from "@/utils/request";

// 请求动作曲线: 电参数电流列表
// 请求完整参数：
// {
//     "jsonrpc": "2.0",
//     "method": "db.select",
//     "params": {
//         "tag": [
//             "1#.1#J2.电参数.p"
//         ],
//         "deType": "curveIdx",
//         "time": "2025-10-15"
//     },
//     "id": 1
// }
// 获取某个月下的天数列表
// 返回值：
// [
//     {
//         "file": {
//         "type": "curve"
//         },
//         "move_direct": 0,
//         "alarmLevel": 0,
//         "time": "2025-10-15 17:33:14.000",
//         "tag": "1#.1#J2.电参数.p"
//     }
// ]

export const requestEPCurrentList = (ip, { tag, time }) => {
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
                deType: "curveIdx",
            },
        },
    });
}

export const requestEPCurrentCurve = (ip, { tag, time }) => {
    const customRequest = createService(ip);
    return customRequest({
        url: `/rpc`,
        method: "post",
        data: {
            "jsonrpc": "2.0",
            "method": "db.select",
            "params": {
                rootTag: `${tag}.电参数`,
                tag: [
                    "Ia",
                    "Ib",
                    "Ic"
                ],
                time,
                deType: "curve"
            },
        },
    });
}