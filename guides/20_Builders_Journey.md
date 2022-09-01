#

# Amazon Chime SDK Builder's Journey

## Introduction

The goal of this document is to help you work through the various phases of a builder's journey using the Amazon Chime SDK. These follow the Amazon Chime SDK Builder's Journey path:

![](RackMultipart20220816-1-gyffxg_html_e7f73c9f1864449d.png)

###

### Prerequisites

To develop applications using the Amazon Chime SDK for JavaScript you will need to be a proficient JavaScript and / or TypeScript programmer. For mobile development you will need to be a proficient Kotlin or Swift programmer familiar with programming for the iOS or Android platforms. Refreshers for each can be found here:

- [JavaScript Tutorial](https://www.w3schools.com/js/default.asp)
- [TypeScript Tutorial](https://www.w3schools.blog/typescript-tutorial)
- [Create a Basic Webpage with CSS and JavaScript](https://dev.to/programliftoff/create-a-basic-webpage-with-css-and-javascript--104i)
- [Android Tutorial (Android Basics Section)](https://www.tutorialspoint.com/android/index.htm)
- [iOS Tutorial](https://www.youtube.com/watch?v=09TeUXjzpKs)

To use the demos in this document, you will need an AWS Account and may need access to the Cloud9 development environment along with the authorization to create Lambda functions and API gateways.

## 1.0 Amazon Chime SDK components, architecture and common use cases.

### 1.1 What is Amazon Chime SDK (and what isn't it)?

The Amazon Chime SDK provides a rich set of APIs and example code that enables customers to build modern communication applications that easily interface to other AWS services, including Connect, Pinpoint, Lex, Polly, Transcribe, and others. The Amazon Chime SDK has three key pillars:

- Meetings, including audio/video via browser (WebRTC), iOS, or Android
- Messaging
- PSTN Audio, including SIP Trunking

The Amazon Chime SDK makes it easy to add collaborative audio calling, video calling, screen share, messaging and Public Switched Telephone Network (PSTN) features to web applications by using the same infrastructure services that power millions of Amazon Chime online meetings. However, while they share some of the same backend services, it is distinct and separate from the Amazon Chime Application. The Amazon Chime Application provides a complete application for real-time communications. It's functionality and user interface (UI) is fixed and cannot be customized. The Amazon Chime SDK is a Software Development Kit that lets you build your own custom web or mobile application with full control of the user experience and UI. The following pages can help you understand the two distinct services:

- [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk/)
- [Amazon Chime Application](https://aws.amazon.com/chime/?nc=sn&loc=0&chime-blog-posts.sort-by=item.additionalFields.createdDate&chime-blog-posts.sort-order=desc)

### 1.2 Major Amazon Chime SDK Features

The Amazon Chime SDK makes it easy to build collaborative audio/video calling, and screen share capabilities. These can span web and mobile applications as well as audio over regular phone calls. This all uses the same infrastructure services that power millions of Amazon Chime online meetings. The Amazon Chime SDK is comprised of number of services and components, including:

- [Amazon Chime SDK Meetings](https://aws.amazon.com/chime/chime-sdk/features/#Meetings) – The Meetings feature of the SDK allows you to create and delete meetings, create and delete attendees as well as add and remove attendees from a meeting.
- [Amazon Chime SDK for JavaScript](https://docs.aws.amazon.com/chime/latest/dg/use-javascript-sdk-top.html)- core code to support building web-based collaboration apps
- [Amazon Chime SDK for iOS](https://docs.aws.amazon.com/chime/latest/dg/sdk-for-ios.html) - core code to support building iOS-based collaboration apps
- [Amazon Chime SDK for Android](https://docs.aws.amazon.com/chime/latest/dg/sdk-for-android.html) - core code to support building Android-based collaboration apps

- [Amazon Chime SDK Messaging](https://aws.amazon.com/chime/chime-sdk/features/#Messaging) – The Messaging feature of the SDK allows you to create persistent messaging applications that can exist either within or outside of a meeting. Click [here](https://aws.amazon.com/chime/chime-sdk/features/#Messaging) for more details.

- [Amazon Chime SDK for PSTN Audio](https://aws.amazon.com/chime/chime-sdk/features/#Public_Switched_Telephone_Network_.28PSTN.29_Audio) – The PSTN feature of the SDK supports a number of functions but the ones we will be focused on will be those that relate to meetings including Inbound Calling and Outbound Calling. Click [here](https://aws.amazon.com/chime/chime-sdk/features/#Public_Switched_Telephone_Network_.28PSTN.29_Audio) for more details.

For more information on the Amazon Chime SDK offering see:

- Amazon Chime SDK Website
- [Amazon Chime - Customers](https://aws.amazon.com/chime/chime-sdk/customers/)
- [Amazon Chime SDK Features](https://aws.amazon.com/chime/chime-sdk/features/) - Meetings, Messaging, PSTN, and Media Pipelines
- [Amazon Chime SDK Partners](https://aws.amazon.com/chime/chime-sdk/partners/)
- [Chime SDK Pricing](https://aws.amazon.com/chime/pricing/#Chime_SDK_)
- [Customer Stories](https://aws.amazon.com/chime/chime-sdk/customers/)
- [Customers like Slack choose the Amazon Chime SDK for real-time communications](https://aws.amazon.com/blogs/business-productivity/customers-like-slack-choose-the-amazon-chime-sdk-for-real-time-communications/)
- [How Cerner uses the Amazon Chime SDK to enhance its virtual health strategy](https://aws.amazon.com/blogs/business-productivity/how-cerner-uses-the-amazon-chime-sdk-to-enhance-its-virtual-health-strategy/)
- [Delivering Video at Scale in Mobile and Web Applications with Orangetheory Fitness](https://aws.amazon.com/blogs/mobile/delivering-video-at-scale-in-mobile-and-web-applications-with-orangetheory-fitness/)
- [Beth Israel Deaconess](https://www.healthcareitnews.com/news/beth-israel-deaconess-creates-homegrown-telehealth-help-amazon)

### 1.3 Extending the Amazon Chime SDK

Amazon Chime SDK can be extended using a number of AWS services including Transcribe, Connect, SMA, media capture as shown in the following:

- [Build a video contact center with Amazon Connect and Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/build-a-video-contact-center-with-amazon-connect-and-amazon-chime-sdk/)
- [Video Help Desk](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/videohelpdesk)
- [Amazon Chime SDK to power video for new Salesforce Anywhere application](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdk-to-power-video-for-new-salesforce-anywhere-application/)
- [Visual voicemail SMA example](https://github.com/siddhartharao/visual-voicemail)
- [Real-Time Transcription with Amazon Chime Voice Connector](https://github.com/aws-samples/amazon-chime-voiceconnector-transcription)
- [PSTN dial-in for Amazon Chime SDK with Amazon Chime SIP Media Application](https://github.com/aws-samples/chime-sipmediaapplication-samples)
- [Whiteboarding](https://dannadori.medium.com/amazon-chime-sdk-whiteboard-with-data-messages-for-real-time-signaling-c0740575a6c0)
- [AI-powered Speech Analytics with Amazon Chime Voice Connector](https://github.com/aws-samples/chime-voiceconnector-agent-assist)
- [Building a PSTN call answering system with the Amazon Chime SDK, Amazon Lex and Amazon Polly](https://aws.amazon.com/blogs/business-productivity/building-a-pstn-call-answering-system-with-the-amazon-chime-sdk-amazon-lex-and-amazon-polly/)

### 1.4 Typical Use Cases

Applications built with Amazon Chime SDK can be new or an expansion of existing applications. They can add video / audio, messaging and/or PSTN calling to an existing web page or mobile app. They can be used for Telemedicine, Remote Learning, Remote Assistance, Virtual Events, Unified Communications, Gaming, and Retail.

The [Amazon Chime SDK Customers](https://aws.amazon.com/chime/chime-sdk/customers/) page provides a list of Industries that use Amazon Chime SDK.

## 2.0 Amazon Chime SDK - How it works

If you are building a collaboration app (standalone or integrated into an existing application) then you will at least need to work with Amazon Chime SDK meetings. Depending on your target platform, you may need to use various other components. If your application needs to run in a web browser, you will need the Amazon Chime SDK for JavaScript. If your application supports mobile devices, you will need the Amazon Chime SDK for iOS and/or Android. If your application needs to support the ability to collaborate by dialing a phone number or across the PSTN, you will need to include the Amazon Chime SDK for PSTN Audio. These all work by connecting to meeting session resources that you create dynamically in your AWS account.

### 2.1 Amazon Chime SDK for JavaScript

The Amazon Chime SDK for JavaScript has everything you need to build custom calling and collaboration experiences in your web application, including methods to: configure meeting sessions, list and select audio and video devices, start and stop screen share and screen share viewing, receive callbacks when media events occur such as volume changes, and control meeting features such as audio mute and video tile bindings.

The Amazon Chime SDK for JavaScript works by connecting to meeting session resources that you have created in your AWS account. Built on top of WebRTC, the Amazon Chime SDK has everything you need to build custom calling and collaboration experiences in your web application, including methods to: configure meeting sessions, list and select audio and video devices, start and stop screen share and screen share viewing, receive callbacks when media events occur such as volume changes, and control meeting features such as audio mute and video tile bindings. For additional information, please see:

- Tutorial - [Workshop Studio – Building with Amazon Chime SDK](https://catalog.us-east-1.prod.workshops.aws/v2/workshops/de1c7d2d-6826-44db-a678-ff7a62747ec4/en-US/)
- [WebRTC Tutorial](https://www.tutorialspoint.com/webrtc/index.htm)
- SDK Tech Talk:[https://www.youtube.com/watch?v=v9KFalEv6gw](https://www.youtube.com/watch?v=v9KFalEv6gw)
- SDK Video:[https://youtu.be/lNQ1_WfUQl4](https://youtu.be/lNQ1_WfUQl4)
- [Amazon Chime SDK for JavaScript Overview](https://aws.github.io/amazon-chime-sdk-js/index.html)
- [Getting Started](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#1-create-a-session)
- Frequently Asked Questions
  - [Amazon Chime SDK FAQ](https://aws.amazon.com/chime/chime-sdk/faq/) (Web Page)
  - [Amazon Chime SDK FAQ](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html) (GitHub)
  - [SA Internal Amazon Chime SDK FAQ](https://quip-amazon.com/2eChAFiHKcpi/Amazon-Chime-SDK-FAQ) (Internal Quip Document)
- [Amazon Chime SDK Guides](https://github.com/aws/amazon-chime-sdk-js/tree/master/guides)(Please review each document in this list)
- [A Builder's Guide to Amazon Chime sessions at](https://aws.amazon.com/blogs/business-productivity/a-builders-guide-to-amazon-chime-sessions-at-reinvent-2019/)[re:Invent 2019](https://aws.amazon.com/blogs/business-productivity/a-builders-guide-to-amazon-chime-sessions-at-reinvent-2019/)
- [Serverless Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless)
- [Developer Guide](https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html)

### 2.2 Quotas / Limits

AWS has service quotas (previously call service limits) to help prevent accidental provisioning of more resources than needed and to help ensure availability of AWS resources.

For each AWS account there are hard limits that cannot be adjusted and soft limits which can be adjusted:

**Hard limits:**

- 250 users per session
- 100 video sources on simultaneously
- 25 tiles displayed simultaneously

**Soft Limits (can be adjusted):**

- 250 simultaneous Amazon Chime SDK meetings per AWS Account
- Adjustments can be requested via the [Amazon Chime Service Quota Dashboard](https://console.aws.amazon.com/servicequotas/home/services/chime/quotas).

Note: Adjusting the Active Amazon Chime SDK meetings per account will cause the "All meeting management API requests limit" and the "All meeting management API requests rate limit in transactions per second" to be automatically adjusted as well

Additionally, the Amazon Chime SDK has limits on meeting length to protect against abandoned meetings. A meeting will automatically end under the following conditions:

- Call to the DeleteMeeting API
- 5 minutes with nobody in the meeting (primary meetings only)
- primary meeting has ended (replica meetings only)
- 30 minutes with one person in the meeting (old Chime namespace only)
- 24 hours with one person in the meeting (new ChimeSDKMeetings namespace only)
- 6 hours with 2 or more attendees but no detected audio

Messaging quotas can be found here: [https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html](https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html).

###

###

### 2.3 Supported Browsers and Operating Systems

Amazon Chime SDK is dependent on the supported features of various browsers to be able to function. Therefore, there are only certain browsers and operating system we support. The current list of supported browsers and their versions can be found in the [Amazon Chime SDK FAQs](https://aws.amazon.com/chime/chime-sdk/faq/) under "General Heading Q: What browsers does the Amazon Chime SDK for JavaScript support?".

We do not specify hardware requirements because they are dependent on the requirements of the application and are therefore left up to the you to determine. It is important that the you make a determination based on testing with your application so they can advise your users of the hardware requirements for your application.

### 2.4 Media and Control Planes for Meetings

The Amazon Chime SDK consists of Control Planes and a Media Planes. The control plane is used to set up a meeting and the medial Plane is where the meeting actually happens. The available regions for each can be found in [https://docs.aws.amazon.com/chime/latest/dg/sdk-available-regions.html](https://docs.aws.amazon.com/chime/latest/dg/sdk-available-regions.html). Additional information and guidance on selecting a region can be found here: [https://docs.aws.amazon.com/chime/latest/dg/chime-sdk-meetings-regions.html](https://docs.aws.amazon.com/chime/latest/dg/chime-sdk-meetings-regions.html).

![](RackMultipart20220816-1-gyffxg_html_46f0e418fa28f44a.png)

### 2.5 Messaging

Amazon Chime SDK Messaging can be used to add massively scalable messaging capability to your application. This may be in the context of a meeting, but it does not need to be. Amazon Chime SDK Messaging is a service that can be used independently from the other components of the SDK.

- [Using Amazon Chime SDK messaging](https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html)

### 2.6 Getting a Public Switched Telephone Network (PSTN) audio call into a meeting

Amazon Chime SDK PSTN Audio enables integration with common telephony interfaces including PSTN phone numbers and SIP Trunks. This allows you to build applications that use audio from phone calls, either in the context of a meeting or not. SIP Trunks allow you to integrate directly with your on-premise PBX under programmatic control. You can provision Amazon Chime SDK managed phone numbers in the US and other countries. Using the SIP Media Appliance (SMA) managed object and SIP rules you can associate events that occur on phone line with a lambda function that you write. The lambda function instructs the PSTN Audio Service what actions to take on the phone call: connect to a meeting, play an audio file, record audio from the caller, collect pressed STMF digits, etc. More sophisticated examples include integrating with other Amazon AWS services such as Lex, Polly, Transcribe, etc.

- [Using Amazon PSTN Audio Service](https://docs.aws.amazon.com/chime/latest/dg/build-lambdas-for-sip-sdk.html)

When in an Amazon Chime SDK Meeting, it is often helpful to allow users to call into a meeting with their desk or mobile phone. It lets you do much more but this document will focus on the call-in capabilities. The following document provides the details about using the Amazon Chime SDK PSTN Audio feature:

- [Using the Amazon Chime SDK PSTN Audio service](https://docs.aws.amazon.com/chime-sdk/latest/dg/build-lambdas-for-sip-sdk.html)

This blog explains how to add a PSTN caller to an Amazon Chime SDK meeting:

- [Updating an In-Progress Amazon Chime SIP Media Application Call](https://github.com/aws-samples/amazon-chime-sma-update-call)

Tutorial - This workshop is a good introduction to Amazon Chime SDK PSTN Audio:

- [https://catalog.workshops.aws/building-with-chime-sdk](https://catalog.workshops.aws/building-with-chime-sdk).

### 2.7 Review, install and test drive our full-featured demos

There are many demos for Amazon Chime SDK features you can run in your own environment. Below are the key demos for each platform:

| **Amazon Chime SDK** | **Feature**                                                                                                                                                                                                                                                                                                       | **Demo Resources**                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript           | Meetings Web                                                                                                                                                                                                                                                                                                      | [Blog](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-using-the-amazon-chime-sdk/)[Demo Instructions](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/serverless)[Source Code](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser) |
| Messaging            | TBD                                                                                                                                                                                                                                                                                                               |
| React                | Meetings Web                                                                                                                                                                                                                                                                                                      | [Demo Instructions](https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/meeting)[Source Code](https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/meeting/src)                                                                                                                 |
| Messaging            | [Blog](https://aws.amazon.com/blogs/business-productivity/build-meeting-features-into-your-amazon-chime-sdk-messaging-application/)[Demo Instructions](https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/chat)[Source Code](https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/chat/src) |
| iOS\*                | Meetings                                                                                                                                                                                                                                                                                                          | [iOS and Android Overview](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdks-ios-android/)[Blog](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-on-ios-using-the-amazon-chime-sdk/)                                                            |
| Messaging            | [Blog](https://aws.amazon.com/blogs/business-productivity/build-chat-applications-in-ios-and-android-with-amazon-chime-sdk-messaging/)                                                                                                                                                                            |
| Android\*            | Meetings                                                                                                                                                                                                                                                                                                          | [iOS and Android Overview](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdks-ios-android/)[Blog](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-on-android-using-the-amazon-chime-sdk/)                                                        |
| Messaging            | [Blog](https://aws.amazon.com/blogs/business-productivity/build-chat-applications-in-ios-and-android-with-amazon-chime-sdk-messaging/)                                                                                                                                                                            |
| PSTN / SMA           | Inbound Calling                                                                                                                                                                                                                                                                                                   | [Blog](https://github.com/aws-samples/amazon-chime-sma-update-call)[Demo Code](https://github.com/aws-samples/amazon-chime-sma-update-call)                                                                                                                                                          |

\*Requires access to compatible iOS or Android hardware

## 3.0 Get ready for a Proof of Concept (POC)

According to the Meriam Webster Dictionary a Proof of Concept is "something that demonstrates the feasibility of a concept". An Amazon Chime SDK POC is usually designed to help validate that core goals can be met using the Amazon Chime SDK. It is not generally a full-blown application and is not usually deployed to the masses but is tested and verified by a small subset of folks, often just within IT.

###

### 3.1 What is a POC Readiness Review?

It is important that you what your goals are. You document what they are trying to accomplish in the POC in the POC Readiness Review. In this review, you and AWS review the timelines, success criteria, and expectations.

### 3.2 POC Readiness Review

You would hold a POC Readiness Review with the Amazon Chime SDK SA, TAM and the Account Team before starting to develop for the POC. Here's some examples of things you will want to document in a POC Readiness Review:

- What are you hoping to accomplish?
- Who is the owner for the POC?
- Who are the developers?
  - Is a Partner needed?
- What is the POC Minimum Viable Product?
- Architecture?
- Timeline?
  - Start date
  - End date
- How will you measure success?

### 3.3 POC Roadmap

There is a base knowledge level needed to build an Amazon Chime SDK application. First, you will need to choose the framework you will use, HTML w/ JavaScript (no framework or any framework other than React) or the React framework. For mobile devices (Android and iOS) you can choose to use the same Web-based application or create native apps. In general, new features and functionality come out first in the JavaScript version followed by the React version often several weeks later. However, using the built-in React components can mean less development effort and faster time to market.

#### 3.4 SDK Basics

#### 3.4.1 Building a JavaScript App

To understand how to get a basic video and audio application working in JavaScript please review the following links. Pay particular attention to the "Building a Meeting Application using the Amazon Chime SDK with JavaScript" blog and the workshop. These documents help you to understand the options for Participant Layout Control, how to construct a Roster and detect the active speaker.

- [GitHub Repository](https://github.com/aws/amazon-chime-sdk-js)
- [API Overview](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html)
- [Getting Started](https://aws.github.io/amazon-chime-sdk-js/modules/gettingstarted.html)
- [Building a Meeting Application using the Amazon Chime SDK with JavaScript](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-using-the-amazon-chime-sdk/)
- [Mute / Unmute](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#6-mute-and-unmute-microphone-audio-with-the-real-time-api)
  - Remote Mute can be implemented using [Centralized Attendee Controls](https://aws.amazon.com/about-aws/whats-new/2022/06/amazon-chime-sdk-supports-centralized-attendee-controls)
    - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html)
    - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html)
  - Or using [dataMessages](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#9-send-and-receive-data-messages-optional)
- [Participant Layout control](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#7-share-and-display-video)
- [Subscribe to an Active Speaker Detector](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#5d-subscribe-to-an-active-speaker-detector-optional)
- [Roster](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#5-build-a-roster-of-participants-using-the-real-time-api)

#### 3.4.2 Building a React App

To understand how to get a basic video and audio application working in JavaScipt with Reacct, please review the following links. Pay particular attention to the "Building with Amazon Chime SDK Using React" workshop. It will help you understand how a basic Amazon Chime SDK application is constructed, and build an Amazon Chime SDK React application. The documents will also help you understand the options for Participant Layout Control, how to construct a Roster and detect the current Active Speaker.

- [GitHub Repository](https://github.com/aws/amazon-chime-sdk-component-library-react)
- [Getting Started](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/docs/quick-starts--page)
- This Hands-on Workshop creates a working React Amazon Chime SDK Web App
  - [Workshop Studio - Building with Amazon Chime SDK Using React](https://catalog.us-east-1.prod.workshops.aws/v2/workshops/de1c7d2d-6826-44db-a678-ff7a62747ec4/en-US/)
- Here is a third-party article about building with the Amazon Chime SDK
  - [How to build a video calling POC with AWS chime and ReactJS](https://blog.nona.digital/how-to-build-a-video-calling-poc-with-aws-chime-and-reactjs/)
- [Mute / Unmute](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/story/sdk-hooks-usetogglelocalmute--page)
  - Remote Mute can be implemented using [Centralized Attendee Controls](https://aws.amazon.com/about-aws/whats-new/2022/06/amazon-chime-sdk-supports-centralized-attendee-controls)
    - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html)
    - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html)
  - Or using [dataMessages](https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#9-send-and-receive-data-messages-optional)
- [Participant Layout control](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/docs/ui-components-grid--named-grid)
- [Highlight Current Speaker](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/story/sdk-hooks-useactivespeakersstate--page)
- Roster
  - [useRosterState](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/story/sdk-hooks-userosterstate--page)
  - [Roster Header with Navigation Icon](https://aws.github.io/amazon-chime-sdk-component-library-react/?path=/story/ui-components-roster--roster-header-with-navigation-icon)
- [Amazon Chime SDK Smart Video Sending Demo](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdk-smart-video-sending-demo/)

#### 3.4.3 Building a Mobile App

You can choose to create native apps for Android and iOS. Run through the demo apps and workshops below to see what examples of what can be done:

- [Introducing the Amazon Chime SDKs for iOS and Android](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdks-ios-android/)
- [Building a Meeting Application on iOS using the Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-on-ios-using-the-amazon-chime-sdk/)
- [Building a Meeting Application on Android using the Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/building-a-meeting-application-on-android-using-the-amazon-chime-sdk/)
- [WKWebView and Webview](https://aws.amazon.com/about-aws/whats-new/2021/05/wkwebview-now-supported-with-amazon-chime-sdk-for-javascript/)(embedding Amazon Chime SDK JavaScript into a mobile app)
  - [https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/iOS-WKWebView-sample](https://github.com/aws-samples/amazon-chime-sdk/tree/main/apps/iOS-WKWebView-sample)
  - [https://developer.chrome.com/docs/multidevice/webview/gettingstarted/](https://developer.chrome.com/docs/multidevice/webview/gettingstarted/)

### 3.5 Review Layout Options

An important consideration for the user experience is the layout of the display. This document walks you through the more common layouts and how to implement them with JavaScript and React: [Managing Video Quality for Different Video Layouts](https://aws.github.io/amazon-chime-sdk-js/modules/videolayout.html#managing-video-quality-for-different-video-layouts). It will help you get it right the first time.

### 3.6 Considerations for Quality, Bandwidth and Connectivity

The Amazon Chime SDK allows you to show up to 25 video tiles and resolution up to 720p. However, you will not be able to show 25 video tiles at the highest resolution because of CPU and bandwidth limitations. Current guidance is to only show 4 720p tiles on a screen. A client's CPU, bandwidth and the resolution of the tiles will affect how many tiles their device can display. Finally, the SDK can make some automated adjustments of the transmitted video resolution based on the number of participants with video turned on. Additional guidance can be found in "[Quality, Bandwidth and Connectivity](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html)".

### 3.7 Security

Because there are a number of ways to implement authentication and authorization (including no authentication), Amazon Chime SDK provides a way your server side application can control who can attend a meeting. When an attendee joins a meeting, they are given a join token. That join token is what allows them to get and send the media. The primary way to control who gets a join token is via your server-side app. The links below provide additional information.

- [How do users authenticate into a meeting?](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html#how-do-users-authenticate-into-a-meeting)
- [Understanding Security in the Amazon Chime Application and SDK](https://aws.amazon.com/blogs/business-productivity/understanding-security-in-the-amazon-chime-application-and-sdk/)
- [Identification and Authorization](https://aws.amazon.com/blogs/opensource/real-world-serverless-application/)

### 3.8 Advanced Features

Up until now we have been focused on getting into meetings and starting a meeting with voice, video and screen sharing. Now let's look at things that can be added to further enhance the meeting experience.

#### 3.8.1 Meeting Management

In addition to the main meeting, you may want to hold attendees in a Waiting Room until a certain number of attendees join or until the presenter joins. This is often just implemented as a web page that then automatically moves them to the main meeting at the appropriate time, or when a particular dataMessage is received.. Breakout rooms allow a presenter or administrator to create meetings for a subset of the attendees in the main meeting for smaller group discussions. These are just additional meetings with people moved to / from the main meeting. If you need to have separate groups of audio or video an attendee can choose from (multiple languages, more than 100 video sources), it is possible to join multiple meetings simultaneously. Please read through the additional information in the links below.

- [Break-out Rooms](https://aws.amazon.com/blogs/business-productivity/breakout-room-amazon-chime-sdk-react-component-library/)
- [Centralized Attendee Controls](https://aws.amazon.com/about-aws/whats-new/2022/06/amazon-chime-sdk-supports-centralized-attendee-controls)
  - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_UpdateAttendeeCapabilities.html)
  - [https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_AttendeeCapabilities.html)

#### 3.8.2 Recording / Media Capture

If you want to record a meeting, there are multiple ways of doing it with the Amazon Chime SDK. The client can have recording built-in so that it records directly to the local client's hard drive. This has the advantage of being easy but can take up a lot of room on the hard drive and presents an additional local CPU load which can cause audio and video problems for larger meetings. The second method is to have a remote app you deploy join the meeting and record whatever a browser sees in the meeting (see the Recording Demo). You are responsible for running the infrastructure but the output is a simple, single MP4 video file in an S3 bucket. Finally, you can use the Media Capture API to have the system (in the cloud) join your meeting. You can then record just the active speaker or 1 to all individual video streams and mixed audio in the meeting. Each stream is captured in 5 second chunks to allow for near real-time AI/ML processing of the video and audio. This means that you will have to stitch these chunks back together to reconstitute the whole stream. This also means that if you want to get all of the video into a single MP4 file, you will have to do the processing to create a composite video of all of the individual MP4 files. You can set up and run each of the recording options so you can experience the differences.

- [How to Enable Client-Side Recording Using the Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/how-to-enable-client-side-recording-using-the-amazon-chime-sdk/)
- [Recording Demo](https://github.com/aws-samples/amazon-chime-sdk-recording-demo)
- [Media Capture](https://aws.amazon.com/blogs/business-productivity/capture-amazon-chime-sdk-meetings-using-media-capture-pipelines/)

#### 3.8.3 Messaging / Chat

The Messaging API of the Amazon Chime SDK can be using with or completely independent of a Meeting. The following blog shows an example of a basic Messaging application. Deploy it and run it to become familiar with its capabilities.

- [Build chat features into your application with Amazon Chime SDK messaging](https://aws.amazon.com/blogs/business-productivity/build-chat-features-into-your-application-with-amazon-chime-sdk-messaging/)

Sometimes you want to use your own identity provider. Read through this blog to learn how:

- [Integrate your Identity Provider with Amazon Chime SDK Messaging](https://aws.amazon.com/blogs/business-productivity/integrate-your-identity-provider-with-amazon-chime-sdk-messaging/)

#### 3.8.4 Background / Image Modification

With the Amazon Chime SDK, it is possible to process the image from the camera before sending it on to the meeting. There is a lower-level set of APIs for doing your own video processing of a video frame and higher-level APIs for adding background blur or for replacing the entire background image. Read through the first two Video Processing API papers to get an understanding of what it can do and set up and run the demo in the "Blur your Background and Suppress Noise" blog.

- [Video Processing APIs](https://aws.github.io/amazon-chime-sdk-js/modules/videoprocessor.html)
- [Chime Video Processing API's GitHub Repo](https://github.com/aws/amazon-chime-sdk-js/blob/master/guides/10_Video_Processor.md)
- [Blur your Background and suppress noise](https://aws.amazon.com/blogs/business-productivity/blur-your-background-and-suppress-noise-in-an-online-meeting-application-built-with-the-amazon-chime-sdk-for-javascript/)

#### 3.8.5 PSTN call processing

Users can call to/from meetings from the Public Switched Telephone Network (PSTN) using a desk phone or mobile phone. They can also build stand-alone PSTN apps that can dynamically route calls based on user (DTMF), database, or AI/ML data. Review the links below to become familiar with the techniques and capabilities:

- [Updating an In-Progress Amazon Chime SIP Media Application Call](https://github.com/aws-samples/amazon-chime-sma-update-call)
- [Amazon Chime SDK PSTN Audio Sample Call Flow](https://docs.aws.amazon.com/chime/latest/dg/call-flow.html)
- [PSTN dial-in for Amazon Chime SDK with Amazon Chime SIP Media Application](https://github.com/aws-samples/chime-sipmediaapplication-samples)
- [Building a Click-To-Call Application with Amazon Chime SDK](https://catalog.us-east-1.prod.workshops.aws/workshops/43b40159-ea91-4a81-ac6e-3f6906034ea0/en-US) (Meeting Outbound dialing)
- [Building Telephony-Powered Applications with the Amazon Chime SDK PSTN Audio Service](https://catalog.workshops.aws/building-with-chime-sdk/en-US)
- [Amazon Chime Click-To-Call Starter Project](https://github.com/aws-samples/amazon-chime-sdk-click-to-call)
- [Amazon Chime SDK PSTN Audio Workshop](https://github.com/aws-samples/amazon-chime-sdk-pstn-audio-workshop)

#### 3.8.6 React Native

The following React Native demo will show how you can integrate the Amazon Chime SDK with a React Native application.

- [Amazon Chime SDK React Native Demo](https://github.com/aws-samples/amazon-chime-react-native-demo)

Note: This is a limited function demo. Many times, folks wanting to use this demo are looking for a way to create an Amazon Chime SDK application without having to know the underlying iOS or Android environment. If they find that the functionality they want to implement is not in the demo, they will have to go into the native application to implement it.

### 3.9 Understanding Key Use Cases

#### 3.9.1 Virtual Classroom

A popular use case for the Amazon Chime SDK is building a remote classroom application. Read through this blog and deploy the demo application below:

- [Building a Virtual Classroom Application using the Amazon Chime SDK and Electron](https://aws.amazon.com/blogs/business-productivity/building-a-virtual-classroom-application-using-the-amazon-chime-sdk/)

#### 3.9.2 Broadcast Live Events

You can build a live events platform with Amazon Chime SDK at its core. The SDK provides a space for the interactive portion while IVS (or other Broadcast Service) provides one-way distribution to over 100,000 users. Review the demos below. Deploy and use "Amazon Chime Meeting Broadcast Demo" to test this capability.

- [Amazon Chime Meeting Broadcast Demo](https://github.com/aws-samples/amazon-chime-meeting-broadcast-demo)
- [How to deploy a live events solution built with the Amazon Chime SDK](https://aws.amazon.com/blogs/opensource/how-to-deploy-a-live-events-solution-built-with-the-amazon-chime-sdk/)
- [Town Hall/Webinar sample application](https://github.com/aws-samples/amazon-chime-live-events)

#### 3.9.3 Telehealth

- [CareMonitor Scales Telehealth and Remote Patient Monitoring Platform with AWS](https://aws.amazon.com/solutions/case-studies/caremonitor/)
- [Embed Healthcare Appointment Scheduling Widget with the Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/embed-healthcare-appointment-scheduling-widget-with-the-amazon-chime-sdk/)

### 3.10 POC Testing

Testing is one of the most important steps in developing an app for the Amazon Chime SDK. Because each application provides a unique combination of bandwidth and CPU loads, it is necessary to test the hardware and bandwidth configurations you plan to support.

- Test a range of supported devices (current and older): Windows, Mac, iOS, Android, Chromebook. Will you support a 5 year old Chromebook? If so, you need to test it.
- Test on all supported browsers (see [https://aws.amazon.com/chime/chime-sdk/faq/](https://aws.amazon.com/chime/chime-sdk/faq/))
- Test with heavy CPU load
  - [https://docs.microsoft.com/en-us/sysinternals/downloads/cpustres](https://docs.microsoft.com/en-us/sysinternals/downloads/cpustres)
  - [https://osxdaily.com/2012/10/02/stress-test-mac-cpu/](https://osxdaily.com/2012/10/02/stress-test-mac-cpu/)
- Test with bandwidth constraints
  - [Throttling within Chrome Browser](https://www.guidingtech.com/manage-throttle-download-speed-chrome/)
  - [http://wanem.sourceforge.net/](http://wanem.sourceforge.net/) (Windows)
  - [https://nshipster.com/network-link-conditioner/](https://nshipster.com/network-link-conditioner/) (Mac & iOS)

## 4 Amazon Chime SDK Business Case – Go/No-go

In order to proceed there must be a valid business case that justifies the continued effort required to build a production Amazon Chime SDK meetings application. Review the results of the POC, decide if it is worth proceeding and establish requirements and goals for the next phase, Pilot deployment.

### 4.1 POC Outcome Review / Pilot Readiness Review

A POC Outcome Review documents how your application performed against the POC goals and timelines. You would hold a POC Outcome Review when a the POC is complete. The purpose of the review is to decide if the POC shows you can proceed to a larger Pilot Deployment. Here are some of the things you should examine

- Who is the owner for the Pilot?
- Who are the developers?
  - Is a Partner needed?
- What is the Pilot Minimum Viable Product?
  - Be sure to include any new operations requirements
- Architecture?
- Understand line of business impacts
- Success metrics and expectations
- Pricing questions and understanding
- Deployment plan and needed support (marketing awareness)
- Timelines for launch, ramp period to peak, growth expectations
- Known usage patterns or spikes

## 5.0 Pilot Deployment

Once you have decided to build a Pilot application you may need to add additional functionality. Some will be functionality listed above in the POC section. Often, you will need to add functionality to make the application more supportable as listed below. When you have your MVP complete for the Pilot launch, it is time for an Amazon Chime SDK Application Review.

### 5.1 Resiliency

There are a number of environmental issues that can impact the performance of an Amazon Chime SDK application including the device CPU and bandwidth it is running on. Please review the following document for guidance on how best to identify when you are having issues, the causes and how to mitigate them:

- [Quality, Bandwidth and Connectivity](https://aws.github.io/amazon-chime-sdk-js/modules/qualitybandwidth_connectivity.html)

### 5.2 Logging, Monitoring, and Troubleshooting

For a POC, you may be able to do without much in the way of logging or monitoring for the application (though it can still help if you run into issues). When going into production, it is very important to be able to collect logs for each call so that you can try to find the cause of a user's issue. The server-side events (Meeting created /deleted, Attendee added / deleted, and Attendee joined / left / dropped) should be logged at a minimum. The following blogs walks you through logging server-side events in CloudWatch and setting up a simple dashboard for them:

- [Server-Side Logging and Monitoring of Amazon Chime SDK Events](https://aws.amazon.com/blogs/business-productivity/server-side-logging-and-monitoring-of-amazon-chime-sdk-events/)

This next blog talks about adding client-side events to CloudWatch:

- [Monitoring and troubleshooting with Amazon Chime SDK meeting events |...](https://aws.amazon.com/blogs/business-productivity/monitoring-and-troubleshooting-with-amazon-chime-sdk-meeting-events/)
- [Automating Amazon Chime with EventBridge - Amazon Chime](https://docs.aws.amazon.com/chime/latest/ag/automating-chime-with-cloudwatch-events.html#events-sdk)

These slide decks provide some guidance for troubleshooting:

- [Amazon Chime SDK Monitoring and Troubleshooting Powerpoint](#_Appendix_B_%E2%80%93)

### 5.3 Amazon Chime SDK Application Review

The application review is a guided conversation about your meeting service (back end) and meeting application (front end) usually conducted by an Amazon Chime SDK SA. It is intended to identify potential major issues, discover anti-patterns, and share best practices in the context of the your solution. It is not a comprehensive code review.

Beyond your application, a [Well Architected Review](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) looks at Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization and Sustainability of the deployed resources as well and is worth considering. It is typically conducted by the Account SA.

### 5.4 Implement any required changes and Deploy the Pilot

Any required changes from the Application Review would need to be implemented then the Amazon Chime SDK application can be deployed. The Pilot deployment should have defined goals to meet for time and thresholds for expanding the deployment to Production. If the you have Enterprise Support or Business Support (with an additional charge), you should work with the TAM to determine if an [IEM (Infrastructure Event Management)](https://w.amazon.com/bin/view/AWS/IEM) engagement would be helpful. Note that an IEM is typically planned 6-8 weeks in advance but shorter-term IEM's can sometimes be accommodated if needed.

## 6.0 Production Deployment

Prior to expanding the Pilot into Production, any issues discovered in Pilot will have to be triaged and those that are show stoppers, fixed. A Production Readiness Review is a formal meeting with the you, the Account team, the TAM, the Sales Specialist and Specialist SA to assess the readiness to expand the deployment into Production. This expansion is sometimes limited to a specific geography or set of users but usually represents a significant portion of the planned usage.

### 6.1 Production Readiness Review

A Production Readiness Review helps you document your goals and timelines. You would hold a Production Readiness Review when the Pilot is complete and you are ready to support a production workload. You will need to consider the following for a Production Readiness Review:

- Review Pilot Results / Issues
- Review launch date, ramp period to peak, growth expectations
- Review known usage patterns or spikes
- Expected service team support

### 6.1 Production Launch

After The Production Readiness Review, the application can be opened up to additional users. Ideally this would be a phased roll-out of a short time-period while watching for load related issues.

## 7.0 Post-Launch phase

After launch, it would be good to assess what went well and where there were issues. It would be a good time to review your usage and metrics and bring seek suggestions for optimizing your utilization, quota utilization, infrastructure, expansion on your application functionality, and improvements in operational metrics. It would also be a good time to have an NDA Roadmap discussion with the Specialist SA so they can plan for any new features that are coming out in the near future.

## Reference Information

- [Getting Started Guides](https://github.com/aws/amazon-chime-sdk-js/tree/main/guides)
- [AWS glossary - AWS General Reference](https://docs.aws.amazon.com/general/latest/gr/glos-chap.html)
- [Support Technology and Programs](https://aws.amazon.com/premiumsupport/)
- [Amazon Chime SDK FAQs](https://aws.amazon.com/chime/chime-sdk/faq/)
- [https://github.com/aws/amazon-chime-sdk-js/tree/main/guides](https://github.com/aws/amazon-chime-sdk-js/tree/main/guides)
- Making Amazon Chime SDK an installable Windows or Mac App
  - [https://www.electronjs.org/](https://www.electronjs.org/)
  - [https://github.com/aws-samples/amazon-chime-sdk-classroom-demo](https://github.com/aws-samples/amazon-chime-sdk-classroom-demo)
