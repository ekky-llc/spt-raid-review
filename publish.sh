#!/usr/bin/env bash

# Default
default_name="raid_review"
default_version="0.1.0"
current_dir=$(pwd)

# Display a message
echo "Let's start the deployment process..."


# Prompt the user for name of the Mod
read -p "Please enter the name of your Mod [$default_name]: " name
name=${name:-$default_name}  # Use default if user input is empty

# Prompt the user for version number of the Mod
read -p "Please enter the version number of your Mod [$default_version]: " version
version=${version:-$default_version}  # Use default if user input is empty
### Create a package folder if it does not exist
server_package_folder="dist/${name}__${version}/user/mods/${name}__${version}"
rm -rf dist/${name}__${version}
if [ ! -d "$server_package_folder" ]; then
    # If it doesn't exist, create it
    mkdir -p "$server_package_folder"
    echo ">>> Folder '$server_package_folder' created successfully."
else
    echo ">>> Folder '$server_package_folder' already exists."
fi

### Build the server app
cd Server
npm run build-all
cd "$current_dir"
rm -f Server/dist/*.zip 
cp -r Server/dist/* $server_package_folder
rm -rf $server_package_folder/tmp
cd "$server_package_folder/"
npm install
cd "$current_dir"

### Build the client mod
client_package_folder="dist/${name}__${version}/BepInEx/plugins"
mkdir -p  $client_package_folder

xml_file="Client/RAID-REVIEW.csproj"
output_path=$(grep -oP '<OutputPath>\K.*?(?=</OutputPath>)' "$xml_file" | sed 's/^\s*//;s/\s*$//')
echo "OutputPath read from $xml_file:"
echo "$output_path"

cp "$output_path/${default_name^^}__${default_version}.dll" "$client_package_folder/"

### ZIP
cd "dist/${name}__${version}"
powershell -Command "Compress-Archive -Path '*' -DestinationPath "$default_name__$default_version_windows.zip"
