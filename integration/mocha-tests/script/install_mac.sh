#!/bin/bash

# Script to automatically install browser drivers for Chrome, Firefox, and Safari on macOS
# Usage: ./install_mac.sh
# The script will detect installed browser versions and install matching drivers

set -e

# Function to extract major version from full version string
get_major_version() {
    echo "$1" | cut -d '.' -f 1
}

# Function to detect Chrome version
detect_chrome_version() {
    if [ -f "/Applications/Google Chrome.app/Contents/Info.plist" ]; then
        chrome_version=$(/usr/bin/defaults read "/Applications/Google Chrome.app/Contents/Info.plist" CFBundleShortVersionString)
        echo "Detected Chrome version: $chrome_version"
        return 0
    else
        echo "Chrome not found. Skipping ChromeDriver installation."
        return 1
    fi
}

# Function to detect Firefox version
detect_firefox_version() {
    if [ -f "/Applications/Firefox.app/Contents/Info.plist" ]; then
        firefox_version=$(/usr/bin/defaults read "/Applications/Firefox.app/Contents/Info.plist" CFBundleShortVersionString)
        echo "Detected Firefox version: $firefox_version"
        return 0
    else
        echo "Firefox not found. Skipping GeckoDriver installation."
        return 1
    fi
}

# Function to detect Safari version
detect_safari_version() {
    if [ -f "/Applications/Safari.app/Contents/Info.plist" ]; then
        safari_version=$(/usr/bin/defaults read "/Applications/Safari.app/Contents/Info.plist" CFBundleShortVersionString)
        echo "Detected Safari version: $safari_version"
        return 0
    else
        echo "Safari not found. Skipping SafariDriver setup."
        return 1
    fi
}

# Function to download and install ChromeDriver
install_chromedriver() {
    local version=$1
    local major_version=$(get_major_version "$version")
    local download_url
    local temp_dir=$(mktemp -d)
    
    echo "Installing ChromeDriver for Chrome version $version (major version $major_version)"

    latest_version=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_$major_version")
    download_url="https://storage.googleapis.com/chrome-for-testing-public/$latest_version/mac-x64/chromedriver-mac-x64.zip"
    
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
    echo "ChromeDriver version:"
    ~/bin/chromedriver --version
}

# Function to download and install GeckoDriver (Firefox)
install_geckodriver() {
    local temp_dir=$(mktemp -d)
    
    echo "Installing GeckoDriver for Firefox"
    
    # Get the latest GeckoDriver version
    latest_version=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest | grep tag_name | cut -d '"' -f 4)
    echo "Latest GeckoDriver version: $latest_version"
    
    # Download URL for macOS
    download_url="https://github.com/mozilla/geckodriver/releases/download/$latest_version/geckodriver-$latest_version-macos.tar.gz"
    
    echo "Downloading GeckoDriver from $download_url"
    
    # Download GeckoDriver
    curl -L -o "$temp_dir/geckodriver.tar.gz" "$download_url"
    
    # Extract the tar.gz file
    tar -xzf "$temp_dir/geckodriver.tar.gz" -C "$temp_dir"
    
    # Make it executable
    chmod +x "$temp_dir/geckodriver"
    
    # Create directory if it doesn't exist
    mkdir -p ~/bin
    
    # Move to user's bin directory
    mv "$temp_dir/geckodriver" ~/bin/geckodriver
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo "GeckoDriver installed successfully at ~/bin/geckodriver"
    echo "GeckoDriver version:"
    ~/bin/geckodriver --version
}

# Function to set up Safari driver
setup_safari_driver() {
    echo "Setting up Safari for WebDriver"
    
    # Safari's driver is built-in, just need to enable Remote Automation
    echo "Enabling Safari Remote Automation..."
    
    # Check if Safari is already enabled for automation
    if safaridriver --enable 2>&1 | grep -q "already enabled"; then
        echo "Safari Remote Automation is already enabled"
    else
        # Enable Safari Remote Automation (may require password)
        echo "You may be prompted for your password to enable Safari Remote Automation"
        safaridriver --enable
    fi
    
    echo "Safari WebDriver setup complete"
    echo "Safari WebDriver version:"
    safaridriver --version
}

# Function to update PATH
update_path() {
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bash_profile
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
        echo "Added ~/bin to PATH in .bash_profile and .zshrc"
        echo "Please restart your terminal or run 'source ~/.bash_profile' or 'source ~/.zshrc'"
    else
        echo "~/bin is already in your PATH"
    fi
}

# Main script

# Create bin directory if it doesn't exist
mkdir -p ~/bin

# Install drivers
echo "=== Installing WebDrivers for Selenium Testing ==="

# Detect and install Chrome driver
echo -e "\n=== Chrome Setup ==="
if detect_chrome_version; then
    install_chromedriver "$chrome_version"
fi

# Detect and install Firefox driver
echo -e "\n=== Firefox Setup ==="
if detect_firefox_version; then
    install_geckodriver
fi

# Detect and setup Safari driver
echo -e "\n=== Safari Setup ==="
if detect_safari_version; then
    setup_safari_driver
fi

# Update PATH
echo -e "\n=== Updating PATH ==="
update_path

echo -e "\n=== Installation Complete ==="
echo "All WebDrivers have been installed successfully!"
echo "Make sure ~/bin is in your PATH"
echo "You can now run your Selenium tests with the detected browsers."
