import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a SdkSignalFrame. */
export interface ISdkSignalFrame {

    /** SdkSignalFrame timestampMs */
    timestampMs: (number|Long);

    /** SdkSignalFrame type */
    type: SdkSignalFrame.Type;

    /** SdkSignalFrame error */
    error?: (ISdkErrorFrame|null);

    /** SdkSignalFrame join */
    join?: (ISdkJoinFrame|null);

    /** SdkSignalFrame joinack */
    joinack?: (ISdkJoinAckFrame|null);

    /** SdkSignalFrame sub */
    sub?: (ISdkSubscribeFrame|null);

    /** SdkSignalFrame suback */
    suback?: (ISdkSubscribeAckFrame|null);

    /** SdkSignalFrame index */
    index?: (ISdkIndexFrame|null);

    /** SdkSignalFrame pause */
    pause?: (ISdkPauseResumeFrame|null);

    /** SdkSignalFrame leave */
    leave?: (ISdkLeaveFrame|null);

    /** SdkSignalFrame leaveAck */
    leaveAck?: (ISdkLeaveAckFrame|null);

    /** SdkSignalFrame bitrates */
    bitrates?: (ISdkBitrateFrame|null);

    /** SdkSignalFrame audioControl */
    audioControl?: (ISdkAudioControlFrame|null);

    /** SdkSignalFrame audioMetadata */
    audioMetadata?: (ISdkAudioMetadataFrame|null);

    /** SdkSignalFrame audioStreamIdInfo */
    audioStreamIdInfo?: (ISdkAudioStreamIdInfoFrame|null);

    /** SdkSignalFrame pingPong */
    pingPong?: (ISdkPingPongFrame|null);

    /** SdkSignalFrame audioStatus */
    audioStatus?: (ISdkAudioStatusFrame|null);

    /** SdkSignalFrame clientMetric */
    clientMetric?: (ISdkClientMetricFrame|null);

    /** SdkSignalFrame dataMessage */
    dataMessage?: (ISdkDataMessageFrame|null);

    /** SdkSignalFrame remoteVideoUpdate */
    remoteVideoUpdate?: (ISdkRemoteVideoUpdateFrame|null);

    /** SdkSignalFrame primaryMeetingJoin */
    primaryMeetingJoin?: (ISdkPrimaryMeetingJoinFrame|null);

    /** SdkSignalFrame primaryMeetingJoinAck */
    primaryMeetingJoinAck?: (ISdkPrimaryMeetingJoinAckFrame|null);

    /** SdkSignalFrame primaryMeetingLeave */
    primaryMeetingLeave?: (ISdkPrimaryMeetingLeaveFrame|null);

    /** SdkSignalFrame notification */
    notification?: (ISdkNotificationFrame|null);
}

/** Represents a SdkSignalFrame. */
export class SdkSignalFrame implements ISdkSignalFrame {

    /**
     * Constructs a new SdkSignalFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkSignalFrame);

    /** SdkSignalFrame timestampMs. */
    public timestampMs: (number|Long);

    /** SdkSignalFrame type. */
    public type: SdkSignalFrame.Type;

    /** SdkSignalFrame error. */
    public error?: (ISdkErrorFrame|null);

    /** SdkSignalFrame join. */
    public join?: (ISdkJoinFrame|null);

    /** SdkSignalFrame joinack. */
    public joinack?: (ISdkJoinAckFrame|null);

    /** SdkSignalFrame sub. */
    public sub?: (ISdkSubscribeFrame|null);

    /** SdkSignalFrame suback. */
    public suback?: (ISdkSubscribeAckFrame|null);

    /** SdkSignalFrame index. */
    public index?: (ISdkIndexFrame|null);

    /** SdkSignalFrame pause. */
    public pause?: (ISdkPauseResumeFrame|null);

    /** SdkSignalFrame leave. */
    public leave?: (ISdkLeaveFrame|null);

    /** SdkSignalFrame leaveAck. */
    public leaveAck?: (ISdkLeaveAckFrame|null);

    /** SdkSignalFrame bitrates. */
    public bitrates?: (ISdkBitrateFrame|null);

    /** SdkSignalFrame audioControl. */
    public audioControl?: (ISdkAudioControlFrame|null);

    /** SdkSignalFrame audioMetadata. */
    public audioMetadata?: (ISdkAudioMetadataFrame|null);

    /** SdkSignalFrame audioStreamIdInfo. */
    public audioStreamIdInfo?: (ISdkAudioStreamIdInfoFrame|null);

    /** SdkSignalFrame pingPong. */
    public pingPong?: (ISdkPingPongFrame|null);

    /** SdkSignalFrame audioStatus. */
    public audioStatus?: (ISdkAudioStatusFrame|null);

    /** SdkSignalFrame clientMetric. */
    public clientMetric?: (ISdkClientMetricFrame|null);

    /** SdkSignalFrame dataMessage. */
    public dataMessage?: (ISdkDataMessageFrame|null);

    /** SdkSignalFrame remoteVideoUpdate. */
    public remoteVideoUpdate?: (ISdkRemoteVideoUpdateFrame|null);

    /** SdkSignalFrame primaryMeetingJoin. */
    public primaryMeetingJoin?: (ISdkPrimaryMeetingJoinFrame|null);

    /** SdkSignalFrame primaryMeetingJoinAck. */
    public primaryMeetingJoinAck?: (ISdkPrimaryMeetingJoinAckFrame|null);

    /** SdkSignalFrame primaryMeetingLeave. */
    public primaryMeetingLeave?: (ISdkPrimaryMeetingLeaveFrame|null);

    /** SdkSignalFrame notification. */
    public notification?: (ISdkNotificationFrame|null);

    /**
     * Creates a new SdkSignalFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkSignalFrame instance
     */
    public static create(properties?: ISdkSignalFrame): SdkSignalFrame;

    /**
     * Encodes the specified SdkSignalFrame message. Does not implicitly {@link SdkSignalFrame.verify|verify} messages.
     * @param message SdkSignalFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkSignalFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkSignalFrame message, length delimited. Does not implicitly {@link SdkSignalFrame.verify|verify} messages.
     * @param message SdkSignalFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkSignalFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkSignalFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkSignalFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkSignalFrame;

    /**
     * Decodes a SdkSignalFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkSignalFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkSignalFrame;

    /**
     * Verifies a SdkSignalFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkSignalFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkSignalFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkSignalFrame;

    /**
     * Creates a plain object from a SdkSignalFrame message. Also converts values to other types if specified.
     * @param message SdkSignalFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkSignalFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkSignalFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkSignalFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkSignalFrame {

    /** Type enum. */
    enum Type {
        JOIN = 1,
        JOIN_ACK = 2,
        SUBSCRIBE = 3,
        SUBSCRIBE_ACK = 4,
        INDEX = 5,
        PAUSE = 7,
        RESUME = 8,
        LEAVE = 9,
        LEAVE_ACK = 10,
        BITRATES = 13,
        AUDIO_CONTROL = 16,
        AUDIO_METADATA = 17,
        AUDIO_STREAM_ID_INFO = 18,
        PING_PONG = 19,
        AUDIO_STATUS = 20,
        CLIENT_METRIC = 21,
        DATA_MESSAGE = 22,
        REMOTE_VIDEO_UPDATE = 24,
        PRIMARY_MEETING_JOIN = 25,
        PRIMARY_MEETING_JOIN_ACK = 26,
        PRIMARY_MEETING_LEAVE = 27,
        NOTIFICATION = 34
    }
}

/** Properties of a SdkErrorFrame. */
export interface ISdkErrorFrame {

    /** SdkErrorFrame status */
    status?: (number|null);

    /** SdkErrorFrame description */
    description?: (string|null);
}

/** Represents a SdkErrorFrame. */
export class SdkErrorFrame implements ISdkErrorFrame {

    /**
     * Constructs a new SdkErrorFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkErrorFrame);

    /** SdkErrorFrame status. */
    public status: number;

    /** SdkErrorFrame description. */
    public description: string;

    /**
     * Creates a new SdkErrorFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkErrorFrame instance
     */
    public static create(properties?: ISdkErrorFrame): SdkErrorFrame;

    /**
     * Encodes the specified SdkErrorFrame message. Does not implicitly {@link SdkErrorFrame.verify|verify} messages.
     * @param message SdkErrorFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkErrorFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkErrorFrame message, length delimited. Does not implicitly {@link SdkErrorFrame.verify|verify} messages.
     * @param message SdkErrorFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkErrorFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkErrorFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkErrorFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkErrorFrame;

    /**
     * Decodes a SdkErrorFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkErrorFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkErrorFrame;

    /**
     * Verifies a SdkErrorFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkErrorFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkErrorFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkErrorFrame;

    /**
     * Creates a plain object from a SdkErrorFrame message. Also converts values to other types if specified.
     * @param message SdkErrorFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkErrorFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkErrorFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkErrorFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkJoinFlags enum. */
export enum SdkJoinFlags {
    HAS_STREAM_UPDATE = 2,
    COMPLETE_VIDEO_SOURCES_LIST = 16,
    EXCLUDE_SELF_CONTENT_IN_INDEX = 32
}

/** Properties of a SdkClientDetails. */
export interface ISdkClientDetails {

    /** SdkClientDetails appName */
    appName?: (string|null);

    /** SdkClientDetails appVersion */
    appVersion?: (string|null);

    /** SdkClientDetails deviceModel */
    deviceModel?: (string|null);

    /** SdkClientDetails deviceMake */
    deviceMake?: (string|null);

    /** SdkClientDetails platformName */
    platformName?: (string|null);

    /** SdkClientDetails platformVersion */
    platformVersion?: (string|null);

    /** SdkClientDetails clientSource */
    clientSource?: (string|null);

    /** SdkClientDetails chimeSdkVersion */
    chimeSdkVersion?: (string|null);

    /** SdkClientDetails clientUtcOffset */
    clientUtcOffset?: (string|null);
}

/** Represents a SdkClientDetails. */
export class SdkClientDetails implements ISdkClientDetails {

    /**
     * Constructs a new SdkClientDetails.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkClientDetails);

    /** SdkClientDetails appName. */
    public appName: string;

    /** SdkClientDetails appVersion. */
    public appVersion: string;

    /** SdkClientDetails deviceModel. */
    public deviceModel: string;

    /** SdkClientDetails deviceMake. */
    public deviceMake: string;

    /** SdkClientDetails platformName. */
    public platformName: string;

    /** SdkClientDetails platformVersion. */
    public platformVersion: string;

    /** SdkClientDetails clientSource. */
    public clientSource: string;

    /** SdkClientDetails chimeSdkVersion. */
    public chimeSdkVersion: string;

    /** SdkClientDetails clientUtcOffset. */
    public clientUtcOffset: string;

    /**
     * Creates a new SdkClientDetails instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkClientDetails instance
     */
    public static create(properties?: ISdkClientDetails): SdkClientDetails;

    /**
     * Encodes the specified SdkClientDetails message. Does not implicitly {@link SdkClientDetails.verify|verify} messages.
     * @param message SdkClientDetails message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkClientDetails, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkClientDetails message, length delimited. Does not implicitly {@link SdkClientDetails.verify|verify} messages.
     * @param message SdkClientDetails message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkClientDetails, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkClientDetails message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkClientDetails
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkClientDetails;

    /**
     * Decodes a SdkClientDetails message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkClientDetails
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkClientDetails;

    /**
     * Verifies a SdkClientDetails message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkClientDetails message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkClientDetails
     */
    public static fromObject(object: { [k: string]: any }): SdkClientDetails;

    /**
     * Creates a plain object from a SdkClientDetails message. Also converts values to other types if specified.
     * @param message SdkClientDetails
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkClientDetails, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkClientDetails to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkClientDetails
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkServerSideNetworkAdaption enum. */
export enum SdkServerSideNetworkAdaption {
    DEFAULT = 1,
    NONE = 2,
    BANDWIDTH_PROBING = 3,
    BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION = 4
}

/** Properties of a SdkJoinFrame. */
export interface ISdkJoinFrame {

    /** SdkJoinFrame protocolVersion */
    protocolVersion?: (number|null);

    /** SdkJoinFrame maxNumOfVideos */
    maxNumOfVideos?: (number|null);

    /** SdkJoinFrame flags */
    flags?: (number|null);

    /** SdkJoinFrame clientDetails */
    clientDetails?: (ISdkClientDetails|null);

    /** SdkJoinFrame audioSessionId */
    audioSessionId?: (number|Long|null);

    /** SdkJoinFrame wantsCompressedSdp */
    wantsCompressedSdp?: (boolean|null);

    /** SdkJoinFrame serverSideNetworkAdaption */
    serverSideNetworkAdaption?: (SdkServerSideNetworkAdaption|null);

    /** SdkJoinFrame supportedServerSideNetworkAdaptions */
    supportedServerSideNetworkAdaptions?: (SdkServerSideNetworkAdaption[]|null);

    /** SdkJoinFrame wantsAllTemporalLayersInIndex */
    wantsAllTemporalLayersInIndex?: (boolean|null);

    /** SdkJoinFrame disablePeriodicKeyframeRequestOnContentSender */
    disablePeriodicKeyframeRequestOnContentSender?: (boolean|null);
}

/** Represents a SdkJoinFrame. */
export class SdkJoinFrame implements ISdkJoinFrame {

