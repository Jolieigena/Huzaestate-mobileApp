# Runs the app on the Android emulator against the website running on this computer.
#   .\scripts\dev.ps1
# Needs the website and its backend to be running, as they are with the project's Docker setup.
. "$PSScriptRoot\android-env.ps1"
& "$PSScriptRoot\emulator.ps1"

# The emulator's "localhost" is the emulator itself. These forward the ports the website uses to this computer, so the website
# works inside the app with no change:
#   8085 the website   8081 its API   9000 the listing photos (MinIO)   8082 Metro, the JavaScript server for this app
# (Metro uses 8082 because 8081 is already the API.)
foreach ($port in 8085, 8081, 9000, 8082) { & adb reverse "tcp:$port" "tcp:$port" | Out-Null }

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

# Metro runs from the real project folder (it needs the real paths) in its own window.
if (-not (Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', "Set-Location '$root'; npx react-native start --port 8082"
}

# Windows stops the native (C++) build at 260-character paths, and this project's folder is deep. The build therefore runs from a
# short drive letter that points at the same folder.
if (-not ((& subst) -match '^H:\\')) { & subst H: $root }
Set-Location 'H:\android'
# Only the emulator's processor type is built while developing (about four times faster); release builds include them all.
.\gradlew.bat app:installDebug '-PreactNativeDevServerPort=8082' '-PreactNativeArchitectures=x86_64'
if ($LASTEXITCODE -ne 0) { throw 'The build failed.' }

& adb shell am force-stop com.huzaestate
& adb shell am start -n com.huzaestate/.MainActivity
