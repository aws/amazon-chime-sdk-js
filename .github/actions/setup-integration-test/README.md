# Setup Integration Test Action

When an integration test or a browser compatibility test runs on GitHub actions, there are several setup steps that need to be performed for the action to run. Most of these setup steps are specific to Chime JS SDK's testing frameworks.

To better perform these steps in a reusable manner we created this composite action. The composite action is called by other workflows to setup the host and then the workflows will run whatever test they are running.

## Steps Performed
- Pack the Chime JS SDK and install the tarball into demo
- Create a job ID
- Set the job ID as an ENV variable
- Echo job ID
- Configure AWS credentials
- Setup Sauce Connect
- Install KITE
- Clean install

## Sauce Rest URL
Sauce rest url is the datacenter endpoint used by Sauce Connect Proxy action as a parameter. The default url is https://saucelabs.com/rest/v1 and it is applicable for US-West region. The default url will be overwritten by calling workflows. You can learn more at [Data Center Endpoints](https://docs.saucelabs.com/basics/data-center-endpoints/#headless-us-east-data-center).

## More Information
This GitHub action uses a composite action and the associated metadata syntax for GitHub actions. This metadata syntax is a little different from the regular GitHub workflow syntax. Useful links:
[About custom actions](https://docs.github.com/en/actions/creating-actions/about-custom-actions)

[Creating a composite action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)

[Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#outputs-for-composite-actions)

