type GetUserMediaCallType = (constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback) => void;
interface Navigator {
  webkitGetUserMedia: GetUserMediaCallType;
  mozGetUserMedia: GetUserMediaCallType;
  msGetUserMedia: GetUserMediaCallType;
  getUserMedia: GetUserMediaCallType;
}
