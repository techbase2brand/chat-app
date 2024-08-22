import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Header = ({ title, back, showImage, onPressSetting, imageUrl }) => {

    const navigation = useNavigation();
    const capitalizeFirstLetter = (str) => {
        // console.log("str", str)
        if (str.length === 0) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : '';
    };
    const FallbackAvatar = ({ name }) => (
        <View style={[styles.userImage, { borderColor: "black" }]}>
            <Text style={styles.fallbackAvatarText}>{getInitials(name)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={{ width: "90%", flexDirection: "row" }}>
                {back && <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>}
                <View style={styles.titleContainer}>
                    {showImage && (
                        imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.profilePicture}
                            />
                        ) : (
                            <FallbackAvatar name={title} />
                        )
                    )}
                    <Text style={styles.title}>{capitalizeFirstLetter(title)}</Text>
                </View>
            </View>
            {onPressSetting && <TouchableOpacity style={styles.settingsButton}
                onPress={onPressSetting}
            >
                <Icon name="settings" size={24} color="#fff" />
            </TouchableOpacity>}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        paddingHorizontal: 8,
        paddingVertical: 8,
        elevation: 4,
    },
    backButton: {
        padding: 8,
        width: "15%"
    },
    titleContainer: {
        // flex: 1,
        width: "60%",
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#a8326b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    placeholderImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ddd',
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10
    },
    settingsButton: {
        padding: 8,
    },

    fallbackAvatarText: {
        fontSize: 20,
        color: '#fff',
    },
    profilePicture: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
});

export default Header;
