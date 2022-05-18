#!/bin/bash

# Script to install ChromeDriver matching the installed Chrome version on macOS
# Usage: ./install_mac.sh [chrome_version]
# If no version is provided, the script will attempt to detect the installed Chrome version

set -e

# Function to extract major version from full version string
get_major_version() {
    echo "$1" | cut -d '.' -f 1
}

# Function to download and install ChromeDriver
install_chromedriver() {
    local version=$1
    local major_version=$(get_major_version "$version")
    local download_url
    local temp_dir=$(mktemp -d)
    
    echo "Installing ChromeDriver for Chrome version $version (major version $major_version)"
    
    # For Chrome >= 115, use the new versioning scheme
    if [ "$major_version" -ge 115 ]; then
        # Get the latest ChromeDriver version for this major version
        latest_version=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_$major_version")
        download_url="https://storage.googleapis.com/chrome-for-testing-public/$latest_version/mac-x64/chromedriver-mac-x64.zip"
    else
        # For older versions, use the old versioning scheme
        # Get the latest ChromeDriver version for this Chrome version
        latest_version=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$major_version")
        download_url="https://chromedriver.storage.googleapis.com/$latest_version/chromedriver_mac64.zip"
    fi
    
    echo "Downloading ChromeDriver version $latest_version from $download_url"
    
    # Download ChromeDriver
    curl -L -o "$temp_dir/chromedriver.zip" "$download_url"
    
    # Extract the zip file
    unzip -q "$temp_dir/chromedriver.zip" -d "$temp_dir"
    
    # Find the chromedriver binary (location differs between old and new versions)
    if [ -f "$temp_dir/chromedriver" ]; then
        chromedriver_path="$temp_dir/chromedriver"
    elif [ -f "$temp_dir/chromedriver-mac-x64/chromedriver" ]; then
        chromedriver_path="$temp_dir/chromedriver-mac-x64/chromedriver"
    else
        echo "Error: Could not find chromedriver binary in the extracted files"
        exit 1
    fi
    
    # Make it executable
    chmod +x "$chromedriver_path"
    
    # Create directory if it doesn't exist
    mkdir -p ~/bin
    
    # Move to user's bin directory
    mv "$chromedriver_path" ~/bin/chromedriver
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo "ChromeDriver installed successfully at ~/bin/chromedriver"
    echo "Make sure ~/bin is in your PATH"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bash_profile
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
        echo "Added ~/bin to PATH in .bash_profile and .zshrc"
        echo "Please restart your terminal or run 'source ~/.bash_profile' or 'source ~/.zshrc'"
    fi
    
    # Verify installation
    echo "ChromeDriver version:"
    ~/bin/chromedriver --version
}

# Main script

# Check if a version was provided
if [ -n "$1" ]; then
    chrome_version="$1"
else
    # Try to detect Chrome version
    if [ -f "/Applications/Google Chrome.app/Contents/Info.plist" ]; then
        chrome_version=$(/usr/bin/defaults read "/Applications/Google Chrome.app/Contents/Info.plist" CFBundleShortVersionString)
        echo "Detected Chrome version: $chrome_version"
    else
        echo "Error: Chrome not found. Please provide a version number."
        echo "Usage: $0 [chrome_version]"
        exit 1
    fi
fi

# Install ChromeDriver
install_chromedriver "$chrome_version"

echo ""
echo "ChromeDriver installation complete!"
echo "You can now run your Selenium tests with Chrome."
