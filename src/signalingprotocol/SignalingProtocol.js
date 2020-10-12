/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.SdkSignalFrame = (function() {

    /**
     * Properties of a SdkSignalFrame.
     * @exports ISdkSignalFrame
     * @interface ISdkSignalFrame
     * @property {number|Long} timestampMs SdkSignalFrame timestampMs
     * @property {SdkSignalFrame.Type} type SdkSignalFrame type
     * @property {ISdkErrorFrame|null} [error] SdkSignalFrame error
     * @property {ISdkJoinFrame|null} [join] SdkSignalFrame join
     * @property {ISdkJoinAckFrame|null} [joinack] SdkSignalFrame joinack
     * @property {ISdkSubscribeFrame|null} [sub] SdkSignalFrame sub
     * @property {ISdkSubscribeAckFrame|null} [suback] SdkSignalFrame suback
     * @property {ISdkIndexFrame|null} [index] SdkSignalFrame index
     * @property {ISdkPauseResumeFrame|null} [pause] SdkSignalFrame pause
     * @property {ISdkLeaveFrame|null} [leave] SdkSignalFrame leave
     * @property {ISdkLeaveAckFrame|null} [leaveAck] SdkSignalFrame leaveAck
     * @property {ISdkBitrateFrame|null} [bitrates] SdkSignalFrame bitrates
     * @property {ISdkAudioControlFrame|null} [audioControl] SdkSignalFrame audioControl
     * @property {ISdkAudioMetadataFrame|null} [audioMetadata] SdkSignalFrame audioMetadata
     * @property {ISdkAudioStreamIdInfoFrame|null} [audioStreamIdInfo] SdkSignalFrame audioStreamIdInfo
     * @property {ISdkPingPongFrame|null} [pingPong] SdkSignalFrame pingPong
     * @property {ISdkAudioStatusFrame|null} [audioStatus] SdkSignalFrame audioStatus
     * @property {ISdkClientMetricFrame|null} [clientMetric] SdkSignalFrame clientMetric
     * @property {ISdkDataMessageFrame|null} [dataMessage] SdkSignalFrame dataMessage
     */

    /**
     * Constructs a new SdkSignalFrame.
     * @exports SdkSignalFrame
     * @classdesc Represents a SdkSignalFrame.
     * @implements ISdkSignalFrame
     * @constructor
     * @param {ISdkSignalFrame=} [properties] Properties to set
     */
    function SdkSignalFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkSignalFrame timestampMs.
     * @member {number|Long} timestampMs
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.timestampMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * SdkSignalFrame type.
     * @member {SdkSignalFrame.Type} type
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.type = 1;

    /**
     * SdkSignalFrame error.
     * @member {ISdkErrorFrame|null|undefined} error
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.error = null;

    /**
     * SdkSignalFrame join.
     * @member {ISdkJoinFrame|null|undefined} join
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.join = null;

    /**
     * SdkSignalFrame joinack.
     * @member {ISdkJoinAckFrame|null|undefined} joinack
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.joinack = null;

    /**
     * SdkSignalFrame sub.
     * @member {ISdkSubscribeFrame|null|undefined} sub
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.sub = null;

    /**
     * SdkSignalFrame suback.
     * @member {ISdkSubscribeAckFrame|null|undefined} suback
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.suback = null;

    /**
     * SdkSignalFrame index.
     * @member {ISdkIndexFrame|null|undefined} index
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.index = null;

    /**
     * SdkSignalFrame pause.
     * @member {ISdkPauseResumeFrame|null|undefined} pause
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.pause = null;

    /**
     * SdkSignalFrame leave.
     * @member {ISdkLeaveFrame|null|undefined} leave
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.leave = null;

    /**
     * SdkSignalFrame leaveAck.
     * @member {ISdkLeaveAckFrame|null|undefined} leaveAck
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.leaveAck = null;

    /**
     * SdkSignalFrame bitrates.
     * @member {ISdkBitrateFrame|null|undefined} bitrates
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.bitrates = null;

    /**
     * SdkSignalFrame audioControl.
     * @member {ISdkAudioControlFrame|null|undefined} audioControl
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.audioControl = null;

    /**
     * SdkSignalFrame audioMetadata.
     * @member {ISdkAudioMetadataFrame|null|undefined} audioMetadata
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.audioMetadata = null;

    /**
     * SdkSignalFrame audioStreamIdInfo.
     * @member {ISdkAudioStreamIdInfoFrame|null|undefined} audioStreamIdInfo
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.audioStreamIdInfo = null;

    /**
     * SdkSignalFrame pingPong.
     * @member {ISdkPingPongFrame|null|undefined} pingPong
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.pingPong = null;

    /**
     * SdkSignalFrame audioStatus.
     * @member {ISdkAudioStatusFrame|null|undefined} audioStatus
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.audioStatus = null;

    /**
     * SdkSignalFrame clientMetric.
     * @member {ISdkClientMetricFrame|null|undefined} clientMetric
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.clientMetric = null;

    /**
     * SdkSignalFrame dataMessage.
     * @member {ISdkDataMessageFrame|null|undefined} dataMessage
     * @memberof SdkSignalFrame
     * @instance
     */
    SdkSignalFrame.prototype.dataMessage = null;

    /**
     * Creates a new SdkSignalFrame instance using the specified properties.
     * @function create
     * @memberof SdkSignalFrame
     * @static
     * @param {ISdkSignalFrame=} [properties] Properties to set
     * @returns {SdkSignalFrame} SdkSignalFrame instance
     */
    SdkSignalFrame.create = function create(properties) {
        return new SdkSignalFrame(properties);
    };

    /**
     * Encodes the specified SdkSignalFrame message. Does not implicitly {@link SdkSignalFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkSignalFrame
     * @static
     * @param {ISdkSignalFrame} message SdkSignalFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSignalFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.timestampMs);
        writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
        if (message.error != null && message.hasOwnProperty("error"))
            $root.SdkErrorFrame.encode(message.error, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        if (message.join != null && message.hasOwnProperty("join"))
            $root.SdkJoinFrame.encode(message.join, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.joinack != null && message.hasOwnProperty("joinack"))
            $root.SdkJoinAckFrame.encode(message.joinack, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.sub != null && message.hasOwnProperty("sub"))
            $root.SdkSubscribeFrame.encode(message.sub, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        if (message.suback != null && message.hasOwnProperty("suback"))
            $root.SdkSubscribeAckFrame.encode(message.suback, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
        if (message.index != null && message.hasOwnProperty("index"))
            $root.SdkIndexFrame.encode(message.index, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
        if (message.pause != null && message.hasOwnProperty("pause"))
            $root.SdkPauseResumeFrame.encode(message.pause, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
        if (message.leave != null && message.hasOwnProperty("leave"))
            $root.SdkLeaveFrame.encode(message.leave, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
        if (message.leaveAck != null && message.hasOwnProperty("leaveAck"))
            $root.SdkLeaveAckFrame.encode(message.leaveAck, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
        if (message.bitrates != null && message.hasOwnProperty("bitrates"))
            $root.SdkBitrateFrame.encode(message.bitrates, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
        if (message.audioControl != null && message.hasOwnProperty("audioControl"))
            $root.SdkAudioControlFrame.encode(message.audioControl, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
        if (message.audioMetadata != null && message.hasOwnProperty("audioMetadata"))
            $root.SdkAudioMetadataFrame.encode(message.audioMetadata, writer.uint32(/* id 18, wireType 2 =*/146).fork()).ldelim();
        if (message.audioStreamIdInfo != null && message.hasOwnProperty("audioStreamIdInfo"))
            $root.SdkAudioStreamIdInfoFrame.encode(message.audioStreamIdInfo, writer.uint32(/* id 19, wireType 2 =*/154).fork()).ldelim();
        if (message.pingPong != null && message.hasOwnProperty("pingPong"))
            $root.SdkPingPongFrame.encode(message.pingPong, writer.uint32(/* id 20, wireType 2 =*/162).fork()).ldelim();
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus"))
            $root.SdkAudioStatusFrame.encode(message.audioStatus, writer.uint32(/* id 21, wireType 2 =*/170).fork()).ldelim();
        if (message.clientMetric != null && message.hasOwnProperty("clientMetric"))
            $root.SdkClientMetricFrame.encode(message.clientMetric, writer.uint32(/* id 22, wireType 2 =*/178).fork()).ldelim();
        if (message.dataMessage != null && message.hasOwnProperty("dataMessage"))
            $root.SdkDataMessageFrame.encode(message.dataMessage, writer.uint32(/* id 23, wireType 2 =*/186).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkSignalFrame message, length delimited. Does not implicitly {@link SdkSignalFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkSignalFrame
     * @static
     * @param {ISdkSignalFrame} message SdkSignalFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSignalFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkSignalFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkSignalFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkSignalFrame} SdkSignalFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSignalFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkSignalFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.timestampMs = reader.uint64();
                break;
            case 2:
                message.type = reader.int32();
                break;
            case 3:
                message.error = $root.SdkErrorFrame.decode(reader, reader.uint32());
                break;
            case 4:
                message.join = $root.SdkJoinFrame.decode(reader, reader.uint32());
                break;
            case 5:
                message.joinack = $root.SdkJoinAckFrame.decode(reader, reader.uint32());
                break;
            case 6:
                message.sub = $root.SdkSubscribeFrame.decode(reader, reader.uint32());
                break;
            case 7:
                message.suback = $root.SdkSubscribeAckFrame.decode(reader, reader.uint32());
                break;
            case 8:
                message.index = $root.SdkIndexFrame.decode(reader, reader.uint32());
                break;
            case 10:
                message.pause = $root.SdkPauseResumeFrame.decode(reader, reader.uint32());
                break;
            case 11:
                message.leave = $root.SdkLeaveFrame.decode(reader, reader.uint32());
                break;
            case 12:
                message.leaveAck = $root.SdkLeaveAckFrame.decode(reader, reader.uint32());
                break;
            case 14:
                message.bitrates = $root.SdkBitrateFrame.decode(reader, reader.uint32());
                break;
            case 17:
                message.audioControl = $root.SdkAudioControlFrame.decode(reader, reader.uint32());
                break;
            case 18:
                message.audioMetadata = $root.SdkAudioMetadataFrame.decode(reader, reader.uint32());
                break;
            case 19:
                message.audioStreamIdInfo = $root.SdkAudioStreamIdInfoFrame.decode(reader, reader.uint32());
                break;
            case 20:
                message.pingPong = $root.SdkPingPongFrame.decode(reader, reader.uint32());
                break;
            case 21:
                message.audioStatus = $root.SdkAudioStatusFrame.decode(reader, reader.uint32());
                break;
            case 22:
                message.clientMetric = $root.SdkClientMetricFrame.decode(reader, reader.uint32());
                break;
            case 23:
                message.dataMessage = $root.SdkDataMessageFrame.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("timestampMs"))
            throw $util.ProtocolError("missing required 'timestampMs'", { instance: message });
        if (!message.hasOwnProperty("type"))
            throw $util.ProtocolError("missing required 'type'", { instance: message });
        return message;
    };

    /**
     * Decodes a SdkSignalFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkSignalFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkSignalFrame} SdkSignalFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSignalFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkSignalFrame message.
     * @function verify
     * @memberof SdkSignalFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkSignalFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (!$util.isInteger(message.timestampMs) && !(message.timestampMs && $util.isInteger(message.timestampMs.low) && $util.isInteger(message.timestampMs.high)))
            return "timestampMs: integer|Long expected";
        switch (message.type) {
        default:
            return "type: enum value expected";
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 7:
        case 8:
        case 9:
        case 10:
        case 13:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
            break;
        }
        if (message.error != null && message.hasOwnProperty("error")) {
            var error = $root.SdkErrorFrame.verify(message.error);
            if (error)
                return "error." + error;
        }
        if (message.join != null && message.hasOwnProperty("join")) {
            var error = $root.SdkJoinFrame.verify(message.join);
            if (error)
                return "join." + error;
        }
        if (message.joinack != null && message.hasOwnProperty("joinack")) {
            var error = $root.SdkJoinAckFrame.verify(message.joinack);
            if (error)
                return "joinack." + error;
        }
        if (message.sub != null && message.hasOwnProperty("sub")) {
            var error = $root.SdkSubscribeFrame.verify(message.sub);
            if (error)
                return "sub." + error;
        }
        if (message.suback != null && message.hasOwnProperty("suback")) {
            var error = $root.SdkSubscribeAckFrame.verify(message.suback);
            if (error)
                return "suback." + error;
        }
        if (message.index != null && message.hasOwnProperty("index")) {
            var error = $root.SdkIndexFrame.verify(message.index);
            if (error)
                return "index." + error;
        }
        if (message.pause != null && message.hasOwnProperty("pause")) {
            var error = $root.SdkPauseResumeFrame.verify(message.pause);
            if (error)
                return "pause." + error;
        }
        if (message.leave != null && message.hasOwnProperty("leave")) {
            var error = $root.SdkLeaveFrame.verify(message.leave);
            if (error)
                return "leave." + error;
        }
        if (message.leaveAck != null && message.hasOwnProperty("leaveAck")) {
            var error = $root.SdkLeaveAckFrame.verify(message.leaveAck);
            if (error)
                return "leaveAck." + error;
        }
        if (message.bitrates != null && message.hasOwnProperty("bitrates")) {
            var error = $root.SdkBitrateFrame.verify(message.bitrates);
            if (error)
                return "bitrates." + error;
        }
        if (message.audioControl != null && message.hasOwnProperty("audioControl")) {
            var error = $root.SdkAudioControlFrame.verify(message.audioControl);
            if (error)
                return "audioControl." + error;
        }
        if (message.audioMetadata != null && message.hasOwnProperty("audioMetadata")) {
            var error = $root.SdkAudioMetadataFrame.verify(message.audioMetadata);
            if (error)
                return "audioMetadata." + error;
        }
        if (message.audioStreamIdInfo != null && message.hasOwnProperty("audioStreamIdInfo")) {
            var error = $root.SdkAudioStreamIdInfoFrame.verify(message.audioStreamIdInfo);
            if (error)
                return "audioStreamIdInfo." + error;
        }
        if (message.pingPong != null && message.hasOwnProperty("pingPong")) {
            var error = $root.SdkPingPongFrame.verify(message.pingPong);
            if (error)
                return "pingPong." + error;
        }
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus")) {
            var error = $root.SdkAudioStatusFrame.verify(message.audioStatus);
            if (error)
                return "audioStatus." + error;
        }
        if (message.clientMetric != null && message.hasOwnProperty("clientMetric")) {
            var error = $root.SdkClientMetricFrame.verify(message.clientMetric);
            if (error)
                return "clientMetric." + error;
        }
        if (message.dataMessage != null && message.hasOwnProperty("dataMessage")) {
            var error = $root.SdkDataMessageFrame.verify(message.dataMessage);
            if (error)
                return "dataMessage." + error;
        }
        return null;
    };

    /**
     * Creates a SdkSignalFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkSignalFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkSignalFrame} SdkSignalFrame
     */
    SdkSignalFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkSignalFrame)
            return object;
        var message = new $root.SdkSignalFrame();
        if (object.timestampMs != null)
            if ($util.Long)
                (message.timestampMs = $util.Long.fromValue(object.timestampMs)).unsigned = true;
            else if (typeof object.timestampMs === "string")
                message.timestampMs = parseInt(object.timestampMs, 10);
            else if (typeof object.timestampMs === "number")
                message.timestampMs = object.timestampMs;
            else if (typeof object.timestampMs === "object")
                message.timestampMs = new $util.LongBits(object.timestampMs.low >>> 0, object.timestampMs.high >>> 0).toNumber(true);
        switch (object.type) {
        case "JOIN":
        case 1:
            message.type = 1;
            break;
        case "JOIN_ACK":
        case 2:
            message.type = 2;
            break;
        case "SUBSCRIBE":
        case 3:
            message.type = 3;
            break;
        case "SUBSCRIBE_ACK":
        case 4:
            message.type = 4;
            break;
        case "INDEX":
        case 5:
            message.type = 5;
            break;
        case "PAUSE":
        case 7:
            message.type = 7;
            break;
        case "RESUME":
        case 8:
            message.type = 8;
            break;
        case "LEAVE":
        case 9:
            message.type = 9;
            break;
        case "LEAVE_ACK":
        case 10:
            message.type = 10;
            break;
        case "BITRATES":
        case 13:
            message.type = 13;
            break;
        case "AUDIO_CONTROL":
        case 16:
            message.type = 16;
            break;
        case "AUDIO_METADATA":
        case 17:
            message.type = 17;
            break;
        case "AUDIO_STREAM_ID_INFO":
        case 18:
            message.type = 18;
            break;
        case "PING_PONG":
        case 19:
            message.type = 19;
            break;
        case "AUDIO_STATUS":
        case 20:
            message.type = 20;
            break;
        case "CLIENT_METRIC":
        case 21:
            message.type = 21;
            break;
        case "DATA_MESSAGE":
        case 22:
            message.type = 22;
            break;
        }
        if (object.error != null) {
            if (typeof object.error !== "object")
                throw TypeError(".SdkSignalFrame.error: object expected");
            message.error = $root.SdkErrorFrame.fromObject(object.error);
        }
        if (object.join != null) {
            if (typeof object.join !== "object")
                throw TypeError(".SdkSignalFrame.join: object expected");
            message.join = $root.SdkJoinFrame.fromObject(object.join);
        }
        if (object.joinack != null) {
            if (typeof object.joinack !== "object")
                throw TypeError(".SdkSignalFrame.joinack: object expected");
            message.joinack = $root.SdkJoinAckFrame.fromObject(object.joinack);
        }
        if (object.sub != null) {
            if (typeof object.sub !== "object")
                throw TypeError(".SdkSignalFrame.sub: object expected");
            message.sub = $root.SdkSubscribeFrame.fromObject(object.sub);
        }
        if (object.suback != null) {
            if (typeof object.suback !== "object")
                throw TypeError(".SdkSignalFrame.suback: object expected");
            message.suback = $root.SdkSubscribeAckFrame.fromObject(object.suback);
        }
        if (object.index != null) {
            if (typeof object.index !== "object")
                throw TypeError(".SdkSignalFrame.index: object expected");
            message.index = $root.SdkIndexFrame.fromObject(object.index);
        }
        if (object.pause != null) {
            if (typeof object.pause !== "object")
                throw TypeError(".SdkSignalFrame.pause: object expected");
            message.pause = $root.SdkPauseResumeFrame.fromObject(object.pause);
        }
        if (object.leave != null) {
            if (typeof object.leave !== "object")
                throw TypeError(".SdkSignalFrame.leave: object expected");
            message.leave = $root.SdkLeaveFrame.fromObject(object.leave);
        }
        if (object.leaveAck != null) {
            if (typeof object.leaveAck !== "object")
                throw TypeError(".SdkSignalFrame.leaveAck: object expected");
            message.leaveAck = $root.SdkLeaveAckFrame.fromObject(object.leaveAck);
        }
        if (object.bitrates != null) {
            if (typeof object.bitrates !== "object")
                throw TypeError(".SdkSignalFrame.bitrates: object expected");
            message.bitrates = $root.SdkBitrateFrame.fromObject(object.bitrates);
        }
        if (object.audioControl != null) {
            if (typeof object.audioControl !== "object")
                throw TypeError(".SdkSignalFrame.audioControl: object expected");
            message.audioControl = $root.SdkAudioControlFrame.fromObject(object.audioControl);
        }
        if (object.audioMetadata != null) {
            if (typeof object.audioMetadata !== "object")
                throw TypeError(".SdkSignalFrame.audioMetadata: object expected");
            message.audioMetadata = $root.SdkAudioMetadataFrame.fromObject(object.audioMetadata);
        }
        if (object.audioStreamIdInfo != null) {
            if (typeof object.audioStreamIdInfo !== "object")
                throw TypeError(".SdkSignalFrame.audioStreamIdInfo: object expected");
            message.audioStreamIdInfo = $root.SdkAudioStreamIdInfoFrame.fromObject(object.audioStreamIdInfo);
        }
        if (object.pingPong != null) {
            if (typeof object.pingPong !== "object")
                throw TypeError(".SdkSignalFrame.pingPong: object expected");
            message.pingPong = $root.SdkPingPongFrame.fromObject(object.pingPong);
        }
        if (object.audioStatus != null) {
            if (typeof object.audioStatus !== "object")
                throw TypeError(".SdkSignalFrame.audioStatus: object expected");
            message.audioStatus = $root.SdkAudioStatusFrame.fromObject(object.audioStatus);
        }
        if (object.clientMetric != null) {
            if (typeof object.clientMetric !== "object")
                throw TypeError(".SdkSignalFrame.clientMetric: object expected");
            message.clientMetric = $root.SdkClientMetricFrame.fromObject(object.clientMetric);
        }
        if (object.dataMessage != null) {
            if (typeof object.dataMessage !== "object")
                throw TypeError(".SdkSignalFrame.dataMessage: object expected");
            message.dataMessage = $root.SdkDataMessageFrame.fromObject(object.dataMessage);
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkSignalFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkSignalFrame
     * @static
     * @param {SdkSignalFrame} message SdkSignalFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkSignalFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.timestampMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.timestampMs = options.longs === String ? "0" : 0;
            object.type = options.enums === String ? "JOIN" : 1;
            object.error = null;
            object.join = null;
            object.joinack = null;
            object.sub = null;
            object.suback = null;
            object.index = null;
            object.pause = null;
            object.leave = null;
            object.leaveAck = null;
            object.bitrates = null;
            object.audioControl = null;
            object.audioMetadata = null;
            object.audioStreamIdInfo = null;
            object.pingPong = null;
            object.audioStatus = null;
            object.clientMetric = null;
            object.dataMessage = null;
        }
        if (message.timestampMs != null && message.hasOwnProperty("timestampMs"))
            if (typeof message.timestampMs === "number")
                object.timestampMs = options.longs === String ? String(message.timestampMs) : message.timestampMs;
            else
                object.timestampMs = options.longs === String ? $util.Long.prototype.toString.call(message.timestampMs) : options.longs === Number ? new $util.LongBits(message.timestampMs.low >>> 0, message.timestampMs.high >>> 0).toNumber(true) : message.timestampMs;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.SdkSignalFrame.Type[message.type] : message.type;
        if (message.error != null && message.hasOwnProperty("error"))
            object.error = $root.SdkErrorFrame.toObject(message.error, options);
        if (message.join != null && message.hasOwnProperty("join"))
            object.join = $root.SdkJoinFrame.toObject(message.join, options);
        if (message.joinack != null && message.hasOwnProperty("joinack"))
            object.joinack = $root.SdkJoinAckFrame.toObject(message.joinack, options);
        if (message.sub != null && message.hasOwnProperty("sub"))
            object.sub = $root.SdkSubscribeFrame.toObject(message.sub, options);
        if (message.suback != null && message.hasOwnProperty("suback"))
            object.suback = $root.SdkSubscribeAckFrame.toObject(message.suback, options);
        if (message.index != null && message.hasOwnProperty("index"))
            object.index = $root.SdkIndexFrame.toObject(message.index, options);
        if (message.pause != null && message.hasOwnProperty("pause"))
            object.pause = $root.SdkPauseResumeFrame.toObject(message.pause, options);
        if (message.leave != null && message.hasOwnProperty("leave"))
            object.leave = $root.SdkLeaveFrame.toObject(message.leave, options);
        if (message.leaveAck != null && message.hasOwnProperty("leaveAck"))
            object.leaveAck = $root.SdkLeaveAckFrame.toObject(message.leaveAck, options);
        if (message.bitrates != null && message.hasOwnProperty("bitrates"))
            object.bitrates = $root.SdkBitrateFrame.toObject(message.bitrates, options);
        if (message.audioControl != null && message.hasOwnProperty("audioControl"))
            object.audioControl = $root.SdkAudioControlFrame.toObject(message.audioControl, options);
        if (message.audioMetadata != null && message.hasOwnProperty("audioMetadata"))
            object.audioMetadata = $root.SdkAudioMetadataFrame.toObject(message.audioMetadata, options);
        if (message.audioStreamIdInfo != null && message.hasOwnProperty("audioStreamIdInfo"))
            object.audioStreamIdInfo = $root.SdkAudioStreamIdInfoFrame.toObject(message.audioStreamIdInfo, options);
        if (message.pingPong != null && message.hasOwnProperty("pingPong"))
            object.pingPong = $root.SdkPingPongFrame.toObject(message.pingPong, options);
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus"))
            object.audioStatus = $root.SdkAudioStatusFrame.toObject(message.audioStatus, options);
        if (message.clientMetric != null && message.hasOwnProperty("clientMetric"))
            object.clientMetric = $root.SdkClientMetricFrame.toObject(message.clientMetric, options);
        if (message.dataMessage != null && message.hasOwnProperty("dataMessage"))
            object.dataMessage = $root.SdkDataMessageFrame.toObject(message.dataMessage, options);
        return object;
    };

    /**
     * Converts this SdkSignalFrame to JSON.
     * @function toJSON
     * @memberof SdkSignalFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkSignalFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Type enum.
     * @name SdkSignalFrame.Type
     * @enum {string}
     * @property {number} JOIN=1 JOIN value
     * @property {number} JOIN_ACK=2 JOIN_ACK value
     * @property {number} SUBSCRIBE=3 SUBSCRIBE value
     * @property {number} SUBSCRIBE_ACK=4 SUBSCRIBE_ACK value
     * @property {number} INDEX=5 INDEX value
     * @property {number} PAUSE=7 PAUSE value
     * @property {number} RESUME=8 RESUME value
     * @property {number} LEAVE=9 LEAVE value
     * @property {number} LEAVE_ACK=10 LEAVE_ACK value
     * @property {number} BITRATES=13 BITRATES value
     * @property {number} AUDIO_CONTROL=16 AUDIO_CONTROL value
     * @property {number} AUDIO_METADATA=17 AUDIO_METADATA value
     * @property {number} AUDIO_STREAM_ID_INFO=18 AUDIO_STREAM_ID_INFO value
     * @property {number} PING_PONG=19 PING_PONG value
     * @property {number} AUDIO_STATUS=20 AUDIO_STATUS value
     * @property {number} CLIENT_METRIC=21 CLIENT_METRIC value
     * @property {number} DATA_MESSAGE=22 DATA_MESSAGE value
     */
    SdkSignalFrame.Type = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[1] = "JOIN"] = 1;
        values[valuesById[2] = "JOIN_ACK"] = 2;
        values[valuesById[3] = "SUBSCRIBE"] = 3;
        values[valuesById[4] = "SUBSCRIBE_ACK"] = 4;
        values[valuesById[5] = "INDEX"] = 5;
        values[valuesById[7] = "PAUSE"] = 7;
        values[valuesById[8] = "RESUME"] = 8;
        values[valuesById[9] = "LEAVE"] = 9;
        values[valuesById[10] = "LEAVE_ACK"] = 10;
        values[valuesById[13] = "BITRATES"] = 13;
        values[valuesById[16] = "AUDIO_CONTROL"] = 16;
        values[valuesById[17] = "AUDIO_METADATA"] = 17;
        values[valuesById[18] = "AUDIO_STREAM_ID_INFO"] = 18;
        values[valuesById[19] = "PING_PONG"] = 19;
        values[valuesById[20] = "AUDIO_STATUS"] = 20;
        values[valuesById[21] = "CLIENT_METRIC"] = 21;
        values[valuesById[22] = "DATA_MESSAGE"] = 22;
        return values;
    })();

    return SdkSignalFrame;
})();