    /**
     * Constructs a new SdkJoinFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkJoinFrame);

    /** SdkJoinFrame protocolVersion. */
    public protocolVersion: number;

    /** SdkJoinFrame maxNumOfVideos. */
    public maxNumOfVideos: number;

    /** SdkJoinFrame flags. */
    public flags: number;

    /** SdkJoinFrame clientDetails. */
    public clientDetails?: (ISdkClientDetails|null);

    /** SdkJoinFrame audioSessionId. */
    public audioSessionId: (number|Long);

    /** SdkJoinFrame wantsCompressedSdp. */
    public wantsCompressedSdp: boolean;

    /** SdkJoinFrame serverSideNetworkAdaption. */
    public serverSideNetworkAdaption: SdkServerSideNetworkAdaption;

    /** SdkJoinFrame supportedServerSideNetworkAdaptions. */
    public supportedServerSideNetworkAdaptions: SdkServerSideNetworkAdaption[];

    /** SdkJoinFrame wantsAllTemporalLayersInIndex. */
    public wantsAllTemporalLayersInIndex: boolean;

    /** SdkJoinFrame disablePeriodicKeyframeRequestOnContentSender. */
    public disablePeriodicKeyframeRequestOnContentSender: boolean;

    /**
     * Creates a new SdkJoinFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkJoinFrame instance
     */
    public static create(properties?: ISdkJoinFrame): SdkJoinFrame;

    /**
     * Encodes the specified SdkJoinFrame message. Does not implicitly {@link SdkJoinFrame.verify|verify} messages.
     * @param message SdkJoinFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkJoinFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkJoinFrame message, length delimited. Does not implicitly {@link SdkJoinFrame.verify|verify} messages.
     * @param message SdkJoinFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkJoinFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkJoinFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkJoinFrame;

    /**
     * Decodes a SdkJoinFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkJoinFrame;

    /**
     * Verifies a SdkJoinFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkJoinFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkJoinFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkJoinFrame;

    /**
     * Creates a plain object from a SdkJoinFrame message. Also converts values to other types if specified.
     * @param message SdkJoinFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkJoinFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkJoinFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkJoinFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkJoinAckFrame. */
export interface ISdkJoinAckFrame {

    /** SdkJoinAckFrame turnCredentials */
    turnCredentials?: (ISdkTurnCredentials|null);

    /** SdkJoinAckFrame videoSubscriptionLimit */
    videoSubscriptionLimit?: (number|null);

    /** SdkJoinAckFrame wantsCompressedSdp */
    wantsCompressedSdp?: (boolean|null);

    /** SdkJoinAckFrame defaultServerSideNetworkAdaption */
    defaultServerSideNetworkAdaption?: (SdkServerSideNetworkAdaption|null);
}

/** Represents a SdkJoinAckFrame. */
export class SdkJoinAckFrame implements ISdkJoinAckFrame {

    /**
     * Constructs a new SdkJoinAckFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkJoinAckFrame);

    /** SdkJoinAckFrame turnCredentials. */
    public turnCredentials?: (ISdkTurnCredentials|null);

    /** SdkJoinAckFrame videoSubscriptionLimit. */
    public videoSubscriptionLimit: number;

    /** SdkJoinAckFrame wantsCompressedSdp. */
    public wantsCompressedSdp: boolean;

    /** SdkJoinAckFrame defaultServerSideNetworkAdaption. */
    public defaultServerSideNetworkAdaption: SdkServerSideNetworkAdaption;

    /**
     * Creates a new SdkJoinAckFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkJoinAckFrame instance
     */
    public static create(properties?: ISdkJoinAckFrame): SdkJoinAckFrame;

    /**
     * Encodes the specified SdkJoinAckFrame message. Does not implicitly {@link SdkJoinAckFrame.verify|verify} messages.
     * @param message SdkJoinAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkJoinAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkJoinAckFrame message, length delimited. Does not implicitly {@link SdkJoinAckFrame.verify|verify} messages.
     * @param message SdkJoinAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkJoinAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkJoinAckFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkJoinAckFrame;

    /**
     * Decodes a SdkJoinAckFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkJoinAckFrame;

    /**
     * Verifies a SdkJoinAckFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkJoinAckFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkJoinAckFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkJoinAckFrame;

    /**
     * Creates a plain object from a SdkJoinAckFrame message. Also converts values to other types if specified.
     * @param message SdkJoinAckFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkJoinAckFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkJoinAckFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkJoinAckFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkLeaveFrame. */
export interface ISdkLeaveFrame {
}

/** Represents a SdkLeaveFrame. */
export class SdkLeaveFrame implements ISdkLeaveFrame {

    /**
     * Constructs a new SdkLeaveFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkLeaveFrame);

    /**
     * Creates a new SdkLeaveFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkLeaveFrame instance
     */
    public static create(properties?: ISdkLeaveFrame): SdkLeaveFrame;

    /**
     * Encodes the specified SdkLeaveFrame message. Does not implicitly {@link SdkLeaveFrame.verify|verify} messages.
     * @param message SdkLeaveFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkLeaveFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkLeaveFrame message, length delimited. Does not implicitly {@link SdkLeaveFrame.verify|verify} messages.
     * @param message SdkLeaveFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkLeaveFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkLeaveFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkLeaveFrame;

    /**
     * Decodes a SdkLeaveFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkLeaveFrame;

    /**
     * Verifies a SdkLeaveFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkLeaveFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkLeaveFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkLeaveFrame;

    /**
     * Creates a plain object from a SdkLeaveFrame message. Also converts values to other types if specified.
     * @param message SdkLeaveFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkLeaveFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkLeaveFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkLeaveFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkLeaveAckFrame. */
export interface ISdkLeaveAckFrame {
}

/** Represents a SdkLeaveAckFrame. */
export class SdkLeaveAckFrame implements ISdkLeaveAckFrame {

    /**
     * Constructs a new SdkLeaveAckFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkLeaveAckFrame);

    /**
     * Creates a new SdkLeaveAckFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkLeaveAckFrame instance
     */
    public static create(properties?: ISdkLeaveAckFrame): SdkLeaveAckFrame;

    /**
     * Encodes the specified SdkLeaveAckFrame message. Does not implicitly {@link SdkLeaveAckFrame.verify|verify} messages.
     * @param message SdkLeaveAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkLeaveAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkLeaveAckFrame message, length delimited. Does not implicitly {@link SdkLeaveAckFrame.verify|verify} messages.
     * @param message SdkLeaveAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkLeaveAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkLeaveAckFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkLeaveAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkLeaveAckFrame;

    /**
     * Decodes a SdkLeaveAckFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkLeaveAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkLeaveAckFrame;

    /**
     * Verifies a SdkLeaveAckFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkLeaveAckFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkLeaveAckFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkLeaveAckFrame;

    /**
     * Creates a plain object from a SdkLeaveAckFrame message. Also converts values to other types if specified.
     * @param message SdkLeaveAckFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkLeaveAckFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkLeaveAckFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkLeaveAckFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkStreamServiceType enum. */
export enum SdkStreamServiceType {
    RX = 1,
    TX = 2,
    DUPLEX = 3
}

/** SdkStreamMediaType enum. */
export enum SdkStreamMediaType {
    AUDIO = 1,
    VIDEO = 2
}

/** Properties of a SdkSubscribeFrame. */
export interface ISdkSubscribeFrame {

    /** SdkSubscribeFrame duplex */
    duplex?: (SdkStreamServiceType|null);

    /** SdkSubscribeFrame sendStreams */
    sendStreams?: (ISdkStreamDescriptor[]|null);

    /** SdkSubscribeFrame receiveStreamIds */
    receiveStreamIds?: (number[]|null);

    /** SdkSubscribeFrame sdpOffer */
    sdpOffer?: (string|null);

    /** SdkSubscribeFrame audioHost */
    audioHost?: (string|null);

    /** SdkSubscribeFrame audioCheckin */
    audioCheckin?: (boolean|null);

    /** SdkSubscribeFrame audioMuted */
    audioMuted?: (boolean|null);

    /** SdkSubscribeFrame compressedSdpOffer */
    compressedSdpOffer?: (Uint8Array|null);

    /** SdkSubscribeFrame videoSubscriptionConfiguration */
    videoSubscriptionConfiguration?: (ISdkVideoSubscriptionConfiguration[]|null);
}

/** Represents a SdkSubscribeFrame. */
export class SdkSubscribeFrame implements ISdkSubscribeFrame {

    /**
     * Constructs a new SdkSubscribeFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkSubscribeFrame);

    /** SdkSubscribeFrame duplex. */
    public duplex: SdkStreamServiceType;

    /** SdkSubscribeFrame sendStreams. */
    public sendStreams: ISdkStreamDescriptor[];

    /** SdkSubscribeFrame receiveStreamIds. */
    public receiveStreamIds: number[];

    /** SdkSubscribeFrame sdpOffer. */
    public sdpOffer: string;

    /** SdkSubscribeFrame audioHost. */
    public audioHost: string;

    /** SdkSubscribeFrame audioCheckin. */
    public audioCheckin: boolean;

    /** SdkSubscribeFrame audioMuted. */
    public audioMuted: boolean;

    /** SdkSubscribeFrame compressedSdpOffer. */
    public compressedSdpOffer: Uint8Array;

    /** SdkSubscribeFrame videoSubscriptionConfiguration. */
    public videoSubscriptionConfiguration: ISdkVideoSubscriptionConfiguration[];

    /**
     * Creates a new SdkSubscribeFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkSubscribeFrame instance
     */
    public static create(properties?: ISdkSubscribeFrame): SdkSubscribeFrame;

    /**
     * Encodes the specified SdkSubscribeFrame message. Does not implicitly {@link SdkSubscribeFrame.verify|verify} messages.
     * @param message SdkSubscribeFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkSubscribeFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkSubscribeFrame message, length delimited. Does not implicitly {@link SdkSubscribeFrame.verify|verify} messages.
     * @param message SdkSubscribeFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkSubscribeFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkSubscribeFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkSubscribeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkSubscribeFrame;

    /**
     * Decodes a SdkSubscribeFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkSubscribeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkSubscribeFrame;

    /**
     * Verifies a SdkSubscribeFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkSubscribeFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkSubscribeFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkSubscribeFrame;

    /**
     * Creates a plain object from a SdkSubscribeFrame message. Also converts values to other types if specified.
     * @param message SdkSubscribeFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkSubscribeFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkSubscribeFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkSubscribeFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkSubscribeAckFrame. */
export interface ISdkSubscribeAckFrame {

    /** SdkSubscribeAckFrame duplex */
    duplex?: (SdkStreamServiceType|null);

    /** SdkSubscribeAckFrame allocations */
    allocations?: (ISdkStreamAllocation[]|null);

    /** SdkSubscribeAckFrame sdpAnswer */
    sdpAnswer?: (string|null);

    /** SdkSubscribeAckFrame tracks */
    tracks?: (ISdkTrackMapping[]|null);

    /** SdkSubscribeAckFrame compressedSdpAnswer */
    compressedSdpAnswer?: (Uint8Array|null);
}

/** Represents a SdkSubscribeAckFrame. */
export class SdkSubscribeAckFrame implements ISdkSubscribeAckFrame {

    /**
     * Constructs a new SdkSubscribeAckFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkSubscribeAckFrame);

    /** SdkSubscribeAckFrame duplex. */
    public duplex: SdkStreamServiceType;

    /** SdkSubscribeAckFrame allocations. */
    public allocations: ISdkStreamAllocation[];

    /** SdkSubscribeAckFrame sdpAnswer. */
    public sdpAnswer: string;

    /** SdkSubscribeAckFrame tracks. */
    public tracks: ISdkTrackMapping[];

    /** SdkSubscribeAckFrame compressedSdpAnswer. */
    public compressedSdpAnswer: Uint8Array;

    /**
     * Creates a new SdkSubscribeAckFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkSubscribeAckFrame instance
     */
    public static create(properties?: ISdkSubscribeAckFrame): SdkSubscribeAckFrame;

    /**
     * Encodes the specified SdkSubscribeAckFrame message. Does not implicitly {@link SdkSubscribeAckFrame.verify|verify} messages.
     * @param message SdkSubscribeAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkSubscribeAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkSubscribeAckFrame message, length delimited. Does not implicitly {@link SdkSubscribeAckFrame.verify|verify} messages.
     * @param message SdkSubscribeAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkSubscribeAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkSubscribeAckFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkSubscribeAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkSubscribeAckFrame;

    /**
     * Decodes a SdkSubscribeAckFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkSubscribeAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkSubscribeAckFrame;

    /**
     * Verifies a SdkSubscribeAckFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkSubscribeAckFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkSubscribeAckFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkSubscribeAckFrame;

    /**
     * Creates a plain object from a SdkSubscribeAckFrame message. Also converts values to other types if specified.
     * @param message SdkSubscribeAckFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkSubscribeAckFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkSubscribeAckFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkSubscribeAckFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkIndexFrame. */
export interface ISdkIndexFrame {

    /** SdkIndexFrame atCapacity */
    atCapacity?: (boolean|null);

    /** SdkIndexFrame sources */
    sources?: (ISdkStreamDescriptor[]|null);

    /** SdkIndexFrame pausedAtSourceIds */
    pausedAtSourceIds?: (number[]|null);

    /** SdkIndexFrame numParticipants */
    numParticipants?: (number|null);

