import React, {useState} from 'react';
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library

const SignInScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const onEmailSignInPress = async () => {
    setErrorMessage(''); // Clear previous errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length === 0 || password.length === 0) {
      setErrorMessage('Please fill in all details.');
      return;
    }

    if (!emailRegex.test(email)) {
      setErrorMessage('Invalid email format.');
      return;
    }

    // Basic password validation (minimum 6 characters)
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;
      const displayName = email.split('@')[0];

      // Update profile with displayName
      await user.updateProfile({
        displayName,
      });
      // Save user to Firestore
      await firestore().collection('users').doc(user.uid).set({
        email: user.email,
        uid: user.uid,
        displayName,
        online: true, // Set online status to true upon sign-in
        lastSeen: new Date(),
      });
      console.log('User account created & signed in!');
      navigation.navigate('Users');
    } catch (error) {
      let message = '';
      if (error.code === 'auth/email-already-in-use') {
        message = 'That email address is already in use!';
        try {
          // Try signing in if the email is already in use
          await auth().signInWithEmailAndPassword(email, password);
          navigation.navigate('Users');
        } catch (signInError) {
          console.error(signInError);
          message = signInError.message;
        }
      } else if (error.code === 'auth/invalid-email') {
        message = 'The email address is invalid.';
      } else {
        message = error.message;
      }
      setErrorMessage(message);
    }
  };
  // const onEmailSignInPress = async () => {
  //   try {
  //     const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  //     const user = userCredential.user;
  //     const displayName = email.split('@')[0];

  //     // Update profile with displayName
  //     await user.updateProfile({
  //       displayName,
  //     });
  //     // Save user to Firestore
  //     await firestore().collection('users').doc(user.uid).set({
  //       email: user.email,
  //       uid: user.uid,
  //       displayName,
  //       online: true, // Set online status to true upon sign-in
  //       lastSeen: new Date(),
  //     });
  //     console.log('User account created & signed in!');
  //     navigation.navigate('Users');
  //   } catch (error) {
  //     if (error.code === 'auth/email-already-in-use') {
  //       console.log('That email address is already in use!');
  //       try {
  //         // Try signing in if the email is already in use
  //         await auth().signInWithEmailAndPassword(email, password);
  //         // Navigate to Users screen
  //         navigation.navigate('Users');
  //       } catch (signInError) {
  //         console.error(signInError);
  //         Alert.alert('Sign In Error', signInError.message);
  //       }
  //     } else if (error.code === 'auth/invalid-email') {
  //       console.log('That email address is invalid!');
  //       Alert.alert('Invalid Email', 'The email address is invalid.');
  //     } else {
  //       console.error(error);
  //       Alert.alert('Sign In Error', error.message);
  //     }
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Sign In</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.togglePasswordButton}>
            <Icon
              name={passwordVisible ? 'visibility' : 'visibility-off'}
              size={24}
              color="#1E90FF"
            />
          </TouchableOpacity>
        </View>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={onEmailSignInPress}>
          <Text style={styles.buttonText}>Sign In with Email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 15,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    position: 'relative',
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    height: 30,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default SignInScreen;
