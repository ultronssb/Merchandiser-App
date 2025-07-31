import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import api from '../service/api';
import { font } from '../Settings/Theme';
import CustomToast from '../service/hook/Toast/CustomToast';

const VendorPicker = ({ value, onValueChange, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Create refs for state values
    const isLoadingRef = useRef(isLoading);
    const hasMoreRef = useRef(hasMore);
    const searchTermRef = useRef(searchTerm);
    const pageRef = useRef(page);

    // Update refs when state changes
    useEffect(() => {
        isLoadingRef.current = isLoading;
        hasMoreRef.current = hasMore;
        searchTermRef.current = searchTerm;
        pageRef.current = page;
    }, [isLoading, hasMore, searchTerm, page]);

    const fetchVendors = useCallback(async (search = '', pageNum = 0) => {
        if (isLoadingRef.current || (pageNum > 0 && !hasMoreRef.current)) return;

        setIsLoading(true);
        try {
            const res = await api.get(`vendor/allAgent?page=${pageNum}&size=10&search=${search}`);
            const newVendors = res.response.content || [];

            setVendors(prev => {
                const combined = pageNum === 0 ? newVendors : [...prev, ...newVendors];
                // Deduplicate vendors by vendorId while keeping order
                const unique = _.uniqBy(combined, 'vendorId');
                return unique;
            });

            setHasMore(res?.response?.last === false);
        } catch (error) {
            console.log('Failed to fetch vendors', error);
            CustomToast.show('Failed to load vendors');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // const debouncedSearch = useCallback(
    //     _.debounce((text) => {
    //         setSearchTerm(text);
    //         setPage(0);
    //         setVendors([]);
    //         setHasMore(true);
    //         fetchVendors(text, 0);
    //     }, 500),
    //     [fetchVendors]
    // );
    useEffect(() => {
        setPage(0);
        setVendors([]);
        setHasMore(true);
        fetchVendors(searchTerm, 0);
    }, [searchTerm]);

    useEffect(() => {
        if (modalVisible) {
            fetchVendors('', 0);
        }
    }, [modalVisible]);

    const loadMore = useCallback(() => {
        if (hasMoreRef.current && !isLoadingRef.current) {
            const nextPage = pageRef.current + 1;
            setPage(nextPage);
            fetchVendors(searchTermRef.current, nextPage);
        }
    }, [fetchVendors]);

    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setSearchTerm('');
        setPage(0);
        setHasMore(true);
    }, []);

    const selectedVendor = vendors.find(v => v.vendorId === value);

    return (
        <View>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.pickerText}>
                    {selectedVendor ? selectedVendor.supplier : placeholder}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={modalVisible}
                onRequestClose={handleCloseModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <TextInput
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholder="Search vendors"
                            style={styles.searchInput}
                        />

                        <View style={styles.listContainer}>
                            <FlatList
                                data={vendors}
                                keyExtractor={item => item.vendorId.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.vendorItem}
                                        onPress={() => {
                                            onValueChange(item.vendorId);
                                            handleCloseModal();
                                        }}
                                    >
                                        <Text style={styles.vendorText}>{item.supplier}</Text>
                                    </TouchableOpacity>
                                )}
                                onEndReached={loadMore}
                                onEndReachedThreshold={0.2}
                                ListFooterComponent={
                                    isLoading ? (
                                        <ActivityIndicator size="small" color="#007bff" />
                                    ) : !vendors.length ? (
                                        <Text style={styles.noResultsText}>No vendors found</Text>
                                    ) : !hasMore ? (
                                        <Text style={styles.noMoreText}>No more vendors</Text>
                                    ) : null
                                }
                                contentContainerStyle={vendors.length === 0 && styles.emptyListContainer}
                            />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleCloseModal}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    pickerButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 4,
        marginBottom: 5
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
        fontFamily: font.semiBold
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
        padding: 20,
        // maxHeight: '75%',
        width: '90%',
        alignSelf: 'center'
    },
    listContainer: {
        height: 300,
        marginVertical: 10
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
        fontFamily: font.semiBold
    },
    vendorItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    vendorText: {
        fontSize: 14,
        color: '#333',
        fontFamily: font.regular
    },
    closeButton: {
        marginTop: 10,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#007bff',
        borderRadius: 6
    },
    closeText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: font.semiBold
    },
    noResultsText: {
        textAlign: 'center',
        padding: 20,
        fontFamily: font.regular,
        color: '#666'
    },
    noMoreText: {
        textAlign: 'center',
        padding: 10,
        fontFamily: font.medium,
        color: '#666',
    }
});

export default VendorPicker;
