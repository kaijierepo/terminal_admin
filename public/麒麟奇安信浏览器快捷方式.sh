#!/bin/bash

# 设置字符编码
export LANG=zh_CN.UTF-8

# 脚本当前目录
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "当前目录: $CURRENT_DIR"

# 查找奇安信浏览器路径
echo "正在查找奇安信浏览器..."

BROWSER_PATH=""
POSSIBLE_PATHS=(
    "/usr/bin/qaxbrowser"
    "/opt/qianxin.com/qaxbrowser/qaxbrowser"
	"/opt/qaxbrowser/qaxbrowser"
    "/usr/local/bin/qaxbrowser"
    "/opt/QAXBrowser/qaxbrowser"
    "$HOME/.local/bin/qaxbrowser"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ] && [ -x "$path" ]; then
        BROWSER_PATH="$path"
        echo "找到奇安信浏览器: $BROWSER_PATH"
        break
    fi
done

# 如果自动查找失败，尝试使用which命令
if [ -z "$BROWSER_PATH" ]; then
    BROWSER_PATH=$(which qaxbrowser 2>/dev/null)
    if [ -n "$BROWSER_PATH" ]; then
        echo "使用which找到奇安信浏览器: $BROWSER_PATH"
    fi
fi

# 如果还是找不到，提示用户手动输入
if [ -z "$BROWSER_PATH" ]; then
    echo "未自动找到奇安信浏览器，请手动输入路径"
    echo "常见路径: /usr/bin/qaxbrowser 或 /opt/qaxbrowser/qaxbrowser"
    read -p "请输入奇安信浏览器完整路径: " BROWSER_PATH
    
    if [ ! -f "$BROWSER_PATH" ] || [ ! -x "$BROWSER_PATH" ]; then
        echo "错误: 指定的路径不存在或不可执行"
        exit 1
    fi
fi

# 设置图标路径
ICON_PATH="$CURRENT_DIR/SAP.ico"
# 如果ico文件不存在，尝试png格式（Linux更常用）
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="$CURRENT_DIR/SAP.png"
    if [ ! -f "$ICON_PATH" ]; then
        echo "警告: 未找到SAP.ico或SAP.png图标文件"
        # 使用浏览器自带图标
        ICON_PATH="$BROWSER_PATH"
    fi
fi

# 桌面文件内容
DESKTOP_CONTENT="[Desktop Entry]
Version=1.0
Type=Application
Name=JHD
Comment=使用奇安信浏览器运行本地Web应用
Exec=\"$BROWSER_PATH\" --app=file://$CURRENT_DIR/index.html
Icon=$ICON_PATH
Path=$CURRENT_DIR
Terminal=false
StartupWMClass=qaxbrowser
Categories=Network;WebBrowser;
MimeType=text/html;text/xml;application/xhtml+xml;"

# 桌面文件路径
DESKTOP_FILE="$HOME/桌面/JHD.desktop"

# 写入桌面文件
echo "$DESKTOP_CONTENT" > "$DESKTOP_FILE"

# 给桌面文件添加执行权限
chmod +x "$DESKTOP_FILE"

if [ -f "$DESKTOP_FILE" ]; then
    echo "成功！快捷方式已创建在桌面: $DESKTOP_FILE"
    echo "如果双击无法运行，请尝试右键选择'允许启动'"
else
    echo "错误：快捷方式创建失败"
    exit 1
fi

echo "脚本执行完成"
