'use strict';
/**
 * @author Rachael Colley <rcolley@rcolley>
 * @fileoverview does stuff.
 */

import { requestAPI } from './network/network-control.js';
import { stringUtils } from './string-utils.js';
import { ulList } from './node-ul-list.js';
import { h1Heading } from './node-h1.js';
import { imgImage } from './node-img.js';
import { removeNode, removeChildNodes } from './remove-node.js';
import { pText } from './p-node.js';
import { toggleViz } from './toggle-viz.js';
import { userProfile } from './user-profile.js';
import { imgUtils } from './img-utils.js';
import {
  retrieveFromLocalStorage,
  persistToLocalStorage,
  retrieveImageFromLocalStorage,
  persistImageToLocalStorage
} from './local-storage-utils.js';
import { commonProps } from './common-props.js';

/**
 *
 * @param {*} username desc
 */
export function getGithubProfile(username) {
  const uname = stringUtils.removeIllegalCharacters(username);
  if (usernameIsEmpty(uname)) {
    respond(
      new userProfile.Data(commonProps.appProps.STATUS_USERNAME_IS_EMPTY, null)
    );
  } else if (
    cachedInLocalStorage(uname).status ==
    commonProps.localStorageStatus.STATUS_LOCAL_STORAGE_OBJECT_FOUND
  ) {
    respond(
      new userProfile.Data(
        commonProps.localStorageStatus.STATUS_LOCAL_STORAGE_OBJECT_FOUND,
        cachedInLocalStorage(uname).body
      )
    );
  } else {
    respond(
      new userProfile.Data(commonProps.appProps.STATUS_START_NEW_REQUEST, {
        login: uname
      })
    );
  }
}

/**
 *
 * @param {*} uname desc
 * @return {object} desc
 */
function cachedInLocalStorage(uname) {
  return checkLocalStorage(uname);
}

/**
 *
 * @param {string} uname desc.
 * @return {boolean} Whether the string is empty
 */
function usernameIsEmpty(uname) {
  return stringUtils.stringIsEmpty(uname);
}

/**
 *
 * @param {object} rezponseObj desc
 */
function respond(rezponseObj) {
  console.log('respond: ' + rezponseObj.status);

  switch (rezponseObj.status) {
    case commonProps.appProps.STATUS_START_NEW_REQUEST:
      startNetworkRequest(rezponseObj.body.login);
      break;
    case commonProps.httpStatusCodes.HTTP_STATUS_SUCCESS:
      prepareSuccessNodes(rezponseObj);
      break;
    case commonProps.httpStatusCodes.HTTP_STATUS_NOT_FOUND:
      prepareErrorNode(commonProps.appProps.MESSAGE_USER_NOT_FOUND);
      break;
    case commonProps.domExceptionIds.NETWORK_ERROR:
      prepareErrorNode(commonProps.domExceptionMessages.MESSAGE_ERROR_NO_NETWORK);
      break;
      case commonProps.domExceptionIds.STATUS_TIMEOUT:
      prepareErrorNode(commonProps.domExceptionMessages.MESSAGE_ERROR_TIME_OUT);
      break;
    case commonProps.domExceptionIds.STATUS_CANT_COMPLETE_OPERATION:
      prepareErrorNode(commonProps.domExceptionMessages.MESSAGE_OPERATION_CANT_COMPLETE);
      break;
    case commonProps.localStorageStatus.STATUS_LOCAL_STORAGE_OBJECT_FOUND:
      prepareSuccessNodes(rezponseObj);
      break;
    case commonProps.appProps.STATUS_LOCAL_STORAGE_OBJECT_NOT_FOUND:
      prepareSuccessNodes(rezponseObj);
      break;
    case commonProps.appProps.STATUS_USERNAME_IS_EMPTY:
      prepareErrorNode(commonProps.appProps.MESSAGE_USERNAME_CANNOT_BE_EMPTY);
      break;
    default:
      prepareErrorNode(commonProps.domExceptionMessages.MESSAGE_OPERATION_CANT_COMPLETE);
      break;
  }
}

