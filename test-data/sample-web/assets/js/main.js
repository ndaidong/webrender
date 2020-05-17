/**
 * sample
 * @ndaidong
**/

import {add} from './sample.js';

const onKeyUp = (evt) => {
  return evt;
};

const registerEventListener = (element, evt, handler) => {
  element.addEventListener(evt, handler, false);
};

window.onload = () => {
  const sum = add(1, 2);
  console.log(sum);
  registerEventListener(document, 'keyup', onKeyUp);
};
