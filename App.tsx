import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from './src/screens/SignInScreen';
import UsersScreen from './src/screens/UsersScreen';
import ChatScreen from './src/screens/ChatScreen';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createStackNavigator();
const useOnlineStatus = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  // console.log("appstate", appState)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log("nextApp", nextAppState)
      if (nextAppState === 'active') {
        // App has come to the foreground
        updateOnlineStatus(true);
      } else if (nextAppState.match(/inactive|background/) && appState === 'active') {
        // App has gone to the background
        updateOnlineStatus(false);
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    if (appState === 'active') {
      updateOnlineStatus(true);
    }
    return () => {
      subscription.remove();
    };
  }, [appState]);

  const updateOnlineStatus = (isOnline) => {
    // console.log("isonline", isOnline)
    const userId = auth().currentUser?.uid;
    if (userId) {
      firestore().collection('users').doc(userId).update({
        online: isOnline,
        lastSeen: new Date(),
      }).catch(error => {
        console.error("Error updating online status: ", error);
      });
    }
  };

  return null;
};


// const useOnlineStatus = () => {
//   const [appState, setAppState] = useState(AppState.currentState);

//   useEffect(() => {
//     const handleAppStateChange = (nextAppState) => {
//       if (nextAppState === 'active') {
//         // App has come to the foreground
//         updateOnlineStatus(true);
//       } else if (nextAppState.match(/inactive|background/) && appState === 'active') {
//         // App has gone to the background
//         updateOnlineStatus(false);
//       }
//       setAppState(nextAppState);
//     };

//     const subscription = AppState.addEventListener('change', handleAppStateChange);

//     // Initial status set to online
//     updateOnlineStatus(true);

//     return () => {
//       subscription.remove();
//       // Optionally set user to offline when the component unmounts
//       updateOnlineStatus(false);
//     };
//   }, [appState]);

//   const updateOnlineStatus = async (isOnline) => {
//     console.log("Updating online status:", isOnline);
//     const userId = auth().currentUser?.uid;
//     if (userId) {
//       try {
//         await firestore().collection('users').doc(userId).update({
//           online: isOnline,
//           lastSeen: new Date(),
//         });
//       } catch (error) {
//         console.error("Error updating online status:", error);
//       }
//     }
//   };

//   return null;
// };


function App(): React.JSX.Element {

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useOnlineStatus();

  // if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Users" component={UsersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({

});

export default App;
