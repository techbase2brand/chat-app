import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Header from '../components/Header';
import ProfileModal from '../components/Modal/ProfileModal';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const currentUser = auth().currentUser;

  const [currentUserImage, setCurrentUserImage] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  useEffect(() => {
    const unsubscribeUsers = firestore()
      .collection('users')
      .onSnapshot(querySnapshot => {
        const users = querySnapshot.docs
          .map(doc => doc.data())
          .filter(user => user.uid !== currentUser.uid);
        setUsers(users);
      });

    const unsubscribeUser = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          const userData = docSnapshot.data();
          setCurrentUserDisplayName(userData.displayName);
          setCurrentUserImage(userData.profilePictureUrl);
        }
      });

    return () => {
      unsubscribeUsers();
      unsubscribeUser();
    };
  }, [currentUser.uid]);

  const getInitials = name => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  const FallbackAvatar = ({name}) => (
    <View style={styles.fallbackAvatar}>
      <Text style={styles.fallbackAvatarText}>{getInitials(name)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title={currentUserDisplayName}
        imageUrl={currentUserImage}
        showImage={true}
        onPressSetting={() => setModalVisible(true)}
      />
      <View style={styles.userListContainer}>
        <FlatList
          data={users}
          keyExtractor={item => item.uid}
          renderItem={({item}) => {
            // console.log('Rendering user item:', {
            //   uid: item.uid,
            //   email: item.email,
            //   online: item.online,
            //   profilePictureUrl: item.profilePictureUrl,
            //   // item:item
            // });
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('Chat', {user: item})}
                style={styles.userCard}>
                {item.profilePictureUrl ? (
                  <Image
                    source={{uri: item.profilePictureUrl}}
                    style={styles.profilePicture}
                    onError={handleImageError}
                  />
                ) : (
                  <FallbackAvatar name={item.email} />
                )}

                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{item.displayName}</Text>
                  <View
                    style={[
                      styles.statusDot,
                      {backgroundColor: item.online ? 'green' : 'gray'},
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
        {isModalVisible && (
          <ProfileModal
            isVisible={isModalVisible}
            onClose={() => setModalVisible(false)}
            navigation={navigation}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background for better contrast
  },
  userListContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  userCard: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'gray',
    position: 'absolute',
    right: 10,
    top: 10,
  },
  fallbackAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a8326b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fallbackAvatarText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
});

export default UsersScreen;