$root.SdkErrorFrame = (function() {

    /**
     * Properties of a SdkErrorFrame.
     * @exports ISdkErrorFrame
     * @interface ISdkErrorFrame
     * @property {number|null} [status] SdkErrorFrame status
     * @property {string|null} [description] SdkErrorFrame description
     */

    /**
     * Constructs a new SdkErrorFrame.
     * @exports SdkErrorFrame
     * @classdesc Represents a SdkErrorFrame.
     * @implements ISdkErrorFrame
     * @constructor
     * @param {ISdkErrorFrame=} [properties] Properties to set
     */
    function SdkErrorFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkErrorFrame status.
     * @member {number} status
     * @memberof SdkErrorFrame
     * @instance
     */
    SdkErrorFrame.prototype.status = 0;

    /**
     * SdkErrorFrame description.
     * @member {string} description
     * @memberof SdkErrorFrame
     * @instance
     */
    SdkErrorFrame.prototype.description = "";

    /**
     * Creates a new SdkErrorFrame instance using the specified properties.
     * @function create
     * @memberof SdkErrorFrame
     * @static
     * @param {ISdkErrorFrame=} [properties] Properties to set
     * @returns {SdkErrorFrame} SdkErrorFrame instance
     */
    SdkErrorFrame.create = function create(properties) {
        return new SdkErrorFrame(properties);
    };

    /**
     * Encodes the specified SdkErrorFrame message. Does not implicitly {@link SdkErrorFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkErrorFrame
     * @static
     * @param {ISdkErrorFrame} message SdkErrorFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkErrorFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.status != null && message.hasOwnProperty("status"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.status);
        if (message.description != null && message.hasOwnProperty("description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        return writer;
    };

    /**
     * Encodes the specified SdkErrorFrame message, length delimited. Does not implicitly {@link SdkErrorFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkErrorFrame
     * @static
     * @param {ISdkErrorFrame} message SdkErrorFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkErrorFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkErrorFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkErrorFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkErrorFrame} SdkErrorFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkErrorFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkErrorFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.status = reader.uint32();
                break;
            case 2:
                message.description = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkErrorFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkErrorFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkErrorFrame} SdkErrorFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkErrorFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkErrorFrame message.
     * @function verify
     * @memberof SdkErrorFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkErrorFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isInteger(message.status))
                return "status: integer expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        return null;
    };

    /**
     * Creates a SdkErrorFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkErrorFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkErrorFrame} SdkErrorFrame
     */
    SdkErrorFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkErrorFrame)
            return object;
        var message = new $root.SdkErrorFrame();
        if (object.status != null)
            message.status = object.status >>> 0;
        if (object.description != null)
            message.description = String(object.description);
        return message;
    };

    /**
     * Creates a plain object from a SdkErrorFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkErrorFrame
     * @static
     * @param {SdkErrorFrame} message SdkErrorFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkErrorFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.status = 0;
            object.description = "";
        }
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = message.status;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        return object;
    };

    /**
     * Converts this SdkErrorFrame to JSON.
     * @function toJSON
     * @memberof SdkErrorFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkErrorFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkErrorFrame;
})();

/**
 * SdkJoinFlags enum.
 * @exports SdkJoinFlags
 * @enum {string}
 * @property {number} SEND_BITRATES=1 SEND_BITRATES value
 * @property {number} HAS_STREAM_UPDATE=2 HAS_STREAM_UPDATE value
 * @property {number} USE_SEND_SIDE_BWE=8 USE_SEND_SIDE_BWE value
 */
$root.SdkJoinFlags = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[1] = "SEND_BITRATES"] = 1;
    values[valuesById[2] = "HAS_STREAM_UPDATE"] = 2;
    values[valuesById[8] = "USE_SEND_SIDE_BWE"] = 8;
    return values;
})();

$root.SdkClientDetails = (function() {

    /**
     * Properties of a SdkClientDetails.
     * @exports ISdkClientDetails
     * @interface ISdkClientDetails
     * @property {string|null} [appVersionName] SdkClientDetails appVersionName
     * @property {string|null} [appVersionCode] SdkClientDetails appVersionCode
     * @property {string|null} [deviceModel] SdkClientDetails deviceModel
     * @property {string|null} [deviceMake] SdkClientDetails deviceMake
     * @property {string|null} [platformName] SdkClientDetails platformName
     * @property {string|null} [platformVersion] SdkClientDetails platformVersion
     * @property {string|null} [clientSource] SdkClientDetails clientSource
     * @property {string|null} [chimeSdkVersion] SdkClientDetails chimeSdkVersion
     */

    /**
     * Constructs a new SdkClientDetails.
     * @exports SdkClientDetails
     * @classdesc Represents a SdkClientDetails.
     * @implements ISdkClientDetails
     * @constructor
     * @param {ISdkClientDetails=} [properties] Properties to set
     */
    function SdkClientDetails(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkClientDetails appVersionName.
     * @member {string} appVersionName
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.appVersionName = "";

    /**
     * SdkClientDetails appVersionCode.
     * @member {string} appVersionCode
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.appVersionCode = "";

    /**
     * SdkClientDetails deviceModel.
     * @member {string} deviceModel
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.deviceModel = "";

    /**
     * SdkClientDetails deviceMake.
     * @member {string} deviceMake
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.deviceMake = "";

    /**
     * SdkClientDetails platformName.
     * @member {string} platformName
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.platformName = "";

    /**
     * SdkClientDetails platformVersion.
     * @member {string} platformVersion
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.platformVersion = "";

    /**
     * SdkClientDetails clientSource.
     * @member {string} clientSource
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.clientSource = "";

    /**
     * SdkClientDetails chimeSdkVersion.
     * @member {string} chimeSdkVersion
     * @memberof SdkClientDetails
     * @instance
     */
    SdkClientDetails.prototype.chimeSdkVersion = "";

    /**
     * Creates a new SdkClientDetails instance using the specified properties.
     * @function create
     * @memberof SdkClientDetails
     * @static
     * @param {ISdkClientDetails=} [properties] Properties to set
     * @returns {SdkClientDetails} SdkClientDetails instance
     */
    SdkClientDetails.create = function create(properties) {
        return new SdkClientDetails(properties);
    };

    /**
     * Encodes the specified SdkClientDetails message. Does not implicitly {@link SdkClientDetails.verify|verify} messages.
     * @function encode
     * @memberof SdkClientDetails
     * @static
     * @param {ISdkClientDetails} message SdkClientDetails message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkClientDetails.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appVersionName != null && message.hasOwnProperty("appVersionName"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.appVersionName);
        if (message.appVersionCode != null && message.hasOwnProperty("appVersionCode"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.appVersionCode);
        if (message.deviceModel != null && message.hasOwnProperty("deviceModel"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.deviceModel);
        if (message.deviceMake != null && message.hasOwnProperty("deviceMake"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.deviceMake);
        if (message.platformName != null && message.hasOwnProperty("platformName"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.platformName);
        if (message.platformVersion != null && message.hasOwnProperty("platformVersion"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.platformVersion);
        if (message.clientSource != null && message.hasOwnProperty("clientSource"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.clientSource);
        if (message.chimeSdkVersion != null && message.hasOwnProperty("chimeSdkVersion"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.chimeSdkVersion);
        return writer;
    };

    /**
     * Encodes the specified SdkClientDetails message, length delimited. Does not implicitly {@link SdkClientDetails.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkClientDetails
     * @static
     * @param {ISdkClientDetails} message SdkClientDetails message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkClientDetails.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkClientDetails message from the specified reader or buffer.
     * @function decode
     * @memberof SdkClientDetails
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkClientDetails} SdkClientDetails
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkClientDetails.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkClientDetails();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.appVersionName = reader.string();
                break;
            case 2:
                message.appVersionCode = reader.string();
                break;
            case 3:
                message.deviceModel = reader.string();
                break;
            case 4:
                message.deviceMake = reader.string();
                break;
            case 5:
                message.platformName = reader.string();
                break;
            case 6:
                message.platformVersion = reader.string();
                break;
            case 7:
                message.clientSource = reader.string();
                break;
            case 8:
                message.chimeSdkVersion = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkClientDetails message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkClientDetails
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkClientDetails} SdkClientDetails
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkClientDetails.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkClientDetails message.
     * @function verify
     * @memberof SdkClientDetails
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkClientDetails.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appVersionName != null && message.hasOwnProperty("appVersionName"))
            if (!$util.isString(message.appVersionName))
                return "appVersionName: string expected";
        if (message.appVersionCode != null && message.hasOwnProperty("appVersionCode"))
            if (!$util.isString(message.appVersionCode))
                return "appVersionCode: string expected";
        if (message.deviceModel != null && message.hasOwnProperty("deviceModel"))
            if (!$util.isString(message.deviceModel))
                return "deviceModel: string expected";
        if (message.deviceMake != null && message.hasOwnProperty("deviceMake"))
            if (!$util.isString(message.deviceMake))
                return "deviceMake: string expected";
        if (message.platformName != null && message.hasOwnProperty("platformName"))
            if (!$util.isString(message.platformName))
                return "platformName: string expected";
        if (message.platformVersion != null && message.hasOwnProperty("platformVersion"))
            if (!$util.isString(message.platformVersion))
                return "platformVersion: string expected";
        if (message.clientSource != null && message.hasOwnProperty("clientSource"))
            if (!$util.isString(message.clientSource))
                return "clientSource: string expected";
        if (message.chimeSdkVersion != null && message.hasOwnProperty("chimeSdkVersion"))
            if (!$util.isString(message.chimeSdkVersion))
                return "chimeSdkVersion: string expected";
        return null;
    };

    /**
     * Creates a SdkClientDetails message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkClientDetails
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkClientDetails} SdkClientDetails
     */
    SdkClientDetails.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkClientDetails)
            return object;
        var message = new $root.SdkClientDetails();
        if (object.appVersionName != null)
            message.appVersionName = String(object.appVersionName);
        if (object.appVersionCode != null)
            message.appVersionCode = String(object.appVersionCode);
        if (object.deviceModel != null)
            message.deviceModel = String(object.deviceModel);
        if (object.deviceMake != null)
            message.deviceMake = String(object.deviceMake);
        if (object.platformName != null)
            message.platformName = String(object.platformName);
        if (object.platformVersion != null)
            message.platformVersion = String(object.platformVersion);
        if (object.clientSource != null)
            message.clientSource = String(object.clientSource);
        if (object.chimeSdkVersion != null)
            message.chimeSdkVersion = String(object.chimeSdkVersion);
        return message;
    };

    /**
     * Creates a plain object from a SdkClientDetails message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkClientDetails
     * @static
     * @param {SdkClientDetails} message SdkClientDetails
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkClientDetails.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.appVersionName = "";
            object.appVersionCode = "";
            object.deviceModel = "";
            object.deviceMake = "";
            object.platformName = "";
            object.platformVersion = "";
            object.clientSource = "";
            object.chimeSdkVersion = "";
        }
        if (message.appVersionName != null && message.hasOwnProperty("appVersionName"))
            object.appVersionName = message.appVersionName;
        if (message.appVersionCode != null && message.hasOwnProperty("appVersionCode"))
            object.appVersionCode = message.appVersionCode;
        if (message.deviceModel != null && message.hasOwnProperty("deviceModel"))
            object.deviceModel = message.deviceModel;
        if (message.deviceMake != null && message.hasOwnProperty("deviceMake"))
            object.deviceMake = message.deviceMake;
        if (message.platformName != null && message.hasOwnProperty("platformName"))
            object.platformName = message.platformName;
        if (message.platformVersion != null && message.hasOwnProperty("platformVersion"))
            object.platformVersion = message.platformVersion;
        if (message.clientSource != null && message.hasOwnProperty("clientSource"))
            object.clientSource = message.clientSource;
        if (message.chimeSdkVersion != null && message.hasOwnProperty("chimeSdkVersion"))
            object.chimeSdkVersion = message.chimeSdkVersion;
        return object;
    };

    /**
     * Converts this SdkClientDetails to JSON.
     * @function toJSON
     * @memberof SdkClientDetails
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkClientDetails.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkClientDetails;
})();

$root.SdkJoinFrame = (function() {

    /**
     * Properties of a SdkJoinFrame.
     * @exports ISdkJoinFrame
     * @interface ISdkJoinFrame
     * @property {number|null} [protocolVersion] SdkJoinFrame protocolVersion
     * @property {number|null} [maxNumOfVideos] SdkJoinFrame maxNumOfVideos
     * @property {number|null} [flags] SdkJoinFrame flags
     * @property {ISdkClientDetails|null} [clientDetails] SdkJoinFrame clientDetails
     * @property {number|Long|null} [audioSessionId] SdkJoinFrame audioSessionId
     */

    /**
     * Constructs a new SdkJoinFrame.
     * @exports SdkJoinFrame
     * @classdesc Represents a SdkJoinFrame.
     * @implements ISdkJoinFrame
     * @constructor
     * @param {ISdkJoinFrame=} [properties] Properties to set
     */
    function SdkJoinFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkJoinFrame protocolVersion.
     * @member {number} protocolVersion
     * @memberof SdkJoinFrame
     * @instance
     */
    SdkJoinFrame.prototype.protocolVersion = 2;

    /**
     * SdkJoinFrame maxNumOfVideos.
     * @member {number} maxNumOfVideos
     * @memberof SdkJoinFrame
     * @instance
     */
    SdkJoinFrame.prototype.maxNumOfVideos = 8;

    /**
     * SdkJoinFrame flags.
     * @member {number} flags
     * @memberof SdkJoinFrame
     * @instance
     */
    SdkJoinFrame.prototype.flags = 0;

    /**
     * SdkJoinFrame clientDetails.
     * @member {ISdkClientDetails|null|undefined} clientDetails
     * @memberof SdkJoinFrame
     * @instance
     */
    SdkJoinFrame.prototype.clientDetails = null;

    /**
     * SdkJoinFrame audioSessionId.
     * @member {number|Long} audioSessionId
     * @memberof SdkJoinFrame
     * @instance
     */
    SdkJoinFrame.prototype.audioSessionId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Creates a new SdkJoinFrame instance using the specified properties.
     * @function create
     * @memberof SdkJoinFrame
     * @static
     * @param {ISdkJoinFrame=} [properties] Properties to set
     * @returns {SdkJoinFrame} SdkJoinFrame instance
     */
    SdkJoinFrame.create = function create(properties) {
        return new SdkJoinFrame(properties);
    };

    /**
     * Encodes the specified SdkJoinFrame message. Does not implicitly {@link SdkJoinFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkJoinFrame
     * @static
     * @param {ISdkJoinFrame} message SdkJoinFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkJoinFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.protocolVersion != null && message.hasOwnProperty("protocolVersion"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.protocolVersion);
        if (message.maxNumOfVideos != null && message.hasOwnProperty("maxNumOfVideos"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.maxNumOfVideos);
        if (message.flags != null && message.hasOwnProperty("flags"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.flags);
        if (message.clientDetails != null && message.hasOwnProperty("clientDetails"))
            $root.SdkClientDetails.encode(message.clientDetails, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.audioSessionId != null && message.hasOwnProperty("audioSessionId"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint64(message.audioSessionId);
        return writer;
    };

    /**
     * Encodes the specified SdkJoinFrame message, length delimited. Does not implicitly {@link SdkJoinFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkJoinFrame
     * @static
     * @param {ISdkJoinFrame} message SdkJoinFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkJoinFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkJoinFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkJoinFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkJoinFrame} SdkJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkJoinFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkJoinFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.protocolVersion = reader.uint32();
                break;
            case 2:
                message.maxNumOfVideos = reader.uint32();
                break;
            case 3:
                message.flags = reader.uint32();
                break;
            case 4:
                message.clientDetails = $root.SdkClientDetails.decode(reader, reader.uint32());
                break;
            case 6:
                message.audioSessionId = reader.uint64();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkJoinFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkJoinFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkJoinFrame} SdkJoinFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkJoinFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkJoinFrame message.
     * @function verify
     * @memberof SdkJoinFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkJoinFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.protocolVersion != null && message.hasOwnProperty("protocolVersion"))
            if (!$util.isInteger(message.protocolVersion))
                return "protocolVersion: integer expected";
        if (message.maxNumOfVideos != null && message.hasOwnProperty("maxNumOfVideos"))
            if (!$util.isInteger(message.maxNumOfVideos))
                return "maxNumOfVideos: integer expected";
        if (message.flags != null && message.hasOwnProperty("flags"))
            if (!$util.isInteger(message.flags))
                return "flags: integer expected";
        if (message.clientDetails != null && message.hasOwnProperty("clientDetails")) {
            var error = $root.SdkClientDetails.verify(message.clientDetails);
            if (error)
                return "clientDetails." + error;
        }
        if (message.audioSessionId != null && message.hasOwnProperty("audioSessionId"))
            if (!$util.isInteger(message.audioSessionId) && !(message.audioSessionId && $util.isInteger(message.audioSessionId.low) && $util.isInteger(message.audioSessionId.high)))
                return "audioSessionId: integer|Long expected";
        return null;
    };

    /**
     * Creates a SdkJoinFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkJoinFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkJoinFrame} SdkJoinFrame
     */
    SdkJoinFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkJoinFrame)
            return object;
        var message = new $root.SdkJoinFrame();
        if (object.protocolVersion != null)
            message.protocolVersion = object.protocolVersion >>> 0;
        if (object.maxNumOfVideos != null)
            message.maxNumOfVideos = object.maxNumOfVideos >>> 0;
        if (object.flags != null)
            message.flags = object.flags >>> 0;
        if (object.clientDetails != null) {
            if (typeof object.clientDetails !== "object")
                throw TypeError(".SdkJoinFrame.clientDetails: object expected");
            message.clientDetails = $root.SdkClientDetails.fromObject(object.clientDetails);
        }
        if (object.audioSessionId != null)
            if ($util.Long)
                (message.audioSessionId = $util.Long.fromValue(object.audioSessionId)).unsigned = true;
            else if (typeof object.audioSessionId === "string")
                message.audioSessionId = parseInt(object.audioSessionId, 10);
            else if (typeof object.audioSessionId === "number")
                message.audioSessionId = object.audioSessionId;
            else if (typeof object.audioSessionId === "object")
                message.audioSessionId = new $util.LongBits(object.audioSessionId.low >>> 0, object.audioSessionId.high >>> 0).toNumber(true);
        return message;
    };

    /**
     * Creates a plain object from a SdkJoinFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkJoinFrame
     * @static
     * @param {SdkJoinFrame} message SdkJoinFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkJoinFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.protocolVersion = 2;
            object.maxNumOfVideos = 8;
            object.flags = 0;
            object.clientDetails = null;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.audioSessionId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.audioSessionId = options.longs === String ? "0" : 0;
        }
        if (message.protocolVersion != null && message.hasOwnProperty("protocolVersion"))
            object.protocolVersion = message.protocolVersion;
        if (message.maxNumOfVideos != null && message.hasOwnProperty("maxNumOfVideos"))
            object.maxNumOfVideos = message.maxNumOfVideos;
        if (message.flags != null && message.hasOwnProperty("flags"))
            object.flags = message.flags;
        if (message.clientDetails != null && message.hasOwnProperty("clientDetails"))
            object.clientDetails = $root.SdkClientDetails.toObject(message.clientDetails, options);
        if (message.audioSessionId != null && message.hasOwnProperty("audioSessionId"))
            if (typeof message.audioSessionId === "number")
                object.audioSessionId = options.longs === String ? String(message.audioSessionId) : message.audioSessionId;
            else
                object.audioSessionId = options.longs === String ? $util.Long.prototype.toString.call(message.audioSessionId) : options.longs === Number ? new $util.LongBits(message.audioSessionId.low >>> 0, message.audioSessionId.high >>> 0).toNumber(true) : message.audioSessionId;
        return object;
    };

    /**
     * Converts this SdkJoinFrame to JSON.
     * @function toJSON
     * @memberof SdkJoinFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkJoinFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkJoinFrame;
})();

$root.SdkJoinAckFrame = (function() {

    /**
     * Properties of a SdkJoinAckFrame.
     * @exports ISdkJoinAckFrame
     * @interface ISdkJoinAckFrame
     * @property {ISdkTurnCredentials|null} [turnCredentials] SdkJoinAckFrame turnCredentials
     */

    /**
     * Constructs a new SdkJoinAckFrame.
     * @exports SdkJoinAckFrame
     * @classdesc Represents a SdkJoinAckFrame.
     * @implements ISdkJoinAckFrame
     * @constructor
     * @param {ISdkJoinAckFrame=} [properties] Properties to set
     */
    function SdkJoinAckFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkJoinAckFrame turnCredentials.
     * @member {ISdkTurnCredentials|null|undefined} turnCredentials
     * @memberof SdkJoinAckFrame
     * @instance
     */
    SdkJoinAckFrame.prototype.turnCredentials = null;

    /**
     * Creates a new SdkJoinAckFrame instance using the specified properties.
     * @function create
     * @memberof SdkJoinAckFrame
     * @static
     * @param {ISdkJoinAckFrame=} [properties] Properties to set
     * @returns {SdkJoinAckFrame} SdkJoinAckFrame instance
     */
    SdkJoinAckFrame.create = function create(properties) {
        return new SdkJoinAckFrame(properties);
    };

    /**
     * Encodes the specified SdkJoinAckFrame message. Does not implicitly {@link SdkJoinAckFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkJoinAckFrame
     * @static
     * @param {ISdkJoinAckFrame} message SdkJoinAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkJoinAckFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.turnCredentials != null && message.hasOwnProperty("turnCredentials"))
            $root.SdkTurnCredentials.encode(message.turnCredentials, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkJoinAckFrame message, length delimited. Does not implicitly {@link SdkJoinAckFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkJoinAckFrame
     * @static
     * @param {ISdkJoinAckFrame} message SdkJoinAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkJoinAckFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkJoinAckFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkJoinAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkJoinAckFrame} SdkJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkJoinAckFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkJoinAckFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.turnCredentials = $root.SdkTurnCredentials.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkJoinAckFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkJoinAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkJoinAckFrame} SdkJoinAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkJoinAckFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkJoinAckFrame message.
     * @function verify
     * @memberof SdkJoinAckFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkJoinAckFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.turnCredentials != null && message.hasOwnProperty("turnCredentials")) {
            var error = $root.SdkTurnCredentials.verify(message.turnCredentials);
            if (error)
                return "turnCredentials." + error;
        }
        return null;
    };

    /**
     * Creates a SdkJoinAckFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkJoinAckFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkJoinAckFrame} SdkJoinAckFrame
     */
    SdkJoinAckFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkJoinAckFrame)
            return object;
        var message = new $root.SdkJoinAckFrame();
        if (object.turnCredentials != null) {
            if (typeof object.turnCredentials !== "object")
                throw TypeError(".SdkJoinAckFrame.turnCredentials: object expected");
            message.turnCredentials = $root.SdkTurnCredentials.fromObject(object.turnCredentials);
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkJoinAckFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkJoinAckFrame
     * @static
     * @param {SdkJoinAckFrame} message SdkJoinAckFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkJoinAckFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.turnCredentials = null;
        if (message.turnCredentials != null && message.hasOwnProperty("turnCredentials"))
            object.turnCredentials = $root.SdkTurnCredentials.toObject(message.turnCredentials, options);
        return object;
    };

    /**
     * Converts this SdkJoinAckFrame to JSON.
     * @function toJSON
     * @memberof SdkJoinAckFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkJoinAckFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkJoinAckFrame;
})();

$root.SdkLeaveFrame = (function() {

    /**
     * Properties of a SdkLeaveFrame.
     * @exports ISdkLeaveFrame
     * @interface ISdkLeaveFrame
     */

    /**
     * Constructs a new SdkLeaveFrame.
     * @exports SdkLeaveFrame
     * @classdesc Represents a SdkLeaveFrame.
     * @implements ISdkLeaveFrame
     * @constructor
     * @param {ISdkLeaveFrame=} [properties] Properties to set
     */
    function SdkLeaveFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Creates a new SdkLeaveFrame instance using the specified properties.
     * @function create
     * @memberof SdkLeaveFrame
     * @static
     * @param {ISdkLeaveFrame=} [properties] Properties to set
     * @returns {SdkLeaveFrame} SdkLeaveFrame instance
     */
    SdkLeaveFrame.create = function create(properties) {
        return new SdkLeaveFrame(properties);
    };

    /**
     * Encodes the specified SdkLeaveFrame message. Does not implicitly {@link SdkLeaveFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkLeaveFrame
     * @static
     * @param {ISdkLeaveFrame} message SdkLeaveFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkLeaveFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        return writer;
    };

    /**
     * Encodes the specified SdkLeaveFrame message, length delimited. Does not implicitly {@link SdkLeaveFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkLeaveFrame
     * @static
     * @param {ISdkLeaveFrame} message SdkLeaveFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkLeaveFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkLeaveFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkLeaveFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkLeaveFrame} SdkLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkLeaveFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkLeaveFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkLeaveFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkLeaveFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkLeaveFrame} SdkLeaveFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkLeaveFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkLeaveFrame message.
     * @function verify
     * @memberof SdkLeaveFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkLeaveFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        return null;
    };

    /**
     * Creates a SdkLeaveFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkLeaveFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkLeaveFrame} SdkLeaveFrame
     */
    SdkLeaveFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkLeaveFrame)
            return object;
        return new $root.SdkLeaveFrame();
    };

    /**
     * Creates a plain object from a SdkLeaveFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkLeaveFrame
     * @static
     * @param {SdkLeaveFrame} message SdkLeaveFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkLeaveFrame.toObject = function toObject() {
        return {};
    };

    /**
     * Converts this SdkLeaveFrame to JSON.
     * @function toJSON
     * @memberof SdkLeaveFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkLeaveFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkLeaveFrame;
})();

$root.SdkLeaveAckFrame = (function() {

    /**
     * Properties of a SdkLeaveAckFrame.
     * @exports ISdkLeaveAckFrame
     * @interface ISdkLeaveAckFrame
     */

    /**
     * Constructs a new SdkLeaveAckFrame.
     * @exports SdkLeaveAckFrame
     * @classdesc Represents a SdkLeaveAckFrame.
     * @implements ISdkLeaveAckFrame
     * @constructor
     * @param {ISdkLeaveAckFrame=} [properties] Properties to set
     */
    function SdkLeaveAckFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Creates a new SdkLeaveAckFrame instance using the specified properties.
     * @function create
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {ISdkLeaveAckFrame=} [properties] Properties to set
     * @returns {SdkLeaveAckFrame} SdkLeaveAckFrame instance
     */
    SdkLeaveAckFrame.create = function create(properties) {
        return new SdkLeaveAckFrame(properties);
    };

    /**
     * Encodes the specified SdkLeaveAckFrame message. Does not implicitly {@link SdkLeaveAckFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {ISdkLeaveAckFrame} message SdkLeaveAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkLeaveAckFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        return writer;
    };

    /**
     * Encodes the specified SdkLeaveAckFrame message, length delimited. Does not implicitly {@link SdkLeaveAckFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {ISdkLeaveAckFrame} message SdkLeaveAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkLeaveAckFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkLeaveAckFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkLeaveAckFrame} SdkLeaveAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkLeaveAckFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkLeaveAckFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkLeaveAckFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkLeaveAckFrame} SdkLeaveAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkLeaveAckFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkLeaveAckFrame message.
     * @function verify
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkLeaveAckFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        return null;
    };

    /**
     * Creates a SdkLeaveAckFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkLeaveAckFrame} SdkLeaveAckFrame
     */
    SdkLeaveAckFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkLeaveAckFrame)
            return object;
        return new $root.SdkLeaveAckFrame();
    };

    /**
     * Creates a plain object from a SdkLeaveAckFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkLeaveAckFrame
     * @static
     * @param {SdkLeaveAckFrame} message SdkLeaveAckFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkLeaveAckFrame.toObject = function toObject() {
        return {};
    };

    /**
     * Converts this SdkLeaveAckFrame to JSON.
     * @function toJSON
     * @memberof SdkLeaveAckFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkLeaveAckFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkLeaveAckFrame;
})();

/**
 * SdkStreamServiceType enum.
 * @exports SdkStreamServiceType
 * @enum {string}
 * @property {number} RX=1 RX value
 * @property {number} TX=2 TX value
 * @property {number} DUPLEX=3 DUPLEX value
 */