    /** SdkIndexFrame supportedReceiveCodecIntersection */
    supportedReceiveCodecIntersection?: (SdkVideoCodecCapability[]|null);
}

/** Represents a SdkIndexFrame. */
export class SdkIndexFrame implements ISdkIndexFrame {

    /**
     * Constructs a new SdkIndexFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkIndexFrame);

    /** SdkIndexFrame atCapacity. */
    public atCapacity: boolean;

    /** SdkIndexFrame sources. */
    public sources: ISdkStreamDescriptor[];

    /** SdkIndexFrame pausedAtSourceIds. */
    public pausedAtSourceIds: number[];

    /** SdkIndexFrame numParticipants. */
    public numParticipants: number;

    /** SdkIndexFrame supportedReceiveCodecIntersection. */
    public supportedReceiveCodecIntersection: SdkVideoCodecCapability[];

    /**
     * Creates a new SdkIndexFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkIndexFrame instance
     */
    public static create(properties?: ISdkIndexFrame): SdkIndexFrame;

    /**
     * Encodes the specified SdkIndexFrame message. Does not implicitly {@link SdkIndexFrame.verify|verify} messages.
     * @param message SdkIndexFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkIndexFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkIndexFrame message, length delimited. Does not implicitly {@link SdkIndexFrame.verify|verify} messages.
     * @param message SdkIndexFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkIndexFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkIndexFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkIndexFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkIndexFrame;

    /**
     * Decodes a SdkIndexFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkIndexFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkIndexFrame;

    /**
     * Verifies a SdkIndexFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkIndexFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkIndexFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkIndexFrame;

    /**
     * Creates a plain object from a SdkIndexFrame message. Also converts values to other types if specified.
     * @param message SdkIndexFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkIndexFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkIndexFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkIndexFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkPauseResumeFrame. */
export interface ISdkPauseResumeFrame {

    /** SdkPauseResumeFrame streamIds */
    streamIds?: (number[]|null);

    /** SdkPauseResumeFrame groupIds */
    groupIds?: (number[]|null);
}

/** Represents a SdkPauseResumeFrame. */
export class SdkPauseResumeFrame implements ISdkPauseResumeFrame {

    /**
     * Constructs a new SdkPauseResumeFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkPauseResumeFrame);

    /** SdkPauseResumeFrame streamIds. */
    public streamIds: number[];

    /** SdkPauseResumeFrame groupIds. */
    public groupIds: number[];

    /**
     * Creates a new SdkPauseResumeFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkPauseResumeFrame instance
     */
    public static create(properties?: ISdkPauseResumeFrame): SdkPauseResumeFrame;

    /**
     * Encodes the specified SdkPauseResumeFrame message. Does not implicitly {@link SdkPauseResumeFrame.verify|verify} messages.
     * @param message SdkPauseResumeFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkPauseResumeFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkPauseResumeFrame message, length delimited. Does not implicitly {@link SdkPauseResumeFrame.verify|verify} messages.
     * @param message SdkPauseResumeFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkPauseResumeFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkPauseResumeFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkPauseResumeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkPauseResumeFrame;

    /**
     * Decodes a SdkPauseResumeFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkPauseResumeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkPauseResumeFrame;

    /**
     * Verifies a SdkPauseResumeFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkPauseResumeFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkPauseResumeFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkPauseResumeFrame;

    /**
     * Creates a plain object from a SdkPauseResumeFrame message. Also converts values to other types if specified.
     * @param message SdkPauseResumeFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkPauseResumeFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkPauseResumeFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkPauseResumeFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkBitrateFrame. */
export interface ISdkBitrateFrame {

    /** SdkBitrateFrame bitrates */
    bitrates?: (ISdkBitrate[]|null);

    /** SdkBitrateFrame serverAvailableOutgoingBitrate */
    serverAvailableOutgoingBitrate?: (number|null);
}

/** Represents a SdkBitrateFrame. */
export class SdkBitrateFrame implements ISdkBitrateFrame {

    /**
     * Constructs a new SdkBitrateFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkBitrateFrame);

    /** SdkBitrateFrame bitrates. */
    public bitrates: ISdkBitrate[];

    /** SdkBitrateFrame serverAvailableOutgoingBitrate. */
    public serverAvailableOutgoingBitrate: number;

    /**
     * Creates a new SdkBitrateFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkBitrateFrame instance
     */
    public static create(properties?: ISdkBitrateFrame): SdkBitrateFrame;

    /**
     * Encodes the specified SdkBitrateFrame message. Does not implicitly {@link SdkBitrateFrame.verify|verify} messages.
     * @param message SdkBitrateFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkBitrateFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkBitrateFrame message, length delimited. Does not implicitly {@link SdkBitrateFrame.verify|verify} messages.
     * @param message SdkBitrateFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkBitrateFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkBitrateFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkBitrateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkBitrateFrame;

    /**
     * Decodes a SdkBitrateFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkBitrateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkBitrateFrame;

    /**
     * Verifies a SdkBitrateFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkBitrateFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkBitrateFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkBitrateFrame;

    /**
     * Creates a plain object from a SdkBitrateFrame message. Also converts values to other types if specified.
     * @param message SdkBitrateFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkBitrateFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkBitrateFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkBitrateFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkStreamDescriptor. */
export interface ISdkStreamDescriptor {

    /** SdkStreamDescriptor streamId */
    streamId?: (number|null);

    /** SdkStreamDescriptor framerate */
    framerate?: (number|null);

    /** SdkStreamDescriptor maxBitrateKbps */
    maxBitrateKbps?: (number|null);

    /** SdkStreamDescriptor trackLabel */
    trackLabel?: (string|null);

    /** SdkStreamDescriptor groupId */
    groupId?: (number|null);

    /** SdkStreamDescriptor avgBitrateBps */
    avgBitrateBps?: (number|null);

    /** SdkStreamDescriptor attendeeId */
    attendeeId?: (string|null);

    /** SdkStreamDescriptor mediaType */
    mediaType?: (SdkStreamMediaType|null);

    /** SdkStreamDescriptor externalUserId */
    externalUserId?: (string|null);

    /** SdkStreamDescriptor width */
    width?: (number|null);

    /** SdkStreamDescriptor height */
    height?: (number|null);
}

/** Represents a SdkStreamDescriptor. */
export class SdkStreamDescriptor implements ISdkStreamDescriptor {

    /**
     * Constructs a new SdkStreamDescriptor.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkStreamDescriptor);

    /** SdkStreamDescriptor streamId. */
    public streamId: number;

    /** SdkStreamDescriptor framerate. */
    public framerate: number;

    /** SdkStreamDescriptor maxBitrateKbps. */
    public maxBitrateKbps: number;

    /** SdkStreamDescriptor trackLabel. */
    public trackLabel: string;

    /** SdkStreamDescriptor groupId. */
    public groupId: number;

    /** SdkStreamDescriptor avgBitrateBps. */
    public avgBitrateBps: number;

    /** SdkStreamDescriptor attendeeId. */
    public attendeeId: string;

    /** SdkStreamDescriptor mediaType. */
    public mediaType: SdkStreamMediaType;

    /** SdkStreamDescriptor externalUserId. */
    public externalUserId: string;

    /** SdkStreamDescriptor width. */
    public width: number;

    /** SdkStreamDescriptor height. */
    public height: number;

    /**
     * Creates a new SdkStreamDescriptor instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkStreamDescriptor instance
     */
    public static create(properties?: ISdkStreamDescriptor): SdkStreamDescriptor;

    /**
     * Encodes the specified SdkStreamDescriptor message. Does not implicitly {@link SdkStreamDescriptor.verify|verify} messages.
     * @param message SdkStreamDescriptor message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkStreamDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkStreamDescriptor message, length delimited. Does not implicitly {@link SdkStreamDescriptor.verify|verify} messages.
     * @param message SdkStreamDescriptor message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkStreamDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkStreamDescriptor message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkStreamDescriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkStreamDescriptor;

    /**
     * Decodes a SdkStreamDescriptor message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkStreamDescriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkStreamDescriptor;

    /**
     * Verifies a SdkStreamDescriptor message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkStreamDescriptor message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkStreamDescriptor
     */
    public static fromObject(object: { [k: string]: any }): SdkStreamDescriptor;

    /**
     * Creates a plain object from a SdkStreamDescriptor message. Also converts values to other types if specified.
     * @param message SdkStreamDescriptor
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkStreamDescriptor, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkStreamDescriptor to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkStreamDescriptor
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkStreamAllocation. */
export interface ISdkStreamAllocation {

    /** SdkStreamAllocation trackLabel */
    trackLabel?: (string|null);

    /** SdkStreamAllocation streamId */
    streamId?: (number|null);

    /** SdkStreamAllocation groupId */
    groupId?: (number|null);
}

/** Represents a SdkStreamAllocation. */
export class SdkStreamAllocation implements ISdkStreamAllocation {

    /**
     * Constructs a new SdkStreamAllocation.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkStreamAllocation);

    /** SdkStreamAllocation trackLabel. */
    public trackLabel: string;

    /** SdkStreamAllocation streamId. */
    public streamId: number;

    /** SdkStreamAllocation groupId. */
    public groupId: number;

    /**
     * Creates a new SdkStreamAllocation instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkStreamAllocation instance
     */
    public static create(properties?: ISdkStreamAllocation): SdkStreamAllocation;

    /**
     * Encodes the specified SdkStreamAllocation message. Does not implicitly {@link SdkStreamAllocation.verify|verify} messages.
     * @param message SdkStreamAllocation message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkStreamAllocation, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkStreamAllocation message, length delimited. Does not implicitly {@link SdkStreamAllocation.verify|verify} messages.
     * @param message SdkStreamAllocation message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkStreamAllocation, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkStreamAllocation message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkStreamAllocation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkStreamAllocation;

    /**
     * Decodes a SdkStreamAllocation message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkStreamAllocation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkStreamAllocation;

    /**
     * Verifies a SdkStreamAllocation message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkStreamAllocation message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkStreamAllocation
     */
    public static fromObject(object: { [k: string]: any }): SdkStreamAllocation;

    /**
     * Creates a plain object from a SdkStreamAllocation message. Also converts values to other types if specified.
     * @param message SdkStreamAllocation
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkStreamAllocation, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkStreamAllocation to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkStreamAllocation
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTrackMapping. */
export interface ISdkTrackMapping {

    /** SdkTrackMapping streamId */
    streamId?: (number|null);

    /** SdkTrackMapping ssrc */
    ssrc?: (number|null);

    /** SdkTrackMapping trackLabel */
    trackLabel?: (string|null);
}

/** Represents a SdkTrackMapping. */
export class SdkTrackMapping implements ISdkTrackMapping {

    /**
     * Constructs a new SdkTrackMapping.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTrackMapping);

    /** SdkTrackMapping streamId. */
    public streamId: number;

    /** SdkTrackMapping ssrc. */
    public ssrc: number;

    /** SdkTrackMapping trackLabel. */
    public trackLabel: string;

    /**
     * Creates a new SdkTrackMapping instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTrackMapping instance
     */
    public static create(properties?: ISdkTrackMapping): SdkTrackMapping;

    /**
     * Encodes the specified SdkTrackMapping message. Does not implicitly {@link SdkTrackMapping.verify|verify} messages.
     * @param message SdkTrackMapping message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTrackMapping, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTrackMapping message, length delimited. Does not implicitly {@link SdkTrackMapping.verify|verify} messages.
     * @param message SdkTrackMapping message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTrackMapping, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTrackMapping message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTrackMapping
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTrackMapping;

    /**
     * Decodes a SdkTrackMapping message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTrackMapping
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTrackMapping;

    /**
     * Verifies a SdkTrackMapping message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTrackMapping message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTrackMapping
     */
    public static fromObject(object: { [k: string]: any }): SdkTrackMapping;

    /**
     * Creates a plain object from a SdkTrackMapping message. Also converts values to other types if specified.
     * @param message SdkTrackMapping
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTrackMapping, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTrackMapping to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTrackMapping
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkBitrate. */
export interface ISdkBitrate {

    /** SdkBitrate sourceStreamId */
    sourceStreamId?: (number|null);

    /** SdkBitrate avgBitrateBps */
    avgBitrateBps?: (number|null);
}

/** Represents a SdkBitrate. */
export class SdkBitrate implements ISdkBitrate {

    /**
     * Constructs a new SdkBitrate.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkBitrate);

    /** SdkBitrate sourceStreamId. */
    public sourceStreamId: number;

    /** SdkBitrate avgBitrateBps. */
    public avgBitrateBps: number;

    /**
     * Creates a new SdkBitrate instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkBitrate instance
     */
    public static create(properties?: ISdkBitrate): SdkBitrate;

    /**
     * Encodes the specified SdkBitrate message. Does not implicitly {@link SdkBitrate.verify|verify} messages.
     * @param message SdkBitrate message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkBitrate, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkBitrate message, length delimited. Does not implicitly {@link SdkBitrate.verify|verify} messages.
     * @param message SdkBitrate message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkBitrate, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkBitrate message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkBitrate
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkBitrate;

    /**
     * Decodes a SdkBitrate message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkBitrate
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkBitrate;

    /**
     * Verifies a SdkBitrate message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkBitrate message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkBitrate
     */
    public static fromObject(object: { [k: string]: any }): SdkBitrate;

    /**
     * Creates a plain object from a SdkBitrate message. Also converts values to other types if specified.
     * @param message SdkBitrate
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkBitrate, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkBitrate to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkBitrate
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioControlFrame. */
export interface ISdkAudioControlFrame {

