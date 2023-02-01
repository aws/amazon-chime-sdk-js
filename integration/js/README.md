# Integration Tests

This guide will help you setup and run integration tests for [Chime SDK](https://github.com/aws/amazon-chime-sdk-js) using [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser).

## Prerequisites

To run integration tests you will need:

- Node 10 or higher. Node 14 is supported.
- npm 6.11 or higher. 6.14.8 is supported.
- [KITE](https://github.com/webrtc/KITE).
- Java runtime installed on the machine.

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

Note: If the `./configureMac.sh` script fails then make sure you are using Maven 3.6.3 or earlier. The KITE version in use does not work with the latest version of maven.
For example, you can install maven 3.5 by calling `brew install maven@3.5`. If the issue persists, make sure the symlink is pointing to the right version of maven. Use `mvn -v` to check your maven version.
If you have multiple installations of maven in homebrew then use `brew unlink maven` to unlink the latest version of maven and use `brew link maven@3.5` to use an older version.

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

### Testing against a custom audio/video stream in Sauce Labs
Some tests might require testing against a custom audio/video stream. To test, you need the media file on Sauce Labs virtual machine before running your test. For that, you can use a pre-run executable script to download media file from public storage to the virtual machine before running your tests. 

For our use case, a pre-run executable script is a minimal `bash` script that will use `curl` to install the resources on the Sauce Labs VM. Pre-run executable scripts can be used for several different use cases like changing VM configurations and browser settings. See [Using Pre-Run Executables](https://docs.saucelabs.com/web-apps/automated-testing/selenium/pre-run-executables/) for more information.

1. Create a pre-run script by following the steps given in [downloading files to a VM prior to testing](https://docs.saucelabs.com/web-apps/automated-testing/selenium/pre-run-executables/#downloading-files-to-a-vm-prior-to-testing). Following is an example of a pre-run script that will download public assets and store them at the specified path.
    ```shell
    #!/bin/bash
    curl -o /Users/chef/file.txt http://mywebsite.com/file.txt
    ```

2. Once the script is created, you should then upload the pre-run executable to Sauce Labs storage by using Sauce Labs API methods: [Saucelabs Storage CRUD API](https://docs.saucelabs.com/dev/api/storage/). You will need your Sauce Labs account username and access key for authorization. Upon successful upload you will get a storage id in the HTTP response. This id will be useful in step 4 for setting the config.

3. In your test config, configure the directory where the audio/video assets will be downloaded to.

    - Windows = `C:\Users\Administrator\`

    - Mac = `/Users/chef/`

    - Linux = `/home/chef/`

> NOTE: The path specified in the test config should match the path specified in the `-o` option of the curl command in step 1.

4. Add the pre-run script to Sauce Labs configs in your code like this prerun: `storage:filename=filename.ext`. You can also use the name of the pre-run script file but id is the better option. For reference,
    ```js
    // integration/js/utils/WebdriverSauceLabs.js
    const getPrerunScript = (capabilities) => {
      return capabilities.name.includes('Background Blur Test') ? 'storage:<storage_id>' : '';
    }
    ```

5. Another way is hosting the pre-run-script in any open public domain and export another environment:
```shell
export PRE_RUN_SCRIPT_URL=<url_to_pre_run_script>
```
Then you can skip other steps and run the test directly on Sauce Labs