$root.SdkStreamServiceType = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[1] = "RX"] = 1;
    values[valuesById[2] = "TX"] = 2;
    values[valuesById[3] = "DUPLEX"] = 3;
    return values;
})();

/**
 * SdkStreamMediaType enum.
 * @exports SdkStreamMediaType
 * @enum {string}
 * @property {number} AUDIO=1 AUDIO value
 * @property {number} VIDEO=2 VIDEO value
 */
$root.SdkStreamMediaType = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[1] = "AUDIO"] = 1;
    values[valuesById[2] = "VIDEO"] = 2;
    return values;
})();

$root.SdkSubscribeFrame = (function() {

    /**
     * Properties of a SdkSubscribeFrame.
     * @exports ISdkSubscribeFrame
     * @interface ISdkSubscribeFrame
     * @property {SdkStreamServiceType|null} [duplex] SdkSubscribeFrame duplex
     * @property {Array.<ISdkStreamDescriptor>|null} [sendStreams] SdkSubscribeFrame sendStreams
     * @property {Array.<number>|null} [receiveStreamIds] SdkSubscribeFrame receiveStreamIds
     * @property {string|null} [sdpOffer] SdkSubscribeFrame sdpOffer
     * @property {string|null} [audioHost] SdkSubscribeFrame audioHost
     * @property {boolean|null} [audioCheckin] SdkSubscribeFrame audioCheckin
     * @property {boolean|null} [audioMuted] SdkSubscribeFrame audioMuted
     */

    /**
     * Constructs a new SdkSubscribeFrame.
     * @exports SdkSubscribeFrame
     * @classdesc Represents a SdkSubscribeFrame.
     * @implements ISdkSubscribeFrame
     * @constructor
     * @param {ISdkSubscribeFrame=} [properties] Properties to set
     */
    function SdkSubscribeFrame(properties) {
        this.sendStreams = [];
        this.receiveStreamIds = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkSubscribeFrame duplex.
     * @member {SdkStreamServiceType} duplex
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.duplex = 1;

    /**
     * SdkSubscribeFrame sendStreams.
     * @member {Array.<ISdkStreamDescriptor>} sendStreams
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.sendStreams = $util.emptyArray;

    /**
     * SdkSubscribeFrame receiveStreamIds.
     * @member {Array.<number>} receiveStreamIds
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.receiveStreamIds = $util.emptyArray;

    /**
     * SdkSubscribeFrame sdpOffer.
     * @member {string} sdpOffer
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.sdpOffer = "";

    /**
     * SdkSubscribeFrame audioHost.
     * @member {string} audioHost
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.audioHost = "";

    /**
     * SdkSubscribeFrame audioCheckin.
     * @member {boolean} audioCheckin
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.audioCheckin = false;

    /**
     * SdkSubscribeFrame audioMuted.
     * @member {boolean} audioMuted
     * @memberof SdkSubscribeFrame
     * @instance
     */
    SdkSubscribeFrame.prototype.audioMuted = false;

    /**
     * Creates a new SdkSubscribeFrame instance using the specified properties.
     * @function create
     * @memberof SdkSubscribeFrame
     * @static
     * @param {ISdkSubscribeFrame=} [properties] Properties to set
     * @returns {SdkSubscribeFrame} SdkSubscribeFrame instance
     */
    SdkSubscribeFrame.create = function create(properties) {
        return new SdkSubscribeFrame(properties);
    };

    /**
     * Encodes the specified SdkSubscribeFrame message. Does not implicitly {@link SdkSubscribeFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkSubscribeFrame
     * @static
     * @param {ISdkSubscribeFrame} message SdkSubscribeFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSubscribeFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.duplex);
        if (message.sendStreams != null && message.sendStreams.length)
            for (var i = 0; i < message.sendStreams.length; ++i)
                $root.SdkStreamDescriptor.encode(message.sendStreams[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.receiveStreamIds != null && message.receiveStreamIds.length)
            for (var i = 0; i < message.receiveStreamIds.length; ++i)
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.receiveStreamIds[i]);
        if (message.sdpOffer != null && message.hasOwnProperty("sdpOffer"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.sdpOffer);
        if (message.audioHost != null && message.hasOwnProperty("audioHost"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.audioHost);
        if (message.audioCheckin != null && message.hasOwnProperty("audioCheckin"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.audioCheckin);
        if (message.audioMuted != null && message.hasOwnProperty("audioMuted"))
            writer.uint32(/* id 7, wireType 0 =*/56).bool(message.audioMuted);
        return writer;
    };

    /**
     * Encodes the specified SdkSubscribeFrame message, length delimited. Does not implicitly {@link SdkSubscribeFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkSubscribeFrame
     * @static
     * @param {ISdkSubscribeFrame} message SdkSubscribeFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSubscribeFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkSubscribeFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkSubscribeFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkSubscribeFrame} SdkSubscribeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSubscribeFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkSubscribeFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.duplex = reader.int32();
                break;
            case 2:
                if (!(message.sendStreams && message.sendStreams.length))
                    message.sendStreams = [];
                message.sendStreams.push($root.SdkStreamDescriptor.decode(reader, reader.uint32()));
                break;
            case 3:
                if (!(message.receiveStreamIds && message.receiveStreamIds.length))
                    message.receiveStreamIds = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.receiveStreamIds.push(reader.uint32());
                } else
                    message.receiveStreamIds.push(reader.uint32());
                break;
            case 4:
                message.sdpOffer = reader.string();
                break;
            case 5:
                message.audioHost = reader.string();
                break;
            case 6:
                message.audioCheckin = reader.bool();
                break;
            case 7:
                message.audioMuted = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkSubscribeFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkSubscribeFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkSubscribeFrame} SdkSubscribeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSubscribeFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkSubscribeFrame message.
     * @function verify
     * @memberof SdkSubscribeFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkSubscribeFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            switch (message.duplex) {
            default:
                return "duplex: enum value expected";
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.sendStreams != null && message.hasOwnProperty("sendStreams")) {
            if (!Array.isArray(message.sendStreams))
                return "sendStreams: array expected";
            for (var i = 0; i < message.sendStreams.length; ++i) {
                var error = $root.SdkStreamDescriptor.verify(message.sendStreams[i]);
                if (error)
                    return "sendStreams." + error;
            }
        }
        if (message.receiveStreamIds != null && message.hasOwnProperty("receiveStreamIds")) {
            if (!Array.isArray(message.receiveStreamIds))
                return "receiveStreamIds: array expected";
            for (var i = 0; i < message.receiveStreamIds.length; ++i)
                if (!$util.isInteger(message.receiveStreamIds[i]))
                    return "receiveStreamIds: integer[] expected";
        }
        if (message.sdpOffer != null && message.hasOwnProperty("sdpOffer"))
            if (!$util.isString(message.sdpOffer))
                return "sdpOffer: string expected";
        if (message.audioHost != null && message.hasOwnProperty("audioHost"))
            if (!$util.isString(message.audioHost))
                return "audioHost: string expected";
        if (message.audioCheckin != null && message.hasOwnProperty("audioCheckin"))
            if (typeof message.audioCheckin !== "boolean")
                return "audioCheckin: boolean expected";
        if (message.audioMuted != null && message.hasOwnProperty("audioMuted"))
            if (typeof message.audioMuted !== "boolean")
                return "audioMuted: boolean expected";
        return null;
    };

    /**
     * Creates a SdkSubscribeFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkSubscribeFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkSubscribeFrame} SdkSubscribeFrame
     */
    SdkSubscribeFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkSubscribeFrame)
            return object;
        var message = new $root.SdkSubscribeFrame();
        switch (object.duplex) {
        case "RX":
        case 1:
            message.duplex = 1;
            break;
        case "TX":
        case 2:
            message.duplex = 2;
            break;
        case "DUPLEX":
        case 3:
            message.duplex = 3;
            break;
        }
        if (object.sendStreams) {
            if (!Array.isArray(object.sendStreams))
                throw TypeError(".SdkSubscribeFrame.sendStreams: array expected");
            message.sendStreams = [];
            for (var i = 0; i < object.sendStreams.length; ++i) {
                if (typeof object.sendStreams[i] !== "object")
                    throw TypeError(".SdkSubscribeFrame.sendStreams: object expected");
                message.sendStreams[i] = $root.SdkStreamDescriptor.fromObject(object.sendStreams[i]);
            }
        }
        if (object.receiveStreamIds) {
            if (!Array.isArray(object.receiveStreamIds))
                throw TypeError(".SdkSubscribeFrame.receiveStreamIds: array expected");
            message.receiveStreamIds = [];
            for (var i = 0; i < object.receiveStreamIds.length; ++i)
                message.receiveStreamIds[i] = object.receiveStreamIds[i] >>> 0;
        }
        if (object.sdpOffer != null)
            message.sdpOffer = String(object.sdpOffer);
        if (object.audioHost != null)
            message.audioHost = String(object.audioHost);
        if (object.audioCheckin != null)
            message.audioCheckin = Boolean(object.audioCheckin);
        if (object.audioMuted != null)
            message.audioMuted = Boolean(object.audioMuted);
        return message;
    };

    /**
     * Creates a plain object from a SdkSubscribeFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkSubscribeFrame
     * @static
     * @param {SdkSubscribeFrame} message SdkSubscribeFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkSubscribeFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults) {
            object.sendStreams = [];
            object.receiveStreamIds = [];
        }
        if (options.defaults) {
            object.duplex = options.enums === String ? "RX" : 1;
            object.sdpOffer = "";
            object.audioHost = "";
            object.audioCheckin = false;
            object.audioMuted = false;
        }
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            object.duplex = options.enums === String ? $root.SdkStreamServiceType[message.duplex] : message.duplex;
        if (message.sendStreams && message.sendStreams.length) {
            object.sendStreams = [];
            for (var j = 0; j < message.sendStreams.length; ++j)
                object.sendStreams[j] = $root.SdkStreamDescriptor.toObject(message.sendStreams[j], options);
        }
        if (message.receiveStreamIds && message.receiveStreamIds.length) {
            object.receiveStreamIds = [];
            for (var j = 0; j < message.receiveStreamIds.length; ++j)
                object.receiveStreamIds[j] = message.receiveStreamIds[j];
        }
        if (message.sdpOffer != null && message.hasOwnProperty("sdpOffer"))
            object.sdpOffer = message.sdpOffer;
        if (message.audioHost != null && message.hasOwnProperty("audioHost"))
            object.audioHost = message.audioHost;
        if (message.audioCheckin != null && message.hasOwnProperty("audioCheckin"))
            object.audioCheckin = message.audioCheckin;
        if (message.audioMuted != null && message.hasOwnProperty("audioMuted"))
            object.audioMuted = message.audioMuted;
        return object;
    };

    /**
     * Converts this SdkSubscribeFrame to JSON.
     * @function toJSON
     * @memberof SdkSubscribeFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkSubscribeFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkSubscribeFrame;
})();

$root.SdkSubscribeAckFrame = (function() {

    /**
     * Properties of a SdkSubscribeAckFrame.
     * @exports ISdkSubscribeAckFrame
     * @interface ISdkSubscribeAckFrame
     * @property {SdkStreamServiceType|null} [duplex] SdkSubscribeAckFrame duplex
     * @property {Array.<ISdkStreamAllocation>|null} [allocations] SdkSubscribeAckFrame allocations
     * @property {string|null} [sdpAnswer] SdkSubscribeAckFrame sdpAnswer
     * @property {Array.<ISdkTrackMapping>|null} [tracks] SdkSubscribeAckFrame tracks
     */

    /**
     * Constructs a new SdkSubscribeAckFrame.
     * @exports SdkSubscribeAckFrame
     * @classdesc Represents a SdkSubscribeAckFrame.
     * @implements ISdkSubscribeAckFrame
     * @constructor
     * @param {ISdkSubscribeAckFrame=} [properties] Properties to set
     */
    function SdkSubscribeAckFrame(properties) {
        this.allocations = [];
        this.tracks = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkSubscribeAckFrame duplex.
     * @member {SdkStreamServiceType} duplex
     * @memberof SdkSubscribeAckFrame
     * @instance
     */
    SdkSubscribeAckFrame.prototype.duplex = 1;

    /**
     * SdkSubscribeAckFrame allocations.
     * @member {Array.<ISdkStreamAllocation>} allocations
     * @memberof SdkSubscribeAckFrame
     * @instance
     */
    SdkSubscribeAckFrame.prototype.allocations = $util.emptyArray;

    /**
     * SdkSubscribeAckFrame sdpAnswer.
     * @member {string} sdpAnswer
     * @memberof SdkSubscribeAckFrame
     * @instance
     */
    SdkSubscribeAckFrame.prototype.sdpAnswer = "";

    /**
     * SdkSubscribeAckFrame tracks.
     * @member {Array.<ISdkTrackMapping>} tracks
     * @memberof SdkSubscribeAckFrame
     * @instance
     */
    SdkSubscribeAckFrame.prototype.tracks = $util.emptyArray;

    /**
     * Creates a new SdkSubscribeAckFrame instance using the specified properties.
     * @function create
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {ISdkSubscribeAckFrame=} [properties] Properties to set
     * @returns {SdkSubscribeAckFrame} SdkSubscribeAckFrame instance
     */
    SdkSubscribeAckFrame.create = function create(properties) {
        return new SdkSubscribeAckFrame(properties);
    };

    /**
     * Encodes the specified SdkSubscribeAckFrame message. Does not implicitly {@link SdkSubscribeAckFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {ISdkSubscribeAckFrame} message SdkSubscribeAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSubscribeAckFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.duplex);
        if (message.allocations != null && message.allocations.length)
            for (var i = 0; i < message.allocations.length; ++i)
                $root.SdkStreamAllocation.encode(message.allocations[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.sdpAnswer != null && message.hasOwnProperty("sdpAnswer"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.sdpAnswer);
        if (message.tracks != null && message.tracks.length)
            for (var i = 0; i < message.tracks.length; ++i)
                $root.SdkTrackMapping.encode(message.tracks[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkSubscribeAckFrame message, length delimited. Does not implicitly {@link SdkSubscribeAckFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {ISdkSubscribeAckFrame} message SdkSubscribeAckFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkSubscribeAckFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkSubscribeAckFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkSubscribeAckFrame} SdkSubscribeAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSubscribeAckFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkSubscribeAckFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.duplex = reader.int32();
                break;
            case 2:
                if (!(message.allocations && message.allocations.length))
                    message.allocations = [];
                message.allocations.push($root.SdkStreamAllocation.decode(reader, reader.uint32()));
                break;
            case 3:
                message.sdpAnswer = reader.string();
                break;
            case 4:
                if (!(message.tracks && message.tracks.length))
                    message.tracks = [];
                message.tracks.push($root.SdkTrackMapping.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkSubscribeAckFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkSubscribeAckFrame} SdkSubscribeAckFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkSubscribeAckFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkSubscribeAckFrame message.
     * @function verify
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkSubscribeAckFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            switch (message.duplex) {
            default:
                return "duplex: enum value expected";
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.allocations != null && message.hasOwnProperty("allocations")) {
            if (!Array.isArray(message.allocations))
                return "allocations: array expected";
            for (var i = 0; i < message.allocations.length; ++i) {
                var error = $root.SdkStreamAllocation.verify(message.allocations[i]);
                if (error)
                    return "allocations." + error;
            }
        }
        if (message.sdpAnswer != null && message.hasOwnProperty("sdpAnswer"))
            if (!$util.isString(message.sdpAnswer))
                return "sdpAnswer: string expected";
        if (message.tracks != null && message.hasOwnProperty("tracks")) {
            if (!Array.isArray(message.tracks))
                return "tracks: array expected";
            for (var i = 0; i < message.tracks.length; ++i) {
                var error = $root.SdkTrackMapping.verify(message.tracks[i]);
                if (error)
                    return "tracks." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkSubscribeAckFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkSubscribeAckFrame} SdkSubscribeAckFrame
     */
    SdkSubscribeAckFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkSubscribeAckFrame)
            return object;
        var message = new $root.SdkSubscribeAckFrame();
        switch (object.duplex) {
        case "RX":
        case 1:
            message.duplex = 1;
            break;
        case "TX":
        case 2:
            message.duplex = 2;
            break;
        case "DUPLEX":
        case 3:
            message.duplex = 3;
            break;
        }
        if (object.allocations) {
            if (!Array.isArray(object.allocations))
                throw TypeError(".SdkSubscribeAckFrame.allocations: array expected");
            message.allocations = [];
            for (var i = 0; i < object.allocations.length; ++i) {
                if (typeof object.allocations[i] !== "object")
                    throw TypeError(".SdkSubscribeAckFrame.allocations: object expected");
                message.allocations[i] = $root.SdkStreamAllocation.fromObject(object.allocations[i]);
            }
        }
        if (object.sdpAnswer != null)
            message.sdpAnswer = String(object.sdpAnswer);
        if (object.tracks) {
            if (!Array.isArray(object.tracks))
                throw TypeError(".SdkSubscribeAckFrame.tracks: array expected");
            message.tracks = [];
            for (var i = 0; i < object.tracks.length; ++i) {
                if (typeof object.tracks[i] !== "object")
                    throw TypeError(".SdkSubscribeAckFrame.tracks: object expected");
                message.tracks[i] = $root.SdkTrackMapping.fromObject(object.tracks[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkSubscribeAckFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkSubscribeAckFrame
     * @static
     * @param {SdkSubscribeAckFrame} message SdkSubscribeAckFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkSubscribeAckFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults) {
            object.allocations = [];
            object.tracks = [];
        }
        if (options.defaults) {
            object.duplex = options.enums === String ? "RX" : 1;
            object.sdpAnswer = "";
        }
        if (message.duplex != null && message.hasOwnProperty("duplex"))
            object.duplex = options.enums === String ? $root.SdkStreamServiceType[message.duplex] : message.duplex;
        if (message.allocations && message.allocations.length) {
            object.allocations = [];
            for (var j = 0; j < message.allocations.length; ++j)
                object.allocations[j] = $root.SdkStreamAllocation.toObject(message.allocations[j], options);
        }
        if (message.sdpAnswer != null && message.hasOwnProperty("sdpAnswer"))
            object.sdpAnswer = message.sdpAnswer;
        if (message.tracks && message.tracks.length) {
            object.tracks = [];
            for (var j = 0; j < message.tracks.length; ++j)
                object.tracks[j] = $root.SdkTrackMapping.toObject(message.tracks[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkSubscribeAckFrame to JSON.
     * @function toJSON
     * @memberof SdkSubscribeAckFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkSubscribeAckFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkSubscribeAckFrame;
})();

$root.SdkIndexFrame = (function() {

    /**
     * Properties of a SdkIndexFrame.
     * @exports ISdkIndexFrame
     * @interface ISdkIndexFrame
     * @property {boolean|null} [atCapacity] SdkIndexFrame atCapacity
     * @property {Array.<ISdkStreamDescriptor>|null} [sources] SdkIndexFrame sources
     * @property {Array.<number>|null} [pausedAtSourceIds] SdkIndexFrame pausedAtSourceIds
     * @property {number|null} [numParticipants] SdkIndexFrame numParticipants
     */

    /**
     * Constructs a new SdkIndexFrame.
     * @exports SdkIndexFrame
     * @classdesc Represents a SdkIndexFrame.
     * @implements ISdkIndexFrame
     * @constructor
     * @param {ISdkIndexFrame=} [properties] Properties to set
     */
    function SdkIndexFrame(properties) {
        this.sources = [];
        this.pausedAtSourceIds = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkIndexFrame atCapacity.
     * @member {boolean} atCapacity
     * @memberof SdkIndexFrame
     * @instance
     */
    SdkIndexFrame.prototype.atCapacity = false;

    /**
     * SdkIndexFrame sources.
     * @member {Array.<ISdkStreamDescriptor>} sources
     * @memberof SdkIndexFrame
     * @instance
     */
    SdkIndexFrame.prototype.sources = $util.emptyArray;

    /**
     * SdkIndexFrame pausedAtSourceIds.
     * @member {Array.<number>} pausedAtSourceIds
     * @memberof SdkIndexFrame
     * @instance
     */
    SdkIndexFrame.prototype.pausedAtSourceIds = $util.emptyArray;

    /**
     * SdkIndexFrame numParticipants.
     * @member {number} numParticipants
     * @memberof SdkIndexFrame
     * @instance
     */
    SdkIndexFrame.prototype.numParticipants = 0;

    /**
     * Creates a new SdkIndexFrame instance using the specified properties.
     * @function create
     * @memberof SdkIndexFrame
     * @static
     * @param {ISdkIndexFrame=} [properties] Properties to set
     * @returns {SdkIndexFrame} SdkIndexFrame instance
     */
    SdkIndexFrame.create = function create(properties) {
        return new SdkIndexFrame(properties);
    };

    /**
     * Encodes the specified SdkIndexFrame message. Does not implicitly {@link SdkIndexFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkIndexFrame
     * @static
     * @param {ISdkIndexFrame} message SdkIndexFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkIndexFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.atCapacity != null && message.hasOwnProperty("atCapacity"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.atCapacity);
        if (message.sources != null && message.sources.length)
            for (var i = 0; i < message.sources.length; ++i)
                $root.SdkStreamDescriptor.encode(message.sources[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.pausedAtSourceIds != null && message.pausedAtSourceIds.length)
            for (var i = 0; i < message.pausedAtSourceIds.length; ++i)
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.pausedAtSourceIds[i]);
        if (message.numParticipants != null && message.hasOwnProperty("numParticipants"))
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.numParticipants);
        return writer;
    };

    /**
     * Encodes the specified SdkIndexFrame message, length delimited. Does not implicitly {@link SdkIndexFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkIndexFrame
     * @static
     * @param {ISdkIndexFrame} message SdkIndexFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkIndexFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkIndexFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkIndexFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkIndexFrame} SdkIndexFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkIndexFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkIndexFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.atCapacity = reader.bool();
                break;
            case 2:
                if (!(message.sources && message.sources.length))
                    message.sources = [];
                message.sources.push($root.SdkStreamDescriptor.decode(reader, reader.uint32()));
                break;
            case 3:
                if (!(message.pausedAtSourceIds && message.pausedAtSourceIds.length))
                    message.pausedAtSourceIds = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.pausedAtSourceIds.push(reader.uint32());
                } else
                    message.pausedAtSourceIds.push(reader.uint32());
                break;
            case 4:
                message.numParticipants = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkIndexFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkIndexFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkIndexFrame} SdkIndexFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkIndexFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkIndexFrame message.
     * @function verify
     * @memberof SdkIndexFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkIndexFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.atCapacity != null && message.hasOwnProperty("atCapacity"))
            if (typeof message.atCapacity !== "boolean")
                return "atCapacity: boolean expected";
        if (message.sources != null && message.hasOwnProperty("sources")) {
            if (!Array.isArray(message.sources))
                return "sources: array expected";
            for (var i = 0; i < message.sources.length; ++i) {
                var error = $root.SdkStreamDescriptor.verify(message.sources[i]);
                if (error)
                    return "sources." + error;
            }
        }
        if (message.pausedAtSourceIds != null && message.hasOwnProperty("pausedAtSourceIds")) {
            if (!Array.isArray(message.pausedAtSourceIds))
                return "pausedAtSourceIds: array expected";
            for (var i = 0; i < message.pausedAtSourceIds.length; ++i)
                if (!$util.isInteger(message.pausedAtSourceIds[i]))
                    return "pausedAtSourceIds: integer[] expected";
        }
        if (message.numParticipants != null && message.hasOwnProperty("numParticipants"))
            if (!$util.isInteger(message.numParticipants))
                return "numParticipants: integer expected";
        return null;
    };

    /**
     * Creates a SdkIndexFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkIndexFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkIndexFrame} SdkIndexFrame
     */
    SdkIndexFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkIndexFrame)
            return object;
        var message = new $root.SdkIndexFrame();
        if (object.atCapacity != null)
            message.atCapacity = Boolean(object.atCapacity);
        if (object.sources) {
            if (!Array.isArray(object.sources))
                throw TypeError(".SdkIndexFrame.sources: array expected");
            message.sources = [];
            for (var i = 0; i < object.sources.length; ++i) {
                if (typeof object.sources[i] !== "object")
                    throw TypeError(".SdkIndexFrame.sources: object expected");
                message.sources[i] = $root.SdkStreamDescriptor.fromObject(object.sources[i]);
            }
        }
        if (object.pausedAtSourceIds) {
            if (!Array.isArray(object.pausedAtSourceIds))
                throw TypeError(".SdkIndexFrame.pausedAtSourceIds: array expected");
            message.pausedAtSourceIds = [];
            for (var i = 0; i < object.pausedAtSourceIds.length; ++i)
                message.pausedAtSourceIds[i] = object.pausedAtSourceIds[i] >>> 0;
        }
        if (object.numParticipants != null)
            message.numParticipants = object.numParticipants >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkIndexFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkIndexFrame
     * @static
     * @param {SdkIndexFrame} message SdkIndexFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkIndexFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults) {
            object.sources = [];
            object.pausedAtSourceIds = [];
        }
        if (options.defaults) {
            object.atCapacity = false;
            object.numParticipants = 0;
        }
        if (message.atCapacity != null && message.hasOwnProperty("atCapacity"))
            object.atCapacity = message.atCapacity;
        if (message.sources && message.sources.length) {
            object.sources = [];
            for (var j = 0; j < message.sources.length; ++j)
                object.sources[j] = $root.SdkStreamDescriptor.toObject(message.sources[j], options);
        }
        if (message.pausedAtSourceIds && message.pausedAtSourceIds.length) {
            object.pausedAtSourceIds = [];
            for (var j = 0; j < message.pausedAtSourceIds.length; ++j)
                object.pausedAtSourceIds[j] = message.pausedAtSourceIds[j];
        }
        if (message.numParticipants != null && message.hasOwnProperty("numParticipants"))
            object.numParticipants = message.numParticipants;
        return object;
    };

    /**
     * Converts this SdkIndexFrame to JSON.
     * @function toJSON
     * @memberof SdkIndexFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkIndexFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkIndexFrame;
})();

$root.SdkPauseResumeFrame = (function() {

    /**
     * Properties of a SdkPauseResumeFrame.
     * @exports ISdkPauseResumeFrame
     * @interface ISdkPauseResumeFrame
     * @property {Array.<number>|null} [streamIds] SdkPauseResumeFrame streamIds
     */

    /**
     * Constructs a new SdkPauseResumeFrame.
     * @exports SdkPauseResumeFrame
     * @classdesc Represents a SdkPauseResumeFrame.
     * @implements ISdkPauseResumeFrame
     * @constructor
     * @param {ISdkPauseResumeFrame=} [properties] Properties to set
     */
    function SdkPauseResumeFrame(properties) {
        this.streamIds = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkPauseResumeFrame streamIds.
     * @member {Array.<number>} streamIds
     * @memberof SdkPauseResumeFrame
     * @instance
     */
    SdkPauseResumeFrame.prototype.streamIds = $util.emptyArray;

    /**
     * Creates a new SdkPauseResumeFrame instance using the specified properties.
     * @function create
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {ISdkPauseResumeFrame=} [properties] Properties to set
     * @returns {SdkPauseResumeFrame} SdkPauseResumeFrame instance
     */
    SdkPauseResumeFrame.create = function create(properties) {
        return new SdkPauseResumeFrame(properties);
    };

    /**
     * Encodes the specified SdkPauseResumeFrame message. Does not implicitly {@link SdkPauseResumeFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {ISdkPauseResumeFrame} message SdkPauseResumeFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkPauseResumeFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.streamIds != null && message.streamIds.length)
            for (var i = 0; i < message.streamIds.length; ++i)
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.streamIds[i]);
        return writer;
    };

    /**
     * Encodes the specified SdkPauseResumeFrame message, length delimited. Does not implicitly {@link SdkPauseResumeFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {ISdkPauseResumeFrame} message SdkPauseResumeFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkPauseResumeFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkPauseResumeFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkPauseResumeFrame} SdkPauseResumeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkPauseResumeFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkPauseResumeFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.streamIds && message.streamIds.length))
                    message.streamIds = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.streamIds.push(reader.uint32());
                } else
                    message.streamIds.push(reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkPauseResumeFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkPauseResumeFrame} SdkPauseResumeFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkPauseResumeFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkPauseResumeFrame message.
     * @function verify
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkPauseResumeFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.streamIds != null && message.hasOwnProperty("streamIds")) {
            if (!Array.isArray(message.streamIds))
                return "streamIds: array expected";
            for (var i = 0; i < message.streamIds.length; ++i)
                if (!$util.isInteger(message.streamIds[i]))
                    return "streamIds: integer[] expected";
        }
        return null;
    };

    /**
     * Creates a SdkPauseResumeFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkPauseResumeFrame} SdkPauseResumeFrame
     */
    SdkPauseResumeFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkPauseResumeFrame)
            return object;
        var message = new $root.SdkPauseResumeFrame();
        if (object.streamIds) {
            if (!Array.isArray(object.streamIds))
                throw TypeError(".SdkPauseResumeFrame.streamIds: array expected");
            message.streamIds = [];
            for (var i = 0; i < object.streamIds.length; ++i)
                message.streamIds[i] = object.streamIds[i] >>> 0;
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkPauseResumeFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkPauseResumeFrame
     * @static
     * @param {SdkPauseResumeFrame} message SdkPauseResumeFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkPauseResumeFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.streamIds = [];
        if (message.streamIds && message.streamIds.length) {
            object.streamIds = [];
            for (var j = 0; j < message.streamIds.length; ++j)
                object.streamIds[j] = message.streamIds[j];
        }
        return object;
    };

    /**
     * Converts this SdkPauseResumeFrame to JSON.
     * @function toJSON
     * @memberof SdkPauseResumeFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkPauseResumeFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkPauseResumeFrame;
})();

$root.SdkBitrateFrame = (function() {

    /**
     * Properties of a SdkBitrateFrame.
     * @exports ISdkBitrateFrame
     * @interface ISdkBitrateFrame
     * @property {Array.<ISdkBitrate>|null} [bitrates] SdkBitrateFrame bitrates
     */

    /**
     * Constructs a new SdkBitrateFrame.
     * @exports SdkBitrateFrame
     * @classdesc Represents a SdkBitrateFrame.
     * @implements ISdkBitrateFrame
     * @constructor
     * @param {ISdkBitrateFrame=} [properties] Properties to set
     */
    function SdkBitrateFrame(properties) {
        this.bitrates = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkBitrateFrame bitrates.
     * @member {Array.<ISdkBitrate>} bitrates
     * @memberof SdkBitrateFrame
     * @instance
     */
    SdkBitrateFrame.prototype.bitrates = $util.emptyArray;

    /**
     * Creates a new SdkBitrateFrame instance using the specified properties.
     * @function create
     * @memberof SdkBitrateFrame
     * @static
     * @param {ISdkBitrateFrame=} [properties] Properties to set
     * @returns {SdkBitrateFrame} SdkBitrateFrame instance
     */
    SdkBitrateFrame.create = function create(properties) {
        return new SdkBitrateFrame(properties);
    };

    /**
     * Encodes the specified SdkBitrateFrame message. Does not implicitly {@link SdkBitrateFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkBitrateFrame
     * @static
     * @param {ISdkBitrateFrame} message SdkBitrateFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkBitrateFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.bitrates != null && message.bitrates.length)
            for (var i = 0; i < message.bitrates.length; ++i)
                $root.SdkBitrate.encode(message.bitrates[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkBitrateFrame message, length delimited. Does not implicitly {@link SdkBitrateFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkBitrateFrame
     * @static
     * @param {ISdkBitrateFrame} message SdkBitrateFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkBitrateFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkBitrateFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkBitrateFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkBitrateFrame} SdkBitrateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkBitrateFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkBitrateFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.bitrates && message.bitrates.length))
                    message.bitrates = [];
                message.bitrates.push($root.SdkBitrate.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkBitrateFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkBitrateFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkBitrateFrame} SdkBitrateFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkBitrateFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkBitrateFrame message.
     * @function verify
     * @memberof SdkBitrateFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkBitrateFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.bitrates != null && message.hasOwnProperty("bitrates")) {
            if (!Array.isArray(message.bitrates))
                return "bitrates: array expected";
            for (var i = 0; i < message.bitrates.length; ++i) {
                var error = $root.SdkBitrate.verify(message.bitrates[i]);
                if (error)
                    return "bitrates." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkBitrateFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkBitrateFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkBitrateFrame} SdkBitrateFrame
     */
    SdkBitrateFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkBitrateFrame)
            return object;
        var message = new $root.SdkBitrateFrame();
        if (object.bitrates) {
            if (!Array.isArray(object.bitrates))
                throw TypeError(".SdkBitrateFrame.bitrates: array expected");
            message.bitrates = [];
            for (var i = 0; i < object.bitrates.length; ++i) {
                if (typeof object.bitrates[i] !== "object")
                    throw TypeError(".SdkBitrateFrame.bitrates: object expected");
                message.bitrates[i] = $root.SdkBitrate.fromObject(object.bitrates[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkBitrateFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkBitrateFrame
     * @static
     * @param {SdkBitrateFrame} message SdkBitrateFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkBitrateFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.bitrates = [];
        if (message.bitrates && message.bitrates.length) {
            object.bitrates = [];
            for (var j = 0; j < message.bitrates.length; ++j)
                object.bitrates[j] = $root.SdkBitrate.toObject(message.bitrates[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkBitrateFrame to JSON.
     * @function toJSON
     * @memberof SdkBitrateFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkBitrateFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkBitrateFrame;
})();

$root.SdkStreamDescriptor = (function() {

    /**
     * Properties of a SdkStreamDescriptor.
     * @exports ISdkStreamDescriptor
     * @interface ISdkStreamDescriptor
     * @property {number|null} [streamId] SdkStreamDescriptor streamId
     * @property {number|null} [framerate] SdkStreamDescriptor framerate
     * @property {number|null} [maxBitrateKbps] SdkStreamDescriptor maxBitrateKbps
     * @property {string|null} [trackLabel] SdkStreamDescriptor trackLabel
     * @property {number|null} [groupId] SdkStreamDescriptor groupId
     * @property {number|null} [avgBitrateBps] SdkStreamDescriptor avgBitrateBps
     * @property {string|null} [attendeeId] SdkStreamDescriptor attendeeId
     * @property {SdkStreamMediaType|null} [mediaType] SdkStreamDescriptor mediaType
     * @property {string|null} [externalUserId] SdkStreamDescriptor externalUserId
     */

    /**
     * Constructs a new SdkStreamDescriptor.
     * @exports SdkStreamDescriptor
     * @classdesc Represents a SdkStreamDescriptor.
     * @implements ISdkStreamDescriptor
     * @constructor
     * @param {ISdkStreamDescriptor=} [properties] Properties to set
     */
    function SdkStreamDescriptor(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkStreamDescriptor streamId.
     * @member {number} streamId
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.streamId = 0;

    /**
     * SdkStreamDescriptor framerate.
     * @member {number} framerate
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.framerate = 0;

    /**
     * SdkStreamDescriptor maxBitrateKbps.
     * @member {number} maxBitrateKbps
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.maxBitrateKbps = 0;

    /**
     * SdkStreamDescriptor trackLabel.
     * @member {string} trackLabel
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.trackLabel = "";

    /**
     * SdkStreamDescriptor groupId.
     * @member {number} groupId
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.groupId = 0;

    /**
     * SdkStreamDescriptor avgBitrateBps.
     * @member {number} avgBitrateBps
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.avgBitrateBps = 0;

    /**
     * SdkStreamDescriptor attendeeId.
     * @member {string} attendeeId
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.attendeeId = "";

    /**
     * SdkStreamDescriptor mediaType.
     * @member {SdkStreamMediaType} mediaType
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.mediaType = 1;

    /**
     * SdkStreamDescriptor externalUserId.
     * @member {string} externalUserId
     * @memberof SdkStreamDescriptor
     * @instance
     */
    SdkStreamDescriptor.prototype.externalUserId = "";

    /**
     * Creates a new SdkStreamDescriptor instance using the specified properties.
     * @function create
     * @memberof SdkStreamDescriptor
     * @static
     * @param {ISdkStreamDescriptor=} [properties] Properties to set
     * @returns {SdkStreamDescriptor} SdkStreamDescriptor instance
     */
    SdkStreamDescriptor.create = function create(properties) {
        return new SdkStreamDescriptor(properties);
    };

    /**
     * Encodes the specified SdkStreamDescriptor message. Does not implicitly {@link SdkStreamDescriptor.verify|verify} messages.
     * @function encode
     * @memberof SdkStreamDescriptor
     * @static
     * @param {ISdkStreamDescriptor} message SdkStreamDescriptor message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamDescriptor.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.streamId);
        if (message.framerate != null && message.hasOwnProperty("framerate"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.framerate);
        if (message.maxBitrateKbps != null && message.hasOwnProperty("maxBitrateKbps"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.maxBitrateKbps);
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.trackLabel);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.groupId);
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.avgBitrateBps);
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.attendeeId);
        if (message.mediaType != null && message.hasOwnProperty("mediaType"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.mediaType);
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            writer.uint32(/* id 10, wireType 2 =*/82).string(message.externalUserId);
        return writer;
    };

    /**
     * Encodes the specified SdkStreamDescriptor message, length delimited. Does not implicitly {@link SdkStreamDescriptor.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkStreamDescriptor
     * @static
     * @param {ISdkStreamDescriptor} message SdkStreamDescriptor message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamDescriptor.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkStreamDescriptor message from the specified reader or buffer.
     * @function decode
     * @memberof SdkStreamDescriptor
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkStreamDescriptor} SdkStreamDescriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamDescriptor.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkStreamDescriptor();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.streamId = reader.uint32();
                break;
            case 2:
                message.framerate = reader.uint32();
                break;
            case 3:
                message.maxBitrateKbps = reader.uint32();
                break;
            case 4:
                message.trackLabel = reader.string();
                break;
            case 6:
                message.groupId = reader.uint32();
                break;
            case 7:
                message.avgBitrateBps = reader.uint32();
                break;
            case 8:
                message.attendeeId = reader.string();
                break;
            case 9:
                message.mediaType = reader.int32();
                break;
            case 10:
                message.externalUserId = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkStreamDescriptor message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkStreamDescriptor
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkStreamDescriptor} SdkStreamDescriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamDescriptor.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkStreamDescriptor message.
     * @function verify
     * @memberof SdkStreamDescriptor
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkStreamDescriptor.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            if (!$util.isInteger(message.streamId))
                return "streamId: integer expected";
        if (message.framerate != null && message.hasOwnProperty("framerate"))
            if (!$util.isInteger(message.framerate))
                return "framerate: integer expected";
        if (message.maxBitrateKbps != null && message.hasOwnProperty("maxBitrateKbps"))
            if (!$util.isInteger(message.maxBitrateKbps))
                return "maxBitrateKbps: integer expected";
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            if (!$util.isString(message.trackLabel))
                return "trackLabel: string expected";
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId))
                return "groupId: integer expected";
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            if (!$util.isInteger(message.avgBitrateBps))
                return "avgBitrateBps: integer expected";
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            if (!$util.isString(message.attendeeId))
                return "attendeeId: string expected";
        if (message.mediaType != null && message.hasOwnProperty("mediaType"))
            switch (message.mediaType) {
            default:
                return "mediaType: enum value expected";
            case 1:
            case 2:
                break;
            }
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            if (!$util.isString(message.externalUserId))
                return "externalUserId: string expected";
        return null;
    };

    /**
     * Creates a SdkStreamDescriptor message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkStreamDescriptor
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkStreamDescriptor} SdkStreamDescriptor
     */
    SdkStreamDescriptor.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkStreamDescriptor)
            return object;
        var message = new $root.SdkStreamDescriptor();
        if (object.streamId != null)
            message.streamId = object.streamId >>> 0;
        if (object.framerate != null)
            message.framerate = object.framerate >>> 0;
        if (object.maxBitrateKbps != null)
            message.maxBitrateKbps = object.maxBitrateKbps >>> 0;
        if (object.trackLabel != null)
            message.trackLabel = String(object.trackLabel);
        if (object.groupId != null)
            message.groupId = object.groupId >>> 0;
        if (object.avgBitrateBps != null)
            message.avgBitrateBps = object.avgBitrateBps >>> 0;
        if (object.attendeeId != null)
            message.attendeeId = String(object.attendeeId);
        switch (object.mediaType) {
        case "AUDIO":
        case 1:
            message.mediaType = 1;
            break;
        case "VIDEO":
        case 2:
            message.mediaType = 2;
            break;
        }
        if (object.externalUserId != null)
            message.externalUserId = String(object.externalUserId);
        return message;
    };

    /**
     * Creates a plain object from a SdkStreamDescriptor message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkStreamDescriptor
     * @static
     * @param {SdkStreamDescriptor} message SdkStreamDescriptor
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkStreamDescriptor.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.streamId = 0;
            object.framerate = 0;
            object.maxBitrateKbps = 0;
            object.trackLabel = "";
            object.groupId = 0;
            object.avgBitrateBps = 0;
            object.attendeeId = "";
            object.mediaType = options.enums === String ? "AUDIO" : 1;
            object.externalUserId = "";
        }
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            object.streamId = message.streamId;
        if (message.framerate != null && message.hasOwnProperty("framerate"))
            object.framerate = message.framerate;
        if (message.maxBitrateKbps != null && message.hasOwnProperty("maxBitrateKbps"))
            object.maxBitrateKbps = message.maxBitrateKbps;
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            object.trackLabel = message.trackLabel;
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            object.groupId = message.groupId;
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            object.avgBitrateBps = message.avgBitrateBps;
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            object.attendeeId = message.attendeeId;
        if (message.mediaType != null && message.hasOwnProperty("mediaType"))
            object.mediaType = options.enums === String ? $root.SdkStreamMediaType[message.mediaType] : message.mediaType;
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            object.externalUserId = message.externalUserId;
        return object;
    };

    /**
     * Converts this SdkStreamDescriptor to JSON.
     * @function toJSON
     * @memberof SdkStreamDescriptor
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkStreamDescriptor.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkStreamDescriptor;
})();

$root.SdkStreamAllocation = (function() {

    /**
     * Properties of a SdkStreamAllocation.
     * @exports ISdkStreamAllocation
     * @interface ISdkStreamAllocation
     * @property {string|null} [trackLabel] SdkStreamAllocation trackLabel
     * @property {number|null} [streamId] SdkStreamAllocation streamId
     * @property {number|null} [groupId] SdkStreamAllocation groupId
     */

    /**
     * Constructs a new SdkStreamAllocation.
     * @exports SdkStreamAllocation
     * @classdesc Represents a SdkStreamAllocation.
     * @implements ISdkStreamAllocation
     * @constructor
     * @param {ISdkStreamAllocation=} [properties] Properties to set
     */
    function SdkStreamAllocation(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkStreamAllocation trackLabel.
     * @member {string} trackLabel
     * @memberof SdkStreamAllocation
     * @instance
     */
    SdkStreamAllocation.prototype.trackLabel = "";

    /**
     * SdkStreamAllocation streamId.
     * @member {number} streamId
     * @memberof SdkStreamAllocation
     * @instance
     */
    SdkStreamAllocation.prototype.streamId = 0;

    /**
     * SdkStreamAllocation groupId.
     * @member {number} groupId
     * @memberof SdkStreamAllocation
     * @instance
     */
    SdkStreamAllocation.prototype.groupId = 0;

    /**
     * Creates a new SdkStreamAllocation instance using the specified properties.
     * @function create
     * @memberof SdkStreamAllocation
     * @static
     * @param {ISdkStreamAllocation=} [properties] Properties to set
     * @returns {SdkStreamAllocation} SdkStreamAllocation instance
     */
    SdkStreamAllocation.create = function create(properties) {
        return new SdkStreamAllocation(properties);
    };

    /**
     * Encodes the specified SdkStreamAllocation message. Does not implicitly {@link SdkStreamAllocation.verify|verify} messages.
     * @function encode
     * @memberof SdkStreamAllocation
     * @static
     * @param {ISdkStreamAllocation} message SdkStreamAllocation message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamAllocation.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.trackLabel);
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.streamId);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.groupId);
        return writer;
    };

    /**
     * Encodes the specified SdkStreamAllocation message, length delimited. Does not implicitly {@link SdkStreamAllocation.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkStreamAllocation
     * @static
     * @param {ISdkStreamAllocation} message SdkStreamAllocation message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamAllocation.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkStreamAllocation message from the specified reader or buffer.
     * @function decode
     * @memberof SdkStreamAllocation
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkStreamAllocation} SdkStreamAllocation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamAllocation.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkStreamAllocation();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.trackLabel = reader.string();
                break;
            case 2:
                message.streamId = reader.uint32();
                break;
            case 3:
                message.groupId = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkStreamAllocation message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkStreamAllocation
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkStreamAllocation} SdkStreamAllocation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamAllocation.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkStreamAllocation message.
     * @function verify
     * @memberof SdkStreamAllocation
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkStreamAllocation.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            if (!$util.isString(message.trackLabel))
                return "trackLabel: string expected";
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            if (!$util.isInteger(message.streamId))
                return "streamId: integer expected";
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId))
                return "groupId: integer expected";
        return null;
    };

    /**
     * Creates a SdkStreamAllocation message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkStreamAllocation
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkStreamAllocation} SdkStreamAllocation
     */
    SdkStreamAllocation.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkStreamAllocation)
            return object;
        var message = new $root.SdkStreamAllocation();
        if (object.trackLabel != null)
            message.trackLabel = String(object.trackLabel);
        if (object.streamId != null)
            message.streamId = object.streamId >>> 0;
        if (object.groupId != null)
            message.groupId = object.groupId >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkStreamAllocation message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkStreamAllocation
     * @static
     * @param {SdkStreamAllocation} message SdkStreamAllocation
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkStreamAllocation.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.trackLabel = "";
            object.streamId = 0;
            object.groupId = 0;
        }
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            object.trackLabel = message.trackLabel;
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            object.streamId = message.streamId;
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            object.groupId = message.groupId;
        return object;
    };

    /**
     * Converts this SdkStreamAllocation to JSON.
     * @function toJSON
     * @memberof SdkStreamAllocation
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkStreamAllocation.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkStreamAllocation;
})();

$root.SdkTrackMapping = (function() {

    /**
     * Properties of a SdkTrackMapping.
     * @exports ISdkTrackMapping
     * @interface ISdkTrackMapping
     * @property {number|null} [streamId] SdkTrackMapping streamId
     * @property {number|null} [ssrc] SdkTrackMapping ssrc
     * @property {string|null} [trackLabel] SdkTrackMapping trackLabel
     */

    /**
     * Constructs a new SdkTrackMapping.
     * @exports SdkTrackMapping
     * @classdesc Represents a SdkTrackMapping.
     * @implements ISdkTrackMapping
     * @constructor
     * @param {ISdkTrackMapping=} [properties] Properties to set
     */
    function SdkTrackMapping(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkTrackMapping streamId.
     * @member {number} streamId
     * @memberof SdkTrackMapping
     * @instance
     */
    SdkTrackMapping.prototype.streamId = 0;

    /**
     * SdkTrackMapping ssrc.
     * @member {number} ssrc
     * @memberof SdkTrackMapping
     * @instance
     */
    SdkTrackMapping.prototype.ssrc = 0;

    /**
     * SdkTrackMapping trackLabel.
     * @member {string} trackLabel
     * @memberof SdkTrackMapping
     * @instance
     */
    SdkTrackMapping.prototype.trackLabel = "";

    /**
     * Creates a new SdkTrackMapping instance using the specified properties.
     * @function create
     * @memberof SdkTrackMapping
     * @static
     * @param {ISdkTrackMapping=} [properties] Properties to set
     * @returns {SdkTrackMapping} SdkTrackMapping instance
     */
    SdkTrackMapping.create = function create(properties) {
        return new SdkTrackMapping(properties);
    };

    /**
     * Encodes the specified SdkTrackMapping message. Does not implicitly {@link SdkTrackMapping.verify|verify} messages.
     * @function encode
     * @memberof SdkTrackMapping
     * @static
     * @param {ISdkTrackMapping} message SdkTrackMapping message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkTrackMapping.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.streamId);
        if (message.ssrc != null && message.hasOwnProperty("ssrc"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.ssrc);
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.trackLabel);
        return writer;
    };

    /**
     * Encodes the specified SdkTrackMapping message, length delimited. Does not implicitly {@link SdkTrackMapping.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkTrackMapping
     * @static
     * @param {ISdkTrackMapping} message SdkTrackMapping message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkTrackMapping.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkTrackMapping message from the specified reader or buffer.
     * @function decode
     * @memberof SdkTrackMapping
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkTrackMapping} SdkTrackMapping
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkTrackMapping.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkTrackMapping();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.streamId = reader.uint32();
                break;
            case 2:
                message.ssrc = reader.uint32();
                break;
            case 3:
                message.trackLabel = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkTrackMapping message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkTrackMapping
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkTrackMapping} SdkTrackMapping
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkTrackMapping.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkTrackMapping message.
     * @function verify
     * @memberof SdkTrackMapping
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkTrackMapping.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            if (!$util.isInteger(message.streamId))
                return "streamId: integer expected";
        if (message.ssrc != null && message.hasOwnProperty("ssrc"))
            if (!$util.isInteger(message.ssrc))
                return "ssrc: integer expected";
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            if (!$util.isString(message.trackLabel))
                return "trackLabel: string expected";
        return null;
    };

    /**
     * Creates a SdkTrackMapping message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkTrackMapping
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkTrackMapping} SdkTrackMapping
     */
    SdkTrackMapping.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkTrackMapping)
            return object;
        var message = new $root.SdkTrackMapping();
        if (object.streamId != null)
            message.streamId = object.streamId >>> 0;
        if (object.ssrc != null)
            message.ssrc = object.ssrc >>> 0;
        if (object.trackLabel != null)
            message.trackLabel = String(object.trackLabel);
        return message;
    };

    /**
     * Creates a plain object from a SdkTrackMapping message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkTrackMapping
     * @static
     * @param {SdkTrackMapping} message SdkTrackMapping
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkTrackMapping.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.streamId = 0;
            object.ssrc = 0;
            object.trackLabel = "";
        }
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            object.streamId = message.streamId;
        if (message.ssrc != null && message.hasOwnProperty("ssrc"))
            object.ssrc = message.ssrc;
        if (message.trackLabel != null && message.hasOwnProperty("trackLabel"))
            object.trackLabel = message.trackLabel;
        return object;
    };

    /**
     * Converts this SdkTrackMapping to JSON.
     * @function toJSON
     * @memberof SdkTrackMapping
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkTrackMapping.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkTrackMapping;
})();

$root.SdkBitrate = (function() {

    /**
     * Properties of a SdkBitrate.
     * @exports ISdkBitrate
     * @interface ISdkBitrate
     * @property {number|null} [sourceStreamId] SdkBitrate sourceStreamId
     * @property {number|null} [avgBitrateBps] SdkBitrate avgBitrateBps
     */

    /**
     * Constructs a new SdkBitrate.
     * @exports SdkBitrate
     * @classdesc Represents a SdkBitrate.
     * @implements ISdkBitrate
     * @constructor
     * @param {ISdkBitrate=} [properties] Properties to set
     */
    function SdkBitrate(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkBitrate sourceStreamId.
     * @member {number} sourceStreamId
     * @memberof SdkBitrate
     * @instance
     */
    SdkBitrate.prototype.sourceStreamId = 0;

    /**
     * SdkBitrate avgBitrateBps.
     * @member {number} avgBitrateBps
     * @memberof SdkBitrate
     * @instance
     */
    SdkBitrate.prototype.avgBitrateBps = 0;

    /**
     * Creates a new SdkBitrate instance using the specified properties.
     * @function create
     * @memberof SdkBitrate
     * @static
     * @param {ISdkBitrate=} [properties] Properties to set
     * @returns {SdkBitrate} SdkBitrate instance
     */
    SdkBitrate.create = function create(properties) {
        return new SdkBitrate(properties);
    };

    /**
     * Encodes the specified SdkBitrate message. Does not implicitly {@link SdkBitrate.verify|verify} messages.
     * @function encode
     * @memberof SdkBitrate
     * @static
     * @param {ISdkBitrate} message SdkBitrate message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkBitrate.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.sourceStreamId != null && message.hasOwnProperty("sourceStreamId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.sourceStreamId);
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.avgBitrateBps);
        return writer;
    };

    /**
     * Encodes the specified SdkBitrate message, length delimited. Does not implicitly {@link SdkBitrate.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkBitrate
     * @static
     * @param {ISdkBitrate} message SdkBitrate message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkBitrate.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkBitrate message from the specified reader or buffer.
     * @function decode
     * @memberof SdkBitrate
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkBitrate} SdkBitrate
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkBitrate.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkBitrate();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.sourceStreamId = reader.uint32();
                break;
            case 2:
                message.avgBitrateBps = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkBitrate message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkBitrate
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkBitrate} SdkBitrate
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkBitrate.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkBitrate message.
     * @function verify
     * @memberof SdkBitrate
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkBitrate.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.sourceStreamId != null && message.hasOwnProperty("sourceStreamId"))
            if (!$util.isInteger(message.sourceStreamId))
                return "sourceStreamId: integer expected";
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            if (!$util.isInteger(message.avgBitrateBps))
                return "avgBitrateBps: integer expected";
        return null;
    };

    /**
     * Creates a SdkBitrate message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkBitrate
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkBitrate} SdkBitrate
     */
    SdkBitrate.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkBitrate)
            return object;
        var message = new $root.SdkBitrate();
        if (object.sourceStreamId != null)
            message.sourceStreamId = object.sourceStreamId >>> 0;
        if (object.avgBitrateBps != null)
            message.avgBitrateBps = object.avgBitrateBps >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkBitrate message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkBitrate
     * @static
     * @param {SdkBitrate} message SdkBitrate
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkBitrate.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.sourceStreamId = 0;
            object.avgBitrateBps = 0;
        }
        if (message.sourceStreamId != null && message.hasOwnProperty("sourceStreamId"))
            object.sourceStreamId = message.sourceStreamId;
        if (message.avgBitrateBps != null && message.hasOwnProperty("avgBitrateBps"))
            object.avgBitrateBps = message.avgBitrateBps;
        return object;
    };

    /**
     * Converts this SdkBitrate to JSON.
     * @function toJSON
     * @memberof SdkBitrate
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkBitrate.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkBitrate;
})();

$root.SdkAudioControlFrame = (function() {

    /**
     * Properties of a SdkAudioControlFrame.
     * @exports ISdkAudioControlFrame
     * @interface ISdkAudioControlFrame
     * @property {boolean|null} [muted] SdkAudioControlFrame muted
     */

    /**
     * Constructs a new SdkAudioControlFrame.
     * @exports SdkAudioControlFrame
     * @classdesc Represents a SdkAudioControlFrame.
     * @implements ISdkAudioControlFrame
     * @constructor
     * @param {ISdkAudioControlFrame=} [properties] Properties to set
     */
    function SdkAudioControlFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioControlFrame muted.
     * @member {boolean} muted
     * @memberof SdkAudioControlFrame
     * @instance
     */
    SdkAudioControlFrame.prototype.muted = false;

    /**
     * Creates a new SdkAudioControlFrame instance using the specified properties.
     * @function create
     * @memberof SdkAudioControlFrame
     * @static
     * @param {ISdkAudioControlFrame=} [properties] Properties to set
     * @returns {SdkAudioControlFrame} SdkAudioControlFrame instance
     */
    SdkAudioControlFrame.create = function create(properties) {
        return new SdkAudioControlFrame(properties);
    };

    /**
     * Encodes the specified SdkAudioControlFrame message. Does not implicitly {@link SdkAudioControlFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioControlFrame
     * @static
     * @param {ISdkAudioControlFrame} message SdkAudioControlFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioControlFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.muted != null && message.hasOwnProperty("muted"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.muted);
        return writer;
    };

    /**
     * Encodes the specified SdkAudioControlFrame message, length delimited. Does not implicitly {@link SdkAudioControlFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioControlFrame
     * @static
     * @param {ISdkAudioControlFrame} message SdkAudioControlFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioControlFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioControlFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioControlFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioControlFrame} SdkAudioControlFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioControlFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioControlFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.muted = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioControlFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioControlFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioControlFrame} SdkAudioControlFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioControlFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioControlFrame message.
     * @function verify
     * @memberof SdkAudioControlFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioControlFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.muted != null && message.hasOwnProperty("muted"))
            if (typeof message.muted !== "boolean")
                return "muted: boolean expected";
        return null;
    };

    /**
     * Creates a SdkAudioControlFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioControlFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioControlFrame} SdkAudioControlFrame
     */
    SdkAudioControlFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioControlFrame)
            return object;
        var message = new $root.SdkAudioControlFrame();
        if (object.muted != null)
            message.muted = Boolean(object.muted);
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioControlFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioControlFrame
     * @static
     * @param {SdkAudioControlFrame} message SdkAudioControlFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioControlFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.muted = false;
        if (message.muted != null && message.hasOwnProperty("muted"))
            object.muted = message.muted;
        return object;
    };

    /**
     * Converts this SdkAudioControlFrame to JSON.
     * @function toJSON
     * @memberof SdkAudioControlFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioControlFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioControlFrame;
})();

$root.SdkAudioMetadataFrame = (function() {

    /**
     * Properties of a SdkAudioMetadataFrame.
     * @exports ISdkAudioMetadataFrame
     * @interface ISdkAudioMetadataFrame
     * @property {Array.<ISdkAudioAttendeeState>|null} [attendeeStates] SdkAudioMetadataFrame attendeeStates
     */

    /**
     * Constructs a new SdkAudioMetadataFrame.
     * @exports SdkAudioMetadataFrame
     * @classdesc Represents a SdkAudioMetadataFrame.
     * @implements ISdkAudioMetadataFrame
     * @constructor
     * @param {ISdkAudioMetadataFrame=} [properties] Properties to set
     */
    function SdkAudioMetadataFrame(properties) {
        this.attendeeStates = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioMetadataFrame attendeeStates.
     * @member {Array.<ISdkAudioAttendeeState>} attendeeStates
     * @memberof SdkAudioMetadataFrame
     * @instance
     */
    SdkAudioMetadataFrame.prototype.attendeeStates = $util.emptyArray;

    /**
     * Creates a new SdkAudioMetadataFrame instance using the specified properties.
     * @function create
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {ISdkAudioMetadataFrame=} [properties] Properties to set
     * @returns {SdkAudioMetadataFrame} SdkAudioMetadataFrame instance
     */
    SdkAudioMetadataFrame.create = function create(properties) {
        return new SdkAudioMetadataFrame(properties);
    };

    /**
     * Encodes the specified SdkAudioMetadataFrame message. Does not implicitly {@link SdkAudioMetadataFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {ISdkAudioMetadataFrame} message SdkAudioMetadataFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioMetadataFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.attendeeStates != null && message.attendeeStates.length)
            for (var i = 0; i < message.attendeeStates.length; ++i)
                $root.SdkAudioAttendeeState.encode(message.attendeeStates[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkAudioMetadataFrame message, length delimited. Does not implicitly {@link SdkAudioMetadataFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {ISdkAudioMetadataFrame} message SdkAudioMetadataFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioMetadataFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioMetadataFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioMetadataFrame} SdkAudioMetadataFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioMetadataFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioMetadataFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.attendeeStates && message.attendeeStates.length))
                    message.attendeeStates = [];
                message.attendeeStates.push($root.SdkAudioAttendeeState.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioMetadataFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioMetadataFrame} SdkAudioMetadataFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioMetadataFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioMetadataFrame message.
     * @function verify
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioMetadataFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.attendeeStates != null && message.hasOwnProperty("attendeeStates")) {
            if (!Array.isArray(message.attendeeStates))
                return "attendeeStates: array expected";
            for (var i = 0; i < message.attendeeStates.length; ++i) {
                var error = $root.SdkAudioAttendeeState.verify(message.attendeeStates[i]);
                if (error)
                    return "attendeeStates." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkAudioMetadataFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioMetadataFrame} SdkAudioMetadataFrame
     */
    SdkAudioMetadataFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioMetadataFrame)
            return object;
        var message = new $root.SdkAudioMetadataFrame();
        if (object.attendeeStates) {
            if (!Array.isArray(object.attendeeStates))
                throw TypeError(".SdkAudioMetadataFrame.attendeeStates: array expected");
            message.attendeeStates = [];
            for (var i = 0; i < object.attendeeStates.length; ++i) {
                if (typeof object.attendeeStates[i] !== "object")
                    throw TypeError(".SdkAudioMetadataFrame.attendeeStates: object expected");
                message.attendeeStates[i] = $root.SdkAudioAttendeeState.fromObject(object.attendeeStates[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioMetadataFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioMetadataFrame
     * @static
     * @param {SdkAudioMetadataFrame} message SdkAudioMetadataFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioMetadataFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.attendeeStates = [];
        if (message.attendeeStates && message.attendeeStates.length) {
            object.attendeeStates = [];
            for (var j = 0; j < message.attendeeStates.length; ++j)
                object.attendeeStates[j] = $root.SdkAudioAttendeeState.toObject(message.attendeeStates[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkAudioMetadataFrame to JSON.
     * @function toJSON
     * @memberof SdkAudioMetadataFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioMetadataFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioMetadataFrame;
})();

$root.SdkAudioAttendeeState = (function() {

    /**
     * Properties of a SdkAudioAttendeeState.
     * @exports ISdkAudioAttendeeState
     * @interface ISdkAudioAttendeeState
     * @property {number|null} [audioStreamId] SdkAudioAttendeeState audioStreamId
     * @property {number|null} [volume] SdkAudioAttendeeState volume
     * @property {boolean|null} [muted] SdkAudioAttendeeState muted
     * @property {number|null} [signalStrength] SdkAudioAttendeeState signalStrength
     */

    /**
     * Constructs a new SdkAudioAttendeeState.
     * @exports SdkAudioAttendeeState
     * @classdesc Represents a SdkAudioAttendeeState.
     * @implements ISdkAudioAttendeeState
     * @constructor
     * @param {ISdkAudioAttendeeState=} [properties] Properties to set
     */
    function SdkAudioAttendeeState(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioAttendeeState audioStreamId.
     * @member {number} audioStreamId
     * @memberof SdkAudioAttendeeState
     * @instance
     */
    SdkAudioAttendeeState.prototype.audioStreamId = 0;

    /**
     * SdkAudioAttendeeState volume.
     * @member {number} volume
     * @memberof SdkAudioAttendeeState
     * @instance
     */
    SdkAudioAttendeeState.prototype.volume = 0;

    /**
     * SdkAudioAttendeeState muted.
     * @member {boolean} muted
     * @memberof SdkAudioAttendeeState
     * @instance
     */
    SdkAudioAttendeeState.prototype.muted = false;

    /**
     * SdkAudioAttendeeState signalStrength.
     * @member {number} signalStrength
     * @memberof SdkAudioAttendeeState
     * @instance
     */
    SdkAudioAttendeeState.prototype.signalStrength = 0;

    /**
     * Creates a new SdkAudioAttendeeState instance using the specified properties.
     * @function create
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {ISdkAudioAttendeeState=} [properties] Properties to set
     * @returns {SdkAudioAttendeeState} SdkAudioAttendeeState instance
     */
    SdkAudioAttendeeState.create = function create(properties) {
        return new SdkAudioAttendeeState(properties);
    };

    /**
     * Encodes the specified SdkAudioAttendeeState message. Does not implicitly {@link SdkAudioAttendeeState.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {ISdkAudioAttendeeState} message SdkAudioAttendeeState message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioAttendeeState.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.audioStreamId);
        if (message.volume != null && message.hasOwnProperty("volume"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.volume);
        if (message.muted != null && message.hasOwnProperty("muted"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.muted);
        if (message.signalStrength != null && message.hasOwnProperty("signalStrength"))
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.signalStrength);
        return writer;
    };

    /**
     * Encodes the specified SdkAudioAttendeeState message, length delimited. Does not implicitly {@link SdkAudioAttendeeState.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {ISdkAudioAttendeeState} message SdkAudioAttendeeState message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioAttendeeState.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioAttendeeState message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioAttendeeState} SdkAudioAttendeeState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioAttendeeState.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioAttendeeState();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.audioStreamId = reader.uint32();
                break;
            case 2:
                message.volume = reader.uint32();
                break;
            case 3:
                message.muted = reader.bool();
                break;
            case 4:
                message.signalStrength = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioAttendeeState message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioAttendeeState} SdkAudioAttendeeState
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioAttendeeState.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioAttendeeState message.
     * @function verify
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioAttendeeState.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            if (!$util.isInteger(message.audioStreamId))
                return "audioStreamId: integer expected";
        if (message.volume != null && message.hasOwnProperty("volume"))
            if (!$util.isInteger(message.volume))
                return "volume: integer expected";
        if (message.muted != null && message.hasOwnProperty("muted"))
            if (typeof message.muted !== "boolean")
                return "muted: boolean expected";
        if (message.signalStrength != null && message.hasOwnProperty("signalStrength"))
            if (!$util.isInteger(message.signalStrength))
                return "signalStrength: integer expected";
        return null;
    };

    /**
     * Creates a SdkAudioAttendeeState message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioAttendeeState} SdkAudioAttendeeState
     */
    SdkAudioAttendeeState.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioAttendeeState)
            return object;
        var message = new $root.SdkAudioAttendeeState();
        if (object.audioStreamId != null)
            message.audioStreamId = object.audioStreamId >>> 0;
        if (object.volume != null)
            message.volume = object.volume >>> 0;
        if (object.muted != null)
            message.muted = Boolean(object.muted);
        if (object.signalStrength != null)
            message.signalStrength = object.signalStrength >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioAttendeeState message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioAttendeeState
     * @static
     * @param {SdkAudioAttendeeState} message SdkAudioAttendeeState
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioAttendeeState.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.audioStreamId = 0;
            object.volume = 0;
            object.muted = false;
            object.signalStrength = 0;
        }
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            object.audioStreamId = message.audioStreamId;
        if (message.volume != null && message.hasOwnProperty("volume"))
            object.volume = message.volume;
        if (message.muted != null && message.hasOwnProperty("muted"))
            object.muted = message.muted;
        if (message.signalStrength != null && message.hasOwnProperty("signalStrength"))
            object.signalStrength = message.signalStrength;
        return object;
    };

    /**
     * Converts this SdkAudioAttendeeState to JSON.
     * @function toJSON
     * @memberof SdkAudioAttendeeState
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioAttendeeState.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioAttendeeState;
})();

$root.SdkAudioStreamIdInfoFrame = (function() {

    /**
     * Properties of a SdkAudioStreamIdInfoFrame.
     * @exports ISdkAudioStreamIdInfoFrame
     * @interface ISdkAudioStreamIdInfoFrame
     * @property {Array.<ISdkAudioStreamIdInfo>|null} [streams] SdkAudioStreamIdInfoFrame streams
     */

    /**
     * Constructs a new SdkAudioStreamIdInfoFrame.
     * @exports SdkAudioStreamIdInfoFrame
     * @classdesc Represents a SdkAudioStreamIdInfoFrame.
     * @implements ISdkAudioStreamIdInfoFrame
     * @constructor
     * @param {ISdkAudioStreamIdInfoFrame=} [properties] Properties to set
     */
    function SdkAudioStreamIdInfoFrame(properties) {
        this.streams = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioStreamIdInfoFrame streams.
     * @member {Array.<ISdkAudioStreamIdInfo>} streams
     * @memberof SdkAudioStreamIdInfoFrame
     * @instance
     */
    SdkAudioStreamIdInfoFrame.prototype.streams = $util.emptyArray;

    /**
     * Creates a new SdkAudioStreamIdInfoFrame instance using the specified properties.
     * @function create
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {ISdkAudioStreamIdInfoFrame=} [properties] Properties to set
     * @returns {SdkAudioStreamIdInfoFrame} SdkAudioStreamIdInfoFrame instance
     */
    SdkAudioStreamIdInfoFrame.create = function create(properties) {
        return new SdkAudioStreamIdInfoFrame(properties);
    };

    /**
     * Encodes the specified SdkAudioStreamIdInfoFrame message. Does not implicitly {@link SdkAudioStreamIdInfoFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {ISdkAudioStreamIdInfoFrame} message SdkAudioStreamIdInfoFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStreamIdInfoFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.streams != null && message.streams.length)
            for (var i = 0; i < message.streams.length; ++i)
                $root.SdkAudioStreamIdInfo.encode(message.streams[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkAudioStreamIdInfoFrame message, length delimited. Does not implicitly {@link SdkAudioStreamIdInfoFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {ISdkAudioStreamIdInfoFrame} message SdkAudioStreamIdInfoFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStreamIdInfoFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioStreamIdInfoFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioStreamIdInfoFrame} SdkAudioStreamIdInfoFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStreamIdInfoFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioStreamIdInfoFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.streams && message.streams.length))
                    message.streams = [];
                message.streams.push($root.SdkAudioStreamIdInfo.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioStreamIdInfoFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioStreamIdInfoFrame} SdkAudioStreamIdInfoFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStreamIdInfoFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioStreamIdInfoFrame message.
     * @function verify
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioStreamIdInfoFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.streams != null && message.hasOwnProperty("streams")) {
            if (!Array.isArray(message.streams))
                return "streams: array expected";
            for (var i = 0; i < message.streams.length; ++i) {
                var error = $root.SdkAudioStreamIdInfo.verify(message.streams[i]);
                if (error)
                    return "streams." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkAudioStreamIdInfoFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioStreamIdInfoFrame} SdkAudioStreamIdInfoFrame
     */
    SdkAudioStreamIdInfoFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioStreamIdInfoFrame)
            return object;
        var message = new $root.SdkAudioStreamIdInfoFrame();
        if (object.streams) {
            if (!Array.isArray(object.streams))
                throw TypeError(".SdkAudioStreamIdInfoFrame.streams: array expected");
            message.streams = [];
            for (var i = 0; i < object.streams.length; ++i) {
                if (typeof object.streams[i] !== "object")
                    throw TypeError(".SdkAudioStreamIdInfoFrame.streams: object expected");
                message.streams[i] = $root.SdkAudioStreamIdInfo.fromObject(object.streams[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioStreamIdInfoFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioStreamIdInfoFrame
     * @static
     * @param {SdkAudioStreamIdInfoFrame} message SdkAudioStreamIdInfoFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioStreamIdInfoFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.streams = [];
        if (message.streams && message.streams.length) {
            object.streams = [];
            for (var j = 0; j < message.streams.length; ++j)
                object.streams[j] = $root.SdkAudioStreamIdInfo.toObject(message.streams[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkAudioStreamIdInfoFrame to JSON.
     * @function toJSON
     * @memberof SdkAudioStreamIdInfoFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioStreamIdInfoFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioStreamIdInfoFrame;
})();

$root.SdkAudioStreamIdInfo = (function() {

    /**
     * Properties of a SdkAudioStreamIdInfo.
     * @exports ISdkAudioStreamIdInfo
     * @interface ISdkAudioStreamIdInfo
     * @property {number|null} [audioStreamId] SdkAudioStreamIdInfo audioStreamId
     * @property {string|null} [attendeeId] SdkAudioStreamIdInfo attendeeId
     * @property {boolean|null} [muted] SdkAudioStreamIdInfo muted
     * @property {string|null} [externalUserId] SdkAudioStreamIdInfo externalUserId
     * @property {boolean|null} [dropped] SdkAudioStreamIdInfo dropped
     */

    /**
     * Constructs a new SdkAudioStreamIdInfo.
     * @exports SdkAudioStreamIdInfo
     * @classdesc Represents a SdkAudioStreamIdInfo.
     * @implements ISdkAudioStreamIdInfo
     * @constructor
     * @param {ISdkAudioStreamIdInfo=} [properties] Properties to set
     */
    function SdkAudioStreamIdInfo(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioStreamIdInfo audioStreamId.
     * @member {number} audioStreamId
     * @memberof SdkAudioStreamIdInfo
     * @instance
     */
    SdkAudioStreamIdInfo.prototype.audioStreamId = 0;

    /**
     * SdkAudioStreamIdInfo attendeeId.
     * @member {string} attendeeId
     * @memberof SdkAudioStreamIdInfo
     * @instance
     */
    SdkAudioStreamIdInfo.prototype.attendeeId = "";

    /**
     * SdkAudioStreamIdInfo muted.
     * @member {boolean} muted
     * @memberof SdkAudioStreamIdInfo
     * @instance
     */
    SdkAudioStreamIdInfo.prototype.muted = false;

    /**
     * SdkAudioStreamIdInfo externalUserId.
     * @member {string} externalUserId
     * @memberof SdkAudioStreamIdInfo
     * @instance
     */
    SdkAudioStreamIdInfo.prototype.externalUserId = "";

    /**
     * SdkAudioStreamIdInfo dropped.
     * @member {boolean} dropped
     * @memberof SdkAudioStreamIdInfo
     * @instance
     */
    SdkAudioStreamIdInfo.prototype.dropped = false;

    /**
     * Creates a new SdkAudioStreamIdInfo instance using the specified properties.
     * @function create
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {ISdkAudioStreamIdInfo=} [properties] Properties to set
     * @returns {SdkAudioStreamIdInfo} SdkAudioStreamIdInfo instance
     */
    SdkAudioStreamIdInfo.create = function create(properties) {
        return new SdkAudioStreamIdInfo(properties);
    };

    /**
     * Encodes the specified SdkAudioStreamIdInfo message. Does not implicitly {@link SdkAudioStreamIdInfo.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {ISdkAudioStreamIdInfo} message SdkAudioStreamIdInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStreamIdInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.audioStreamId);
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.attendeeId);
        if (message.muted != null && message.hasOwnProperty("muted"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.muted);
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.externalUserId);
        if (message.dropped != null && message.hasOwnProperty("dropped"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.dropped);
        return writer;
    };

    /**
     * Encodes the specified SdkAudioStreamIdInfo message, length delimited. Does not implicitly {@link SdkAudioStreamIdInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {ISdkAudioStreamIdInfo} message SdkAudioStreamIdInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStreamIdInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioStreamIdInfo message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioStreamIdInfo} SdkAudioStreamIdInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStreamIdInfo.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioStreamIdInfo();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.audioStreamId = reader.uint32();
                break;
            case 2:
                message.attendeeId = reader.string();
                break;
            case 3:
                message.muted = reader.bool();
                break;
            case 4:
                message.externalUserId = reader.string();
                break;
            case 5:
                message.dropped = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioStreamIdInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioStreamIdInfo} SdkAudioStreamIdInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStreamIdInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioStreamIdInfo message.
     * @function verify
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioStreamIdInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            if (!$util.isInteger(message.audioStreamId))
                return "audioStreamId: integer expected";
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            if (!$util.isString(message.attendeeId))
                return "attendeeId: string expected";
        if (message.muted != null && message.hasOwnProperty("muted"))
            if (typeof message.muted !== "boolean")
                return "muted: boolean expected";
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            if (!$util.isString(message.externalUserId))
                return "externalUserId: string expected";
        if (message.dropped != null && message.hasOwnProperty("dropped"))
            if (typeof message.dropped !== "boolean")
                return "dropped: boolean expected";
        return null;
    };

    /**
     * Creates a SdkAudioStreamIdInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioStreamIdInfo} SdkAudioStreamIdInfo
     */
    SdkAudioStreamIdInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioStreamIdInfo)
            return object;
        var message = new $root.SdkAudioStreamIdInfo();
        if (object.audioStreamId != null)
            message.audioStreamId = object.audioStreamId >>> 0;
        if (object.attendeeId != null)
            message.attendeeId = String(object.attendeeId);
        if (object.muted != null)
            message.muted = Boolean(object.muted);
        if (object.externalUserId != null)
            message.externalUserId = String(object.externalUserId);
        if (object.dropped != null)
            message.dropped = Boolean(object.dropped);
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioStreamIdInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioStreamIdInfo
     * @static
     * @param {SdkAudioStreamIdInfo} message SdkAudioStreamIdInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioStreamIdInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.audioStreamId = 0;
            object.attendeeId = "";
            object.muted = false;
            object.externalUserId = "";
            object.dropped = false;
        }
        if (message.audioStreamId != null && message.hasOwnProperty("audioStreamId"))
            object.audioStreamId = message.audioStreamId;
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            object.attendeeId = message.attendeeId;
        if (message.muted != null && message.hasOwnProperty("muted"))
            object.muted = message.muted;
        if (message.externalUserId != null && message.hasOwnProperty("externalUserId"))
            object.externalUserId = message.externalUserId;
        if (message.dropped != null && message.hasOwnProperty("dropped"))
            object.dropped = message.dropped;
        return object;
    };

    /**
     * Converts this SdkAudioStreamIdInfo to JSON.
     * @function toJSON
     * @memberof SdkAudioStreamIdInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioStreamIdInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioStreamIdInfo;
})();

/**
 * SdkPingPongType enum.
 * @exports SdkPingPongType
 * @enum {string}
 * @property {number} PING=1 PING value
 * @property {number} PONG=2 PONG value
 */
$root.SdkPingPongType = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[1] = "PING"] = 1;
    values[valuesById[2] = "PONG"] = 2;
    return values;
})();

$root.SdkPingPongFrame = (function() {

    /**
     * Properties of a SdkPingPongFrame.
     * @exports ISdkPingPongFrame
     * @interface ISdkPingPongFrame
     * @property {SdkPingPongType} type SdkPingPongFrame type
     * @property {number} pingId SdkPingPongFrame pingId
     */

    /**
     * Constructs a new SdkPingPongFrame.
     * @exports SdkPingPongFrame
     * @classdesc Represents a SdkPingPongFrame.
     * @implements ISdkPingPongFrame
     * @constructor
     * @param {ISdkPingPongFrame=} [properties] Properties to set
     */
    function SdkPingPongFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkPingPongFrame type.
     * @member {SdkPingPongType} type
     * @memberof SdkPingPongFrame
     * @instance
     */
    SdkPingPongFrame.prototype.type = 1;

    /**
     * SdkPingPongFrame pingId.
     * @member {number} pingId
     * @memberof SdkPingPongFrame
     * @instance
     */
    SdkPingPongFrame.prototype.pingId = 0;

    /**
     * Creates a new SdkPingPongFrame instance using the specified properties.
     * @function create
     * @memberof SdkPingPongFrame
     * @static
     * @param {ISdkPingPongFrame=} [properties] Properties to set
     * @returns {SdkPingPongFrame} SdkPingPongFrame instance
     */
    SdkPingPongFrame.create = function create(properties) {
        return new SdkPingPongFrame(properties);
    };

    /**
     * Encodes the specified SdkPingPongFrame message. Does not implicitly {@link SdkPingPongFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkPingPongFrame
     * @static
     * @param {ISdkPingPongFrame} message SdkPingPongFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkPingPongFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
        writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.pingId);
        return writer;
    };

    /**
     * Encodes the specified SdkPingPongFrame message, length delimited. Does not implicitly {@link SdkPingPongFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkPingPongFrame
     * @static
     * @param {ISdkPingPongFrame} message SdkPingPongFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkPingPongFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkPingPongFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkPingPongFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkPingPongFrame} SdkPingPongFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkPingPongFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkPingPongFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.type = reader.int32();
                break;
            case 2:
                message.pingId = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("type"))
            throw $util.ProtocolError("missing required 'type'", { instance: message });
        if (!message.hasOwnProperty("pingId"))
            throw $util.ProtocolError("missing required 'pingId'", { instance: message });
        return message;
    };

    /**
     * Decodes a SdkPingPongFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkPingPongFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkPingPongFrame} SdkPingPongFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkPingPongFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkPingPongFrame message.
     * @function verify
     * @memberof SdkPingPongFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkPingPongFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        switch (message.type) {
        default:
            return "type: enum value expected";
        case 1:
        case 2:
            break;
        }
        if (!$util.isInteger(message.pingId))
            return "pingId: integer expected";
        return null;
    };

    /**
     * Creates a SdkPingPongFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkPingPongFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkPingPongFrame} SdkPingPongFrame
     */
    SdkPingPongFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkPingPongFrame)
            return object;
        var message = new $root.SdkPingPongFrame();
        switch (object.type) {
        case "PING":
        case 1:
            message.type = 1;
            break;
        case "PONG":
        case 2:
            message.type = 2;
            break;
        }
        if (object.pingId != null)
            message.pingId = object.pingId >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkPingPongFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkPingPongFrame
     * @static
     * @param {SdkPingPongFrame} message SdkPingPongFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkPingPongFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.type = options.enums === String ? "PING" : 1;
            object.pingId = 0;
        }
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.SdkPingPongType[message.type] : message.type;
        if (message.pingId != null && message.hasOwnProperty("pingId"))
            object.pingId = message.pingId;
        return object;
    };

    /**
     * Converts this SdkPingPongFrame to JSON.
     * @function toJSON
     * @memberof SdkPingPongFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkPingPongFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkPingPongFrame;
})();

$root.SdkAudioStatusFrame = (function() {

    /**
     * Properties of a SdkAudioStatusFrame.
     * @exports ISdkAudioStatusFrame
     * @interface ISdkAudioStatusFrame
     * @property {number|null} [audioStatus] SdkAudioStatusFrame audioStatus
     */

    /**
     * Constructs a new SdkAudioStatusFrame.
     * @exports SdkAudioStatusFrame
     * @classdesc Represents a SdkAudioStatusFrame.
     * @implements ISdkAudioStatusFrame
     * @constructor
     * @param {ISdkAudioStatusFrame=} [properties] Properties to set
     */
    function SdkAudioStatusFrame(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkAudioStatusFrame audioStatus.
     * @member {number} audioStatus
     * @memberof SdkAudioStatusFrame
     * @instance
     */
    SdkAudioStatusFrame.prototype.audioStatus = 0;

    /**
     * Creates a new SdkAudioStatusFrame instance using the specified properties.
     * @function create
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {ISdkAudioStatusFrame=} [properties] Properties to set
     * @returns {SdkAudioStatusFrame} SdkAudioStatusFrame instance
     */
    SdkAudioStatusFrame.create = function create(properties) {
        return new SdkAudioStatusFrame(properties);
    };

    /**
     * Encodes the specified SdkAudioStatusFrame message. Does not implicitly {@link SdkAudioStatusFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {ISdkAudioStatusFrame} message SdkAudioStatusFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStatusFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.audioStatus);
        return writer;
    };

    /**
     * Encodes the specified SdkAudioStatusFrame message, length delimited. Does not implicitly {@link SdkAudioStatusFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {ISdkAudioStatusFrame} message SdkAudioStatusFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkAudioStatusFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkAudioStatusFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkAudioStatusFrame} SdkAudioStatusFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStatusFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkAudioStatusFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.audioStatus = reader.uint32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkAudioStatusFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkAudioStatusFrame} SdkAudioStatusFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkAudioStatusFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkAudioStatusFrame message.
     * @function verify
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkAudioStatusFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus"))
            if (!$util.isInteger(message.audioStatus))
                return "audioStatus: integer expected";
        return null;
    };

    /**
     * Creates a SdkAudioStatusFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkAudioStatusFrame} SdkAudioStatusFrame
     */
    SdkAudioStatusFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkAudioStatusFrame)
            return object;
        var message = new $root.SdkAudioStatusFrame();
        if (object.audioStatus != null)
            message.audioStatus = object.audioStatus >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a SdkAudioStatusFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkAudioStatusFrame
     * @static
     * @param {SdkAudioStatusFrame} message SdkAudioStatusFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkAudioStatusFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.audioStatus = 0;
        if (message.audioStatus != null && message.hasOwnProperty("audioStatus"))
            object.audioStatus = message.audioStatus;
        return object;
    };

    /**
     * Converts this SdkAudioStatusFrame to JSON.
     * @function toJSON
     * @memberof SdkAudioStatusFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkAudioStatusFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkAudioStatusFrame;
})();

$root.SdkMetric = (function() {

    /**
     * Properties of a SdkMetric.
     * @exports ISdkMetric
     * @interface ISdkMetric
     * @property {SdkMetric.Type|null} [type] SdkMetric type
     * @property {number|null} [value] SdkMetric value
     */

    /**
     * Constructs a new SdkMetric.
     * @exports SdkMetric
     * @classdesc Represents a SdkMetric.
     * @implements ISdkMetric
     * @constructor
     * @param {ISdkMetric=} [properties] Properties to set
     */
    function SdkMetric(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkMetric type.
     * @member {SdkMetric.Type} type
     * @memberof SdkMetric
     * @instance
     */
    SdkMetric.prototype.type = 1;

    /**
     * SdkMetric value.
     * @member {number} value
     * @memberof SdkMetric
     * @instance
     */
    SdkMetric.prototype.value = 0;

    /**
     * Creates a new SdkMetric instance using the specified properties.
     * @function create
     * @memberof SdkMetric
     * @static
     * @param {ISdkMetric=} [properties] Properties to set
     * @returns {SdkMetric} SdkMetric instance
     */
    SdkMetric.create = function create(properties) {
        return new SdkMetric(properties);
    };

    /**
     * Encodes the specified SdkMetric message. Does not implicitly {@link SdkMetric.verify|verify} messages.
     * @function encode
     * @memberof SdkMetric
     * @static
     * @param {ISdkMetric} message SdkMetric message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkMetric.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.type != null && message.hasOwnProperty("type"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
        if (message.value != null && message.hasOwnProperty("value"))
            writer.uint32(/* id 2, wireType 1 =*/17).double(message.value);
        return writer;
    };

    /**
     * Encodes the specified SdkMetric message, length delimited. Does not implicitly {@link SdkMetric.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkMetric
     * @static
     * @param {ISdkMetric} message SdkMetric message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkMetric.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkMetric message from the specified reader or buffer.
     * @function decode
     * @memberof SdkMetric
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkMetric} SdkMetric
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkMetric.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkMetric();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.type = reader.int32();
                break;
            case 2:
                message.value = reader.double();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkMetric message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkMetric
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkMetric} SdkMetric
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkMetric.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkMetric message.
     * @function verify
     * @memberof SdkMetric
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkMetric.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.type != null && message.hasOwnProperty("type"))
            switch (message.type) {
            default:
                return "type: enum value expected";
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22:
            case 23:
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
            case 38:
            case 39:
            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
            case 48:
            case 49:
                break;
            }
        if (message.value != null && message.hasOwnProperty("value"))
            if (typeof message.value !== "number")
                return "value: number expected";
        return null;
    };

    /**
     * Creates a SdkMetric message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkMetric
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkMetric} SdkMetric
     */
    SdkMetric.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkMetric)
            return object;
        var message = new $root.SdkMetric();
        switch (object.type) {
        case "VIDEO_ACTUAL_ENCODER_BITRATE":
        case 1:
            message.type = 1;
            break;
        case "VIDEO_AVAILABLE_SEND_BANDWIDTH":
        case 2:
            message.type = 2;
            break;
        case "VIDEO_RETRANSMIT_BITRATE":
        case 3:
            message.type = 3;
            break;
        case "VIDEO_AVAILABLE_RECEIVE_BANDWIDTH":
        case 4:
            message.type = 4;
            break;
        case "VIDEO_TARGET_ENCODER_BITRATE":
        case 5:
            message.type = 5;
            break;
        case "VIDEO_BUCKET_DELAY_MS":
        case 6:
            message.type = 6;
            break;
        case "STUN_RTT_MS":
        case 7:
            message.type = 7;
            break;
        case "SOCKET_DISCARDED_PPS":
        case 8:
            message.type = 8;
            break;
        case "RTC_MIC_JITTER_MS":
        case 9:
            message.type = 9;
            break;
        case "RTC_MIC_PPS":
        case 10:
            message.type = 10;
            break;
        case "RTC_MIC_FRACTION_PACKET_LOST_PERCENT":
        case 11:
            message.type = 11;
            break;
        case "RTC_MIC_BITRATE":
        case 12:
            message.type = 12;
            break;
        case "RTC_MIC_RTT_MS":
        case 13:
            message.type = 13;
            break;
        case "RTC_SPK_PPS":
        case 14:
            message.type = 14;
            break;
        case "RTC_SPK_FRACTION_PACKET_LOST_PERCENT":
        case 15:
            message.type = 15;
            break;
        case "RTC_SPK_JITTER_MS":
        case 16:
            message.type = 16;
            break;
        case "RTC_SPK_FRACTION_DECODER_LOSS_PERCENT":
        case 17:
            message.type = 17;
            break;
        case "RTC_SPK_BITRATE":
        case 18:
            message.type = 18;
            break;
        case "RTC_SPK_CURRENT_DELAY_MS":
        case 19:
            message.type = 19;
            break;
        case "RTC_SPK_JITTER_BUFFER_MS":
        case 20:
            message.type = 20;
            break;
        case "VIDEO_SENT_RTT_MS":
        case 21:
            message.type = 21;
            break;
        case "VIDEO_ENCODE_USAGE_PERCENT":
        case 22:
            message.type = 22;
            break;
        case "VIDEO_NACKS_RECEIVED":
        case 23:
            message.type = 23;
            break;
        case "VIDEO_PLIS_RECEIVED":
        case 24:
            message.type = 24;
            break;
        case "VIDEO_AVERAGE_ENCODE_MS":
        case 25:
            message.type = 25;
            break;
        case "VIDEO_INPUT_FPS":
        case 26:
            message.type = 26;
            break;
        case "VIDEO_ENCODE_FPS":
        case 27:
            message.type = 27;
            break;
        case "VIDEO_SENT_FPS":
        case 28:
            message.type = 28;
            break;
        case "VIDEO_FIRS_RECEIVED":
        case 29:
            message.type = 29;
            break;
        case "VIDEO_SENT_PPS":
        case 30:
            message.type = 30;
            break;
        case "VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT":
        case 31:
            message.type = 31;
            break;
        case "VIDEO_SENT_BITRATE":
        case 32:
            message.type = 32;
            break;
        case "VIDEO_DROPPED_FPS":
        case 33:
            message.type = 33;
            break;
        case "VIDEO_TARGET_DELAY_MS":
        case 34:
            message.type = 34;
            break;
        case "VIDEO_DECODE_MS":
        case 35:
            message.type = 35;
            break;
        case "VIDEO_OUTPUT_FPS":
        case 36:
            message.type = 36;
            break;
        case "VIDEO_RECEIVED_PPS":
        case 37:
            message.type = 37;
            break;
        case "VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT":
        case 38:
            message.type = 38;
            break;
        case "VIDEO_RENDER_DELAY_MS":
        case 39:
            message.type = 39;
            break;
        case "VIDEO_RECEIVED_FPS":
        case 40:
            message.type = 40;
            break;
        case "VIDEO_DECODE_FPS":
        case 41:
            message.type = 41;
            break;
        case "VIDEO_NACKS_SENT":
        case 42:
            message.type = 42;
            break;
        case "VIDEO_FIRS_SENT":
        case 43:
            message.type = 43;
            break;
        case "VIDEO_RECEIVED_BITRATE":
        case 44:
            message.type = 44;
            break;
        case "VIDEO_CURRENT_DELAY_MS":
        case 45:
            message.type = 45;
            break;
        case "VIDEO_JITTER_BUFFER_MS":
        case 46:
            message.type = 46;
            break;
        case "VIDEO_DISCARDED_PPS":
        case 47:
            message.type = 47;
            break;
        case "VIDEO_PLIS_SENT":
        case 48:
            message.type = 48;
            break;
        case "VIDEO_RECEIVED_JITTER_MS":
        case 49:
            message.type = 49;
            break;
        }
        if (object.value != null)
            message.value = Number(object.value);
        return message;
    };

    /**
     * Creates a plain object from a SdkMetric message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkMetric
     * @static
     * @param {SdkMetric} message SdkMetric
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkMetric.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.type = options.enums === String ? "VIDEO_ACTUAL_ENCODER_BITRATE" : 1;
            object.value = 0;
        }
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.SdkMetric.Type[message.type] : message.type;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
        return object;
    };

    /**
     * Converts this SdkMetric to JSON.
     * @function toJSON
     * @memberof SdkMetric
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkMetric.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Type enum.
     * @name SdkMetric.Type
     * @enum {string}
     * @property {number} VIDEO_ACTUAL_ENCODER_BITRATE=1 VIDEO_ACTUAL_ENCODER_BITRATE value
     * @property {number} VIDEO_AVAILABLE_SEND_BANDWIDTH=2 VIDEO_AVAILABLE_SEND_BANDWIDTH value
     * @property {number} VIDEO_RETRANSMIT_BITRATE=3 VIDEO_RETRANSMIT_BITRATE value
     * @property {number} VIDEO_AVAILABLE_RECEIVE_BANDWIDTH=4 VIDEO_AVAILABLE_RECEIVE_BANDWIDTH value
     * @property {number} VIDEO_TARGET_ENCODER_BITRATE=5 VIDEO_TARGET_ENCODER_BITRATE value
     * @property {number} VIDEO_BUCKET_DELAY_MS=6 VIDEO_BUCKET_DELAY_MS value
     * @property {number} STUN_RTT_MS=7 STUN_RTT_MS value
     * @property {number} SOCKET_DISCARDED_PPS=8 SOCKET_DISCARDED_PPS value
     * @property {number} RTC_MIC_JITTER_MS=9 RTC_MIC_JITTER_MS value
     * @property {number} RTC_MIC_PPS=10 RTC_MIC_PPS value
     * @property {number} RTC_MIC_FRACTION_PACKET_LOST_PERCENT=11 RTC_MIC_FRACTION_PACKET_LOST_PERCENT value
     * @property {number} RTC_MIC_BITRATE=12 RTC_MIC_BITRATE value
     * @property {number} RTC_MIC_RTT_MS=13 RTC_MIC_RTT_MS value
     * @property {number} RTC_SPK_PPS=14 RTC_SPK_PPS value
     * @property {number} RTC_SPK_FRACTION_PACKET_LOST_PERCENT=15 RTC_SPK_FRACTION_PACKET_LOST_PERCENT value
     * @property {number} RTC_SPK_JITTER_MS=16 RTC_SPK_JITTER_MS value
     * @property {number} RTC_SPK_FRACTION_DECODER_LOSS_PERCENT=17 RTC_SPK_FRACTION_DECODER_LOSS_PERCENT value
     * @property {number} RTC_SPK_BITRATE=18 RTC_SPK_BITRATE value
     * @property {number} RTC_SPK_CURRENT_DELAY_MS=19 RTC_SPK_CURRENT_DELAY_MS value
     * @property {number} RTC_SPK_JITTER_BUFFER_MS=20 RTC_SPK_JITTER_BUFFER_MS value
     * @property {number} VIDEO_SENT_RTT_MS=21 VIDEO_SENT_RTT_MS value
     * @property {number} VIDEO_ENCODE_USAGE_PERCENT=22 VIDEO_ENCODE_USAGE_PERCENT value
     * @property {number} VIDEO_NACKS_RECEIVED=23 VIDEO_NACKS_RECEIVED value
     * @property {number} VIDEO_PLIS_RECEIVED=24 VIDEO_PLIS_RECEIVED value
     * @property {number} VIDEO_AVERAGE_ENCODE_MS=25 VIDEO_AVERAGE_ENCODE_MS value
     * @property {number} VIDEO_INPUT_FPS=26 VIDEO_INPUT_FPS value
     * @property {number} VIDEO_ENCODE_FPS=27 VIDEO_ENCODE_FPS value
     * @property {number} VIDEO_SENT_FPS=28 VIDEO_SENT_FPS value
     * @property {number} VIDEO_FIRS_RECEIVED=29 VIDEO_FIRS_RECEIVED value
     * @property {number} VIDEO_SENT_PPS=30 VIDEO_SENT_PPS value
     * @property {number} VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT=31 VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT value
     * @property {number} VIDEO_SENT_BITRATE=32 VIDEO_SENT_BITRATE value
     * @property {number} VIDEO_DROPPED_FPS=33 VIDEO_DROPPED_FPS value
     * @property {number} VIDEO_TARGET_DELAY_MS=34 VIDEO_TARGET_DELAY_MS value
     * @property {number} VIDEO_DECODE_MS=35 VIDEO_DECODE_MS value
     * @property {number} VIDEO_OUTPUT_FPS=36 VIDEO_OUTPUT_FPS value
     * @property {number} VIDEO_RECEIVED_PPS=37 VIDEO_RECEIVED_PPS value
     * @property {number} VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT=38 VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT value
     * @property {number} VIDEO_RENDER_DELAY_MS=39 VIDEO_RENDER_DELAY_MS value
     * @property {number} VIDEO_RECEIVED_FPS=40 VIDEO_RECEIVED_FPS value
     * @property {number} VIDEO_DECODE_FPS=41 VIDEO_DECODE_FPS value
     * @property {number} VIDEO_NACKS_SENT=42 VIDEO_NACKS_SENT value
     * @property {number} VIDEO_FIRS_SENT=43 VIDEO_FIRS_SENT value
     * @property {number} VIDEO_RECEIVED_BITRATE=44 VIDEO_RECEIVED_BITRATE value
     * @property {number} VIDEO_CURRENT_DELAY_MS=45 VIDEO_CURRENT_DELAY_MS value
     * @property {number} VIDEO_JITTER_BUFFER_MS=46 VIDEO_JITTER_BUFFER_MS value
     * @property {number} VIDEO_DISCARDED_PPS=47 VIDEO_DISCARDED_PPS value
     * @property {number} VIDEO_PLIS_SENT=48 VIDEO_PLIS_SENT value
     * @property {number} VIDEO_RECEIVED_JITTER_MS=49 VIDEO_RECEIVED_JITTER_MS value
     */
    SdkMetric.Type = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[1] = "VIDEO_ACTUAL_ENCODER_BITRATE"] = 1;
        values[valuesById[2] = "VIDEO_AVAILABLE_SEND_BANDWIDTH"] = 2;
        values[valuesById[3] = "VIDEO_RETRANSMIT_BITRATE"] = 3;
        values[valuesById[4] = "VIDEO_AVAILABLE_RECEIVE_BANDWIDTH"] = 4;
        values[valuesById[5] = "VIDEO_TARGET_ENCODER_BITRATE"] = 5;
        values[valuesById[6] = "VIDEO_BUCKET_DELAY_MS"] = 6;
        values[valuesById[7] = "STUN_RTT_MS"] = 7;
        values[valuesById[8] = "SOCKET_DISCARDED_PPS"] = 8;
        values[valuesById[9] = "RTC_MIC_JITTER_MS"] = 9;
        values[valuesById[10] = "RTC_MIC_PPS"] = 10;
        values[valuesById[11] = "RTC_MIC_FRACTION_PACKET_LOST_PERCENT"] = 11;
        values[valuesById[12] = "RTC_MIC_BITRATE"] = 12;
        values[valuesById[13] = "RTC_MIC_RTT_MS"] = 13;
        values[valuesById[14] = "RTC_SPK_PPS"] = 14;
        values[valuesById[15] = "RTC_SPK_FRACTION_PACKET_LOST_PERCENT"] = 15;
        values[valuesById[16] = "RTC_SPK_JITTER_MS"] = 16;
        values[valuesById[17] = "RTC_SPK_FRACTION_DECODER_LOSS_PERCENT"] = 17;
        values[valuesById[18] = "RTC_SPK_BITRATE"] = 18;
        values[valuesById[19] = "RTC_SPK_CURRENT_DELAY_MS"] = 19;
        values[valuesById[20] = "RTC_SPK_JITTER_BUFFER_MS"] = 20;
        values[valuesById[21] = "VIDEO_SENT_RTT_MS"] = 21;
        values[valuesById[22] = "VIDEO_ENCODE_USAGE_PERCENT"] = 22;
        values[valuesById[23] = "VIDEO_NACKS_RECEIVED"] = 23;
        values[valuesById[24] = "VIDEO_PLIS_RECEIVED"] = 24;
        values[valuesById[25] = "VIDEO_AVERAGE_ENCODE_MS"] = 25;
        values[valuesById[26] = "VIDEO_INPUT_FPS"] = 26;
        values[valuesById[27] = "VIDEO_ENCODE_FPS"] = 27;
        values[valuesById[28] = "VIDEO_SENT_FPS"] = 28;
        values[valuesById[29] = "VIDEO_FIRS_RECEIVED"] = 29;
        values[valuesById[30] = "VIDEO_SENT_PPS"] = 30;
        values[valuesById[31] = "VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT"] = 31;
        values[valuesById[32] = "VIDEO_SENT_BITRATE"] = 32;
        values[valuesById[33] = "VIDEO_DROPPED_FPS"] = 33;
        values[valuesById[34] = "VIDEO_TARGET_DELAY_MS"] = 34;
        values[valuesById[35] = "VIDEO_DECODE_MS"] = 35;
        values[valuesById[36] = "VIDEO_OUTPUT_FPS"] = 36;
        values[valuesById[37] = "VIDEO_RECEIVED_PPS"] = 37;
        values[valuesById[38] = "VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT"] = 38;
        values[valuesById[39] = "VIDEO_RENDER_DELAY_MS"] = 39;
        values[valuesById[40] = "VIDEO_RECEIVED_FPS"] = 40;
        values[valuesById[41] = "VIDEO_DECODE_FPS"] = 41;
        values[valuesById[42] = "VIDEO_NACKS_SENT"] = 42;
        values[valuesById[43] = "VIDEO_FIRS_SENT"] = 43;
        values[valuesById[44] = "VIDEO_RECEIVED_BITRATE"] = 44;
        values[valuesById[45] = "VIDEO_CURRENT_DELAY_MS"] = 45;
        values[valuesById[46] = "VIDEO_JITTER_BUFFER_MS"] = 46;
        values[valuesById[47] = "VIDEO_DISCARDED_PPS"] = 47;
        values[valuesById[48] = "VIDEO_PLIS_SENT"] = 48;
        values[valuesById[49] = "VIDEO_RECEIVED_JITTER_MS"] = 49;
        return values;
    })();

    return SdkMetric;
})();