    /** SdkAudioControlFrame muted */
    muted?: (boolean|null);
}

/** Represents a SdkAudioControlFrame. */
export class SdkAudioControlFrame implements ISdkAudioControlFrame {

    /**
     * Constructs a new SdkAudioControlFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioControlFrame);

    /** SdkAudioControlFrame muted. */
    public muted: boolean;

    /**
     * Creates a new SdkAudioControlFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioControlFrame instance
     */
    public static create(properties?: ISdkAudioControlFrame): SdkAudioControlFrame;

    /**
     * Encodes the specified SdkAudioControlFrame message. Does not implicitly {@link SdkAudioControlFrame.verify|verify} messages.
     * @param message SdkAudioControlFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioControlFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioControlFrame message, length delimited. Does not implicitly {@link SdkAudioControlFrame.verify|verify} messages.
     * @param message SdkAudioControlFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioControlFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioControlFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioControlFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioControlFrame;

    /**
     * Decodes a SdkAudioControlFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioControlFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioControlFrame;

    /**
     * Verifies a SdkAudioControlFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioControlFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioControlFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioControlFrame;

    /**
     * Creates a plain object from a SdkAudioControlFrame message. Also converts values to other types if specified.
     * @param message SdkAudioControlFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioControlFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioControlFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioControlFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioMetadataFrame. */
export interface ISdkAudioMetadataFrame {

    /** SdkAudioMetadataFrame attendeeStates */
    attendeeStates?: (ISdkAudioAttendeeState[]|null);
}

/** Represents a SdkAudioMetadataFrame. */
export class SdkAudioMetadataFrame implements ISdkAudioMetadataFrame {

    /**
     * Constructs a new SdkAudioMetadataFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioMetadataFrame);

    /** SdkAudioMetadataFrame attendeeStates. */
    public attendeeStates: ISdkAudioAttendeeState[];

    /**
     * Creates a new SdkAudioMetadataFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioMetadataFrame instance
     */
    public static create(properties?: ISdkAudioMetadataFrame): SdkAudioMetadataFrame;

    /**
     * Encodes the specified SdkAudioMetadataFrame message. Does not implicitly {@link SdkAudioMetadataFrame.verify|verify} messages.
     * @param message SdkAudioMetadataFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioMetadataFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioMetadataFrame message, length delimited. Does not implicitly {@link SdkAudioMetadataFrame.verify|verify} messages.
     * @param message SdkAudioMetadataFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioMetadataFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioMetadataFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioMetadataFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioMetadataFrame;

    /**
     * Decodes a SdkAudioMetadataFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioMetadataFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioMetadataFrame;

    /**
     * Verifies a SdkAudioMetadataFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioMetadataFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioMetadataFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioMetadataFrame;

    /**
     * Creates a plain object from a SdkAudioMetadataFrame message. Also converts values to other types if specified.
     * @param message SdkAudioMetadataFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioMetadataFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioMetadataFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioMetadataFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioAttendeeState. */
export interface ISdkAudioAttendeeState {

    /** SdkAudioAttendeeState audioStreamId */
    audioStreamId?: (number|null);

    /** SdkAudioAttendeeState volume */
    volume?: (number|null);

    /** SdkAudioAttendeeState muted */
    muted?: (boolean|null);

    /** SdkAudioAttendeeState signalStrength */
    signalStrength?: (number|null);
}

/** Represents a SdkAudioAttendeeState. */
export class SdkAudioAttendeeState implements ISdkAudioAttendeeState {

    /**
     * Constructs a new SdkAudioAttendeeState.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioAttendeeState);

    /** SdkAudioAttendeeState audioStreamId. */
    public audioStreamId: number;

    /** SdkAudioAttendeeState volume. */
    public volume: number;

    /** SdkAudioAttendeeState muted. */
    public muted: boolean;

    /** SdkAudioAttendeeState signalStrength. */
    public signalStrength: number;

    /**
     * Creates a new SdkAudioAttendeeState instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioAttendeeState instance
     */
    public static create(properties?: ISdkAudioAttendeeState): SdkAudioAttendeeState;

    /**
     * Encodes the specified SdkAudioAttendeeState message. Does not implicitly {@link SdkAudioAttendeeState.verify|verify} messages.
     * @param message SdkAudioAttendeeState message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioAttendeeState, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioAttendeeState message, length delimited. Does not implicitly {@link SdkAudioAttendeeState.verify|verify} messages.
     * @param message SdkAudioAttendeeState message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioAttendeeState, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioAttendeeState message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioAttendeeState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioAttendeeState;

    /**
     * Decodes a SdkAudioAttendeeState message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioAttendeeState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioAttendeeState;

    /**
     * Verifies a SdkAudioAttendeeState message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioAttendeeState message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioAttendeeState
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioAttendeeState;

    /**
     * Creates a plain object from a SdkAudioAttendeeState message. Also converts values to other types if specified.
     * @param message SdkAudioAttendeeState
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioAttendeeState, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioAttendeeState to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioAttendeeState
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioStreamIdInfoFrame. */
export interface ISdkAudioStreamIdInfoFrame {

    /** SdkAudioStreamIdInfoFrame streams */
    streams?: (ISdkAudioStreamIdInfo[]|null);
}

/** Represents a SdkAudioStreamIdInfoFrame. */
export class SdkAudioStreamIdInfoFrame implements ISdkAudioStreamIdInfoFrame {

    /**
     * Constructs a new SdkAudioStreamIdInfoFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioStreamIdInfoFrame);

    /** SdkAudioStreamIdInfoFrame streams. */
    public streams: ISdkAudioStreamIdInfo[];

    /**
     * Creates a new SdkAudioStreamIdInfoFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioStreamIdInfoFrame instance
     */
    public static create(properties?: ISdkAudioStreamIdInfoFrame): SdkAudioStreamIdInfoFrame;

    /**
     * Encodes the specified SdkAudioStreamIdInfoFrame message. Does not implicitly {@link SdkAudioStreamIdInfoFrame.verify|verify} messages.
     * @param message SdkAudioStreamIdInfoFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioStreamIdInfoFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioStreamIdInfoFrame message, length delimited. Does not implicitly {@link SdkAudioStreamIdInfoFrame.verify|verify} messages.
     * @param message SdkAudioStreamIdInfoFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioStreamIdInfoFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioStreamIdInfoFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioStreamIdInfoFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioStreamIdInfoFrame;

    /**
     * Decodes a SdkAudioStreamIdInfoFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioStreamIdInfoFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioStreamIdInfoFrame;

    /**
     * Verifies a SdkAudioStreamIdInfoFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioStreamIdInfoFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioStreamIdInfoFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioStreamIdInfoFrame;

    /**
     * Creates a plain object from a SdkAudioStreamIdInfoFrame message. Also converts values to other types if specified.
     * @param message SdkAudioStreamIdInfoFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioStreamIdInfoFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioStreamIdInfoFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioStreamIdInfoFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioStreamIdInfo. */
export interface ISdkAudioStreamIdInfo {

    /** SdkAudioStreamIdInfo audioStreamId */
    audioStreamId?: (number|null);

    /** SdkAudioStreamIdInfo attendeeId */
    attendeeId?: (string|null);

    /** SdkAudioStreamIdInfo muted */
    muted?: (boolean|null);

    /** SdkAudioStreamIdInfo externalUserId */
    externalUserId?: (string|null);

    /** SdkAudioStreamIdInfo dropped */
    dropped?: (boolean|null);
}

/** Represents a SdkAudioStreamIdInfo. */
export class SdkAudioStreamIdInfo implements ISdkAudioStreamIdInfo {

    /**
     * Constructs a new SdkAudioStreamIdInfo.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioStreamIdInfo);

    /** SdkAudioStreamIdInfo audioStreamId. */
    public audioStreamId: number;

    /** SdkAudioStreamIdInfo attendeeId. */
    public attendeeId: string;

    /** SdkAudioStreamIdInfo muted. */
    public muted: boolean;

    /** SdkAudioStreamIdInfo externalUserId. */
    public externalUserId: string;

    /** SdkAudioStreamIdInfo dropped. */
    public dropped: boolean;

    /**
     * Creates a new SdkAudioStreamIdInfo instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioStreamIdInfo instance
     */
    public static create(properties?: ISdkAudioStreamIdInfo): SdkAudioStreamIdInfo;

    /**
     * Encodes the specified SdkAudioStreamIdInfo message. Does not implicitly {@link SdkAudioStreamIdInfo.verify|verify} messages.
     * @param message SdkAudioStreamIdInfo message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioStreamIdInfo, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioStreamIdInfo message, length delimited. Does not implicitly {@link SdkAudioStreamIdInfo.verify|verify} messages.
     * @param message SdkAudioStreamIdInfo message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioStreamIdInfo, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioStreamIdInfo message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioStreamIdInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioStreamIdInfo;

    /**
     * Decodes a SdkAudioStreamIdInfo message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioStreamIdInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioStreamIdInfo;

    /**
     * Verifies a SdkAudioStreamIdInfo message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioStreamIdInfo message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioStreamIdInfo
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioStreamIdInfo;

    /**
     * Creates a plain object from a SdkAudioStreamIdInfo message. Also converts values to other types if specified.
     * @param message SdkAudioStreamIdInfo
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioStreamIdInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioStreamIdInfo to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioStreamIdInfo
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkPingPongType enum. */
export enum SdkPingPongType {
    PING = 1,
    PONG = 2
}

/** Properties of a SdkPingPongFrame. */
export interface ISdkPingPongFrame {

    /** SdkPingPongFrame type */
    type: SdkPingPongType;

    /** SdkPingPongFrame pingId */
    pingId: number;
}

/** Represents a SdkPingPongFrame. */
export class SdkPingPongFrame implements ISdkPingPongFrame {

    /**
     * Constructs a new SdkPingPongFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkPingPongFrame);

    /** SdkPingPongFrame type. */
    public type: SdkPingPongType;

    /** SdkPingPongFrame pingId. */
    public pingId: number;

    /**
     * Creates a new SdkPingPongFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkPingPongFrame instance
     */
    public static create(properties?: ISdkPingPongFrame): SdkPingPongFrame;

    /**
     * Encodes the specified SdkPingPongFrame message. Does not implicitly {@link SdkPingPongFrame.verify|verify} messages.
     * @param message SdkPingPongFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkPingPongFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkPingPongFrame message, length delimited. Does not implicitly {@link SdkPingPongFrame.verify|verify} messages.
     * @param message SdkPingPongFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkPingPongFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkPingPongFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkPingPongFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkPingPongFrame;

    /**
     * Decodes a SdkPingPongFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkPingPongFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkPingPongFrame;

    /**
     * Verifies a SdkPingPongFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkPingPongFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkPingPongFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkPingPongFrame;

    /**
     * Creates a plain object from a SdkPingPongFrame message. Also converts values to other types if specified.
     * @param message SdkPingPongFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkPingPongFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkPingPongFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkPingPongFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkAudioStatusFrame. */
export interface ISdkAudioStatusFrame {

    /** SdkAudioStatusFrame audioStatus */
    audioStatus?: (number|null);
}

/** Represents a SdkAudioStatusFrame. */
export class SdkAudioStatusFrame implements ISdkAudioStatusFrame {

    /**
     * Constructs a new SdkAudioStatusFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkAudioStatusFrame);

    /** SdkAudioStatusFrame audioStatus. */
    public audioStatus: number;

    /**
     * Creates a new SdkAudioStatusFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkAudioStatusFrame instance
     */
    public static create(properties?: ISdkAudioStatusFrame): SdkAudioStatusFrame;

    /**
     * Encodes the specified SdkAudioStatusFrame message. Does not implicitly {@link SdkAudioStatusFrame.verify|verify} messages.
     * @param message SdkAudioStatusFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkAudioStatusFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkAudioStatusFrame message, length delimited. Does not implicitly {@link SdkAudioStatusFrame.verify|verify} messages.
     * @param message SdkAudioStatusFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkAudioStatusFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkAudioStatusFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkAudioStatusFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkAudioStatusFrame;

    /**
     * Decodes a SdkAudioStatusFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkAudioStatusFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkAudioStatusFrame;

    /**
     * Verifies a SdkAudioStatusFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkAudioStatusFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkAudioStatusFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkAudioStatusFrame;

    /**
     * Creates a plain object from a SdkAudioStatusFrame message. Also converts values to other types if specified.
     * @param message SdkAudioStatusFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkAudioStatusFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkAudioStatusFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkAudioStatusFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkMetric. */
export interface ISdkMetric {

    /** SdkMetric type */
    type?: (SdkMetric.Type|null);

    /** SdkMetric value */
    value?: (number|null);
}

/** Represents a SdkMetric. */
export class SdkMetric implements ISdkMetric {

    /**
     * Constructs a new SdkMetric.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkMetric);

    /** SdkMetric type. */
    public type: SdkMetric.Type;

    /** SdkMetric value. */
    public value: number;

    /**
     * Creates a new SdkMetric instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkMetric instance
     */
    public static create(properties?: ISdkMetric): SdkMetric;

