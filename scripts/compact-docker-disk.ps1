# Gives back the disk space Docker no longer uses.
#
# Docker keeps everything in one file (docker_data.vhdx) that grows as images and build caches are created but never shrinks by
# itself, so deleting images inside Docker does not free any space on C: until the file is compacted. This does that.
#
# Run it from an ADMINISTRATOR PowerShell window (Start menu > type "PowerShell" > Run as administrator):
#     powershell -ExecutionPolicy Bypass -File "<this file>"
#
# It stops Docker Desktop and every container (they all start again afterwards), compacts the file, and starts Docker Desktop.
# Images, containers and data volumes are not touched. It takes a few minutes.
#Requires -RunAsAdministrator

$vhdx = 'C:\Users\aimee\AppData\Local\Docker\wsl\disk\docker_data.vhdx'
$docker = 'C:\Users\aimee\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe'

if (-not (Test-Path $vhdx)) { throw "Docker's disk file was not found at $vhdx" }
$before = (Get-Item $vhdx).Length / 1GB
"Docker disk file before: {0:N1} GB" -f $before

"Stopping Docker Desktop..."
Get-Process 'Docker Desktop', 'com.docker.backend', 'com.docker.build', 'docker-agent' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
wsl --shutdown
Start-Sleep -Seconds 8

"Compacting (this takes a few minutes)..."
$script = Join-Path $env:TEMP 'compact-docker.diskpart'
@(
  "select vdisk file=`"$vhdx`"",
  'attach vdisk readonly',
  'compact vdisk',
  'detach vdisk',
  'exit'
) | Set-Content -Path $script -Encoding ascii
diskpart /s $script
Remove-Item $script -ErrorAction SilentlyContinue

$after = (Get-Item $vhdx).Length / 1GB
"Docker disk file after:  {0:N1} GB  (freed {1:N1} GB)" -f $after, ($before - $after)

"Starting Docker Desktop..."
Start-Process $docker
"Done. Docker takes a minute to start; the containers start on their own."
