# Points this PowerShell session (and the Gradle build) at the Android SDK installed without Android Studio.
# Dot-source it:  . .\scripts\android-env.ps1
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (-not (Test-Path (Join-Path $sdk 'platform-tools'))) { throw "Android SDK not found at $sdk. See README.md, section 'Android SDK'." }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$sdk\platform-tools;$sdk\emulator;$sdk\cmdline-tools\latest\bin;$env:Path"

# Gradle reads the SDK location from android/local.properties, which is machine-specific and not committed.
$props = Join-Path $PSScriptRoot '..\android\local.properties'
"sdk.dir=" + $sdk.Replace('\', '\\') | Set-Content -Path $props -Encoding ascii
