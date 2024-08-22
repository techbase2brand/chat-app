import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons

const ProfileModal = ({ isVisible, onClose, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = () => {
            const user = auth().currentUser;
            if (user) {
                const userDocRef = firestore().collection('users').doc(user.uid);

                // Listener for real-time updates
                const unsubscribe = userDocRef.onSnapshot(docSnapshot => {
                    if (docSnapshot.exists) {
                        setUserData(docSnapshot.data());
                        setLoading(false);
                    } else {
                        console.log("No user data found");
                        setLoading(false);
                    }
                }, error => {
                    console.error("Error fetching user data: ", error);
                    setLoading(false);
                });

                return () => unsubscribe();
            } else {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const onEdit = () => {
        onClose();
        navigation.navigate("EditProfile");
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

    const capitalizeFirstLetter = (str) => {
        if (str.length === 0) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.contentContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Icon name="close" size={34} color="#333" />
                    </TouchableOpacity>
                    {userData ? (
                        <>
                            {userData.profilePictureUrl ? (
                                <Image
                                    source={{ uri: userData.profilePictureUrl }}
                                    style={styles.profilePicture}
                                />
                            ) : (
                                <FallbackAvatar name={userData.displayName} />
                            )}
                            <Text style={styles.displayName}>{capitalizeFirstLetter(userData.displayName)}</Text>
                            <Text style={styles.email}>{userData.email}</Text>
                            {userData.bio && <Text style={styles.bio}>{userData.bio}</Text>}
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={onEdit}
                            >
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.noDataText}>No user data found</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    contentContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        minHeight: 380,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    profilePicture: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 5,
        borderColor: '#1E90FF',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 5,
    },
    displayName: {
        fontSize: 30,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5,
    },
    email: {
        fontSize: 20,
        color: '#555',
        marginBottom: 10,
    },
    bio: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
        paddingHorizontal: 15,
    },
    editButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        position: "absolute",
        bottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    noDataText: {
        fontSize: 18,
        color: '#999',
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
});

export default ProfileModal;
