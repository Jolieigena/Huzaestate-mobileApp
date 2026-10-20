# Creates the "HuzaPixel" Android emulator (first run only) and starts it, then waits until it has finished booting.
#   .\scripts\emulator.ps1
. "$PSScriptRoot\android-env.ps1"
$name = 'HuzaPixel'
$image = 'system-images;android-35;google_apis;x86_64'

# How much of the screen's usable height the emulator window should take. The emulator has a smallest size it will shrink to
# (about 780 pixels tall), so on a short screen the window may end up larger than this.
$heightShare = 0.65

$existing = & emulator -list-avds 2>$null
if ($existing -notcontains $name) {
  Write-Host "Creating the $name emulator..."
  'no' | & avdmanager create avd --name $name --package $image --device 'pixel_6' --force
}

$running = & adb devices 2>$null | Select-String -Pattern 'emulator-\d+\s+device'
if (-not $running) {
  Write-Host "Starting $name..."
  # Software rendering: with the host graphics card the picture can freeze on Windows once the emulator window loses focus.
  # -no-snapshot-load starts it fresh each time so a saved frozen state is never restored.
  Start-Process -FilePath (Join-Path $env:ANDROID_HOME 'emulator\emulator.exe') -ArgumentList '-avd', $name, '-netdelay', 'none', '-netspeed', 'full', '-no-boot-anim', '-gpu', 'swiftshader_indirect', '-no-snapshot-load' | Out-Null
}

& adb wait-for-device
do {
  Start-Sleep -Seconds 3
  $booted = (& adb shell getprop sys.boot_completed 2>$null) -join ''
} until ($booted.Trim() -eq '1')

# The phone is 2400 pixels tall; at its default size the window can be taller than a laptop screen and end up mostly off it
# (Windows display scaling hides this from programs that are not scaling-aware, so everything here is measured in real pixels).
# Size the window to a share of the screen and put it in the top-right corner, fully on screen.
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class EmuWin {
  public delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr p);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool SystemParametersInfo(uint action, uint param, out RECT r, uint flags);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
}
"@ -ErrorAction SilentlyContinue
[void][EmuWin]::SetProcessDPIAware()
$work = New-Object EmuWin+RECT
[void][EmuWin]::SystemParametersInfo(0x30, 0, [ref]$work, 0)   # the screen minus the taskbar
$script:hwnd = [IntPtr]::Zero
$deadline = (Get-Date).AddSeconds(30)
while ($script:hwnd -eq [IntPtr]::Zero -and (Get-Date) -lt $deadline) {
  [EmuWin]::EnumWindows({ param($h, $p) $sb = New-Object Text.StringBuilder 256; [void][EmuWin]::GetWindowText($h, $sb, 256); if ($sb.ToString() -like "Android Emulator - $name*") { $script:hwnd = $h }; return $true }, [IntPtr]::Zero) | Out-Null
  if ($script:hwnd -eq [IntPtr]::Zero) { Start-Sleep -Seconds 1 }
}
if ($script:hwnd -ne [IntPtr]::Zero) {
  $r = New-Object EmuWin+RECT
  [void][EmuWin]::GetWindowRect($script:hwnd, [ref]$r)
  $ratio = ($r.R - $r.L) / ($r.B - $r.T)
  $height = [int](($work.B - $work.T) * $heightShare)
  $width = [int]($height * $ratio)
  [void][EmuWin]::SetWindowPos($script:hwnd, [IntPtr]::Zero, ($work.R - $width - 20), ($work.T + 20), $width, $height, 0x44)   # keep stacking order, show
  Start-Sleep -Milliseconds 800
  # The emulator keeps its own smallest size, so read back what it settled on and make sure the window is inside the screen.
  [void][EmuWin]::GetWindowRect($script:hwnd, [ref]$r)
  [void][EmuWin]::SetWindowPos($script:hwnd, [IntPtr]::Zero, ($work.R - ($r.R - $r.L) - 20), ($work.T + 20), 0, 0, 0x45)   # move only
}
Write-Host 'Emulator is ready.'
