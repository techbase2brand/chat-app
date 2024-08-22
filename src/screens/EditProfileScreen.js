import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EditProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState({
        displayName: '',
        email: '',
        bio: '',
        profilePictureUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth().currentUser;
            if (user) {
                try {
                    const userDoc = await firestore().collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleImagePick = () => {
        launchImageLibrary({}, async (response) => {
            if (response.assets && response.assets.length > 0) {
                const { uri, fileName, type } = response.assets[0];
                try {
                    const uploadUri = await uploadImage(uri, fileName, type);
                    setUserData(prevState => ({
                        ...prevState,
                        profilePictureUrl: uploadUri,
                    }));
                } catch (error) {
                    console.error("Error uploading image: ", error);
                }
            }
        });
    };

    const uploadImage = async (uri, fileName, type) => {
        const reference = storage().ref(fileName);
        await reference.putFile(uri);
        return await reference.getDownloadURL();
    };

    const handleSave = async () => {
        setUpdating(true);
        const user = auth().currentUser;
        if (user) {
            try {
                await firestore().collection('users').doc(user.uid).update(userData);
                navigation.goBack()
            } catch (error) {
                console.error("Error updating profile: ", error);
                alert('Error updating profile');
            }
        }
        setUpdating(false);
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />;
    }

    const getInitials = (name) => {
        return name ? name.split(' ').map(word => word.charAt(0).toUpperCase()).join('') : '';
    };

    const FallbackAvatar = ({ name }) => (
        <View style={styles.fallbackAvatar}>
            <Text style={styles.fallbackAvatarText}>{getInitials(name)}</Text>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={34} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
                {userData.profilePictureUrl ? (
                    <Image source={{ uri: userData.profilePictureUrl }} style={styles.profilePicture} />
                ) : (
                    <FallbackAvatar name={userData.displayName} />
                )}
                <TouchableOpacity onPress={handleImagePick} style={styles.cameraButton}>
                    <Icon name="camera-alt" size={20} color="black" />
                </TouchableOpacity>
            </TouchableOpacity>
            <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor="#999"
                value={userData.displayName}
                onChangeText={text => setUserData(prevState => ({ ...prevState, displayName: text }))}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={userData.email}
                onChangeText={text => setUserData(prevState => ({ ...prevState, email: text }))}
            />
            <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Bio"
                placeholderTextColor="#999"
                value={userData.bio}
                onChangeText={text => setUserData(prevState => ({ ...prevState, bio: text }))}
                multiline
            />
            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={updating}
            >
                <Text style={styles.saveButtonText}>{updating ? 'Updating...' : 'Save Changes'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1,
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 50,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#1E90FF',
        backgroundColor: '#f0f0f0',
        resizeMode: 'cover',
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#1E90FF',
    },
    placeholderAvatarText: {
        fontSize: 50,
        color: '#1E90FF',
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderBottomWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingVertical: 10,
    },
    saveButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 3,
        marginTop: 40
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    fallbackAvatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#a8326b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#fff',
    },
    fallbackAvatarText: {
        fontSize: 60,
        color: '#fff',
        fontWeight: 'bold',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 50,
        padding: 8,
        elevation: 2,
    },
});

export default EditProfileScreen;
