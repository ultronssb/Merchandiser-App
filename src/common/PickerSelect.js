import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { font } from '../Settings/Theme';
import { TouchableRipple } from 'react-native-paper';

const PickerSelect = ({ value, onValueChange, items, placeholder, disabled = false }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedLabel = items.find(item => item.value === value)?.label || '';

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.inputContainer,
                    disabled && styles.disabledInputContainer
                ]}
                onPress={() => {
                    if (!disabled) setModalVisible(true);
                }}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <Text
                    style={[
                        styles.inputText,
                        !selectedLabel && styles.placeholderText,
                        disabled && styles.disabledText
                    ]}
                    numberOfLines={1}
                >
                    {selectedLabel || placeholder?.label || 'Select an option'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color={disabled ? '#ccc' : '#555'} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{placeholder?.label || 'Select an option'}</Text>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item?.value?.toString()}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            renderItem={({ item }) => (
                                <TouchableRipple
                                    rippleColor={'#ccc'}
                                    style={styles.item}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.itemText}>{item.label}</Text>
                                </TouchableRipple>
                            )}
                        />
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        height: 55,
        justifyContent: 'space-between',
        backgroundColor: '#fff'
    },
    disabledInputContainer: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ddd'
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#333'
    },
    placeholderText: {
        fontFamily: font.regular,
        color: '#999'
    },
    disabledText: {
        color: '#aaa'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 20,
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        maxHeight: '75%'
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: font.semiBold,
        marginBottom: 15,
        color: '#333'
    },
    item: {
        paddingVertical: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        fontFamily: font.regular
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 4
    },
    closeButton: {
        marginTop: 20,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#1976D2',
        borderRadius: 6
    },
    closeText: {
        color: '#fff',
        fontFamily: font.semiBold,
        fontSize: 14
    }
});

export default PickerSelect;