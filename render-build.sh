#!/usr/bin/env bash

# Update packages
apt-get update

# Install Chromium manually
apt-get install -y chromium-browser

# Install Node dependencies
npm install
