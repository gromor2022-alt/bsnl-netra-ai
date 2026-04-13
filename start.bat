@echo off

cd backend
start cmd /k node src/app.js

timeout /t 3

start http://localhost:5000