#!/bin/sh
# Xcode Cloud: install JavaScript and iOS dependencies before the build.
set -e
cd "$CI_PRIMARY_REPOSITORY_PATH"
brew install node
npm ci
cd ios
pod install