    /**
     * Encodes the specified SdkMetric message. Does not implicitly {@link SdkMetric.verify|verify} messages.
     * @param message SdkMetric message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkMetric, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkMetric message, length delimited. Does not implicitly {@link SdkMetric.verify|verify} messages.
     * @param message SdkMetric message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkMetric, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkMetric message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkMetric
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkMetric;

    /**
     * Decodes a SdkMetric message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkMetric
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkMetric;

    /**
     * Verifies a SdkMetric message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkMetric message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkMetric
     */
    public static fromObject(object: { [k: string]: any }): SdkMetric;

    /**
     * Creates a plain object from a SdkMetric message. Also converts values to other types if specified.
     * @param message SdkMetric
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkMetric, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkMetric to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkMetric
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkMetric {

    /** Type enum. */
    enum Type {
        VIDEO_ACTUAL_ENCODER_BITRATE = 1,
        VIDEO_AVAILABLE_SEND_BANDWIDTH = 2,
        VIDEO_RETRANSMIT_BITRATE = 3,
        VIDEO_AVAILABLE_RECEIVE_BANDWIDTH = 4,
        VIDEO_TARGET_ENCODER_BITRATE = 5,
        VIDEO_BUCKET_DELAY_MS = 6,
        STUN_RTT_MS = 7,
        SOCKET_DISCARDED_PPS = 8,
        RTC_MIC_JITTER_MS = 9,
        RTC_MIC_PPS = 10,
        RTC_MIC_FRACTION_PACKET_LOST_PERCENT = 11,
        RTC_MIC_BITRATE = 12,
        RTC_MIC_RTT_MS = 13,
        RTC_SPK_PPS = 14,
        RTC_SPK_FRACTION_PACKET_LOST_PERCENT = 15,
        RTC_SPK_JITTER_MS = 16,
        RTC_SPK_FRACTION_DECODER_LOSS_PERCENT = 17,
        RTC_SPK_BITRATE = 18,
        RTC_SPK_CURRENT_DELAY_MS = 19,
        RTC_SPK_JITTER_BUFFER_MS = 20,
        VIDEO_SENT_RTT_MS = 21,
        VIDEO_ENCODE_USAGE_PERCENT = 22,
        VIDEO_NACKS_RECEIVED = 23,
        VIDEO_PLIS_RECEIVED = 24,
        VIDEO_ENCODE_MS = 25,
        VIDEO_INPUT_FPS = 26,
        VIDEO_ENCODE_FPS = 27,
        VIDEO_SENT_FPS = 28,
        VIDEO_FIRS_RECEIVED = 29,
        VIDEO_SENT_PPS = 30,
        VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT = 31,
        VIDEO_SENT_BITRATE = 32,
        VIDEO_DROPPED_FPS = 33,
        VIDEO_TARGET_DELAY_MS = 34,
        VIDEO_DECODE_MS = 35,
        VIDEO_OUTPUT_FPS = 36,
        VIDEO_RECEIVED_PPS = 37,
        VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT = 38,
        VIDEO_RENDER_DELAY_MS = 39,
        VIDEO_RECEIVED_FPS = 40,
        VIDEO_DECODE_FPS = 41,
        VIDEO_NACKS_SENT = 42,
        VIDEO_FIRS_SENT = 43,
        VIDEO_RECEIVED_BITRATE = 44,
        VIDEO_CURRENT_DELAY_MS = 45,
        VIDEO_JITTER_BUFFER_MS = 46,
        VIDEO_DISCARDED_PPS = 47,
        VIDEO_PLIS_SENT = 48,
        VIDEO_RECEIVED_JITTER_MS = 49,
        VIDEO_ENCODE_HEIGHT = 64,
        VIDEO_SENT_QP_SUM = 66,
        VIDEO_DECODE_HEIGHT = 69,
        VIDEO_RECEIVED_QP_SUM = 72,
        VIDEO_ENCODE_WIDTH = 86,
        VIDEO_DECODE_WIDTH = 87,
        VIDEO_ENCODER_IS_HARDWARE = 88,
        VIDEO_DECODER_IS_HARDWARE = 89,
        VIDEO_FREEZE_COUNT = 90,
        VIDEO_FREEZE_DURATION = 91,
        VIDEO_PAUSE_COUNT = 92,
        VIDEO_PAUSE_DURATION = 93,
        VIDEO_QUALITY_REASON = 94,
        VIDEO_PROCESSING_TIME = 95,
        RTC_SPK_AUDIO_LEVEL = 96,
        RTC_MIC_AUDIO_LEVEL = 97,
        RTC_SPK_TOTAL_LOST = 98,
        RTC_SPK_TOTAL_EXPECTED = 99,
        RTC_SPK_TOTAL_RECOVERED_RED = 100,
        RTC_SPK_TOTAL_RECOVERED_FEC = 101,
        VIDEO_QUALITY_LIMITATION_DURATION_CPU = 102,
        VIDEO_CODEC_DEGRADATION_HIGH_ENCODE_CPU = 103,
        VIDEO_CODEC_DEGRADATION_ENCODE_FAILURE = 104
    }
}

/** Properties of a SdkStreamMetricFrame. */
export interface ISdkStreamMetricFrame {

    /** SdkStreamMetricFrame streamId */
    streamId?: (number|null);

    /** SdkStreamMetricFrame groupId */
    groupId?: (number|null);

    /** SdkStreamMetricFrame metrics */
    metrics?: (ISdkMetric[]|null);

    /** SdkStreamMetricFrame dimensions */
    dimensions?: (ISdkStreamDimension[]|null);
}

/** Represents a SdkStreamMetricFrame. */
export class SdkStreamMetricFrame implements ISdkStreamMetricFrame {

    /**
     * Constructs a new SdkStreamMetricFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkStreamMetricFrame);

    /** SdkStreamMetricFrame streamId. */
    public streamId: number;

    /** SdkStreamMetricFrame groupId. */
    public groupId: number;

    /** SdkStreamMetricFrame metrics. */
    public metrics: ISdkMetric[];

    /** SdkStreamMetricFrame dimensions. */
    public dimensions: ISdkStreamDimension[];

    /**
     * Creates a new SdkStreamMetricFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkStreamMetricFrame instance
     */
    public static create(properties?: ISdkStreamMetricFrame): SdkStreamMetricFrame;

    /**
     * Encodes the specified SdkStreamMetricFrame message. Does not implicitly {@link SdkStreamMetricFrame.verify|verify} messages.
     * @param message SdkStreamMetricFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkStreamMetricFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkStreamMetricFrame message, length delimited. Does not implicitly {@link SdkStreamMetricFrame.verify|verify} messages.
     * @param message SdkStreamMetricFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkStreamMetricFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkStreamMetricFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkStreamMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkStreamMetricFrame;

    /**
     * Decodes a SdkStreamMetricFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkStreamMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkStreamMetricFrame;

    /**
     * Verifies a SdkStreamMetricFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkStreamMetricFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkStreamMetricFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkStreamMetricFrame;

    /**
     * Creates a plain object from a SdkStreamMetricFrame message. Also converts values to other types if specified.
     * @param message SdkStreamMetricFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkStreamMetricFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkStreamMetricFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkStreamMetricFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkClientMetricFrame. */
export interface ISdkClientMetricFrame {

    /** SdkClientMetricFrame globalMetrics */
    globalMetrics?: (ISdkMetric[]|null);

    /** SdkClientMetricFrame streamMetricFrames */
    streamMetricFrames?: (ISdkStreamMetricFrame[]|null);
}

/** Represents a SdkClientMetricFrame. */
export class SdkClientMetricFrame implements ISdkClientMetricFrame {

    /**
     * Constructs a new SdkClientMetricFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkClientMetricFrame);

    /** SdkClientMetricFrame globalMetrics. */
    public globalMetrics: ISdkMetric[];

    /** SdkClientMetricFrame streamMetricFrames. */
    public streamMetricFrames: ISdkStreamMetricFrame[];

    /**
     * Creates a new SdkClientMetricFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkClientMetricFrame instance
     */
    public static create(properties?: ISdkClientMetricFrame): SdkClientMetricFrame;

    /**
     * Encodes the specified SdkClientMetricFrame message. Does not implicitly {@link SdkClientMetricFrame.verify|verify} messages.
     * @param message SdkClientMetricFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkClientMetricFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkClientMetricFrame message, length delimited. Does not implicitly {@link SdkClientMetricFrame.verify|verify} messages.
     * @param message SdkClientMetricFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkClientMetricFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkClientMetricFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkClientMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkClientMetricFrame;

    /**
     * Decodes a SdkClientMetricFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkClientMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkClientMetricFrame;

    /**
     * Verifies a SdkClientMetricFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkClientMetricFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkClientMetricFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkClientMetricFrame;

    /**
     * Creates a plain object from a SdkClientMetricFrame message. Also converts values to other types if specified.
     * @param message SdkClientMetricFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkClientMetricFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkClientMetricFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkClientMetricFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkStreamDimension. */
export interface ISdkStreamDimension {

    /** SdkStreamDimension type */
    type?: (SdkStreamDimension.Type|null);

    /** SdkStreamDimension value */
    value?: (ISdkDimensionValue|null);
}

/** Represents a SdkStreamDimension. */
export class SdkStreamDimension implements ISdkStreamDimension {

    /**
     * Constructs a new SdkStreamDimension.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkStreamDimension);

    /** SdkStreamDimension type. */
    public type: SdkStreamDimension.Type;

    /** SdkStreamDimension value. */
    public value?: (ISdkDimensionValue|null);

    /**
     * Creates a new SdkStreamDimension instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkStreamDimension instance
     */
    public static create(properties?: ISdkStreamDimension): SdkStreamDimension;

    /**
     * Encodes the specified SdkStreamDimension message. Does not implicitly {@link SdkStreamDimension.verify|verify} messages.
     * @param message SdkStreamDimension message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkStreamDimension, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkStreamDimension message, length delimited. Does not implicitly {@link SdkStreamDimension.verify|verify} messages.
     * @param message SdkStreamDimension message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkStreamDimension, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkStreamDimension message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkStreamDimension
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkStreamDimension;

    /**
     * Decodes a SdkStreamDimension message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkStreamDimension
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkStreamDimension;

    /**
     * Verifies a SdkStreamDimension message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkStreamDimension message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkStreamDimension
     */
    public static fromObject(object: { [k: string]: any }): SdkStreamDimension;

    /**
     * Creates a plain object from a SdkStreamDimension message. Also converts values to other types if specified.
     * @param message SdkStreamDimension
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkStreamDimension, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkStreamDimension to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkStreamDimension
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkStreamDimension {

    /** Type enum. */
    enum Type {
        VIDEO_ENCODER_NAME = 1,
        VIDEO_DECODER_NAME = 2
    }
}

/** Properties of a SdkDimensionValue. */
export interface ISdkDimensionValue {

    /** SdkDimensionValue stringValue */
    stringValue?: (string|null);

    /** SdkDimensionValue boolValue */
    boolValue?: (boolean|null);

    /** SdkDimensionValue uintValue */
    uintValue?: (number|Long|null);
}

/** Represents a SdkDimensionValue. */
export class SdkDimensionValue implements ISdkDimensionValue {

    /**
     * Constructs a new SdkDimensionValue.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkDimensionValue);

    /** SdkDimensionValue stringValue. */
    public stringValue: string;

    /** SdkDimensionValue boolValue. */
    public boolValue: boolean;

    /** SdkDimensionValue uintValue. */
    public uintValue: (number|Long);

    /**
     * Creates a new SdkDimensionValue instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkDimensionValue instance
     */
    public static create(properties?: ISdkDimensionValue): SdkDimensionValue;

    /**
     * Encodes the specified SdkDimensionValue message. Does not implicitly {@link SdkDimensionValue.verify|verify} messages.
     * @param message SdkDimensionValue message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkDimensionValue, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkDimensionValue message, length delimited. Does not implicitly {@link SdkDimensionValue.verify|verify} messages.
     * @param message SdkDimensionValue message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkDimensionValue, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkDimensionValue message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkDimensionValue
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkDimensionValue;

    /**
     * Decodes a SdkDimensionValue message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkDimensionValue
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkDimensionValue;

    /**
     * Verifies a SdkDimensionValue message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkDimensionValue message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkDimensionValue
     */
    public static fromObject(object: { [k: string]: any }): SdkDimensionValue;

    /**
     * Creates a plain object from a SdkDimensionValue message. Also converts values to other types if specified.
     * @param message SdkDimensionValue
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkDimensionValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkDimensionValue to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkDimensionValue
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkDataMessageFrame. */
export interface ISdkDataMessageFrame {

    /** SdkDataMessageFrame messages */
    messages?: (ISdkDataMessagePayload[]|null);
}

/** Represents a SdkDataMessageFrame. */
export class SdkDataMessageFrame implements ISdkDataMessageFrame {

    /**
     * Constructs a new SdkDataMessageFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkDataMessageFrame);

    /** SdkDataMessageFrame messages. */
    public messages: ISdkDataMessagePayload[];

    /**
     * Creates a new SdkDataMessageFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkDataMessageFrame instance
     */
    public static create(properties?: ISdkDataMessageFrame): SdkDataMessageFrame;

