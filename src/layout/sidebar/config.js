const stationList = [
  {
    acqAlarm: false,
    acqInterval: 30.0,
    acqMode: "all",
    addr: {
      ip: "10.239.238.210",
      port: 9999,
    },
    addrMode: "tcpServer",
    enableAcq: true,
    level: "devcie",
    manageStatus: "managed",
    nodeID: "20-10.239.238.210",
    tagBind: "京九线.南昌车间.南昌站",
    type: "dcqk-sys-device",
    typeLabel: "道岔缺口站机",
  },
];

const digTree = stationList.reduce((acc, item) => {
  const {
    tagBind,
    addr: { ip, port },
  } = item;
  const [line, workshop, station] = tagBind.split(".");

  // 查找是否已存在该线路
  let lineNode = acc.find((item) => item.name === line);

  if (!lineNode) {
    // 如果线路不存在，创建新的线路节点
    lineNode = {
      name: line,
      id: `line_${line}`,
      children: [],
    };
    acc.push(lineNode);
  }

  // 查找是否已存在该车间
  let workshopNode = lineNode.children.find((item) => item.name === workshop);

  if (!workshopNode) {
    // 如果车间不存在，创建新的车间节点
    workshopNode = {
      name: workshop,
      id: `workshop_${workshop}`,
      children: [],
    };
    lineNode.children.push(workshopNode);
  }

  // 添加站点节点
  const stationNode = {
    name: station,
    id: `station_${station}_${ip}`,
    ip: ip,
    port: port,
    httpport: 81,
  };
  workshopNode.children.push(stationNode);

  return acc;
}, []);

export default digTree;
