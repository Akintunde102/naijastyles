import React, {useEffect, useContext, useState, Fragment} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Image,
  Text,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
//import {Timer, InputForm} from './components';
import {SizeContextProvider, SizeContext} from './contexts';

import {keyStorage, fetchAndSave, smartLog, getImages} from './utils';

function App() {
  // States and Contexts Calls
  const {dHeight, dWidth} = useContext(SizeContext);
  const [ready, setReady] = useState<boolean>(false);
  const [imageDict, setImageDict] = useState<[{uri: string}]>([]);
  // To Hide Splash Screen when JS is done loading
  useEffect(() => {
    SplashScreen.hide();
  });

  // to get Image Dict
  useEffect(() => {
    keyStorage('dictStored')
      .get()
      .then(async (dictStored) => {
        smartLog({dictStored});
        const allStored = await keyStorage('allStored').get();
        console.log({allStored});
        if (dictStored && allStored) {
          return;
        }
        await fetchAndSave();
        smartLog('fetch and Saved');
      })
      .catch((error) => {
        smartLog('dictStored, allStored check error', error);
      });

    getImages().then((imageURIs) => {
      setImageDict(imageURIs);
      setReady(true);
    });
  }, []);

  const styles = StyleSheet.create({
    app: {
      height: dHeight,
      width: dWidth,
      borderTopColor: '#000',
      borderTopWidth: 1,
    },
    inputForm: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderRadius: 2,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
    image: {
      width: dWidth,
      height: dHeight,
    },
  });

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        hidden={false}
        backgroundColor="#fff"
      />
      <SafeAreaView>
        <KeyboardAvoidingView behavior="height">
          <View style={styles.app}>
            <SizeContextProvider>
              {ready ? (
                <View>
                  {imageDict.map(
                    (
                      {uri, imageName}: {uri: string; imageName: string},
                      index: number,
                    ) => {
                      return (
                        <Fragment key={index}>
                          <Text>{imageName}</Text>
                          <Image style={styles.image} source={{uri}} />
                        </Fragment>
                      );
                    },
                  )}
                </View>
              ) : (
                <Text>loading</Text>
              )}
            </SizeContextProvider>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

export default App;