    /**
     * Encodes the specified SdkDataMessageFrame message. Does not implicitly {@link SdkDataMessageFrame.verify|verify} messages.
     * @param message SdkDataMessageFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkDataMessageFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkDataMessageFrame message, length delimited. Does not implicitly {@link SdkDataMessageFrame.verify|verify} messages.
     * @param message SdkDataMessageFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkDataMessageFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkDataMessageFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkDataMessageFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkDataMessageFrame;

    /**
     * Decodes a SdkDataMessageFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkDataMessageFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkDataMessageFrame;

    /**
     * Verifies a SdkDataMessageFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkDataMessageFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkDataMessageFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkDataMessageFrame;

    /**
     * Creates a plain object from a SdkDataMessageFrame message. Also converts values to other types if specified.
     * @param message SdkDataMessageFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkDataMessageFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkDataMessageFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkDataMessageFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkDataMessagePayload. */
export interface ISdkDataMessagePayload {

    /** SdkDataMessagePayload topic */
    topic?: (string|null);

    /** SdkDataMessagePayload data */
    data?: (Uint8Array|null);

    /** SdkDataMessagePayload lifetimeMs */
    lifetimeMs?: (number|null);

    /** SdkDataMessagePayload senderAttendeeId */
    senderAttendeeId?: (string|null);

    /** SdkDataMessagePayload ingestTimeNs */
    ingestTimeNs?: (number|Long|null);

    /** SdkDataMessagePayload senderExternalUserId */
    senderExternalUserId?: (string|null);
}

/** Represents a SdkDataMessagePayload. */
export class SdkDataMessagePayload implements ISdkDataMessagePayload {

    /**
     * Constructs a new SdkDataMessagePayload.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkDataMessagePayload);

    /** SdkDataMessagePayload topic. */
    public topic: string;

    /** SdkDataMessagePayload data. */
    public data: Uint8Array;

    /** SdkDataMessagePayload lifetimeMs. */
    public lifetimeMs: number;

    /** SdkDataMessagePayload senderAttendeeId. */
    public senderAttendeeId: string;

    /** SdkDataMessagePayload ingestTimeNs. */
    public ingestTimeNs: (number|Long);

    /** SdkDataMessagePayload senderExternalUserId. */
    public senderExternalUserId: string;

    /**
     * Creates a new SdkDataMessagePayload instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkDataMessagePayload instance
     */
    public static create(properties?: ISdkDataMessagePayload): SdkDataMessagePayload;

    /**
     * Encodes the specified SdkDataMessagePayload message. Does not implicitly {@link SdkDataMessagePayload.verify|verify} messages.
     * @param message SdkDataMessagePayload message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkDataMessagePayload, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkDataMessagePayload message, length delimited. Does not implicitly {@link SdkDataMessagePayload.verify|verify} messages.
     * @param message SdkDataMessagePayload message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkDataMessagePayload, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkDataMessagePayload message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkDataMessagePayload
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkDataMessagePayload;

    /**
     * Decodes a SdkDataMessagePayload message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkDataMessagePayload
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkDataMessagePayload;

    /**
     * Verifies a SdkDataMessagePayload message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkDataMessagePayload message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkDataMessagePayload
     */
    public static fromObject(object: { [k: string]: any }): SdkDataMessagePayload;

    /**
     * Creates a plain object from a SdkDataMessagePayload message. Also converts values to other types if specified.
     * @param message SdkDataMessagePayload
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkDataMessagePayload, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkDataMessagePayload to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkDataMessagePayload
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTurnCredentials. */
export interface ISdkTurnCredentials {

    /** SdkTurnCredentials username */
    username?: (string|null);

    /** SdkTurnCredentials password */
    password?: (string|null);

    /** SdkTurnCredentials ttl */
    ttl?: (number|null);

    /** SdkTurnCredentials uris */
    uris?: (string[]|null);
}

/** Represents a SdkTurnCredentials. */
export class SdkTurnCredentials implements ISdkTurnCredentials {

    /**
     * Constructs a new SdkTurnCredentials.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTurnCredentials);

    /** SdkTurnCredentials username. */
    public username: string;

    /** SdkTurnCredentials password. */
    public password: string;

    /** SdkTurnCredentials ttl. */
    public ttl: number;

    /** SdkTurnCredentials uris. */
    public uris: string[];

    /**
     * Creates a new SdkTurnCredentials instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTurnCredentials instance
     */
    public static create(properties?: ISdkTurnCredentials): SdkTurnCredentials;

    /**
     * Encodes the specified SdkTurnCredentials message. Does not implicitly {@link SdkTurnCredentials.verify|verify} messages.
     * @param message SdkTurnCredentials message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTurnCredentials, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTurnCredentials message, length delimited. Does not implicitly {@link SdkTurnCredentials.verify|verify} messages.
     * @param message SdkTurnCredentials message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTurnCredentials, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTurnCredentials message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTurnCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTurnCredentials;

    /**
     * Decodes a SdkTurnCredentials message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTurnCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTurnCredentials;

    /**
     * Verifies a SdkTurnCredentials message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTurnCredentials message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTurnCredentials
     */
    public static fromObject(object: { [k: string]: any }): SdkTurnCredentials;

    /**
     * Creates a plain object from a SdkTurnCredentials message. Also converts values to other types if specified.
     * @param message SdkTurnCredentials
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTurnCredentials, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTurnCredentials to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTurnCredentials
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptItem. */
export interface ISdkTranscriptItem {

    /** SdkTranscriptItem content */
    content?: (string|null);

    /** SdkTranscriptItem endTime */
    endTime?: (number|Long|null);

    /** SdkTranscriptItem speakerAttendeeId */
    speakerAttendeeId?: (string|null);

    /** SdkTranscriptItem speakerExternalUserId */
    speakerExternalUserId?: (string|null);

    /** SdkTranscriptItem startTime */
    startTime?: (number|Long|null);

    /** SdkTranscriptItem type */
    type?: (SdkTranscriptItem.Type|null);

    /** SdkTranscriptItem vocabularyFilterMatch */
    vocabularyFilterMatch?: (boolean|null);

    /** SdkTranscriptItem confidence */
    confidence?: (number|null);

    /** SdkTranscriptItem stable */
    stable?: (boolean|null);
}

/** Represents a SdkTranscriptItem. */
export class SdkTranscriptItem implements ISdkTranscriptItem {

    /**
     * Constructs a new SdkTranscriptItem.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptItem);

    /** SdkTranscriptItem content. */
    public content: string;

    /** SdkTranscriptItem endTime. */
    public endTime: (number|Long);

    /** SdkTranscriptItem speakerAttendeeId. */
    public speakerAttendeeId: string;

    /** SdkTranscriptItem speakerExternalUserId. */
    public speakerExternalUserId: string;

    /** SdkTranscriptItem startTime. */
    public startTime: (number|Long);

    /** SdkTranscriptItem type. */
    public type: SdkTranscriptItem.Type;

    /** SdkTranscriptItem vocabularyFilterMatch. */
    public vocabularyFilterMatch: boolean;

    /** SdkTranscriptItem confidence. */
    public confidence: number;

    /** SdkTranscriptItem stable. */
    public stable: boolean;

    /**
     * Creates a new SdkTranscriptItem instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptItem instance
     */
    public static create(properties?: ISdkTranscriptItem): SdkTranscriptItem;

    /**
     * Encodes the specified SdkTranscriptItem message. Does not implicitly {@link SdkTranscriptItem.verify|verify} messages.
     * @param message SdkTranscriptItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptItem message, length delimited. Does not implicitly {@link SdkTranscriptItem.verify|verify} messages.
     * @param message SdkTranscriptItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptItem message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptItem;

    /**
     * Decodes a SdkTranscriptItem message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptItem;

    /**
     * Verifies a SdkTranscriptItem message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptItem message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptItem
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptItem;

    /**
     * Creates a plain object from a SdkTranscriptItem message. Also converts values to other types if specified.
     * @param message SdkTranscriptItem
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptItem to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptItem
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkTranscriptItem {

    /** Type enum. */
    enum Type {
        PRONUNCIATION = 1,
        PUNCTUATION = 2
    }
}

/** Properties of a SdkTranscriptEntity. */
export interface ISdkTranscriptEntity {

    /** SdkTranscriptEntity category */
    category?: (string|null);

    /** SdkTranscriptEntity confidence */
    confidence?: (number|null);

    /** SdkTranscriptEntity content */
    content?: (string|null);

    /** SdkTranscriptEntity endTime */
    endTime?: (number|Long|null);

    /** SdkTranscriptEntity startTime */
    startTime?: (number|Long|null);

    /** SdkTranscriptEntity type */
    type?: (string|null);
}

/** Represents a SdkTranscriptEntity. */
export class SdkTranscriptEntity implements ISdkTranscriptEntity {

    /**
     * Constructs a new SdkTranscriptEntity.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptEntity);

    /** SdkTranscriptEntity category. */
    public category: string;

    /** SdkTranscriptEntity confidence. */
    public confidence: number;

    /** SdkTranscriptEntity content. */
    public content: string;

    /** SdkTranscriptEntity endTime. */
    public endTime: (number|Long);

    /** SdkTranscriptEntity startTime. */
    public startTime: (number|Long);

    /** SdkTranscriptEntity type. */
    public type: string;

    /**
     * Creates a new SdkTranscriptEntity instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptEntity instance
     */
    public static create(properties?: ISdkTranscriptEntity): SdkTranscriptEntity;

    /**
     * Encodes the specified SdkTranscriptEntity message. Does not implicitly {@link SdkTranscriptEntity.verify|verify} messages.
     * @param message SdkTranscriptEntity message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptEntity, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptEntity message, length delimited. Does not implicitly {@link SdkTranscriptEntity.verify|verify} messages.
     * @param message SdkTranscriptEntity message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptEntity, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptEntity message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptEntity
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptEntity;

    /**
     * Decodes a SdkTranscriptEntity message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptEntity
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptEntity;

    /**
     * Verifies a SdkTranscriptEntity message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptEntity message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptEntity
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptEntity;

    /**
     * Creates a plain object from a SdkTranscriptEntity message. Also converts values to other types if specified.
     * @param message SdkTranscriptEntity
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptEntity, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptEntity to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptEntity
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptAlternative. */
export interface ISdkTranscriptAlternative {

    /** SdkTranscriptAlternative items */
    items?: (ISdkTranscriptItem[]|null);

    /** SdkTranscriptAlternative transcript */
    transcript?: (string|null);

    /** SdkTranscriptAlternative entities */
    entities?: (ISdkTranscriptEntity[]|null);
}

/** Represents a SdkTranscriptAlternative. */
export class SdkTranscriptAlternative implements ISdkTranscriptAlternative {

    /**
     * Constructs a new SdkTranscriptAlternative.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptAlternative);

    /** SdkTranscriptAlternative items. */
    public items: ISdkTranscriptItem[];

    /** SdkTranscriptAlternative transcript. */
    public transcript: string;

    /** SdkTranscriptAlternative entities. */
    public entities: ISdkTranscriptEntity[];

    /**
     * Creates a new SdkTranscriptAlternative instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptAlternative instance
     */
    public static create(properties?: ISdkTranscriptAlternative): SdkTranscriptAlternative;

    /**
     * Encodes the specified SdkTranscriptAlternative message. Does not implicitly {@link SdkTranscriptAlternative.verify|verify} messages.
     * @param message SdkTranscriptAlternative message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptAlternative, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptAlternative message, length delimited. Does not implicitly {@link SdkTranscriptAlternative.verify|verify} messages.
     * @param message SdkTranscriptAlternative message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptAlternative, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptAlternative message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptAlternative
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptAlternative;

    /**
     * Decodes a SdkTranscriptAlternative message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptAlternative
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptAlternative;

    /**
     * Verifies a SdkTranscriptAlternative message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptAlternative message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptAlternative
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptAlternative;

    /**
     * Creates a plain object from a SdkTranscriptAlternative message. Also converts values to other types if specified.
     * @param message SdkTranscriptAlternative
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptAlternative, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptAlternative to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptAlternative
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptLanguageWithScore. */
export interface ISdkTranscriptLanguageWithScore {

    /** SdkTranscriptLanguageWithScore languageCode */
    languageCode?: (string|null);

    /** SdkTranscriptLanguageWithScore score */
    score?: (number|null);
}

/** Represents a SdkTranscriptLanguageWithScore. */
export class SdkTranscriptLanguageWithScore implements ISdkTranscriptLanguageWithScore {

    /**
     * Constructs a new SdkTranscriptLanguageWithScore.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptLanguageWithScore);

    /** SdkTranscriptLanguageWithScore languageCode. */
    public languageCode: string;

    /** SdkTranscriptLanguageWithScore score. */
    public score: number;

    /**
     * Creates a new SdkTranscriptLanguageWithScore instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptLanguageWithScore instance
     */
    public static create(properties?: ISdkTranscriptLanguageWithScore): SdkTranscriptLanguageWithScore;

