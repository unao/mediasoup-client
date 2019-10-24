"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractRtpCapabilities = extractRtpCapabilities;
exports.extractDtlsParameters = extractDtlsParameters;

var _sdpTransform = _interopRequireDefault(require("sdp-transform"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Extract RTP capabilities from a SDP.
 *
 * @param {Object} sdpObj - SDP Object generated by sdp-transform.
 * @return {RTCRtpCapabilities}
 */
function extractRtpCapabilities(sdpObj) {
  // Map of RtpCodecParameters indexed by payload type.
  var codecsMap = new Map(); // Array of RtpHeaderExtensions.

  var headerExtensions = []; // Whether a m=audio/video section has been already found.

  var gotAudio = false;
  var gotVideo = false;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = sdpObj.media[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var m = _step.value;
      var kind = m.type;

      switch (kind) {
        case 'audio':
          {
            if (gotAudio) continue;
            gotAudio = true;
            break;
          }

        case 'video':
          {
            if (gotVideo) continue;
            gotVideo = true;
            break;
          }

        default:
          {
            continue;
          }
      } // Get codecs.


      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = m.rtp[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var rtp = _step2.value;
          var codec = {
            name: rtp.codec,
            mimeType: "".concat(kind, "/").concat(rtp.codec),
            kind: kind,
            clockRate: rtp.rate,
            preferredPayloadType: rtp.payload,
            channels: rtp.encoding,
            rtcpFeedback: [],
            parameters: {}
          };
          if (codec.kind !== 'audio') delete codec.channels;else if (!codec.channels) codec.channels = 1;
          codecsMap.set(codec.preferredPayloadType, codec);
        } // Get codec parameters.

      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (m.fmtp || [])[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var fmtp = _step3.value;

          var parameters = _sdpTransform["default"].parseFmtpConfig(fmtp.config);

          var _codec = codecsMap.get(fmtp.payload);

          if (!_codec) continue;
          _codec.parameters = parameters;
        } // Get RTCP feedback for each codec.

      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = (m.rtcpFb || [])[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var fb = _step4.value;

          var _codec2 = codecsMap.get(fb.payload);

          if (!_codec2) continue;
          var feedback = {
            type: fb.type,
            parameter: fb.subtype
          };
          if (!feedback.parameter) delete feedback.parameter;

          _codec2.rtcpFeedback.push(feedback);
        } // Get RTP header extensions.

      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = (m.ext || [])[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var ext = _step5.value;
          var headerExtension = {
            kind: kind,
            uri: ext.uri,
            preferredId: ext.value
          };
          headerExtensions.push(headerExtension);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var rtpCapabilities = {
    codecs: Array.from(codecsMap.values()),
    headerExtensions: headerExtensions,
    fecMechanisms: [] // TODO

  };
  return rtpCapabilities;
}
/**
 * Extract DTLS parameters from a SDP.
 *
 * @param {Object} sdpObj - SDP Object generated by sdp-transform.
 * @return {RTCDtlsParameters}
 */


function extractDtlsParameters(sdpObj) {
  var media = getFirstActiveMediaSection(sdpObj);
  var fingerprint = media.fingerprint || sdpObj.fingerprint;
  var role;

  switch (media.setup) {
    case 'active':
      role = 'client';
      break;

    case 'passive':
      role = 'server';
      break;

    case 'actpass':
      role = 'auto';
      break;
  }

  var dtlsParameters = {
    role: role,
    fingerprints: [{
      algorithm: fingerprint.type,
      value: fingerprint.hash
    }]
  };
  return dtlsParameters;
}
/**
 * Get the first acive media section.
 *
 * @private
 * @param {Object} sdpObj - SDP Object generated by sdp-transform.
 * @return {Object} SDP media section as parsed by sdp-transform.
 */


function getFirstActiveMediaSection(sdpObj) {
  return (sdpObj.media || []).find(function (m) {
    return m.iceUfrag && m.port !== 0;
  });
}