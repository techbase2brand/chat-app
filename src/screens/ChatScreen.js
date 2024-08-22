import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import Header from '../components/Header';
import { useFocusEffect } from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import Geolocation from '@react-native-community/geolocation';
import Contacts from 'react-native-contacts';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

const getChatId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

const ChatScreen = ({ route }) => {
  const { user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setName(user.displayName);
    }, [user.displayName]),
  );

  useEffect(() => {
    const chatId = getChatId(auth().currentUser.uid, user.uid);
    const unsubscribeMessages = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data);
      });

    const unsubscribeTyping = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('typingStatus')
      .doc(user.uid)
      .onSnapshot(doc => {
        setTyping(doc?.data()?.isTyping || false);
      });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [user.uid]);

  const sendMessage = async (messageType, content = '') => {
    setNewMessage('');
    if (newMessage.trim() === '' && messageType === 'text') return;

    const chatId = getChatId(auth().currentUser.uid, user.uid);
    const { uid, displayName } = auth().currentUser;
    const createdAt = firestore.FieldValue.serverTimestamp();

    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        text: messageType === 'text' ? newMessage : '',
        mediaUrl: messageType === 'text' ? '' : content,
        senderId: uid,
        senderName: displayName,
        createdAt,
        type: messageType,
      });

    // setNewMessage('');
    updateTypingStatus(false);
  };

  const handleTyping = async () => {
    updateTypingStatus(true);
  };

  const updateTypingStatus = async isTyping => {
    const chatId = getChatId(auth().currentUser.uid, user.uid);
    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('typingStatus')
      .doc(auth().currentUser.uid)
      .set({
        isTyping,
      });
  };

  const pickMedia = mediaType => {
    const options = {
      mediaType,
    };
    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled media picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        setLoading(true);
        await uploadMedia(source.uri, mediaType);
        setLoading(false);
      }
    });
  };

  const captureMedia = mediaType => {
    const options = {
      mediaType,
    };
    launchCamera(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled media picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        setLoading(true);
        await uploadMedia(source.uri, mediaType);
        setLoading(false);
      }
    });
  };

  const uploadMedia = async (uri, type) => {
    const chatId = getChatId(auth().currentUser.uid, user.uid);
    const { uid, displayName } = auth().currentUser;
    const createdAt = firestore.FieldValue.serverTimestamp();

    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const reference = storage().ref(`chats/${chatId}/media/${filename}`);

    await reference.putFile(uri);
    const downloadURL = await reference.getDownloadURL();

    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        mediaUrl: downloadURL,
        senderId: uid,
        senderName: displayName,
        createdAt,
        type,
      });
  };

  const renderChatMessage = ({ item }) => {
    const { text, mediaUrl, type, senderId } = item;
    const isCurrentUser = senderId === auth().currentUser.uid;
    // console.log("rednderitem", mediaUrl)
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}>
        {type === 'text' ? (
          <Text style={styles.messageText}>{text}</Text>
        ) : type === 'photo' ? (
          <Image source={{ uri: mediaUrl }} style={styles.media} />
        ) : type === 'video' ? (
          <Video source={{ uri: mediaUrl }} style={styles.media} controls />
        ) : type === 'location' ? (
          <Text style={styles.locationText} onPress={() => openMap(mediaUrl)}>
            {`Location: ${mediaUrl}`}
          </Text>
        ) : type === 'contact' ? (
          <Text style={styles.contactText}>
            {mediaUrl
              ? mediaUrl
                .split(',')
                .map(item => item.replace(':', ': '))
                .join('\n')
              : 'No contact information available'}
          </Text>
        ) : type === 'file' ? (
          <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)}>
            <Image
              source={require('../assets/images/file.png')}
              style={styles.fileIcon}
            />
            <Text style={styles.fileText}>{`File: ${mediaUrl
              .split('/')
              .pop()}`}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const openMap = locationUrl => {
    // Function to open the map URL
    Linking.openURL(locationUrl);
  };

  const shareLocation = async () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        await sendMessage('location', locationUrl);
        setLoading(false);
      },
      error => {
        console.log(error);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 },
    );
  };

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // For iOS, assume permissions are already granted or use a library to request permissions
      return true;
    }
  };

  // Share contact
  const shareContact = async () => {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Cannot access contacts.');
      return;
    }

    Contacts.getAll()
      .then(contacts => {
        setContacts(contacts);
        setShowContactPicker(true); // Show contact picker modal
      })
      .catch(error => {
        console.error('Failed to fetch contacts:', error);
      });
  };

  const handleSelectContact = async contact => {
    const contactDetails = `Name: ${contact.givenName} ${contact.familyName}, Phone: ${contact.phoneNumbers[0]?.number}`;
    await sendMessage('contact', contactDetails);
    setShowContactPicker(false); // Close contact picker modal
  };

  const getInitials = name => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  const FallbackAvatar = ({ name }) => (
    <View style={[styles.profilePicture, { borderColor: 'black' }]}>
      <Text style={styles.fallbackAvatarText}>{getInitials(name)}</Text>
    </View>
  );

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      // console.log("Picked file:", res);

      const { uri, name } = res;

      // Define a temporary path for the file
      const tempFilePath = `${RNFS.TemporaryDirectoryPath}/${name}`;

      // Copy the file to the temporary directory
      await RNFS.copyFile(uri, tempFilePath);

      // console.log("Temporary file path:", tempFilePath);

      const chatId = getChatId(auth().currentUser.uid, user.uid);
      const reference = storage().ref(`chats/${chatId}/files/${name}`);
      // console.log("Firebase reference:", reference.toString());

      setLoading(true);

      try {
        // console.log("Uploading file...");
        await uploadWithRetry(reference, tempFilePath);
        // console.log("File uploaded successfully.");

        // Get download URL
        const downloadURL = await reference.getDownloadURL();
        // console.log("File download URL:", downloadURL);

        // Send message with the file URL
        await sendMessage('file', downloadURL);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (DocumentPicker.isCancel(err)) {
        console.log('Canceled from document picker');
      } else {
        console.error("File picking error:", err);
      }
    }
  };

  const uploadWithRetry = async (reference, filePath, retryCount = 3) => {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await reference.putFile(filePath);
        return;
      } catch (error) {
        console.warn(`Upload attempt ${attempt} failed:`, error);
        if (attempt === retryCount) {
          throw error;
        }
        // Optional: add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };


  return (
    <View style={{ flex: 1 }}>
      <Header title={name} back={true} />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          {/* <Text style={[styles.typingText, { color: "#42A5F5" }]}>
            Processing...
          </Text> */}
        </View>
      )}
      <View style={styles.container}>
        <FlatList
          data={messages}
          renderItem={renderChatMessage}
          keyExtractor={item => item.id}
          inverted
          showsVerticalScrollIndicator={false}
        />
        {typing && (
          <View style={[styles.messageContainer]}>
            <Text style={styles.typingText}>Typing...</Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={text => {
              setNewMessage(text);
              handleTyping();
            }}
            style={styles.input}
            placeholder="Type your message..."
            onSubmitEditing={() => sendMessage('text')}
            onBlur={() => updateTypingStatus(false)}
          />
          <TouchableOpacity
            onPress={() => sendMessage('text')}
            style={styles.sendButton}>
            <Icon name="send" size={24} color="#42A5F5" />
          </TouchableOpacity>
        </View>
        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity onPress={() => captureMedia('photo')}>
            <Icon name="camera" size={28} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickMedia('photo')}>
            <Icon name="image" size={28} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => captureMedia('video')}>
            <Icon name="video-plus" size={28} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickMedia('video')}>
            <Icon name="video" size={24} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFile}>
            <Icon name="folder-upload" size={28} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareLocation}>
            <Icon name="map-marker" size={28} color="#42A5F5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareContact}>
            <Icon name="contacts" size={28} color="#42A5F5" />
          </TouchableOpacity>

        </View>
        {showContactPicker && (
          <View style={styles.contactPicker}>
            <FlatList
              data={contacts}
              keyExtractor={item => item.recordID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleSelectContact(item)}>
                  <View style={styles.contactInfo}>
                    <FallbackAvatar name={item.givenName} />
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactName}>
                        {item.givenName} {item.familyName}
                      </Text>
                      {item.phoneNumbers.length > 0 && (
                        <Text style={styles.contactPhone}>
                          {item.phoneNumbers[0].number}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowContactPicker(false)}>
              <Icon name="close-thick" size={30} color="#FF0000" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '80%',
    borderRadius: 10,
    padding: 10,
  },
  currentUserMessage: {
    backgroundColor: '#42A5F5',
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    backgroundColor: '#e6e6e6',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: 'black',
  },
  locationText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  contactText: {
    color: 'black',
    // textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  media: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  typingText: {
    color: '#42A5F5',
  },
  contactPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactDetails: {
    marginLeft: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactPhone: {
    fontSize: 14,
    color: '#555',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    // padding: 10,
  },
  fallbackAvatarText: {
    fontSize: 20,
    color: '#fff',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a8326b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileIcon: {
    width: 250,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    resizeMode:"cover",
    marginHorizontal:10
  },
  fileText: {
    marginTop: 10,
    color: 'black',
    fontSize: 16,
  },
});

export default ChatScreen;