$root.SdkStreamMetricFrame = (function() {

    /**
     * Properties of a SdkStreamMetricFrame.
     * @exports ISdkStreamMetricFrame
     * @interface ISdkStreamMetricFrame
     * @property {number|null} [streamId] SdkStreamMetricFrame streamId
     * @property {number|null} [groupId] SdkStreamMetricFrame groupId
     * @property {Array.<ISdkMetric>|null} [metrics] SdkStreamMetricFrame metrics
     */

    /**
     * Constructs a new SdkStreamMetricFrame.
     * @exports SdkStreamMetricFrame
     * @classdesc Represents a SdkStreamMetricFrame.
     * @implements ISdkStreamMetricFrame
     * @constructor
     * @param {ISdkStreamMetricFrame=} [properties] Properties to set
     */
    function SdkStreamMetricFrame(properties) {
        this.metrics = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkStreamMetricFrame streamId.
     * @member {number} streamId
     * @memberof SdkStreamMetricFrame
     * @instance
     */
    SdkStreamMetricFrame.prototype.streamId = 0;

    /**
     * SdkStreamMetricFrame groupId.
     * @member {number} groupId
     * @memberof SdkStreamMetricFrame
     * @instance
     */
    SdkStreamMetricFrame.prototype.groupId = 0;

    /**
     * SdkStreamMetricFrame metrics.
     * @member {Array.<ISdkMetric>} metrics
     * @memberof SdkStreamMetricFrame
     * @instance
     */
    SdkStreamMetricFrame.prototype.metrics = $util.emptyArray;

    /**
     * Creates a new SdkStreamMetricFrame instance using the specified properties.
     * @function create
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {ISdkStreamMetricFrame=} [properties] Properties to set
     * @returns {SdkStreamMetricFrame} SdkStreamMetricFrame instance
     */
    SdkStreamMetricFrame.create = function create(properties) {
        return new SdkStreamMetricFrame(properties);
    };

    /**
     * Encodes the specified SdkStreamMetricFrame message. Does not implicitly {@link SdkStreamMetricFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {ISdkStreamMetricFrame} message SdkStreamMetricFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamMetricFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.streamId);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.groupId);
        if (message.metrics != null && message.metrics.length)
            for (var i = 0; i < message.metrics.length; ++i)
                $root.SdkMetric.encode(message.metrics[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkStreamMetricFrame message, length delimited. Does not implicitly {@link SdkStreamMetricFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {ISdkStreamMetricFrame} message SdkStreamMetricFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkStreamMetricFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkStreamMetricFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkStreamMetricFrame} SdkStreamMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamMetricFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkStreamMetricFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 3:
                message.streamId = reader.uint32();
                break;
            case 4:
                message.groupId = reader.uint32();
                break;
            case 5:
                if (!(message.metrics && message.metrics.length))
                    message.metrics = [];
                message.metrics.push($root.SdkMetric.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkStreamMetricFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkStreamMetricFrame} SdkStreamMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkStreamMetricFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkStreamMetricFrame message.
     * @function verify
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkStreamMetricFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            if (!$util.isInteger(message.streamId))
                return "streamId: integer expected";
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId))
                return "groupId: integer expected";
        if (message.metrics != null && message.hasOwnProperty("metrics")) {
            if (!Array.isArray(message.metrics))
                return "metrics: array expected";
            for (var i = 0; i < message.metrics.length; ++i) {
                var error = $root.SdkMetric.verify(message.metrics[i]);
                if (error)
                    return "metrics." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkStreamMetricFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkStreamMetricFrame} SdkStreamMetricFrame
     */
    SdkStreamMetricFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkStreamMetricFrame)
            return object;
        var message = new $root.SdkStreamMetricFrame();
        if (object.streamId != null)
            message.streamId = object.streamId >>> 0;
        if (object.groupId != null)
            message.groupId = object.groupId >>> 0;
        if (object.metrics) {
            if (!Array.isArray(object.metrics))
                throw TypeError(".SdkStreamMetricFrame.metrics: array expected");
            message.metrics = [];
            for (var i = 0; i < object.metrics.length; ++i) {
                if (typeof object.metrics[i] !== "object")
                    throw TypeError(".SdkStreamMetricFrame.metrics: object expected");
                message.metrics[i] = $root.SdkMetric.fromObject(object.metrics[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkStreamMetricFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkStreamMetricFrame
     * @static
     * @param {SdkStreamMetricFrame} message SdkStreamMetricFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkStreamMetricFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.metrics = [];
        if (options.defaults) {
            object.streamId = 0;
            object.groupId = 0;
        }
        if (message.streamId != null && message.hasOwnProperty("streamId"))
            object.streamId = message.streamId;
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            object.groupId = message.groupId;
        if (message.metrics && message.metrics.length) {
            object.metrics = [];
            for (var j = 0; j < message.metrics.length; ++j)
                object.metrics[j] = $root.SdkMetric.toObject(message.metrics[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkStreamMetricFrame to JSON.
     * @function toJSON
     * @memberof SdkStreamMetricFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkStreamMetricFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkStreamMetricFrame;
})();

$root.SdkClientMetricFrame = (function() {

    /**
     * Properties of a SdkClientMetricFrame.
     * @exports ISdkClientMetricFrame
     * @interface ISdkClientMetricFrame
     * @property {Array.<ISdkMetric>|null} [globalMetrics] SdkClientMetricFrame globalMetrics
     * @property {Array.<ISdkStreamMetricFrame>|null} [streamMetricFrames] SdkClientMetricFrame streamMetricFrames
     */

    /**
     * Constructs a new SdkClientMetricFrame.
     * @exports SdkClientMetricFrame
     * @classdesc Represents a SdkClientMetricFrame.
     * @implements ISdkClientMetricFrame
     * @constructor
     * @param {ISdkClientMetricFrame=} [properties] Properties to set
     */
    function SdkClientMetricFrame(properties) {
        this.globalMetrics = [];
        this.streamMetricFrames = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkClientMetricFrame globalMetrics.
     * @member {Array.<ISdkMetric>} globalMetrics
     * @memberof SdkClientMetricFrame
     * @instance
     */
    SdkClientMetricFrame.prototype.globalMetrics = $util.emptyArray;

    /**
     * SdkClientMetricFrame streamMetricFrames.
     * @member {Array.<ISdkStreamMetricFrame>} streamMetricFrames
     * @memberof SdkClientMetricFrame
     * @instance
     */
    SdkClientMetricFrame.prototype.streamMetricFrames = $util.emptyArray;

    /**
     * Creates a new SdkClientMetricFrame instance using the specified properties.
     * @function create
     * @memberof SdkClientMetricFrame
     * @static
     * @param {ISdkClientMetricFrame=} [properties] Properties to set
     * @returns {SdkClientMetricFrame} SdkClientMetricFrame instance
     */
    SdkClientMetricFrame.create = function create(properties) {
        return new SdkClientMetricFrame(properties);
    };

    /**
     * Encodes the specified SdkClientMetricFrame message. Does not implicitly {@link SdkClientMetricFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkClientMetricFrame
     * @static
     * @param {ISdkClientMetricFrame} message SdkClientMetricFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkClientMetricFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.globalMetrics != null && message.globalMetrics.length)
            for (var i = 0; i < message.globalMetrics.length; ++i)
                $root.SdkMetric.encode(message.globalMetrics[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.streamMetricFrames != null && message.streamMetricFrames.length)
            for (var i = 0; i < message.streamMetricFrames.length; ++i)
                $root.SdkStreamMetricFrame.encode(message.streamMetricFrames[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkClientMetricFrame message, length delimited. Does not implicitly {@link SdkClientMetricFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkClientMetricFrame
     * @static
     * @param {ISdkClientMetricFrame} message SdkClientMetricFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkClientMetricFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkClientMetricFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkClientMetricFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkClientMetricFrame} SdkClientMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkClientMetricFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkClientMetricFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.globalMetrics && message.globalMetrics.length))
                    message.globalMetrics = [];
                message.globalMetrics.push($root.SdkMetric.decode(reader, reader.uint32()));
                break;
            case 2:
                if (!(message.streamMetricFrames && message.streamMetricFrames.length))
                    message.streamMetricFrames = [];
                message.streamMetricFrames.push($root.SdkStreamMetricFrame.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkClientMetricFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkClientMetricFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkClientMetricFrame} SdkClientMetricFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkClientMetricFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkClientMetricFrame message.
     * @function verify
     * @memberof SdkClientMetricFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkClientMetricFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.globalMetrics != null && message.hasOwnProperty("globalMetrics")) {
            if (!Array.isArray(message.globalMetrics))
                return "globalMetrics: array expected";
            for (var i = 0; i < message.globalMetrics.length; ++i) {
                var error = $root.SdkMetric.verify(message.globalMetrics[i]);
                if (error)
                    return "globalMetrics." + error;
            }
        }
        if (message.streamMetricFrames != null && message.hasOwnProperty("streamMetricFrames")) {
            if (!Array.isArray(message.streamMetricFrames))
                return "streamMetricFrames: array expected";
            for (var i = 0; i < message.streamMetricFrames.length; ++i) {
                var error = $root.SdkStreamMetricFrame.verify(message.streamMetricFrames[i]);
                if (error)
                    return "streamMetricFrames." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkClientMetricFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkClientMetricFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkClientMetricFrame} SdkClientMetricFrame
     */
    SdkClientMetricFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkClientMetricFrame)
            return object;
        var message = new $root.SdkClientMetricFrame();
        if (object.globalMetrics) {
            if (!Array.isArray(object.globalMetrics))
                throw TypeError(".SdkClientMetricFrame.globalMetrics: array expected");
            message.globalMetrics = [];
            for (var i = 0; i < object.globalMetrics.length; ++i) {
                if (typeof object.globalMetrics[i] !== "object")
                    throw TypeError(".SdkClientMetricFrame.globalMetrics: object expected");
                message.globalMetrics[i] = $root.SdkMetric.fromObject(object.globalMetrics[i]);
            }
        }
        if (object.streamMetricFrames) {
            if (!Array.isArray(object.streamMetricFrames))
                throw TypeError(".SdkClientMetricFrame.streamMetricFrames: array expected");
            message.streamMetricFrames = [];
            for (var i = 0; i < object.streamMetricFrames.length; ++i) {
                if (typeof object.streamMetricFrames[i] !== "object")
                    throw TypeError(".SdkClientMetricFrame.streamMetricFrames: object expected");
                message.streamMetricFrames[i] = $root.SdkStreamMetricFrame.fromObject(object.streamMetricFrames[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkClientMetricFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkClientMetricFrame
     * @static
     * @param {SdkClientMetricFrame} message SdkClientMetricFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkClientMetricFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults) {
            object.globalMetrics = [];
            object.streamMetricFrames = [];
        }
        if (message.globalMetrics && message.globalMetrics.length) {
            object.globalMetrics = [];
            for (var j = 0; j < message.globalMetrics.length; ++j)
                object.globalMetrics[j] = $root.SdkMetric.toObject(message.globalMetrics[j], options);
        }
        if (message.streamMetricFrames && message.streamMetricFrames.length) {
            object.streamMetricFrames = [];
            for (var j = 0; j < message.streamMetricFrames.length; ++j)
                object.streamMetricFrames[j] = $root.SdkStreamMetricFrame.toObject(message.streamMetricFrames[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkClientMetricFrame to JSON.
     * @function toJSON
     * @memberof SdkClientMetricFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkClientMetricFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkClientMetricFrame;
})();

$root.SdkDataMessageFrame = (function() {

    /**
     * Properties of a SdkDataMessageFrame.
     * @exports ISdkDataMessageFrame
     * @interface ISdkDataMessageFrame
     * @property {Array.<ISdkDataMessagePayload>|null} [messages] SdkDataMessageFrame messages
     */

    /**
     * Constructs a new SdkDataMessageFrame.
     * @exports SdkDataMessageFrame
     * @classdesc Represents a SdkDataMessageFrame.
     * @implements ISdkDataMessageFrame
     * @constructor
     * @param {ISdkDataMessageFrame=} [properties] Properties to set
     */
    function SdkDataMessageFrame(properties) {
        this.messages = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkDataMessageFrame messages.
     * @member {Array.<ISdkDataMessagePayload>} messages
     * @memberof SdkDataMessageFrame
     * @instance
     */
    SdkDataMessageFrame.prototype.messages = $util.emptyArray;

    /**
     * Creates a new SdkDataMessageFrame instance using the specified properties.
     * @function create
     * @memberof SdkDataMessageFrame
     * @static
     * @param {ISdkDataMessageFrame=} [properties] Properties to set
     * @returns {SdkDataMessageFrame} SdkDataMessageFrame instance
     */
    SdkDataMessageFrame.create = function create(properties) {
        return new SdkDataMessageFrame(properties);
    };

    /**
     * Encodes the specified SdkDataMessageFrame message. Does not implicitly {@link SdkDataMessageFrame.verify|verify} messages.
     * @function encode
     * @memberof SdkDataMessageFrame
     * @static
     * @param {ISdkDataMessageFrame} message SdkDataMessageFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkDataMessageFrame.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.messages != null && message.messages.length)
            for (var i = 0; i < message.messages.length; ++i)
                $root.SdkDataMessagePayload.encode(message.messages[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified SdkDataMessageFrame message, length delimited. Does not implicitly {@link SdkDataMessageFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkDataMessageFrame
     * @static
     * @param {ISdkDataMessageFrame} message SdkDataMessageFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkDataMessageFrame.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkDataMessageFrame message from the specified reader or buffer.
     * @function decode
     * @memberof SdkDataMessageFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkDataMessageFrame} SdkDataMessageFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkDataMessageFrame.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkDataMessageFrame();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                if (!(message.messages && message.messages.length))
                    message.messages = [];
                message.messages.push($root.SdkDataMessagePayload.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkDataMessageFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkDataMessageFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkDataMessageFrame} SdkDataMessageFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkDataMessageFrame.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkDataMessageFrame message.
     * @function verify
     * @memberof SdkDataMessageFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkDataMessageFrame.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.messages != null && message.hasOwnProperty("messages")) {
            if (!Array.isArray(message.messages))
                return "messages: array expected";
            for (var i = 0; i < message.messages.length; ++i) {
                var error = $root.SdkDataMessagePayload.verify(message.messages[i]);
                if (error)
                    return "messages." + error;
            }
        }
        return null;
    };

    /**
     * Creates a SdkDataMessageFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkDataMessageFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkDataMessageFrame} SdkDataMessageFrame
     */
    SdkDataMessageFrame.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkDataMessageFrame)
            return object;
        var message = new $root.SdkDataMessageFrame();
        if (object.messages) {
            if (!Array.isArray(object.messages))
                throw TypeError(".SdkDataMessageFrame.messages: array expected");
            message.messages = [];
            for (var i = 0; i < object.messages.length; ++i) {
                if (typeof object.messages[i] !== "object")
                    throw TypeError(".SdkDataMessageFrame.messages: object expected");
                message.messages[i] = $root.SdkDataMessagePayload.fromObject(object.messages[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkDataMessageFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkDataMessageFrame
     * @static
     * @param {SdkDataMessageFrame} message SdkDataMessageFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkDataMessageFrame.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.messages = [];
        if (message.messages && message.messages.length) {
            object.messages = [];
            for (var j = 0; j < message.messages.length; ++j)
                object.messages[j] = $root.SdkDataMessagePayload.toObject(message.messages[j], options);
        }
        return object;
    };

    /**
     * Converts this SdkDataMessageFrame to JSON.
     * @function toJSON
     * @memberof SdkDataMessageFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkDataMessageFrame.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkDataMessageFrame;
})();

$root.SdkDataMessagePayload = (function() {

    /**
     * Properties of a SdkDataMessagePayload.
     * @exports ISdkDataMessagePayload
     * @interface ISdkDataMessagePayload
     * @property {string|null} [topic] SdkDataMessagePayload topic
     * @property {Uint8Array|null} [data] SdkDataMessagePayload data
     * @property {number|null} [lifetimeMs] SdkDataMessagePayload lifetimeMs
     * @property {string|null} [senderAttendeeId] SdkDataMessagePayload senderAttendeeId
     * @property {number|Long|null} [ingestTimeNs] SdkDataMessagePayload ingestTimeNs
     * @property {string|null} [senderExternalUserId] SdkDataMessagePayload senderExternalUserId
     */

    /**
     * Constructs a new SdkDataMessagePayload.
     * @exports SdkDataMessagePayload
     * @classdesc Represents a SdkDataMessagePayload.
     * @implements ISdkDataMessagePayload
     * @constructor
     * @param {ISdkDataMessagePayload=} [properties] Properties to set
     */
    function SdkDataMessagePayload(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkDataMessagePayload topic.
     * @member {string} topic
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.topic = "";

    /**
     * SdkDataMessagePayload data.
     * @member {Uint8Array} data
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.data = $util.newBuffer([]);

    /**
     * SdkDataMessagePayload lifetimeMs.
     * @member {number} lifetimeMs
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.lifetimeMs = 0;

    /**
     * SdkDataMessagePayload senderAttendeeId.
     * @member {string} senderAttendeeId
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.senderAttendeeId = "";

    /**
     * SdkDataMessagePayload ingestTimeNs.
     * @member {number|Long} ingestTimeNs
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.ingestTimeNs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * SdkDataMessagePayload senderExternalUserId.
     * @member {string} senderExternalUserId
     * @memberof SdkDataMessagePayload
     * @instance
     */
    SdkDataMessagePayload.prototype.senderExternalUserId = "";

    /**
     * Creates a new SdkDataMessagePayload instance using the specified properties.
     * @function create
     * @memberof SdkDataMessagePayload
     * @static
     * @param {ISdkDataMessagePayload=} [properties] Properties to set
     * @returns {SdkDataMessagePayload} SdkDataMessagePayload instance
     */
    SdkDataMessagePayload.create = function create(properties) {
        return new SdkDataMessagePayload(properties);
    };

    /**
     * Encodes the specified SdkDataMessagePayload message. Does not implicitly {@link SdkDataMessagePayload.verify|verify} messages.
     * @function encode
     * @memberof SdkDataMessagePayload
     * @static
     * @param {ISdkDataMessagePayload} message SdkDataMessagePayload message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkDataMessagePayload.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.topic != null && message.hasOwnProperty("topic"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.topic);
        if (message.data != null && message.hasOwnProperty("data"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.data);
        if (message.lifetimeMs != null && message.hasOwnProperty("lifetimeMs"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.lifetimeMs);
        if (message.senderAttendeeId != null && message.hasOwnProperty("senderAttendeeId"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.senderAttendeeId);
        if (message.ingestTimeNs != null && message.hasOwnProperty("ingestTimeNs"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.ingestTimeNs);
        if (message.senderExternalUserId != null && message.hasOwnProperty("senderExternalUserId"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.senderExternalUserId);
        return writer;
    };

    /**
     * Encodes the specified SdkDataMessagePayload message, length delimited. Does not implicitly {@link SdkDataMessagePayload.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkDataMessagePayload
     * @static
     * @param {ISdkDataMessagePayload} message SdkDataMessagePayload message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkDataMessagePayload.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkDataMessagePayload message from the specified reader or buffer.
     * @function decode
     * @memberof SdkDataMessagePayload
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkDataMessagePayload} SdkDataMessagePayload
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkDataMessagePayload.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkDataMessagePayload();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.topic = reader.string();
                break;
            case 2:
                message.data = reader.bytes();
                break;
            case 3:
                message.lifetimeMs = reader.uint32();
                break;
            case 4:
                message.senderAttendeeId = reader.string();
                break;
            case 5:
                message.ingestTimeNs = reader.int64();
                break;
            case 6:
                message.senderExternalUserId = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkDataMessagePayload message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkDataMessagePayload
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkDataMessagePayload} SdkDataMessagePayload
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkDataMessagePayload.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkDataMessagePayload message.
     * @function verify
     * @memberof SdkDataMessagePayload
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkDataMessagePayload.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.topic != null && message.hasOwnProperty("topic"))
            if (!$util.isString(message.topic))
                return "topic: string expected";
        if (message.data != null && message.hasOwnProperty("data"))
            if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                return "data: buffer expected";
        if (message.lifetimeMs != null && message.hasOwnProperty("lifetimeMs"))
            if (!$util.isInteger(message.lifetimeMs))
                return "lifetimeMs: integer expected";
        if (message.senderAttendeeId != null && message.hasOwnProperty("senderAttendeeId"))
            if (!$util.isString(message.senderAttendeeId))
                return "senderAttendeeId: string expected";
        if (message.ingestTimeNs != null && message.hasOwnProperty("ingestTimeNs"))
            if (!$util.isInteger(message.ingestTimeNs) && !(message.ingestTimeNs && $util.isInteger(message.ingestTimeNs.low) && $util.isInteger(message.ingestTimeNs.high)))
                return "ingestTimeNs: integer|Long expected";
        if (message.senderExternalUserId != null && message.hasOwnProperty("senderExternalUserId"))
            if (!$util.isString(message.senderExternalUserId))
                return "senderExternalUserId: string expected";
        return null;
    };

    /**
     * Creates a SdkDataMessagePayload message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkDataMessagePayload
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkDataMessagePayload} SdkDataMessagePayload
     */
    SdkDataMessagePayload.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkDataMessagePayload)
            return object;
        var message = new $root.SdkDataMessagePayload();
        if (object.topic != null)
            message.topic = String(object.topic);
        if (object.data != null)
            if (typeof object.data === "string")
                $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
            else if (object.data.length)
                message.data = object.data;
        if (object.lifetimeMs != null)
            message.lifetimeMs = object.lifetimeMs >>> 0;
        if (object.senderAttendeeId != null)
            message.senderAttendeeId = String(object.senderAttendeeId);
        if (object.ingestTimeNs != null)
            if ($util.Long)
                (message.ingestTimeNs = $util.Long.fromValue(object.ingestTimeNs)).unsigned = false;
            else if (typeof object.ingestTimeNs === "string")
                message.ingestTimeNs = parseInt(object.ingestTimeNs, 10);
            else if (typeof object.ingestTimeNs === "number")
                message.ingestTimeNs = object.ingestTimeNs;
            else if (typeof object.ingestTimeNs === "object")
                message.ingestTimeNs = new $util.LongBits(object.ingestTimeNs.low >>> 0, object.ingestTimeNs.high >>> 0).toNumber();
        if (object.senderExternalUserId != null)
            message.senderExternalUserId = String(object.senderExternalUserId);
        return message;
    };

    /**
     * Creates a plain object from a SdkDataMessagePayload message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkDataMessagePayload
     * @static
     * @param {SdkDataMessagePayload} message SdkDataMessagePayload
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkDataMessagePayload.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.topic = "";
            if (options.bytes === String)
                object.data = "";
            else {
                object.data = [];
                if (options.bytes !== Array)
                    object.data = $util.newBuffer(object.data);
            }
            object.lifetimeMs = 0;
            object.senderAttendeeId = "";
            if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.ingestTimeNs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.ingestTimeNs = options.longs === String ? "0" : 0;
            object.senderExternalUserId = "";
        }
        if (message.topic != null && message.hasOwnProperty("topic"))
            object.topic = message.topic;
        if (message.data != null && message.hasOwnProperty("data"))
            object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
        if (message.lifetimeMs != null && message.hasOwnProperty("lifetimeMs"))
            object.lifetimeMs = message.lifetimeMs;
        if (message.senderAttendeeId != null && message.hasOwnProperty("senderAttendeeId"))
            object.senderAttendeeId = message.senderAttendeeId;
        if (message.ingestTimeNs != null && message.hasOwnProperty("ingestTimeNs"))
            if (typeof message.ingestTimeNs === "number")
                object.ingestTimeNs = options.longs === String ? String(message.ingestTimeNs) : message.ingestTimeNs;
            else
                object.ingestTimeNs = options.longs === String ? $util.Long.prototype.toString.call(message.ingestTimeNs) : options.longs === Number ? new $util.LongBits(message.ingestTimeNs.low >>> 0, message.ingestTimeNs.high >>> 0).toNumber() : message.ingestTimeNs;
        if (message.senderExternalUserId != null && message.hasOwnProperty("senderExternalUserId"))
            object.senderExternalUserId = message.senderExternalUserId;
        return object;
    };

    /**
     * Converts this SdkDataMessagePayload to JSON.
     * @function toJSON
     * @memberof SdkDataMessagePayload
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkDataMessagePayload.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkDataMessagePayload;
})();

$root.SdkTurnCredentials = (function() {

    /**
     * Properties of a SdkTurnCredentials.
     * @exports ISdkTurnCredentials
     * @interface ISdkTurnCredentials
     * @property {string|null} [username] SdkTurnCredentials username
     * @property {string|null} [password] SdkTurnCredentials password
     * @property {number|null} [ttl] SdkTurnCredentials ttl
     * @property {Array.<string>|null} [uris] SdkTurnCredentials uris
     */

    /**
     * Constructs a new SdkTurnCredentials.
     * @exports SdkTurnCredentials
     * @classdesc Represents a SdkTurnCredentials.
     * @implements ISdkTurnCredentials
     * @constructor
     * @param {ISdkTurnCredentials=} [properties] Properties to set
     */
    function SdkTurnCredentials(properties) {
        this.uris = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkTurnCredentials username.
     * @member {string} username
     * @memberof SdkTurnCredentials
     * @instance
     */
    SdkTurnCredentials.prototype.username = "";

    /**
     * SdkTurnCredentials password.
     * @member {string} password
     * @memberof SdkTurnCredentials
     * @instance
     */
    SdkTurnCredentials.prototype.password = "";

    /**
     * SdkTurnCredentials ttl.
     * @member {number} ttl
     * @memberof SdkTurnCredentials
     * @instance
     */
    SdkTurnCredentials.prototype.ttl = 0;

    /**
     * SdkTurnCredentials uris.
     * @member {Array.<string>} uris
     * @memberof SdkTurnCredentials
     * @instance
     */
    SdkTurnCredentials.prototype.uris = $util.emptyArray;

    /**
     * Creates a new SdkTurnCredentials instance using the specified properties.
     * @function create
     * @memberof SdkTurnCredentials
     * @static
     * @param {ISdkTurnCredentials=} [properties] Properties to set
     * @returns {SdkTurnCredentials} SdkTurnCredentials instance
     */
    SdkTurnCredentials.create = function create(properties) {
        return new SdkTurnCredentials(properties);
    };

    /**
     * Encodes the specified SdkTurnCredentials message. Does not implicitly {@link SdkTurnCredentials.verify|verify} messages.
     * @function encode
     * @memberof SdkTurnCredentials
     * @static
     * @param {ISdkTurnCredentials} message SdkTurnCredentials message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkTurnCredentials.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.username != null && message.hasOwnProperty("username"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.username);
        if (message.password != null && message.hasOwnProperty("password"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.password);
        if (message.ttl != null && message.hasOwnProperty("ttl"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.ttl);
        if (message.uris != null && message.uris.length)
            for (var i = 0; i < message.uris.length; ++i)
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.uris[i]);
        return writer;
    };

    /**
     * Encodes the specified SdkTurnCredentials message, length delimited. Does not implicitly {@link SdkTurnCredentials.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkTurnCredentials
     * @static
     * @param {ISdkTurnCredentials} message SdkTurnCredentials message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkTurnCredentials.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkTurnCredentials message from the specified reader or buffer.
     * @function decode
     * @memberof SdkTurnCredentials
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkTurnCredentials} SdkTurnCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkTurnCredentials.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkTurnCredentials();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.username = reader.string();
                break;
            case 2:
                message.password = reader.string();
                break;
            case 3:
                message.ttl = reader.uint32();
                break;
            case 4:
                if (!(message.uris && message.uris.length))
                    message.uris = [];
                message.uris.push(reader.string());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkTurnCredentials message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkTurnCredentials
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkTurnCredentials} SdkTurnCredentials
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkTurnCredentials.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkTurnCredentials message.
     * @function verify
     * @memberof SdkTurnCredentials
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkTurnCredentials.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.username != null && message.hasOwnProperty("username"))
            if (!$util.isString(message.username))
                return "username: string expected";
        if (message.password != null && message.hasOwnProperty("password"))
            if (!$util.isString(message.password))
                return "password: string expected";
        if (message.ttl != null && message.hasOwnProperty("ttl"))
            if (!$util.isInteger(message.ttl))
                return "ttl: integer expected";
        if (message.uris != null && message.hasOwnProperty("uris")) {
            if (!Array.isArray(message.uris))
                return "uris: array expected";
            for (var i = 0; i < message.uris.length; ++i)
                if (!$util.isString(message.uris[i]))
                    return "uris: string[] expected";
        }
        return null;
    };

    /**
     * Creates a SdkTurnCredentials message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkTurnCredentials
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkTurnCredentials} SdkTurnCredentials
     */
    SdkTurnCredentials.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkTurnCredentials)
            return object;
        var message = new $root.SdkTurnCredentials();
        if (object.username != null)
            message.username = String(object.username);
        if (object.password != null)
            message.password = String(object.password);
        if (object.ttl != null)
            message.ttl = object.ttl >>> 0;
        if (object.uris) {
            if (!Array.isArray(object.uris))
                throw TypeError(".SdkTurnCredentials.uris: array expected");
            message.uris = [];
            for (var i = 0; i < object.uris.length; ++i)
                message.uris[i] = String(object.uris[i]);
        }
        return message;
    };

    /**
     * Creates a plain object from a SdkTurnCredentials message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkTurnCredentials
     * @static
     * @param {SdkTurnCredentials} message SdkTurnCredentials
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkTurnCredentials.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.uris = [];
        if (options.defaults) {
            object.username = "";
            object.password = "";
            object.ttl = 0;
        }
        if (message.username != null && message.hasOwnProperty("username"))
            object.username = message.username;
        if (message.password != null && message.hasOwnProperty("password"))
            object.password = message.password;
        if (message.ttl != null && message.hasOwnProperty("ttl"))
            object.ttl = message.ttl;
        if (message.uris && message.uris.length) {
            object.uris = [];
            for (var j = 0; j < message.uris.length; ++j)
                object.uris[j] = message.uris[j];
        }
        return object;
    };

    /**
     * Converts this SdkTurnCredentials to JSON.
     * @function toJSON
     * @memberof SdkTurnCredentials
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkTurnCredentials.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkTurnCredentials;
})();

module.exports = $root;
