import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal as RNModal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import _ from 'lodash';
import { ProductContext } from './ProductEdit';
import PickerSelect from '../../common/PickerSelect';
import PickerMultiSelect from '../../common/PickerMultiSelect';
import api from '../../service/api';
import { font } from '../../Settings/Theme';

const ProductCategorys = () => {
    const {
        product,
        setProduct,
        inputError,
        setInputError,
        setHasMultiSelectCategoryMandatory,
    } = useContext(ProductContext);

    const initialState = {
        key: '',
        value: {},
        heirarchyLabel: '',
        options: [],
        openModal: false,
        count: 2,
        multiSelect: false,
        parentCategory: null, // To track the parent category for hierarchy navigation
    };

    const [categorys, setCategorys] = useState([]);
    const [categoryName, setCategoryName] = useState([]);
    const [selectedPairs, setSelectedPairs] = useState([{ ...initialState }]);
    const [multiSelect, setMultiselect] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [modalIndex, setModalIndex] = useState(null);

    useEffect(() => {
        fetchcategory();
    }, []);

    useEffect(() => {
        const updatedSelectedValues = {};
        const uniqueCategoryKeys = [
            ...new Set(
                product.productCategoriesList?.map(
                    (category) => category?.productGroupName
                )
            ),
        ];
        uniqueCategoryKeys.forEach((category) => {
            const selectedForCategory =
                product.productCategoriesList
                    ?.filter((item) => item.productGroupName === category)
                    .map((item) => item.id) || [];
            updatedSelectedValues[category] = selectedForCategory;
        });
        setSelectedValues(updatedSelectedValues);
    }, [selectedPairs, product.productCategoriesList]);

    const fetchcategory = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const categories = res?.response?.filter(
                (cat) => cat.name?.toLowerCase() !== 'fabric content'
            );
            const categoryNames = categories.map((res) => res.name);
            const mandatoryCategories = categories?.filter((cat) => cat.isMandatory);

            const getLastChildCategories = (selectedKey, childCategories = null) => {
                const childCategory = childCategories
                    ? childCategories
                    : categories.find((cat) => cat.name === selectedKey)?.child || [];
                return childCategory.reduce((acc, category) => {
                    if (!category.child || category.child.length === 0) {
                        acc.push({
                            ...category,
                            value: category.id,
                            label: category.name,
                        });
                    } else {
                        acc.push(...getLastChildCategories(null, category.child));
                    }
                    return acc;
                }, []);
            };

            categoryNames.forEach((item) => {
                setMultiselect((prev) => ({
                    ...prev,
                    [item]: getLastChildCategories(item),
                }));
            });
            setCategoryName(categoryNames);
            setCategorys(categories);
            setCategorysAndselectedPairs(mandatoryCategories);
        } catch (error) {
            console.log('Error fetching categories:', error);
        }
    };

    const setCategorysAndselectedPairs = (mandatoryCategories = []) => {
        const productCategoriesList = product.productCategoriesList || [];
        let formattedCategories = [];
        const uniqueCategoryKeys = new Set();

        if (
            product?.productCategories?.length > 0 ||
            _.size(productCategoriesList) > 0
        ) {
            if (product?.productCategories?.length > 0) {

                formattedCategories = product.productCategories.map((category) => ({
                    ...initialState,
                    options: category?.options || [],
                    key: category?.key,
                    isMandatory: category?.isMandatory || false,
                    heirarchyLabel: category?.heirarchyLabel || '',
                    value: category?.value || {},
                    multiSelect: category?.multiSelect || false,
                    count: category?.heirarchyLabel
                        ? category.heirarchyLabel.split(' / ').length + 1
                        : 2,
                    parentCategory: null, // Will be set when navigating hierarchy
                }));
            }
            setHasMultiSelectCategoryMandatory(formattedCategories);

            _.forEach(productCategoriesList, (prod) => {
                if (!uniqueCategoryKeys.has(prod.productGroupName)) {
                    uniqueCategoryKeys.add(prod.productGroupName);
                    formattedCategories.push({
                        ...initialState,
                        heirarchyLabel: prod.name,
                        key: prod.productGroupName,
                        multiSelect: prod.multiSelect,
                        isMandatory:
                            mandatoryCategories.find(
                                (cat) => cat.name === prod.productGroupName
                            )?.isMandatory || false,
                        options: getParentChild(prod.productGroupName) || [],
                    });
                }
            });
        }

        if (formattedCategories.length > 0) {
            formattedCategories.sort(
                (a, b) => (b.isMandatory === true) - (a.isMandatory === true)
            );
            setSelectedPairs(formattedCategories);
        } else if (
            mandatoryCategories.length > 0 &&
            productCategoriesList.length === 0
        ) {
            formattedCategories = mandatoryCategories.map((category) => ({
                ...initialState,
                options: category?.child || [],
                key: category.name,
                isMandatory: true,
                multiSelect: category.multiSelect,
            }));
            setSelectedPairs(formattedCategories);
            console.log(mandatoryCategories, 'mandatoryCategories');
            setHasMultiSelectCategoryMandatory(mandatoryCategories);
            setProduct((prev) => ({
                ...prev,
                productCategories: formattedCategories.filter(
                    (cat) => !cat.multiSelect
                ),
            }));
        }
    };

    const handleSelectChange = (index, selectedKey) => {
        const newPairs = [...selectedPairs];
        newPairs[index] = {
            ...initialState,
            key: selectedKey,
            options: getParentChild(selectedKey),
        };
        const childCategory = categorys.find((cat) => cat.name === selectedKey);
        if (!childCategory?.multiSelect) {
            setProduct((prev) => ({ ...prev, productCategories: newPairs }));
        }
        setSelectedPairs(newPairs);
        setInputError('');
    };

    const openModals = (index, value) => {
        setModalIndex(value ? index : null);
    };

    const addNewPair = () => {
        setSelectedPairs([...selectedPairs, { ...initialState }]);
    };

    const removePair = (index, catname) => {
        const newPairs = [...selectedPairs];
        newPairs.splice(index, 1);
        setSelectedPairs(newPairs);
        if (catname) {
            setSelectedValues((prevState) => {
                const newState = { ...prevState };
                delete newState[catname];
                return newState;
            });
            const list = product?.productCategoriesList?.filter(
                (item) => item.productGroupName !== catname
            );
            setProduct((prevProduct) => ({
                ...prevProduct,
                productCategoriesList: list,
            }));
        }
        setProduct((prev) => ({
            ...prev,
            productCategories: (newPairs || []).filter((cat) => !cat.multiSelect),
        }));
    };

    const selectcategory = (index, cat) => {
        const newPairs = [...selectedPairs];
        const label = newPairs[index]?.heirarchyLabel;
        newPairs[index].value = cat || {};
        const hasNoChild = _.size(cat?.child) === 0;

        if (cat) {
            if (hasNoChild) {
                const splitLabel = label ? label.split(' / ') : [];
                if (splitLabel.length === newPairs[index].count - 1) {
                    splitLabel[splitLabel.length - 1] = cat.name;
                    newPairs[index].heirarchyLabel = _.join(splitLabel, ' / ');
                } else {
                    newPairs[index].heirarchyLabel = label
                        ? `${label} / ${cat.name}`
                        : cat.name;
                }
                newPairs[index].openModal = false;
                newPairs[index].lastChildName = cat.name;
                newPairs[index].parentCategory = null; // Reset parentCategory when a leaf is selected
                setProduct((prev) => ({
                    ...prev,
                    productCategories: newPairs.filter((cat) => !cat.multiSelect),
                }));
            } else {
                newPairs[index].heirarchyLabel = label
                    ? `${label} / ${cat.name}`
                    : cat.name;
                newPairs[index].count = newPairs[index].count + 1;
                newPairs[index].options = cat.child || [];
                newPairs[index].parentCategory = cat; // Track parent for hierarchy navigation
            }
        } else {
            newPairs[index].heirarchyLabel = '';
            newPairs[index].count = 2;
            newPairs[index].options = getParentChild(newPairs[index].key);
            newPairs[index].parentCategory = null;
        }
        setSelectedPairs(newPairs);
        setInputError('');
    };

    const removeCategory = (index) => {
        const newPairs = [...selectedPairs];
        newPairs[index].heirarchyLabel = '';
        newPairs[index].value = {};
        newPairs[index].count = 2;
        newPairs[index].options = getParentChild(newPairs[index].key);
        newPairs[index].parentCategory = null;
        setSelectedPairs(newPairs);
        setProduct((prev) => ({
            ...prev,
            productCategories: newPairs.filter((cat) => !cat.multiSelect),
        }));
        openModals(index, false);
    };

    const getParentChild = (key) => {
        return categorys.find((cat) => cat.name === key)?.child || [];
    };

    const getAvailableKeys = (currentIndex) => {
        const selectedKeys = selectedPairs.map((pair) => pair.key);
        return categoryName.filter(
            (key) =>
                !selectedKeys.includes(key) || selectedPairs[currentIndex].key === key
        );
    };

    // Navigate back one level in the hierarchy
    const goBackInHierarchy = (index) => {
        const newPairs = [...selectedPairs];
        const pair = newPairs[index];
        if (pair.parentCategory && pair.parentCategory.parentId) {
            // Fetch the parent category
            api.get(`product-category/category/${pair.parentCategory.parentId}`)
                .then((res) => {
                    const parentCategory = res.response;
                    if (parentCategory) {
                        newPairs[index].options = parentCategory.child || [];
                        newPairs[index].parentCategory = parentCategory;
                        const splitLabel = pair.heirarchyLabel.split(' / ');
                        splitLabel.pop(); // Remove the last category
                        newPairs[index].heirarchyLabel = splitLabel.join(' / ');
                        newPairs[index].count = pair.count - 1;
                        setSelectedPairs(newPairs);
                    }
                })
                .catch((error) => {
                    console.log('Error fetching parent category:', error);
                });
        } else {
            // If at the top level, reset to initial options
            newPairs[index].options = getParentChild(pair.key);
            newPairs[index].heirarchyLabel = '';
            newPairs[index].count = 2;
            newPairs[index].parentCategory = null;
            setSelectedPairs(newPairs);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.inputContainer}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                    <Text style={[styles.label, { flex: 1 }]}>Category *</Text>
                    <Text style={[styles.label, { flex: 2 }]}>Level *</Text>
                    <View style={styles.actionColumn} />
                </View>

                {/* Category Rows */}
                {selectedPairs.map((pair, index) => (
                    <View key={index} style={styles.categoryRow}>
                        {/* Category Selection */}
                        <View style={styles.categoryColumn}>
                            <PickerSelect
                                value={pair.key}
                                onValueChange={(value) => handleSelectChange(index, value)}
                                items={getAvailableKeys(index).map((key) => ({
                                    label: key,
                                    value: key,
                                }))}
                                placeholder={{ label: 'Select category', value: '' }}
                                style={styles.picker}
                            />
                            {inputError?.categoryErrors?.[index]?.categoryError && (
                                <Text style={styles.errorText}>
                                    {inputError.categoryErrors[index].categoryErrorMessage ||
                                        inputError.categoryErrors[index].categorysErrorMessage}
                                </Text>
                            )}
                        </View>

                        {/* Level Selection */}
                        <View style={styles.levelColumn}>
                            {!pair.multiSelect ? (
                                <TouchableOpacity
                                    style={[
                                        styles.levelInput,
                                        { opacity: pair.key ? 1 : 0.5 },
                                    ]}
                                    onPress={() => pair.key && openModals(index, true)}
                                    disabled={!pair.key}
                                >
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="Select a category"
                                        value={pair.heirarchyLabel}
                                        editable={false}
                                        pointerEvents="none"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <PickerMultiSelect
                                    groupName={pair.key}
                                    items={
                                        multiSelect[pair.key]?.map((item) => ({
                                            value: item.id,
                                            label: item.name,
                                        })) || []
                                    }
                                    selectedItems={selectedValues[pair.key] || []}
                                    onSelectionsChange={(newSelectedValues) => {
                                        const categoryKey = pair.key;
                                        setSelectedValues((prevValues) => {
                                            const updatedValues = {
                                                ...prevValues,
                                                [categoryKey]: newSelectedValues,
                                            };
                                            const list =
                                                product?.productCategoriesList?.filter(
                                                    (item) => item?.productGroupName !== categoryKey
                                                ) || [];
                                            setProduct((prevProduct) => ({
                                                ...prevProduct,
                                                productCategoriesList: [
                                                    ...list,
                                                    ...multiSelect[categoryKey]?.filter((item) =>
                                                        newSelectedValues.includes(item.id)
                                                    ),
                                                ],
                                            }));
                                            return updatedValues;
                                        });
                                    }}
                                    placeholder="Select categories"
                                />
                            )}
                            {inputError?.categoryErrors?.[index]?.categoryError && (
                                <Text style={styles.errorText}>
                                    {inputError.categoryErrors[index].categoryErrorMessage ||
                                        inputError.categoryErrors[index].categorysErrorMessage}
                                </Text>
                            )}
                        </View>

                        {/* Action Button */}
                        <View style={styles.actionColumn}>
                            {index > 0 && pair.key !== 'Fabric Type' && (
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() =>
                                        removePair(
                                            index,
                                            pair.isMandatory ? pair.key : pair.key
                                        )
                                    }
                                    disabled={pair.isMandatory}
                                >
                                    <Icon name="trash" size={20} color="#dc3545" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Custom Modal for Hierarchical Selection */}
                        <RNModal
                            visible={modalIndex === index}
                            onRequestClose={() => openModals(index, false)}
                            animationType="slide"
                            transparent
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Search all categories</Text>
                                        <TouchableOpacity onPress={() => openModals(index, false)}>
                                            <Icon name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.modalContent}>
                                        {(!pair.value || pair.options.length > 0) && (
                                            <>
                                                <TextInput
                                                    style={styles.searchInput}
                                                    placeholder="Enter a category name"
                                                />
                                                <View style={styles.levelContainer}>
                                                    <Text style={styles.levelText}>Level {pair.count}</Text>
                                                    <View style={styles.divider} />
                                                </View>
                                                <View style={{ maxHeight: 300 }}>
                                                    <ScrollView nestedScrollEnabled>
                                                        {pair.options.map((cat) => (
                                                            <TouchableOpacity
                                                                key={cat.id.toString()}
                                                                style={styles.categoryItem}
                                                                onPress={() => selectcategory(index, cat)}
                                                            >
                                                                <Text style={styles.categoryText}>{cat.name}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            </>
                                        )}
                                        {pair.heirarchyLabel && (
                                            <View style={styles.heirarchyContainer}>
                                                <Text style={styles.heirarchyText}>
                                                    {pair.heirarchyLabel}
                                                </Text>
                                                <View style={styles.heirarchyActions}>
                                                    <TouchableOpacity onPress={() => goBackInHierarchy(index)}>
                                                        <Icon name="arrow-left" size={20} color="#007bff" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => removeCategory(index)}>
                                                        <Icon name="trash" size={20} color="#dc3545" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </RNModal>
                    </View>
                ))}

                {/* Add Another Category Button */}
                {_.size(categorys) > _.size(selectedPairs) && (
                    <TouchableOpacity style={styles.addButton} onPress={addNewPair}>
                        <Icon name="plus" size={20} color="#007bff" />
                        <Text style={styles.addButtonText}>Add another category</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    // contentContainer: {
    //     padding: 16,
    // },
    sectionTitle: {
        fontSize: 18,
        fontFamily: font.bold,
        color: '#333',
        marginBottom: 16,
    },
    inputContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#666',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 4,
    },
    categoryColumn: {
        flex: 1,
        marginRight: 8,
    },
    levelColumn: {
        flex: 2,
    },
    actionColumn: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    picker: {
        fontFamily: font.regular,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    levelInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    inputText: {
        fontSize: 13,
        fontFamily: font.semiBold,
        color: '#333',
    },
    errorText: {
        fontSize: 12,
        fontFamily: font.regular,
        color: '#dc3545',
        marginTop: 4,
    },
    removeButton: {
        padding: 8,
        backgroundColor: '#f8d7da',
        borderRadius: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#e9ecef',
        padding: 10,
        borderRadius: 4,
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#007bff',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#333',
    },
    modalContent: {
        padding: 16,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 4,
        fontFamily: font.regular,
        marginBottom: 16,
    },
    levelContainer: {
        marginBottom: 16,
    },
    levelText: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#333',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    categoryItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    categoryText: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#333',
    },
    heirarchyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginTop: 16,
    },
    heirarchyText: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#333',
        flex: 1,
    },
    heirarchyActions: {
        flexDirection: 'row',
        gap: 16,
    },
});

export default ProductCategorys;