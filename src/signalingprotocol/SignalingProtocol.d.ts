import * as Long from "long";
import * as $protobuf from "protobufjs";
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
        DATA_MESSAGE = 22
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
}

/** SdkJoinFlags enum. */
export enum SdkJoinFlags {
    SEND_BITRATES = 1,
    HAS_STREAM_UPDATE = 2,
    USE_SEND_SIDE_BWE = 8
}

/** Properties of a SdkClientDetails. */
export interface ISdkClientDetails {

    /** SdkClientDetails appVersionName */
    appVersionName?: (string|null);

    /** SdkClientDetails appVersionCode */
    appVersionCode?: (string|null);

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
}

/** Represents a SdkClientDetails. */
export class SdkClientDetails implements ISdkClientDetails {

    /**
     * Constructs a new SdkClientDetails.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkClientDetails);

    /** SdkClientDetails appVersionName. */
    public appVersionName: string;

    /** SdkClientDetails appVersionCode. */
    public appVersionCode: string;

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
}

/** Properties of a SdkJoinAckFrame. */
export interface ISdkJoinAckFrame {

    /** SdkJoinAckFrame turnCredentials */
    turnCredentials?: (ISdkTurnCredentials|null);
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
}

/** Properties of a SdkPauseResumeFrame. */
export interface ISdkPauseResumeFrame {

    /** SdkPauseResumeFrame streamIds */
    streamIds?: (number[]|null);
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
}

/** Properties of a SdkBitrateFrame. */
export interface ISdkBitrateFrame {

    /** SdkBitrateFrame bitrates */
    bitrates?: (ISdkBitrate[]|null);
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
        VIDEO_AVERAGE_ENCODE_MS = 25,
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
        VIDEO_RECEIVED_JITTER_MS = 49
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
}
