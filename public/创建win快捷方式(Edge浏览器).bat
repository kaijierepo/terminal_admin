@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 正在自动检测Microsoft Edge安装路径...

set "EdgePath="

REM 从注册表获取Edge路径（主要方法）
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" /ve 2^>nul') do (
    set "EdgePath=%%b"
)

REM 如果找不到，尝试常见安装路径
if not defined EdgePath (
    if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
        set "EdgePath=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    ) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
        set "EdgePath=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    )
)

REM 尝试从用户级别注册表查找
if not defined EdgePath (
    for /f "tokens=2*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe" /ve 2^>nul') do (
        set "EdgePath=%%b"
    )
)

if defined EdgePath (
    echo 成功找到Edge路径: !EdgePath!
) else (
    echo 错误: 未找到Microsoft Edge浏览器，请手动安装或指定路径。
    goto :manual_input
)

goto :create_shortcut

:manual_input
echo.
echo 请手动输入Edge浏览器的完整路径：
set /p "EdgePath=例如: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe : "
if not exist "%EdgePath%" (
    echo 错误: 指定的路径不存在!
    pause
    exit /b 1
)

:create_shortcut
REM 获取当前批处理文件所在的目录
set "CurrentDir=%~dp0"
if "%CurrentDir:~-1%"=="\" set "CurrentDir=%CurrentDir:~0,-1%"

REM 设置图标路径（当前目录下的SAP.ico）
set "IconPath=%CurrentDir%\SAP.ico"

REM 检查图标文件是否存在
if not exist "%IconPath%" (
    echo 警告: 未找到图标文件 SAP.ico，将使用Edge默认图标。
    set "IconPath=%EdgePath%,0"
) else (
    echo 找到图标文件: %IconPath%
)

set "LnkName=JHD"
set "LnkPath=%USERPROFILE%\Desktop\%LnkName%.lnk"

echo.
echo 正在创建快捷方式...

set "vbsFile=%temp%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%vbsFile%"
echo sLinkFile = "%LnkPath%" >> "%vbsFile%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%vbsFile%"
echo oLink.TargetPath = "%EdgePath%" >> "%vbsFile%"
echo oLink.Arguments = "--app=file:///%CurrentDir:/=\%/index.html" >> "%vbsFile%"
echo oLink.WorkingDirectory = "%CurrentDir%" >> "%vbsFile%"
echo oLink.IconLocation = "%IconPath%" >> "%vbsFile%"
echo oLink.Save >> "%vbsFile%"

cscript //nologo "%vbsFile%"
del "%vbsFile%" >nul 2>&1

if exist "%LnkPath%" (
    echo 成功！Edge应用快捷方式已创建在桌面。
    echo 使用的图标: %IconPath%
) else (
    echo 错误：快捷方式创建失败。
)

pause