@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 正在自动检测Chrome安装路径...

set "ChromePath="

REM 方法1: 从注册表获取Chrome路径（常规安装）
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
    set "ChromePath=%%b"
)

REM 方法2: 如果方法1失败，尝试从Wow6432Node查找（32位系统）
if not defined ChromePath (
    for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
        set "ChromePath=%%b"
    )
)

REM 方法3: 尝试从用户级别的注册表查找
if not defined ChromePath (
    for /f "tokens=2*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
        set "ChromePath=%%b"
    )
)

REM 方法4: 如果注册表都找不到，尝试常见安装路径
if not defined ChromePath (
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        set "ChromePath=C:\Program Files\Google\Chrome\Application\chrome.exe"
    ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
        set "ChromePath=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    )
)

if defined ChromePath (
    echo 成功找到Chrome路径: !ChromePath!
) else (
    echo 错误: 未找到Chrome浏览器，请手动安装或指定路径。
    goto :manual_input
)

goto :create_shortcut

:manual_input
echo.
echo 请手动输入Chrome浏览器的完整路径：
set /p "ChromePath=例如: C:\Program Files\Google\Chrome\Application\chrome.exe : "
if not exist "%ChromePath%" (
    echo 错误: 指定的路径不存在!
    pause
    exit /b 1
)

:create_shortcut

REM 获取当前批处理文件所在的目录
set "CurrentDir=%~dp0"
REM 去掉路径末尾的反斜杠（为了美观）
if "%CurrentDir:~-1%"=="\" set "CurrentDir=%CurrentDir:~0,-1%"

REM 设置图标路径（当前目录下的SAP.ico）
set "IconPath=%CurrentDir%\SAP.ico"

REM 检查图标文件是否存在
if not exist "%IconPath%" (
    echo 警告: 未找到图标文件 SAP.ico，将使用Chrome默认图标。
    set "IconPath=%ChromePath%,0"
) else (
    echo 找到图标文件: %IconPath%
)

REM 设置快捷方式的名称（将显示在桌面上的名字）
set "LnkName=JHD"

REM 设置快捷方式的完整路径（保存在桌面）
set "LnkPath=%USERPROFILE%\Desktop\%LnkName%.lnk"

REM 组合成最终要运行的完整命令
set "FullCommand="%ChromePath%" -app=file:///%CurrentDir%/index.html"

echo 正在创建快捷方式到桌面...
echo 目标： %FullCommand%

REM 使用VBScript来创建快捷方式，这是最可靠的方法
set "vbsFile=%temp%\create_shortcut.vbs"

REM 将VBScript命令写入临时文件
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%vbsFile%"
echo sLinkFile = "%LnkPath%" >> "%vbsFile%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%vbsFile%"
echo oLink.TargetPath = "%ChromePath%" >> "%vbsFile%"
echo oLink.Arguments = "-app=file:///%CurrentDir:/=\%/index.html" >> "%vbsFile%"
echo oLink.WorkingDirectory = "%CurrentDir%" >> "%vbsFile%"
echo oLink.IconLocation = "%IconPath%" >> "%vbsFile%"
echo oLink.Save >> "%vbsFile%"

REM 执行VBScript
cscript //nologo "%vbsFile%"

REM 删除临时VBScript文件
del "%vbsFile%" >nul 2>&1

if exist "%LnkPath%" (
    echo 成功！快捷方式已创建在桌面。
) else (
    echo 错误：快捷方式创建失败。
)

pause