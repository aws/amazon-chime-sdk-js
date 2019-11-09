import * as Long from "long";
import * as $protobuf from "protobufjs";
/** Properties of a SdkScreenSignalingMessage. */
export interface ISdkScreenSignalingMessage {

    /** SdkScreenSignalingMessage attendeeId */
    attendeeId?: (string|null);
}

/** Represents a SdkScreenSignalingMessage. */
export class SdkScreenSignalingMessage implements ISdkScreenSignalingMessage {

    /**
     * Constructs a new SdkScreenSignalingMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISdkScreenSignalingMessage);

    /** SdkScreenSignalingMessage attendeeId. */
    public attendeeId: string;

    /**
     * Creates a new SdkScreenSignalingMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SdkScreenSignalingMessage instance
     */
    public static create(properties?: ISdkScreenSignalingMessage): SdkScreenSignalingMessage;

    /**
     * Encodes the specified SdkScreenSignalingMessage message. Does not implicitly {@link SdkScreenSignalingMessage.verify|verify} messages.
     * @param message SdkScreenSignalingMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISdkScreenSignalingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified SdkScreenSignalingMessage message, length delimited. Does not implicitly {@link SdkScreenSignalingMessage.verify|verify} messages.
     * @param message SdkScreenSignalingMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISdkScreenSignalingMessage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SdkScreenSignalingMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns SdkScreenSignalingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SdkScreenSignalingMessage;

    /**
     * Decodes a SdkScreenSignalingMessage message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns SdkScreenSignalingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SdkScreenSignalingMessage;

    /**
     * Verifies a SdkScreenSignalingMessage message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a SdkScreenSignalingMessage message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SdkScreenSignalingMessage
     */
    public static fromObject(object: { [k: string]: any }): SdkScreenSignalingMessage;

    /**
     * Creates a plain object from a SdkScreenSignalingMessage message. Also converts values to other types if specified.
     * @param message SdkScreenSignalingMessage
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SdkScreenSignalingMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SdkScreenSignalingMessage to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
