import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Image,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import api from '../../service/api';
import AlertBox from '../../common/AlertBox';
import { font } from '../../Settings/Theme';
import { common } from '../../common/Common';

const ProductDisplay = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
    const [rowCount, setRowCount] = useState(0);
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

    const closeAlert = () => {
        setIsError((prev) => ({ ...prev, showAlert: false }));
    };

    const fetchProducts = async (pageNum = 0) => {
        try {
            setIsLoading(true);
            const res = await api.get(
                `draftProduct/view?page=${pageNum}&size=${pagination.pageSize}&searchTerm=`
            );
            const newProducts = res.response.content.map((item) => ({
                ...item,
                image: item.image?.replace('/api', ''),
            }));
            setProducts(newProducts);
            setRowCount(res.response?.totalElements || 0);
        } catch (error) {
            setIsError({
                message: 'Failed to fetch product details.',
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

    useEffect(() => {
        setProducts([]);
        fetchProducts(pagination.pageIndex);
    }, [pagination.pageIndex, pagination.pageSize]);

    const onRefresh = () => {
        setRefreshing(true);
        setProducts([]);
        setPagination({ pageIndex: 0, pageSize: 5 });
        fetchProducts(0);
    };

    const columns = useMemo(
        () => [
            {
                header: 'Vendor ID',
                accessorKey: 'vendorId',
            },
            {
                header: 'Product Name',
                accessorFn: (row) =>
                    row.vendorProductName || row.articleName || 'N/A',
            },
            {
                header: 'GSM',
                accessorFn: (row) => row.gsm || row.metrics?.weight || 'N/A',
            },
            {
                header: 'Composition',
                accessorFn: (row) =>
                    row.composition || row.fabricContent?.value || 'N/A',
            },
        ],
        []
    );

    const renderCard = ({ item, index }) => (
        <View style={styles.cardContainer} key={index}>
            {columns.map((col, colIndex) => (
                <View key={colIndex} style={styles.cardRow}>
                    <Text style={styles.cardLabel}>{col.header}:</Text>
                    <Text style={styles.cardValue}>
                        {col.accessorFn
                            ? col.accessorFn(item, index)
                            : item[col.accessorKey] || 'N/A'}
                    </Text>
                </View>
            ))}
            {item.image && (
                <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                />
            )}
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
                <Text style={styles.headerText}>
                    Product{rowCount > 1 ? 's' : ''} ({rowCount})
                </Text>
            </View>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[common.PRIMARY_COLOR]}
                        tintColor={common.PRIMARY_COLOR}
                    />
                }
            >
                {products.length > 0 ? (
                    products.map((item, index) => renderCard({ item, index }))
                ) : (
                    <Text style={styles.noDataText}>
                        {isLoading ? 'Loading...' : 'No products found'}
                    </Text>
                )}
            </ScrollView>
            {rowCount > pagination.pageSize && (
                <View style={styles.paginationContainer}>
                    <TouchableOpacity
                        style={[
                            styles.paginationButton,
                            pagination.pageIndex === 0 && styles.disabledButton,
                        ]}
                        disabled={pagination.pageIndex === 0}
                        onPress={() =>
                            setPagination((prev) => ({
                                ...prev,
                                pageIndex: prev.pageIndex - 1,
                            }))
                        }
                    >
                        <Text style={styles.paginationText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>
                        Page {pagination.pageIndex + 1} of{' '}
                        {Math.ceil(rowCount / pagination.pageSize)}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.paginationButton,
                            (pagination.pageIndex + 1) * pagination.pageSize >=
                            rowCount && styles.disabledButton,
                        ]}
                        disabled={
                            (pagination.pageIndex + 1) * pagination.pageSize >=
                            rowCount
                        }
                        onPress={() =>
                            setPagination((prev) => ({
                                ...prev,
                                pageIndex: prev.pageIndex + 1,
                            }))
                        }
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
    productImage: {
        width: 150,
        height: 150,
        borderRadius: 4,
        marginTop: 8,
        alignSelf: 'center',
    },
    noDataText: {
        fontFamily: font.semiBold,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#333',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        elevation: 2,
        shadowColor: '#000',
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

export default ProductDisplay;