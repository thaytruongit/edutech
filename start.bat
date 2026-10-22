@echo off
chcp 65001 >nul
title EduTech - Hoc Tot
cd /d "%~dp0"

echo === Cai dat thu vien (lan dau co the mat vai phut) ===
if not exist backend\node_modules (cd backend && call npm install && cd ..)
if not exist frontend\node_modules (cd frontend && call npm install && cd ..)

echo === Khoi dong Backend (cong 4000) ===
start "EduTech Backend" cmd /k "cd /d %~dp0backend && npm start"

echo === Khoi dong Frontend ===
start "EduTech Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host --open"

echo.
echo Xong! Trinh duyet se tu mo http://localhost:5173
echo Tai khoan: gv / hs1 / hs2  - mat khau: 123456
echo De tat: dong 2 cua so den "EduTech Backend" va "EduTech Frontend".
pause
