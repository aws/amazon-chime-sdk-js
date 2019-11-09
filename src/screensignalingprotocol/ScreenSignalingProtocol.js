/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.SdkScreenSignalingMessage = (function() {

    /**
     * Properties of a SdkScreenSignalingMessage.
     * @exports ISdkScreenSignalingMessage
     * @interface ISdkScreenSignalingMessage
     * @property {string|null} [attendeeId] SdkScreenSignalingMessage attendeeId
     */

    /**
     * Constructs a new SdkScreenSignalingMessage.
     * @exports SdkScreenSignalingMessage
     * @classdesc Represents a SdkScreenSignalingMessage.
     * @implements ISdkScreenSignalingMessage
     * @constructor
     * @param {ISdkScreenSignalingMessage=} [properties] Properties to set
     */
    function SdkScreenSignalingMessage(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SdkScreenSignalingMessage attendeeId.
     * @member {string} attendeeId
     * @memberof SdkScreenSignalingMessage
     * @instance
     */
    SdkScreenSignalingMessage.prototype.attendeeId = "";

    /**
     * Creates a new SdkScreenSignalingMessage instance using the specified properties.
     * @function create
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {ISdkScreenSignalingMessage=} [properties] Properties to set
     * @returns {SdkScreenSignalingMessage} SdkScreenSignalingMessage instance
     */
    SdkScreenSignalingMessage.create = function create(properties) {
        return new SdkScreenSignalingMessage(properties);
    };

    /**
     * Encodes the specified SdkScreenSignalingMessage message. Does not implicitly {@link SdkScreenSignalingMessage.verify|verify} messages.
     * @function encode
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {ISdkScreenSignalingMessage} message SdkScreenSignalingMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkScreenSignalingMessage.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.attendeeId);
        return writer;
    };

    /**
     * Encodes the specified SdkScreenSignalingMessage message, length delimited. Does not implicitly {@link SdkScreenSignalingMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {ISdkScreenSignalingMessage} message SdkScreenSignalingMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SdkScreenSignalingMessage.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SdkScreenSignalingMessage message from the specified reader or buffer.
     * @function decode
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SdkScreenSignalingMessage} SdkScreenSignalingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkScreenSignalingMessage.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SdkScreenSignalingMessage();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.attendeeId = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SdkScreenSignalingMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SdkScreenSignalingMessage} SdkScreenSignalingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SdkScreenSignalingMessage.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SdkScreenSignalingMessage message.
     * @function verify
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SdkScreenSignalingMessage.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            if (!$util.isString(message.attendeeId))
                return "attendeeId: string expected";
        return null;
    };

    /**
     * Creates a SdkScreenSignalingMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SdkScreenSignalingMessage} SdkScreenSignalingMessage
     */
    SdkScreenSignalingMessage.fromObject = function fromObject(object) {
        if (object instanceof $root.SdkScreenSignalingMessage)
            return object;
        var message = new $root.SdkScreenSignalingMessage();
        if (object.attendeeId != null)
            message.attendeeId = String(object.attendeeId);
        return message;
    };

    /**
     * Creates a plain object from a SdkScreenSignalingMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SdkScreenSignalingMessage
     * @static
     * @param {SdkScreenSignalingMessage} message SdkScreenSignalingMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SdkScreenSignalingMessage.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.attendeeId = "";
        if (message.attendeeId != null && message.hasOwnProperty("attendeeId"))
            object.attendeeId = message.attendeeId;
        return object;
    };

    /**
     * Converts this SdkScreenSignalingMessage to JSON.
     * @function toJSON
     * @memberof SdkScreenSignalingMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SdkScreenSignalingMessage.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SdkScreenSignalingMessage;
})();

module.exports = $root;
