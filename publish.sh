#!/usr/bin/env bash

# Default
default_name="raid_review"
default_version="0.1.0"
current_dir=$(pwd)
linux_server_user=blackdog
linux_server_host=192.168.40.254

# Display a message
echo "Let's start the deployment process..."

# Prompt the user for name of the Mod
read -p "Please enter the name of your Mod [$default_name]: " name
name=${name:-$default_name}  # Use default if user input is empty

# Prompt the user for version number of the Mod
read -p "Please enter the version number of your Mod [$default_version]: " version
version=${version:-$default_version}  # Use default if user input is empty

clear

# Create a package folder if it does not exist
echo ">> Creating distribution folder structure (if not exists)"
server_package_folder="dist/${name}__${version}/user/mods/${name}__${version}"
rm -rf "dist/${name}__${version}"
if [ ! -d "$server_package_folder" ]; then
    # If it doesn't exist, create it
    mkdir -p "$server_package_folder"
    echo ">>> Folder '$server_package_folder' created successfully."
else
    echo ">>> Folder '$server_package_folder' already exists."
fi

echo "Starting - Windows distribution"

# Build the server app
echo ">> Building server mod for Windows"
cd Server
npm run build-all > /dev/null
cd "$current_dir"
rm -f Server/dist/*.zip 
cp -r Server/dist/* "$server_package_folder"
rm -rf "$server_package_folder/tmp"
cd "$server_package_folder"
npm install > /dev/null
cd "$current_dir"

# Build the client mod
echo ">> Building client mod for Windows"
cd Client
dotnet build > /dev/null
cd "$current_dir"
client_package_folder="dist/${name}__${version}/BepInEx/plugins"
mkdir -p "$client_package_folder"
xml_file="Client/RAID-REVIEW.csproj"
output_path=$(grep -oP '<OutputPath>\K.*?(?=</OutputPath>)' "$xml_file" | sed 's/^\s*//;s/\s*$//')
ls -l "$output_path" > /dev/null
for file in "$output_path"/RAID_REVIEW__*.dll; do
  if [ -f "$file" ]; then
    echo "Copying $file to $client_package_folder"
    cp "$file" "$client_package_folder/"
  else
    echo "No files matching pattern: $output_path/RAID_REVIEW__*.dll"
  fi
done

# ZIP for Windows
echo ">> Zipping both server and client mod for Windows"
cd "dist/${name}__${version}"
powershell -Command "Compress-Archive -Force -Path '*' -DestinationPath '../${name}__${version}_windows.zip'" > /dev/null
cd "$current_dir"

echo "Finished - Windows Distribution"
echo "Starting - Linux Distribution"

# Cleanup node_modules before linux zip
echo ">> Cleaning up Windows based 'node_modules'"
cd "$server_package_folder"
rm -rf node_modules
cd "$current_dir"

# ZIP for Linux
echo ">> Zipping both server and client mod for upload to Linux"
cd "$current_dir"
cd "dist/${name}__${version}"
powershell -Command "Compress-Archive -Force -Path '*' -DestinationPath 'linux_deploy.zip'" > /dev/null

# Deploy to Linux server
echo ">> Uploaded package to server"
scp "linux_deploy.zip" $linux_server_user@$linux_server_host:~/auto-deploy

# SSH into the server and perform operations
ssh -q $linux_server_user@$linux_server_host 2> /dev/null << EOF
  cd ~/auto-deploy
  sudo su root

  rm -rf /home/blackdog/auto-deploy/BepInEx
  rm -rf /home/blackdog/auto-deploy/user
  
  echo ">>>> Upacking Zip"
  unzip -o "linux_deploy.zip" -d /home/blackdog/auto-deploy > /dev/null
  rm -f "linux_deploy.zip"

  chmod 777 /home/blackdog/auto-deploy/user
  chmod 777 /home/blackdog/auto-deploy/BepInEx

  echo ">>>> Installing linux 'node_module' dependencies"
  cd /home/blackdog/auto-deploy/user/mods/${name}__${version}
  npm install > /dev/null
  cd /home/blackdog/auto-deploy

  echo ">>>> Packaging linux distribution"
  tar -cvf ${name}__${version}_linux.tar * > /dev/null

  exit
EOF

# Download file
scp $linux_server_user@$linux_server_host:~/auto-deploy/${name}__${version}_linux.tar $current_dir/dist
echo "Finished - Linux Distribution"

# Clean up local
cd "$current_dir"
rm -rf "dist/${name}__${version}"
rm -f "dist/linux_deploy.zip"

# Clean up remote
ssh -q $linux_server_user@$linux_server_host 2> /dev/null << EOF
  cd ~/auto-deploy
  sudo su root
  rm -rf /home/blackdog/auto-deploy/*
EOF

echo "Finished"