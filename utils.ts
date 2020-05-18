import {useRef, useEffect} from 'react';
import {PermissionsAndroid, Alert} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'rn-fetch-blob';
import config from './config';
import credentials from './app.credentials';

export const smartLog = (...data) => {
  console.log(...data);
};

export const RequestCameraPermission = async () => {
  let fullyGranted = false;
  try {
    const fileReadAccess = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'I need your File Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    const fileWriteAccess = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'I need your Write File Permission',
        message:
          'Cool Photo App needs access to your camera ' +
          'so you can take awesome pictures.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    if (
      fileWriteAccess === PermissionsAndroid.RESULTS.GRANTED &&
      fileReadAccess === PermissionsAndroid.RESULTS.GRANTED
    ) {
      fullyGranted = true;
    }
  } catch (err) {
    console.warn(err);
    fullyGranted = false;
  }
  return fullyGranted;
};

export function useInterval(callback: Function, delay: number | null) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**This converts time In Seconds to An Object  that is usable for React Native Manipulation
 *
 * @param timeInSeconds
 */
export const formatTimeForDisplay = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds - minutes * 60;
  const timeObj = {
    minutes: minutes >= 100 ? minutes : ('0' + minutes).slice(-2),
    seconds: ('0' + seconds).slice(-2),
  };
  const formattedDisplay = `${timeObj.minutes}:${timeObj.seconds}`;
  const digitNumber = formattedDisplay.toString().length;
  return {
    ...timeObj,
    formattedDisplay,
    digitNumber,
  };
};

export async function getImageDict() {
  try {
    let response = await fetch('http://localhost:8000/images/dict');
    let json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
  }
}

export function keyStorage(
  key?: string | number,
  value?: string,
  debug: boolean = false,
) {
  const storageKey = `@${credentials.appName}:${key}`;
  return {
    get: async function () {
      try {
        const val = await AsyncStorage.getItem(storageKey);
        debug &&
          smartLog('FILE RETRIEVED!!', {
            storageKey,
            val,
          });
        return val;
      } catch (error) {
        Alert.alert('asyncStorageError', `error:${error}, key:${storageKey}`);
      }
    },
    set: async function () {
      try {
        if (!value) {
          throw 'value is not given in setOperation';
        }
        await AsyncStorage.setItem(storageKey, value);
        debug &&
          smartLog('FILE STORED!!', {
            storageKey,
            value,
          });
        return value;
      } catch (error) {
        Alert.alert('asyncStorageError', `error:${error}, value:${value}`);
      }
    },
    getAllKeys: async function () {
      let keys: string[] = [];
      try {
        keys = await AsyncStorage.getAllKeys();
      } catch (error) {
        Alert.alert('asyncStorageError:: getAllKeys', `error:${error},`);
      }
      return keys;
    },
    clear: async function () {
      try {
        await AsyncStorage.clear();
      } catch (error) {
        Alert.alert('asyncStorageError:: clearKeys', `error:${error},`);
      }
    },
  };
}

export async function fetchAndSave() {
  try {
    const response = await fetch(`https://${config.imageServer}/images/dict`);
    const json = await response.json();
    const stringedJson = JSON.stringify(json);
    await keyStorage('dictStored', stringedJson, true).set();
    smartLog('just finished');
    console.log({json, stringedJson, o: Object.keys(json)});
    const jsonKeys = Object.keys(json);
    for (let index = 0; index < jsonKeys.length; index++) {
      const imageName = jsonKeys[index];
      const res = await RNFetchBlob.fetch(
        'GET',
        `https://${config.imageServer}/images/${json[imageName]}`,
      );
      smartLog(JSON.stringify({name: json[imageName]}));
      await keyStorage(imageName, res.data).set();
    }
    await keyStorage('allStored', 'true').set();
  } catch (error) {
    console.log('scan file error', {error});
  }
}

export async function getImages() {
  const dictStored = await keyStorage('dictStored', '', true).get();
  if (!dictStored) {
    Alert.alert('Data Error', 'Dict Does not Exist yet');
    return;
  }
  const images = [];
  const parsedDict = JSON.parse(dictStored);
  const dictKeys = Object.keys(parsedDict);
  for (let index = 0; index < dictKeys.length; index++) {
    const each = dictKeys[index];
    const base64Image = await keyStorage(each).get();
    const imageType = parsedDict[each].split('.')[1];
    smartLog({ each, imageType, a: parsedDict[each] });
    const uri = `data:image/${imageType};base64,${base64Image}`;
    images.push({
      uri,
      imageName: parsedDict[each] 
    });
  }
  return images;
}