/**
 *
 * @param {string} uname desc
 */
async function startNetworkRequest(uname) {
  const queryURL = commonProps.appProps.URL_GITHUB_USER_API + uname;
  const result = await requestAPI(queryURL);
  console.log('startNetworkRequest: ' + result.status);
  processNetworkResult(result, uname);
}

/**
 *
 * @param {object} rezponseObj desc
 * @param {string} uname desc
 */
function processNetworkResult(rezponseObj, uname) {
  console.log('processNetworkResult: ' + rezponseObj.status);
  respond(rezponseObj);
}

/**
 *
 * @param {string} errorMessage desc
 */
function prepareErrorNode(errorMessage) {
  removeNode(
    commonProps.elementIds.ID_PARENT_WRAPPER,
    commonProps.elementIds.ID_NODE_ERROR_NODE
  );
  pText(
    commonProps.elementIds.ID_PARENT_WRAPPER,
    { id: commonProps.elementIds.ID_NODE_ERROR_NODE },
    errorMessage
  );
}

/**
 *
 * @param {object} rezponseObj
 */
function prepareSuccessNodes(rezponseObj) {
  toggleControlsVisibility();
  removeNode(
    commonProps.elementIds.ID_PARENT_WRAPPER,
    commonProps.elementIds.ID_NODE_ERROR_NODE
  );
  h1Heading(
    commonProps.elementIds.ID_PARENT_WRAPPER,
    { id: commonProps.elementIds.ID_HEADING_USERNAME },
    rezponseObj.body.login
  );
  ulList(
    rezponseObj.body,
    { id: commonProps.elementIds.ID_UL_USER_DEETS },
    commonProps.elementIds.ID_PARENT_WRAPPER
  );
  imgImage(
    commonProps.elementIds.ID_PARENT_WRAPPER,
    { id: commonProps.elementIds.ID_IMAGE_USER, crossorigin: 'anonymous' },
    rezponseObj.body.avatar_url
  );
  saveToLocalStorage(rezponseObj);
}

/** TODO: Smelly. */
export function removeUserDeetsNodes() {
  removeChildNodes(commonProps.elementIds.ID_PARENT_WRAPPER, [
    commonProps.elementIds.ID_HEADING_USERNAME,
    commonProps.elementIds.ID_UL_USER_DEETS,
    commonProps.elementIds.ID_IMAGE_USER
  ]);
}

/**
 *
 */
export function toggleControlsVisibility() {
  toggleViz.toggleDisplayControls([
    commonProps.elementIds.ID_DIV_INPUT_USERNAME_CONTROLS,
    commonProps.elementIds.ID_DIV_RESET_USERNAME_CONTROLS
  ]);
}

/**
 *
 * @param {string} elementId
 */
export function toggleControlVisibility(elementId) {
  toggleViz.toggleDisplay(elementId);
}

/**
 *
 * @param {string} uname
 * @return {object}
 */
function checkLocalStorage(uname) {
  const val = retrieveFromLocalStorage(uname);
  if (val != null) {
    val.avatar_url = retrieveImageFromLocalStorage(`${val.login}_imageData`);
    return new userProfile.Data(
      commonProps.localStorageStatus.STATUS_LOCAL_STORAGE_OBJECT_FOUND,
      val
    );
  } else {
    return new userProfile.Data(
      commonProps.appProps.STATUS_LOCAL_STORAGE_OBJECT_NOT_FOUND,
      null
    );
  }
}

/**
 *
 * @param {object} rezponseObj
 */
function saveToLocalStorage(rezponseObj) {
  persistToLocalStorage(rezponseObj.body.login, rezponseObj.body);
  const userImageNode = document.getElementById(
    commonProps.elementIds.ID_IMAGE_USER
  );
  userImageNode.addEventListener('load', function() {
    persistImageToLocalStorage(
      `${rezponseObj.body.login}_imageData`,
      imgUtils.imageToDataURL(userImageNode)
    );
  });
}

/** TODO: Would you like to see a cached result? */