    /**
     * Encodes the specified SdkTranscriptLanguageWithScore message. Does not implicitly {@link SdkTranscriptLanguageWithScore.verify|verify} messages.
     * @param message SdkTranscriptLanguageWithScore message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptLanguageWithScore, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptLanguageWithScore message, length delimited. Does not implicitly {@link SdkTranscriptLanguageWithScore.verify|verify} messages.
     * @param message SdkTranscriptLanguageWithScore message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptLanguageWithScore, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptLanguageWithScore message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptLanguageWithScore
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptLanguageWithScore;

    /**
     * Decodes a SdkTranscriptLanguageWithScore message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptLanguageWithScore
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptLanguageWithScore;

    /**
     * Verifies a SdkTranscriptLanguageWithScore message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptLanguageWithScore message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptLanguageWithScore
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptLanguageWithScore;

    /**
     * Creates a plain object from a SdkTranscriptLanguageWithScore message. Also converts values to other types if specified.
     * @param message SdkTranscriptLanguageWithScore
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptLanguageWithScore, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptLanguageWithScore to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptLanguageWithScore
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptResult. */
export interface ISdkTranscriptResult {

    /** SdkTranscriptResult alternatives */
    alternatives?: (ISdkTranscriptAlternative[]|null);

    /** SdkTranscriptResult channelId */
    channelId?: (string|null);

    /** SdkTranscriptResult endTime */
    endTime?: (number|Long|null);

    /** SdkTranscriptResult isPartial */
    isPartial?: (boolean|null);

    /** SdkTranscriptResult resultId */
    resultId?: (string|null);

    /** SdkTranscriptResult startTime */
    startTime?: (number|Long|null);

    /** SdkTranscriptResult languageCode */
    languageCode?: (string|null);

    /** SdkTranscriptResult languageIdentification */
    languageIdentification?: (ISdkTranscriptLanguageWithScore[]|null);
}

/** Represents a SdkTranscriptResult. */
export class SdkTranscriptResult implements ISdkTranscriptResult {

    /**
     * Constructs a new SdkTranscriptResult.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptResult);

    /** SdkTranscriptResult alternatives. */
    public alternatives: ISdkTranscriptAlternative[];

    /** SdkTranscriptResult channelId. */
    public channelId: string;

    /** SdkTranscriptResult endTime. */
    public endTime: (number|Long);

    /** SdkTranscriptResult isPartial. */
    public isPartial: boolean;

    /** SdkTranscriptResult resultId. */
    public resultId: string;

    /** SdkTranscriptResult startTime. */
    public startTime: (number|Long);

    /** SdkTranscriptResult languageCode. */
    public languageCode: string;

    /** SdkTranscriptResult languageIdentification. */
    public languageIdentification: ISdkTranscriptLanguageWithScore[];

    /**
     * Creates a new SdkTranscriptResult instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptResult instance
     */
    public static create(properties?: ISdkTranscriptResult): SdkTranscriptResult;

    /**
     * Encodes the specified SdkTranscriptResult message. Does not implicitly {@link SdkTranscriptResult.verify|verify} messages.
     * @param message SdkTranscriptResult message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptResult, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptResult message, length delimited. Does not implicitly {@link SdkTranscriptResult.verify|verify} messages.
     * @param message SdkTranscriptResult message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptResult, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptResult message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptResult;

    /**
     * Decodes a SdkTranscriptResult message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptResult;

    /**
     * Verifies a SdkTranscriptResult message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptResult message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptResult
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptResult;

    /**
     * Creates a plain object from a SdkTranscriptResult message. Also converts values to other types if specified.
     * @param message SdkTranscriptResult
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptResult to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptResult
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscript. */
export interface ISdkTranscript {

    /** SdkTranscript results */
    results?: (ISdkTranscriptResult[]|null);
}

/** Represents a SdkTranscript. */
export class SdkTranscript implements ISdkTranscript {

    /**
     * Constructs a new SdkTranscript.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscript);

    /** SdkTranscript results. */
    public results: ISdkTranscriptResult[];

    /**
     * Creates a new SdkTranscript instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscript instance
     */
    public static create(properties?: ISdkTranscript): SdkTranscript;

    /**
     * Encodes the specified SdkTranscript message. Does not implicitly {@link SdkTranscript.verify|verify} messages.
     * @param message SdkTranscript message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscript, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscript message, length delimited. Does not implicitly {@link SdkTranscript.verify|verify} messages.
     * @param message SdkTranscript message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscript, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscript message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscript
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscript;

    /**
     * Decodes a SdkTranscript message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscript
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscript;

    /**
     * Verifies a SdkTranscript message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscript message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscript
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscript;

    /**
     * Creates a plain object from a SdkTranscript message. Also converts values to other types if specified.
     * @param message SdkTranscript
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscript, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscript to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscript
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptionStatus. */
export interface ISdkTranscriptionStatus {

    /** SdkTranscriptionStatus type */
    type?: (SdkTranscriptionStatus.Type|null);

    /** SdkTranscriptionStatus eventTime */
    eventTime?: (number|Long|null);

    /** SdkTranscriptionStatus transcriptionRegion */
    transcriptionRegion?: (string|null);

    /** SdkTranscriptionStatus transcriptionConfiguration */
    transcriptionConfiguration?: (string|null);

    /** SdkTranscriptionStatus message */
    message?: (string|null);
}

/** Represents a SdkTranscriptionStatus. */
export class SdkTranscriptionStatus implements ISdkTranscriptionStatus {

    /**
     * Constructs a new SdkTranscriptionStatus.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptionStatus);

    /** SdkTranscriptionStatus type. */
    public type: SdkTranscriptionStatus.Type;

    /** SdkTranscriptionStatus eventTime. */
    public eventTime: (number|Long);

    /** SdkTranscriptionStatus transcriptionRegion. */
    public transcriptionRegion: string;

    /** SdkTranscriptionStatus transcriptionConfiguration. */
    public transcriptionConfiguration: string;

    /** SdkTranscriptionStatus message. */
    public message: string;

    /**
     * Creates a new SdkTranscriptionStatus instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptionStatus instance
     */
    public static create(properties?: ISdkTranscriptionStatus): SdkTranscriptionStatus;

    /**
     * Encodes the specified SdkTranscriptionStatus message. Does not implicitly {@link SdkTranscriptionStatus.verify|verify} messages.
     * @param message SdkTranscriptionStatus message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptionStatus, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptionStatus message, length delimited. Does not implicitly {@link SdkTranscriptionStatus.verify|verify} messages.
     * @param message SdkTranscriptionStatus message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptionStatus, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptionStatus message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptionStatus
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptionStatus;

    /**
     * Decodes a SdkTranscriptionStatus message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptionStatus
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptionStatus;

    /**
     * Verifies a SdkTranscriptionStatus message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptionStatus message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptionStatus
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptionStatus;

    /**
     * Creates a plain object from a SdkTranscriptionStatus message. Also converts values to other types if specified.
     * @param message SdkTranscriptionStatus
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptionStatus, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptionStatus to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptionStatus
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkTranscriptionStatus {

    /** Type enum. */
    enum Type {
        STARTED = 1,
        INTERRUPTED = 2,
        RESUMED = 3,
        STOPPED = 4,
        FAILED = 5
    }
}

/** Properties of a SdkTranscriptEvent. */
export interface ISdkTranscriptEvent {

    /** SdkTranscriptEvent status */
    status?: (ISdkTranscriptionStatus|null);

    /** SdkTranscriptEvent transcript */
    transcript?: (ISdkTranscript|null);
}

/** Represents a SdkTranscriptEvent. */
export class SdkTranscriptEvent implements ISdkTranscriptEvent {

    /**
     * Constructs a new SdkTranscriptEvent.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptEvent);

    /** SdkTranscriptEvent status. */
    public status?: (ISdkTranscriptionStatus|null);

    /** SdkTranscriptEvent transcript. */
    public transcript?: (ISdkTranscript|null);

    /** SdkTranscriptEvent Event. */
    public Event?: ("status"|"transcript");

    /**
     * Creates a new SdkTranscriptEvent instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptEvent instance
     */
    public static create(properties?: ISdkTranscriptEvent): SdkTranscriptEvent;

    /**
     * Encodes the specified SdkTranscriptEvent message. Does not implicitly {@link SdkTranscriptEvent.verify|verify} messages.
     * @param message SdkTranscriptEvent message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptEvent, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptEvent message, length delimited. Does not implicitly {@link SdkTranscriptEvent.verify|verify} messages.
     * @param message SdkTranscriptEvent message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptEvent, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptEvent message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptEvent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptEvent;

    /**
     * Decodes a SdkTranscriptEvent message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptEvent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptEvent;

    /**
     * Verifies a SdkTranscriptEvent message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptEvent message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptEvent
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptEvent;

    /**
     * Creates a plain object from a SdkTranscriptEvent message. Also converts values to other types if specified.
     * @param message SdkTranscriptEvent
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptEvent to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptEvent
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkTranscriptFrame. */
export interface ISdkTranscriptFrame {

    /** SdkTranscriptFrame events */
    events?: (ISdkTranscriptEvent[]|null);
}

/** Represents a SdkTranscriptFrame. */
export class SdkTranscriptFrame implements ISdkTranscriptFrame {

    /**
     * Constructs a new SdkTranscriptFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkTranscriptFrame);

    /** SdkTranscriptFrame events. */
    public events: ISdkTranscriptEvent[];

    /**
     * Creates a new SdkTranscriptFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkTranscriptFrame instance
     */
    public static create(properties?: ISdkTranscriptFrame): SdkTranscriptFrame;

    /**
     * Encodes the specified SdkTranscriptFrame message. Does not implicitly {@link SdkTranscriptFrame.verify|verify} messages.
     * @param message SdkTranscriptFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkTranscriptFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkTranscriptFrame message, length delimited. Does not implicitly {@link SdkTranscriptFrame.verify|verify} messages.
     * @param message SdkTranscriptFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkTranscriptFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkTranscriptFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkTranscriptFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkTranscriptFrame;

    /**
     * Decodes a SdkTranscriptFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkTranscriptFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkTranscriptFrame;

    /**
     * Verifies a SdkTranscriptFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkTranscriptFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkTranscriptFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkTranscriptFrame;

    /**
     * Creates a plain object from a SdkTranscriptFrame message. Also converts values to other types if specified.
     * @param message SdkTranscriptFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkTranscriptFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkTranscriptFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkTranscriptFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkRemoteVideoUpdateFrame. */
export interface ISdkRemoteVideoUpdateFrame {

    /** SdkRemoteVideoUpdateFrame addedOrUpdatedVideoSubscriptions */
    addedOrUpdatedVideoSubscriptions?: (ISdkVideoSubscriptionConfiguration[]|null);

    /** SdkRemoteVideoUpdateFrame removedVideoSubscriptionMids */
    removedVideoSubscriptionMids?: (string[]|null);
}

/** Represents a SdkRemoteVideoUpdateFrame. */
export class SdkRemoteVideoUpdateFrame implements ISdkRemoteVideoUpdateFrame {

    /**
     * Constructs a new SdkRemoteVideoUpdateFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkRemoteVideoUpdateFrame);

    /** SdkRemoteVideoUpdateFrame addedOrUpdatedVideoSubscriptions. */
    public addedOrUpdatedVideoSubscriptions: ISdkVideoSubscriptionConfiguration[];

    /** SdkRemoteVideoUpdateFrame removedVideoSubscriptionMids. */
    public removedVideoSubscriptionMids: string[];

    /**
     * Creates a new SdkRemoteVideoUpdateFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkRemoteVideoUpdateFrame instance
     */
    public static create(properties?: ISdkRemoteVideoUpdateFrame): SdkRemoteVideoUpdateFrame;

    /**
     * Encodes the specified SdkRemoteVideoUpdateFrame message. Does not implicitly {@link SdkRemoteVideoUpdateFrame.verify|verify} messages.
     * @param message SdkRemoteVideoUpdateFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkRemoteVideoUpdateFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkRemoteVideoUpdateFrame message, length delimited. Does not implicitly {@link SdkRemoteVideoUpdateFrame.verify|verify} messages.
     * @param message SdkRemoteVideoUpdateFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkRemoteVideoUpdateFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkRemoteVideoUpdateFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkRemoteVideoUpdateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkRemoteVideoUpdateFrame;

    /**
     * Decodes a SdkRemoteVideoUpdateFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkRemoteVideoUpdateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkRemoteVideoUpdateFrame;

    /**
     * Verifies a SdkRemoteVideoUpdateFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkRemoteVideoUpdateFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkRemoteVideoUpdateFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkRemoteVideoUpdateFrame;

    /**
     * Creates a plain object from a SdkRemoteVideoUpdateFrame message. Also converts values to other types if specified.
     * @param message SdkRemoteVideoUpdateFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkRemoteVideoUpdateFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkRemoteVideoUpdateFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkRemoteVideoUpdateFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkVideoQualityAdaptationPreference enum. */
export enum SdkVideoQualityAdaptationPreference {
    BALANCED = 1,
    MAINTAIN_FRAMERATE = 2,
    MAINTAIN_RESOLUTION = 3
}

/** Properties of a SdkVideoSubscriptionConfiguration. */
export interface ISdkVideoSubscriptionConfiguration {

    /** SdkVideoSubscriptionConfiguration mid */
    mid: string;

    /** SdkVideoSubscriptionConfiguration attendeeId */
    attendeeId?: (string|null);

    /** SdkVideoSubscriptionConfiguration streamId */
    streamId?: (number|null);

    /** SdkVideoSubscriptionConfiguration priority */
    priority?: (number|null);

    /** SdkVideoSubscriptionConfiguration targetBitrateKbps */
    targetBitrateKbps?: (number|null);

