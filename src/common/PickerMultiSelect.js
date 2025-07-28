import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { font } from '../Settings/Theme';

export default function PickerMultiSelect({
    groupName,
    items = [],
    selectedItems = [],
    onSelectionsChange,
    placeholder = 'Select items…',
}) {
    const [visible, setVisible] = useState(false);
    const [localSelected, setLocalSelected] = useState([]);
    // keep localSelected in sync if parent resets
    useEffect(() => {
        setLocalSelected(selectedItems);
    }, [selectedItems]);

    const toggleItem = (id) => {
        setLocalSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const confirm = () => {
        onSelectionsChange(localSelected);
        setVisible(false);
    };

    const renderRow = ({ item }) => {
        const checked = localSelected.includes(item.value);
        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => toggleItem(item.value)}
            >
                <Icon
                    name={checked ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                />
                <Text style={styles.rowText}>{item.label}</Text>
            </TouchableOpacity>
        );
    };
    return (
        <>
            <TouchableOpacity
                style={styles.toggle}
                onPress={() => setVisible(true)}
            >
                <Text style={[
                    styles.toggleText,
                    !selectedItems.length && styles.placeholderText
                ]}>
                    {selectedItems.length
                        ? `${selectedItems.length} selected`
                        : placeholder}
                </Text>
                <Icon name="arrow-drop-down" size={24} />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{groupName}</Text>
                        <FlatList
                            data={items}
                            keyExtractor={(i) => String(i.value)}
                            renderItem={renderRow}
                        />
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={{ color: '#333', fontFamily: font.bold }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={confirm}
                            >
                                <Text style={{ color: '#fff', fontFamily: font.bold }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        padding: 10,
    },
    toggleText: {
        flex: 1,
        fontSize: 14, fontFamily: font.semiBold,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
        fontFamily: font.regular,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 8,
        maxHeight: '80%',
        padding: 12,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: font.bold,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rowText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: font.regular,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    modalBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    confirmBtn: {
        backgroundColor: '#1976D2',
        borderRadius: 4,
        marginLeft: 8,
    },
});