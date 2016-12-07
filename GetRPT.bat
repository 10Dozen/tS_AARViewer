cls
@echo off
setlocal

: Configure output
set sourcefolder=%userprofile%\AppData\Local\Arma 3
set destfolder=D:\Workstation\1\1\

: Do not modify
echo "Copying..."
XCOPY %sourcefolder%\*.rpt %destfolder%  /F
echo "Done..."
