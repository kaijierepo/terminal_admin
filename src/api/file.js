// 上传文件接口 - 使用FormData格式和axios
import { createRequestByIP, createService } from '../utils/request';

export const requestUploadFile = (ip, port, data) => {
  const { fileName, file, dir } = data;
  
  // 创建FormData对象
  const formData = new FormData();
  formData.append('file', file, fileName);
  
  // 使用createRequestByIP创建请求实例
  const request = createRequestByIP(ip, port, 60000);
  
  // 构建上传URL路径
  const uploadPath = `/UploadFiles/${dir}/${fileName}`;
  
  return request.post(uploadPath, formData, {
    headers: {
      // 不设置Content-Type，让axios自动处理FormData
    }
  }).then(response => {
    console.log('上传成功，响应数据:', response);
    return response;
  }).catch(error => {
    console.error('上传文件失败:', error);
    throw error;
  });
}

// 请求参数：
// {
//   "dir": "/cfg/SSData04/202508/01/W118%23/W118%23J1/扳动录像/",
//   "items": [
//       "132803.avi_mv.mp3",
//       "135333.avi_mv.mp3"
//   ]
// }
export const requestFilesDownload = (ip, data) => {
  const customRequest = createService(ip);
  return customRequest({
    url: `/ZipFiles`,
    method: "post",
    data,
    responseType: 'blob' // 设置响应类型为blob
  });
}
