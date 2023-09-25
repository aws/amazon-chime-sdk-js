# Integrating Meeting Features into your Amazon Chime SDK for JavaScript application

Chime SDK provides meeting features to enhance user experience. Clients have options to select the meeting features that match their requirements. For example, clients with excellent hardware devices and resources could enjoy best quality by selecting FHD for camera video and UHD for content share. Clients with the goal to control cost could select HD for camera video and FHD for content share. This document describes the meeting features in Chime SDK and how to use them in builder’s app.

## Video Feature

Video feature allows builders to specify the maximum camera video resolution for the meeting. The available options are:

* None: no camera video allowed 
* HD: high-definition camera video (1280x720p)
* FHD: full-high-definition camera video (1920x1080)

Client is recommended to join the meeting with camera resolution at or below maximum allowed resolution. If client joins a meeting and sends camera video above maximum camera video resolution, the uplink video will be disabled with client log message like:

* Disabled video/content send capability, reason: Video resolution is above limit of current meeting feature selection

## Content Feature

Content feature allows builders to specify the maximum content share resolution for the meeting. The available options are:

* None: no content share allowed
* FHD: full-high-definition content share (1920x1080)
* UHD: ultra-high-definition content share (3840x2160)

If client joins a meeting and sends content share above maximum content share resolution, the content share resolution will be scaled down and continue to play. The scaling is done via applying proper MediaTrackConstraints to content share track (as shown below).

```typescript
  const constraint: MediaTrackConstraints = {
    width: { ideal: videoQualitySettings.videoWidth },
    height: { ideal: videoQualitySettings.videoHeight },
    frameRate: { ideal: videoQualitySettings.videoFrameRate },
  };
  this.context.logger.info(
    `Video track (content = ${isContentAttendee}) with constraint: ${JSON.stringify(
      constraint
    )}, trackSettings: ${JSON.stringify(trackSettings)}`
  );
  try {
    await mediaStreamTrack.applyConstraints(constraint);
  } catch (error) {
    this.context.logger.info(
      `Could not apply constraint for video track (content = ${isContentAttendee})`
    );
  }
  ```

The following table shows the expected behaviour for content sharing.


|Content Feature     |Content Share Native Resolution  |Scaling | Content Coding Resolution  |
|---                 |---                              |----    |---                         |
|FHD                 |1280x720                         |No      |1280x720                    |
|FHD                 |1920x1080                        |No      |1920x1080                   |
|FHD                 |3840x2160                        |Yes     |1920x1080                   |
|UHD                 |1920x1080                        |No      |1920x1080                   |
|UHD                 |3840x2160                        |No      |3840x2160                   |
|UHD                 |4200x2400                        |Yes     |3780x2160                   |


Please note that sample aspect ratio should be roughly same before and after scaling. Using last entry in above table as example, SAR before scaling is 4200 / 2400 = 1.75 and after scaling is 3780 / 2160 = 1.75.

## Attendee Feature

Attendee feature allows a builder to specify maximum number of attendees allowed in a meeting.

The following table shows the expected max number of attendees.


|Video Feature       |Content Feature  |Attendee Feature (max attendee count)  |
|---                 |---              |----                                   |
|None                |None             |250                                    |
|None                |FHD              |250                                    |
|None                |UHD              |25                                     |
|HD                  |None             |250                                    |
|HD                  |FHD              |250                                    |
|HD                  |UHD              |25                                     |
|FHD                 |None             |25                                     |
|FHD                 |FHD              |25                                     |
|FHD                 |UHD              |25                                     |


## What is default behaviour if no meeting features are specified?

The default behaviour in the case that no meeting features are specified:

* Camera video resolution up to 1280x720
* Content share resolution up to 1920x1080
* Attendee count up to 250

## How to use meeting features

Here are the links to meeting features API:

* Check [CreateMeeting Request](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_CreateMeeting.html#API_meeting-chime_CreateMeeting_RequestBody) for meeting features to be specified at meeting creation
* Check [CreateMeeting Response](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateMeeting.html#API_CreateMeeting_ResponseElements) for meeting response with specifed meeting features

> ⚠️ To use meeting features, you must migrate to the [Amazon Chime SDK Meetings](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_Operations_Amazon_Chime_SDK_Meetings.html) namespace. To do so, you can follow the steps in the [Migrating to the Amazon Chime SDK Meetings namespace](https://docs.aws.amazon.com/chime-sdk/latest/dg/meeting-namespace-migration.html).

Using Meeting Features is a two step process: 

### 1. Create a meeting with specified meeting features using Amazon Chime SDK Meetings namespace

The Amazon Chime SDK Meetings namespace uses a new service principal: meetings.chime.amazonaws.com. If you have SQS, SNS, or other IAM access policies that grant access to the service, you need to update those polices to grant access to the new service principal.

More information regarding this change can be found [here](https://docs.aws.amazon.com/chime-sdk/latest/dg/meeting-namespace-migration.html).

Create your meeting by calling the CreateMeeting API and specifying meeting features.

```typescript
  // You must migrate to the Amazon Chime SDK Meetings namespace.
  const chime = AWS.ChimeSDKMeetings({ region: "eu-central-1" });

  // Create meeting 
  const meetingInfo = await chime.createMeeting({
    ...
    MeetingFeatures: {
      Audio: {
        EchoReduction: 'AVAILABLE' 
      },
      Video: {
        MaxResolution: 'FHD' 
      },
      Content: {
        MaxResolution: 'UHD' 
      },
      Attendee: {
        MaxCount: 25 
      },
    } 
  }).promise();
```

Where MeetingFeatures is an optional parameter which contains a list of audio, video, content, and attendee features that are specified at the meeting level. The Video sub-element is an optional category of meeting features which contains video-specific configurations, such as MaxResolution for camera video. The Content sub-element is an optional category of meeting features which contains content-specific configurations, such as MaxResolution for content share. The Attendee sub-element is an optional category of meeting features which contains attendee-specific configuration, such as MaxCount for attendees.


### 2. Using meeting features

Once you have created the meeting with the desired meeting features, you can pass in the joinInfo when creating MeetingSessionConfiguration. The meeting features are used meetingSessioin creation. meetingSession sets camera video max resolution and bitrate using video feature and content share max resolution and bitrate using content feature.

```typescript
  const configuration = new MeetingSessionConfiguration(this.joinInfo.Meeting, this.joinInfo.Attendee);

  this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.meetingLogger,
      this.deviceController,
      new DefaultEventController(configuration, this.meetingLogger, this.eventReporter)
  );
```

