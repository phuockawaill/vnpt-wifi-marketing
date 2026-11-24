#!/bin/sh

dir="`pwd`"

# 0. Turning
echo "Apply system turning"

chmod +x "$dir"/turning/*
sudo -E sh -c "cp -rf \"$dir/turning/rc.local\" /etc"
sudo -E sh -c "cp -rf \"$dir/turning/sysctl.conf\" /etc"
sudo -E sh -c "cp -rf \"$dir/turning/limits.conf\" /etc/security"
sudo -E sh -c "sysctl -p"

echo "Please reboot before continue"

exit