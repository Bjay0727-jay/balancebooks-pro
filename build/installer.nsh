; Custom NSIS installer script for Balance Books Pro
; This script handles killing processes before uninstall

!macro customUnInit
  ; Kill any running Balance Books Pro processes before uninstall
  nsExec::ExecToLog 'taskkill /F /IM "Balance Books Pro.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "balance-books-pro.exe"'
  
  ; Wait a moment for processes to terminate
  Sleep 1000
!macroend

!macro customInstall
  ; Kill any running instances before installing (for upgrades)
  nsExec::ExecToLog 'taskkill /F /IM "Balance Books Pro.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "balance-books-pro.exe"'
  
  ; Wait for processes to terminate
  Sleep 500
!macroend

!macro customUnInstall
  ; Final cleanup - ensure processes are killed
  nsExec::ExecToLog 'taskkill /F /IM "Balance Books Pro.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "balance-books-pro.exe"'
  
  ; Clean up any remaining user data if requested
  ; The deleteAppDataOnUninstall option handles the main data folder
!macroend
