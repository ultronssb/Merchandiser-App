import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { font } from '../../Settings/Theme';
import AlertBox from '../../common/AlertBox';
import { common } from '../../common/Common';
import api from '../../service/api';

const DisplayVendor = () => {
    const isInitialLoad = useRef(true);
    const [vendorDetails, setVendorDetails] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
    const [rowCount, setRowCount] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isError, setIsError] = useState({
        message: '',
        heading: '',
        isRight: false,
        rightButtonText: 'OK',
        triggerFunction: () => { },
        setShowAlert: () => { },
        showAlert: false,
    });
    const navigation = useNavigation();

    const closeAlert = () => {
        setIsError((prev) => ({ ...prev, showAlert: false }));
    };

    useEffect(() => {
        setVendorDetails([]);
        getVendor();
    }, [pagination.pageIndex, pagination.pageSize]);

    const getVendor = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(
                `vendor/allAgent?page=${pagination.pageIndex}&size=${pagination.pageSize}&search=`
            );
            setVendorDetails(res?.response?.content || []);
            setRowCount(res.response?.totalElements || 0);
        } catch (error) {
            setIsError({
                message: 'Failed to fetch vendor details.',
                heading: 'Error',
                isRight: false,
                rightButtonText: 'OK',
                triggerFunction: () => { },
                setShowAlert: closeAlert,
                showAlert: true,
            });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        // setPagination({ pageIndex: 0, pageSize: rowCount });
        setVendorDetails([]);
        getVendor();
    };

    const columns = useMemo(
        () => [
            {
                header: 'Supplier Name',
                accessorKey: 'supplier',
            },
            {
                header: 'Email',
                accessorKey: 'email',
            },
            {
                header: 'Mobile No',
                accessorKey: 'mobileNumber',
            },
            {
                header: 'Address',
                accessorFn: (row) => {
                    const address1 = row?.locations?.address1 || '';
                    const address2 = row?.locations?.address2 || '';
                    return address1 || address2 ? `${address1} ${address2}`.trim() : 'N/A';
                },
            },
            {
                header: 'City',
                accessorFn: (row) => row.locations?.city || 'N/A',
            },
            {
                header: 'Status',
                accessorKey: 'status',
            },
        ],
        []
    );

    const handleEdit = (vendor) => {
        navigation.navigate('VendorCreate', {
            customerId: vendor.vendorId,
            isEditCustomer: true,
            isCreateCustomer: false,
        });
    };

    const handleCreate = () => {
        navigation.navigate('VendorCreate', {
            isCreateCustomer: true,
            isEditCustomer: false,
            customerId: '',
        });
    };

    const renderCard = ({ item, index }) => (
        <View style={styles.cardContainer} key={index}>
            {columns.map((col, colIndex) => (
                <View key={colIndex} style={styles.cardRow}>
                    <Text style={styles.cardLabel}>{col.header}:</Text>
                    <Text style={[styles.cardValue, col.header === 'Status' && { color: item.status === 'ACTIVE' ? 'green' : 'red' }]}>
                        {col.accessorFn ? col.accessorFn(item, index) : item[col.accessorKey] || 'N/A'}
                    </Text>
                </View>
            ))}
            <TouchableRipple rippleColor={'rgba(0, 0, 0, .32)'} style={styles.editButton} onPress={() => handleEdit(item)} borderless={true}><>
                <Icon name="edit" size={20} color="teal" />
                <Text style={styles.editButtonText}>Edit</Text>
            </>
            </TouchableRipple>
        </View>
    );

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={common.PRIMARY_COLOR} />
                </View>
            )}
            <AlertBox
                heading={isError.heading}
                message={isError.message}
                setShowAlert={closeAlert}
                showAlert={isError.showAlert}
                triggerFunction={isError.triggerFunction}
                isRight={isError.isRight}
                rightButtonText={isError.rightButtonText}
            />
            <View style={styles.header}>
                <Text style={styles.headerText}>Vendor{rowCount > 1 ? 's' : ''} ({rowCount})</Text>

            </View>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]} // Add padding to avoid overlap
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[common.PRIMARY_COLOR]}
                        tintColor={common.PRIMARY_COLOR}
                    />
                }
            >
                {vendorDetails.length > 0 ? (
                    vendorDetails.map((item, index) => renderCard({ item, index }))
                ) : (
                    <Text style={styles.noDataText}>{isLoading ? 'Loading...' : "No vendors found"}</Text>
                )}
            </ScrollView>
            {rowCount > pagination.pageSize && (
                <View style={styles.paginationContainer}>
                    <TouchableOpacity
                        style={[styles.paginationButton, pagination.pageIndex === 0 && styles.disabledButton]}
                        disabled={pagination.pageIndex === 0}
                        onPress={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                    >
                        <Text style={styles.paginationText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>
                        Page {pagination.pageIndex + 1} of {Math.ceil(rowCount / pagination.pageSize)}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.paginationButton,
                            (pagination.pageIndex + 1) * pagination.pageSize >= rowCount && styles.disabledButton,
                        ]}
                        disabled={(pagination.pageIndex + 1) * pagination.pageSize >= rowCount}
                        onPress={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                    >
                        <Text style={styles.paginationText}>Next</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    headerText: {
        fontSize: 20,
        fontFamily: font.bold,
        color: '#000',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgb(207, 239, 253)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    createButtonText: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#000',
        marginLeft: 5,
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexGrow: 1,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardLabel: {
        fontFamily: font.semiBold,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    cardValue: {
        fontFamily: font.regular,
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        borderRadius: 5,
    },
    editButtonText: {
        fontFamily: font.semiBold,
        fontSize: 14,
        color: 'teal',
        marginLeft: 5,
    },
    noDataText: {
        fontFamily: font.semiBold,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#333',
    },
    paginationContainer: {
        position: 'absolute', // Position absolutely at the bottom
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff', // Add background to avoid transparency
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        elevation: 2, // Add shadow for Android
        shadowColor: '#000', // Add shadow for iOS
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    paginationButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: 'rgb(207, 239, 253)',
        borderRadius: 5,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    paginationText: {
        fontFamily: font.semiBold,
        fontSize: 14,
        color: '#000',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});

export default DisplayVendor;