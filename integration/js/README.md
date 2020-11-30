# Integration Tests

This guide will help you setup and run integration tests for [Chime SDK](https://github.com/aws/amazon-chime-sdk-js) using [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser).

## Prerequisites

To run integration tests you will need:

- Node 10 or higher. Node 14 is supported.
- npm 6.11 or higher. 6.14.8 is supported.
- [KITE](https://github.com/webrtc/KITE).

### Installing KITE on macOS

Run the following.

```shell
# Install Maven.
brew install maven

# If you intend to run tests locally, install browser drivers.
brew install maven geckodriver chromedriver

# Wherever you like.
export KITEDIR=~/repos
cd $KITEDIR
git clone https://github.com/webrtc/KITE.git
cd KITE

# We need a specific commit.
git checkout e9296165cd24bea92cddb59f2bf211c99f764d58
chmod +x configureMac.sh
./configureMac.sh
```

Choose 'y'.

Now find the Terminal window that opened and complete interactive setup. A good configuration is:

```
INSTALL_BROWSERS=FALSE

Browser versions
CHROME_VERSION=86
FIREFOX_VERSION=84

Whether to use localhost or the computers IP as the grids hub address
LOCALHOST=TRUE

GeckoDriver and ChromeDriver versions
GECKO_VERSION=0.27.0
CHROMEDRIVER_VERSION=86.0.4240.22

Selenium Standalone Server version
SELENIUM_VERSION_SHORT=3.141
SELENIUM_VERSION=3.141.59
```

Finish KITE setup:

```shell
cd ~/repos/KITE
export KITE_HOME="$PWD"
export KITE_JAR="$KITE_HOME/KITE-Engine/target"
export PATH="$PATH:$KITE_HOME/scripts/mac/path/"
c
```

### Other platforms

Please follow the KITE installation instructions.

### Installing dependencies

```shell
cd integration/js
npm install
cd -
```

## Testing locally

### Running the grid

The configuration step does this for you automatically, but subsequently, in a shell:

```shell
$KITE_HOME/localGrid/startGrid.sh
```

Then set up to run:

```shell
cd integration
export SELENIUM_GRID_PROVIDER=local
```

### Running tests

Start your demo server in a shell:

```
cd demos/browser
npm run start
```

To run a test by name:

```shell
cd integration
$KITE_HOME/scripts/mac/path/r configs/<test_name>.config.json
```

## Testing on Sauce Labs

### Prerequisites

To run integration tests in Sauce Labs you will need a [Sauce Labs](https://saucelabs.com/) account.

### Running tests

Deploy the [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless) to your stack. Make note of the demo URL.

Navigate to the configs folder and update the URL of the tests you want to run with the serverless demo URL.

Set up to run with the right environment:

```shell
cd integration
export SELENIUM_GRID_PROVIDER=saucelabs
export SAUCE_USERNAME=<Sauce Labs account username>
export SAUCE_ACCESS_KEY=<Sauce Labs access key>
```

Run the test:

```shell
$KITE_HOME/scripts/mac/path/r configs/<test_name>.config.json
```
