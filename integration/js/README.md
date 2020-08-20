## Integration Tests

This guide will help you setup and run integration tests for [Chime SDK](https://github.com/aws/amazon-chime-sdk-js) using [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser).


### Prerequisites

To run integraton tests you will need:

- Node 10 or higher
- npm 6.11 or higher
- [KITE](https://github.com/webrtc/KITE). Since we are using Sauce Labs, you can skip setting up local grid.
- A [Sauce Labs](https://saucelabs.com/) account.

### Run integration test

1. Deploy [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless)

2. Navigate to the configs folder and update the url of the tests you want to run with the serverless demo URL
 deployed in step 1
 
3. Navigate to integration folder and export the following environment variables:
    ```
    export SELENIUM_GRID_PROVIDER=saucelabs
    export SAUCE_USERNAME=<Sauce Labs account username>
    export SAUCE_ACCESS_KEY=<Sauce Labs access key>
    ```
4. Run the test
    ```
    r configs/<test_name>.config.json
    ```