    /** SdkVideoSubscriptionConfiguration groupId */
    groupId?: (number|null);

    /** SdkVideoSubscriptionConfiguration qualityAdaptationPreference */
    qualityAdaptationPreference?: (SdkVideoQualityAdaptationPreference|null);
}

/** Represents a SdkVideoSubscriptionConfiguration. */
export class SdkVideoSubscriptionConfiguration implements ISdkVideoSubscriptionConfiguration {

    /**
     * Constructs a new SdkVideoSubscriptionConfiguration.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkVideoSubscriptionConfiguration);

    /** SdkVideoSubscriptionConfiguration mid. */
    public mid: string;

    /** SdkVideoSubscriptionConfiguration attendeeId. */
    public attendeeId: string;

    /** SdkVideoSubscriptionConfiguration streamId. */
    public streamId: number;

    /** SdkVideoSubscriptionConfiguration priority. */
    public priority: number;

    /** SdkVideoSubscriptionConfiguration targetBitrateKbps. */
    public targetBitrateKbps: number;

    /** SdkVideoSubscriptionConfiguration groupId. */
    public groupId: number;

    /** SdkVideoSubscriptionConfiguration qualityAdaptationPreference. */
    public qualityAdaptationPreference: SdkVideoQualityAdaptationPreference;

    /**
     * Creates a new SdkVideoSubscriptionConfiguration instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkVideoSubscriptionConfiguration instance
     */
    public static create(properties?: ISdkVideoSubscriptionConfiguration): SdkVideoSubscriptionConfiguration;

    /**
     * Encodes the specified SdkVideoSubscriptionConfiguration message. Does not implicitly {@link SdkVideoSubscriptionConfiguration.verify|verify} messages.
     * @param message SdkVideoSubscriptionConfiguration message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkVideoSubscriptionConfiguration, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkVideoSubscriptionConfiguration message, length delimited. Does not implicitly {@link SdkVideoSubscriptionConfiguration.verify|verify} messages.
     * @param message SdkVideoSubscriptionConfiguration message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkVideoSubscriptionConfiguration, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkVideoSubscriptionConfiguration message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkVideoSubscriptionConfiguration
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkVideoSubscriptionConfiguration;

    /**
     * Decodes a SdkVideoSubscriptionConfiguration message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkVideoSubscriptionConfiguration
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkVideoSubscriptionConfiguration;

    /**
     * Verifies a SdkVideoSubscriptionConfiguration message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkVideoSubscriptionConfiguration message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkVideoSubscriptionConfiguration
     */
    public static fromObject(object: { [k: string]: any }): SdkVideoSubscriptionConfiguration;

    /**
     * Creates a plain object from a SdkVideoSubscriptionConfiguration message. Also converts values to other types if specified.
     * @param message SdkVideoSubscriptionConfiguration
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkVideoSubscriptionConfiguration, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkVideoSubscriptionConfiguration to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkVideoSubscriptionConfiguration
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkNotificationFrame. */
export interface ISdkNotificationFrame {

    /** SdkNotificationFrame level */
    level?: (SdkNotificationFrame.NotificationLevel|null);

    /** SdkNotificationFrame message */
    message?: (string|null);
}

/** Represents a SdkNotificationFrame. */
export class SdkNotificationFrame implements ISdkNotificationFrame {

    /**
     * Constructs a new SdkNotificationFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkNotificationFrame);

    /** SdkNotificationFrame level. */
    public level: SdkNotificationFrame.NotificationLevel;

    /** SdkNotificationFrame message. */
    public message: string;

    /**
     * Creates a new SdkNotificationFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkNotificationFrame instance
     */
    public static create(properties?: ISdkNotificationFrame): SdkNotificationFrame;

    /**
     * Encodes the specified SdkNotificationFrame message. Does not implicitly {@link SdkNotificationFrame.verify|verify} messages.
     * @param message SdkNotificationFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkNotificationFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkNotificationFrame message, length delimited. Does not implicitly {@link SdkNotificationFrame.verify|verify} messages.
     * @param message SdkNotificationFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkNotificationFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkNotificationFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkNotificationFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkNotificationFrame;

    /**
     * Decodes a SdkNotificationFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkNotificationFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkNotificationFrame;

    /**
     * Verifies a SdkNotificationFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkNotificationFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkNotificationFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkNotificationFrame;

    /**
     * Creates a plain object from a SdkNotificationFrame message. Also converts values to other types if specified.
     * @param message SdkNotificationFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkNotificationFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkNotificationFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkNotificationFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

export namespace SdkNotificationFrame {

    /** NotificationLevel enum. */
    enum NotificationLevel {
        INFO = 1,
        WARNING = 2,
        ERROR = 3
    }
}

/** Properties of a SdkPrimaryMeetingJoinFrame. */
export interface ISdkPrimaryMeetingJoinFrame {

    /** SdkPrimaryMeetingJoinFrame credentials */
    credentials?: (ISdkMeetingSessionCredentials|null);
}

/** Represents a SdkPrimaryMeetingJoinFrame. */
export class SdkPrimaryMeetingJoinFrame implements ISdkPrimaryMeetingJoinFrame {

    /**
     * Constructs a new SdkPrimaryMeetingJoinFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkPrimaryMeetingJoinFrame);

    /** SdkPrimaryMeetingJoinFrame credentials. */
    public credentials?: (ISdkMeetingSessionCredentials|null);

    /**
     * Creates a new SdkPrimaryMeetingJoinFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkPrimaryMeetingJoinFrame instance
     */
    public static create(properties?: ISdkPrimaryMeetingJoinFrame): SdkPrimaryMeetingJoinFrame;

    /**
     * Encodes the specified SdkPrimaryMeetingJoinFrame message. Does not implicitly {@link SdkPrimaryMeetingJoinFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingJoinFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkPrimaryMeetingJoinFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkPrimaryMeetingJoinFrame message, length delimited. Does not implicitly {@link SdkPrimaryMeetingJoinFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingJoinFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkPrimaryMeetingJoinFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkPrimaryMeetingJoinFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkPrimaryMeetingJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkPrimaryMeetingJoinFrame;

    /**
     * Decodes a SdkPrimaryMeetingJoinFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkPrimaryMeetingJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkPrimaryMeetingJoinFrame;

    /**
     * Verifies a SdkPrimaryMeetingJoinFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkPrimaryMeetingJoinFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkPrimaryMeetingJoinFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkPrimaryMeetingJoinFrame;

    /**
     * Creates a plain object from a SdkPrimaryMeetingJoinFrame message. Also converts values to other types if specified.
     * @param message SdkPrimaryMeetingJoinFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkPrimaryMeetingJoinFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkPrimaryMeetingJoinFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkPrimaryMeetingJoinFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkPrimaryMeetingJoinAckFrame. */
export interface ISdkPrimaryMeetingJoinAckFrame {
}

/** Represents a SdkPrimaryMeetingJoinAckFrame. */
export class SdkPrimaryMeetingJoinAckFrame implements ISdkPrimaryMeetingJoinAckFrame {

    /**
     * Constructs a new SdkPrimaryMeetingJoinAckFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkPrimaryMeetingJoinAckFrame);

    /**
     * Creates a new SdkPrimaryMeetingJoinAckFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkPrimaryMeetingJoinAckFrame instance
     */
    public static create(properties?: ISdkPrimaryMeetingJoinAckFrame): SdkPrimaryMeetingJoinAckFrame;

    /**
     * Encodes the specified SdkPrimaryMeetingJoinAckFrame message. Does not implicitly {@link SdkPrimaryMeetingJoinAckFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingJoinAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkPrimaryMeetingJoinAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkPrimaryMeetingJoinAckFrame message, length delimited. Does not implicitly {@link SdkPrimaryMeetingJoinAckFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingJoinAckFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkPrimaryMeetingJoinAckFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkPrimaryMeetingJoinAckFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkPrimaryMeetingJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkPrimaryMeetingJoinAckFrame;

    /**
     * Decodes a SdkPrimaryMeetingJoinAckFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkPrimaryMeetingJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkPrimaryMeetingJoinAckFrame;

    /**
     * Verifies a SdkPrimaryMeetingJoinAckFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkPrimaryMeetingJoinAckFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkPrimaryMeetingJoinAckFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkPrimaryMeetingJoinAckFrame;

    /**
     * Creates a plain object from a SdkPrimaryMeetingJoinAckFrame message. Also converts values to other types if specified.
     * @param message SdkPrimaryMeetingJoinAckFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkPrimaryMeetingJoinAckFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkPrimaryMeetingJoinAckFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkPrimaryMeetingJoinAckFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkPrimaryMeetingLeaveFrame. */
export interface ISdkPrimaryMeetingLeaveFrame {
}

/** Represents a SdkPrimaryMeetingLeaveFrame. */
export class SdkPrimaryMeetingLeaveFrame implements ISdkPrimaryMeetingLeaveFrame {

    /**
     * Constructs a new SdkPrimaryMeetingLeaveFrame.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkPrimaryMeetingLeaveFrame);

    /**
     * Creates a new SdkPrimaryMeetingLeaveFrame instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkPrimaryMeetingLeaveFrame instance
     */
    public static create(properties?: ISdkPrimaryMeetingLeaveFrame): SdkPrimaryMeetingLeaveFrame;

    /**
     * Encodes the specified SdkPrimaryMeetingLeaveFrame message. Does not implicitly {@link SdkPrimaryMeetingLeaveFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingLeaveFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkPrimaryMeetingLeaveFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkPrimaryMeetingLeaveFrame message, length delimited. Does not implicitly {@link SdkPrimaryMeetingLeaveFrame.verify|verify} messages.
     * @param message SdkPrimaryMeetingLeaveFrame message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkPrimaryMeetingLeaveFrame, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkPrimaryMeetingLeaveFrame message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkPrimaryMeetingLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkPrimaryMeetingLeaveFrame;

    /**
     * Decodes a SdkPrimaryMeetingLeaveFrame message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkPrimaryMeetingLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkPrimaryMeetingLeaveFrame;

    /**
     * Verifies a SdkPrimaryMeetingLeaveFrame message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkPrimaryMeetingLeaveFrame message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkPrimaryMeetingLeaveFrame
     */
    public static fromObject(object: { [k: string]: any }): SdkPrimaryMeetingLeaveFrame;

    /**
     * Creates a plain object from a SdkPrimaryMeetingLeaveFrame message. Also converts values to other types if specified.
     * @param message SdkPrimaryMeetingLeaveFrame
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkPrimaryMeetingLeaveFrame, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkPrimaryMeetingLeaveFrame to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkPrimaryMeetingLeaveFrame
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a SdkMeetingSessionCredentials. */
export interface ISdkMeetingSessionCredentials {

    /** SdkMeetingSessionCredentials attendeeId */
    attendeeId?: (string|null);

    /** SdkMeetingSessionCredentials externalUserId */
    externalUserId?: (string|null);

    /** SdkMeetingSessionCredentials joinToken */
    joinToken?: (string|null);
}

/** Represents a SdkMeetingSessionCredentials. */
export class SdkMeetingSessionCredentials implements ISdkMeetingSessionCredentials {

    /**
     * Constructs a new SdkMeetingSessionCredentials.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkMeetingSessionCredentials);

    /** SdkMeetingSessionCredentials attendeeId. */
    public attendeeId: string;

    /** SdkMeetingSessionCredentials externalUserId. */
    public externalUserId: string;

    /** SdkMeetingSessionCredentials joinToken. */
    public joinToken: string;

    /**
     * Creates a new SdkMeetingSessionCredentials instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkMeetingSessionCredentials instance
     */
    public static create(properties?: ISdkMeetingSessionCredentials): SdkMeetingSessionCredentials;

    /**
     * Encodes the specified SdkMeetingSessionCredentials message. Does not implicitly {@link SdkMeetingSessionCredentials.verify|verify} messages.
     * @param message SdkMeetingSessionCredentials message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkMeetingSessionCredentials, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkMeetingSessionCredentials message, length delimited. Does not implicitly {@link SdkMeetingSessionCredentials.verify|verify} messages.
     * @param message SdkMeetingSessionCredentials message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkMeetingSessionCredentials, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkMeetingSessionCredentials message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkMeetingSessionCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkMeetingSessionCredentials;

    /**
     * Decodes a SdkMeetingSessionCredentials message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkMeetingSessionCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkMeetingSessionCredentials;

    /**
     * Verifies a SdkMeetingSessionCredentials message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkMeetingSessionCredentials message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkMeetingSessionCredentials
     */
    public static fromObject(object: { [k: string]: any }): SdkMeetingSessionCredentials;

    /**
     * Creates a plain object from a SdkMeetingSessionCredentials message. Also converts values to other types if specified.
     * @param message SdkMeetingSessionCredentials
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkMeetingSessionCredentials, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkMeetingSessionCredentials to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for SdkMeetingSessionCredentials
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** SdkVideoCodecCapability enum. */
export enum SdkVideoCodecCapability {
    VP8 = 1,
    H264_BASELINE_PROFILE = 2,
    H264_CONSTRAINED_BASELINE_PROFILE = 3,
    H264_MAIN_PROFILE = 4,
    H264_HIGH_PROFILE = 5,
    H264_CONSTRAINED_HIGH_PROFILE = 6,
    VP9_PROFILE_0 = 8,
    AV1_MAIN_PROFILE = 11
}
