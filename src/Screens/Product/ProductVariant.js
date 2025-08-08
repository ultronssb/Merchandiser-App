import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import _ from 'lodash';
import { ProductContext } from './ProductEdit';
import PickerSelect from '../../common/PickerSelect';
import PickerMultiSelect from '../../common/PickerMultiSelect';
import api from '../../service/api';
import { font } from '../../Settings/Theme';

const ProductVariant = () => {
    const { product, setProduct, inputError, setInputError,mode } = useContext(ProductContext);
    const [attributes, setAttributes] = useState({});
    const [selectedPairs, setSelectedPairs] = useState([{ key: '', values: [] }]);
    const [combinations, setCombinations] = useState([]);
    const [variants, setVariants] = useState([]);
    const [existingPairs, setExistingPairs] = useState({});
    const [existingPairsKeys, setExistingPairsKeys] = useState([]);
    const [productVariantMap, setProductVariantMap] = useState(new Map());

    // Initialize selectedPairs with existing variants when component mounts or product changes
    useEffect(() => {
        if (product && Array.isArray(product.productVariants) && product.productVariants.length > 0) {
            try {
                const keyValuePairs = product.productVariants
                    .filter((pv) => pv && Array.isArray(pv.variants)) // Ensure productVariant and variants are valid
                    .map((productVariant) => {
                        const filteredVariants = productVariant.variants.filter(
                            (variant) => variant?.name && variant.name !== 'Solid / Pattern' && variant.id
                        );
                        return filteredVariants.map((variant) => ({
                            [variant.name]: variant.id,
                        }));
                    })
                    .reduce((acc, objArray) => {
                        objArray.forEach((obj) => {
                            const [key, value] = Object.entries(obj)[0];
                            acc[key] = acc[key] ? [...new Set([...acc[key], value])] : [value];
                        });
                        return acc;
                    }, {});
                setExistingPairs(keyValuePairs);
                const existingKeys = product.productVariants
                    .filter((pv) => pv && Array.isArray(pv.variants))
                    .map((pv) => pv.variants.map((v) => v?.name))
                    .flat()
                    .filter((name) => name); // Remove undefined/null names
                setExistingPairsKeys([...new Set(existingKeys)]);

                // Initialize selectedPairs with existing variant attributes and values
                const initialPairs = Object.keys(keyValuePairs).map((key) => ({
                    key,
                    values: keyValuePairs[key] || [],
                }));
                setSelectedPairs(initialPairs.length > 0 ? initialPairs : [{ key: '', values: [] }]);
            } catch (error) {
                console.error('Error initializing selectedPairs:', error);
                setExistingPairs({});
                setExistingPairsKeys([]);
                setSelectedPairs([{ key: '', values: [] }]);
            }
        } else {
            setExistingPairs({});
            setExistingPairsKeys([]);
            setSelectedPairs([{ key: '', values: [] }]);
        }
    }, [product?.id, product?.productVariants]); // Added product.productVariants to dependencies

    useEffect(() => {
        fetchVariant();
    }, []);

    useEffect(() => {
        generateProductVariantMap();
    }, [product?.productVariants]);

    useEffect(() => {
        updateCombinations(selectedPairs);
    }, [variants, selectedPairs]);

    const generateCombinations = (lists) => {
        const result = [];
        const generate = (current, depth) => {
            if (depth === lists.length) {
                result.push([...current]);
                return;
            }
            for (const element of lists[depth]) {
                current.push(element);
                generate(current, depth + 1);
                current.pop();
            }
        };
        generate([], 0);
        return result;
    };

    const generateProductVariantMap = () => {
        if (Array.isArray(product?.productVariants) && product.productVariants.length > 0) {
            const productMap = new Map();
            product.productVariants
                .filter((pv) => pv && Array.isArray(pv.variants))
                .forEach((pv) => {
                    const variantIds = pv.variants
                        .filter((va) => va && va.id)
                        .map((va) => va.id);
                    const sortedVariantIds = _.sortBy(variantIds);
                    productMap.set(JSON.stringify(sortedVariantIds), pv);
                });
            setProductVariantMap(productMap);
        } else {
            setProductVariantMap(new Map());
        }
    };

    const findMatchingVariant = (combination) => {
        for (let i = 0; i < combination.length; i++) {
            const partialCombination = _.slice(combination, 0, i + 1);
            const flattenedCombination = _.flatten(partialCombination);
            const sortedFlattenedCombination = _.sortBy(flattenedCombination);
            const key = JSON.stringify(sortedFlattenedCombination);
            if (productVariantMap.has(key)) {
                const variant = productVariantMap.get(key);
                productVariantMap.delete(key);
                return variant;
            }
        }
        return null;
    };

    const updateCombinations = async (pairs) => {
        if (!Array.isArray(variants) || variants.length === 0) return;
        const validPairs = pairs.filter((pair) => pair.key && pair.values.length > 0);
        const newCombinations = generateCombinations(validPairs.map((pair) => pair.values));
        const prodVariants = [];
        setCombinations(newCombinations);
        newCombinations.forEach((combination) => {
            let variant = findMatchingVariant(combination) || {};
            const variantObjects = combination
                .map((c) => variants.find((v) => v?.id === c))
                .filter((v) => v); // Remove undefined variants
            if (variantObjects.length === 0) return; // Skip empty combinations
            variant.variants = variantObjects;
            variant.status = variant.id ? variant.status : 'ACTIVE';
            variant.name = `${product.articleName || 'Product'} / ${getVariantName(variant.variants)}`;
            prodVariants.push(variant);
        });
        setProduct((prev) => ({
            ...prev,
            newProductVariants: prodVariants,
        }));
        generateProductVariantMap();
    };

    const fetchVariant = async () => {
        try {
            const response = await api.get('variant');
            const groupedVariants = _.groupBy(response.response, 'name');
            setAttributes(groupedVariants);
            setVariants(response.response || []);
        } catch (error) {
            console.error('Error fetching variants:', error);
            setAttributes({});
            setVariants([]);
        }
    };

    const handleSelectChange = (index, selectedValue) => {
        const newPairs = [...selectedPairs];
        const oldKey = newPairs[index].key;
        newPairs[index].key = selectedValue || '';
        if (!selectedValue) newPairs[index].values = [];
        if (newPairs[index].key !== oldKey) newPairs[index].values = [];
        setSelectedPairs(newPairs);
        updateCombinations(newPairs);
    };

    const handleMultiSelectChange = (index, selectedValues) => {
        const newPairs = [...selectedPairs];
        newPairs[index].values = selectedValues || [];
        setSelectedPairs(newPairs);
        updateCombinations(newPairs);
    };

    const handleSelectSolidChange = (index, selectedValue) => {
        const newPairs = [...selectedPairs];
        newPairs[index].values = selectedValue ? [selectedValue] : [];
        setSelectedPairs(newPairs);
        updateCombinations(newPairs);
    };

    const addNewPair = () => {
        setSelectedPairs([...selectedPairs, { key: '', values: [] }]);
    };

    const removePair = (index) => {
        const newPairs = selectedPairs.filter((_, i) => i !== index);
        setSelectedPairs(newPairs);
        updateCombinations(newPairs);
    };

    const removeVariant = (index) => {
        const removedVariant = product.newProductVariants[index];
        const newVariants = product.newProductVariants.filter((_, i) => i !== index);

        // Update selectedPairs based on remaining variants
        const remainingVariantValues = newVariants.reduce((acc, variant) => {
            if (variant && Array.isArray(variant.variants)) {
                variant.variants.forEach((v) => {
                    if (v && v.name && v.id) {
                        if (!acc[v.name]) {
                            acc[v.name] = new Set();
                        }
                        acc[v.name].add(v.id);
                    }
                });
            }
            return acc;
        }, {});

        const newPairs = selectedPairs
            .map((pair) => {
                if (!pair.key) return pair;
                const usedValues = remainingVariantValues[pair.key]
                    ? Array.from(remainingVariantValues[pair.key])
                    : [];
                return {
                    ...pair,
                    values: pair.values.filter((value) => usedValues.includes(value)),
                };
            })
            .filter((pair) => {
                return (
                    pair.key &&
                    (pair.values.length > 0 || existingPairsKeys.includes(pair.key))
                );
            });

        setSelectedPairs(newPairs.length > 0 ? newPairs : [{ key: '', values: [] }]);
        setProduct((prev) => ({
            ...prev,
            newProductVariants: newVariants,
        }));
        updateCombinations(newPairs);
    };

    const getAvailableKeys = (index) =>
        Object.keys(attributes).filter(
            (key) => !selectedPairs.some((pair, i) => pair.key === key && i !== index)
        );

    const getVariantName = (variants) =>
        variants
            .filter((variant) => variant && variant.value)
            .map((variant) => variant.value)
            .join(' / ');

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Variant Attributes Section */}
            <View style={styles.section}>
                <View style={styles.attributeHeader}>
                    <Text style={[styles.label, { flex: 1 }]}>Variant Name (e.g. colour) *</Text>
                    <Text style={[styles.label, { flex: 2 }]}>Value (e.g. Green) *</Text>
                </View>
                {selectedPairs.map((pair, index) => (
                    <View key={index} style={styles.attributeRow}>
                        <View style={styles.attributeName}>
                            <PickerSelect
                                value={pair.key || ''}
                                onValueChange={(value) => handleSelectChange(index, value)}
                                items={getAvailableKeys(index).map((key) => ({
                                    label: key,
                                    value: key,
                                }))}
                                placeholder={{ label: 'Select attribute', value: '' }}
                                disabled={existingPairsKeys.includes(pair.key) && product?.id}
                                style={styles.picker}
                            />
                        </View>
                        <View style={styles.attributeValues}>
                            {pair.key === 'Solid / Pattern' ? (
                                <PickerSelect
                                    value={pair.values[0] || ''}
                                    onValueChange={(value) => handleSelectSolidChange(index, value)}
                                    items={
                                        attributes[pair.key]
                                            ? attributes[pair.key].map((item) => ({
                                                value: item.id,
                                                label: item.value,
                                            }))
                                            : []
                                    }
                                    placeholder={{ label: 'Select value', value: '' }}
                                    style={styles.picker}
                                disabled={mode==='unapproved'}

                                />
                            ) : (
                                <PickerMultiSelect
                                    groupName={pair.key || ''}
                                    items={
                                        attributes[pair.key]
                                            ? attributes[pair.key].map((item) => ({
                                                value: item.id,
                                                label: item.value,
                                            }))
                                            : []
                                    }
                                    selectedItems={pair.values || []}
                                    onSelectionsChange={(values) => handleMultiSelectChange(index, values)}
                                    placeholder="Select values"
                                                                disable={mode==='unapproved'}


                                />
                            )}
                        </View>{console.log(mode)}
                        {index > 0 && !existingPairsKeys.includes(pair.key) && mode!=='unapproved' &&(
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removePair(index)}
                            >
                                <Icon name="delete" size={20} color="#dc3545" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                {Object.keys(attributes).length > selectedPairs.length && mode!=='unapproved'&&  (
                    <TouchableOpacity style={styles.addButton} onPress={addNewPair}>
                        <Icon name="add" size={20} color="#007bff" />
                        <Text style={styles.addButtonText}>Add another attribute</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Variant List Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    This product has {product?.newProductVariants?.length || 0} variant
                    {product?.newProductVariants?.length !== 1 ? 's' : ''}
                </Text>
                {product?.newProductVariants?.length > 0 ? (
                    <View style={styles.variantList}>
                        {product.newProductVariants.map((variant, index) => (
                            <View key={index} style={styles.variantItem}>
                                <Text style={styles.variantName} numberOfLines={1} ellipsizeMode="tail">
                                    {variant.name || 'Unnamed Variant'}
                                </Text>
                                {mode!=='unapproved' &&  <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => removeVariant(index)}
                                >
                                    <Icon name="delete" size={20} color="#dc3545" />
                                </TouchableOpacity>}
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noVariantsText}>No variants selected</Text>
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

    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
    },
    attributeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontFamily: font.semiBold,
        color: '#666',
    },
    attributeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    attributeName: {
        flex: 1,
        marginRight: 8,
    },
    attributeValues: {
        flex: 2,
    },
    picker: {
        fontFamily: font.regular,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    removeButton: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: '#f8d7da',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
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
    sectionTitle: {
        fontSize: 18,
        fontFamily: font.bold,
        color: '#333',
        marginBottom: 16,
    },
    variantList: {
        marginTop: 8,
    },
    variantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
        marginBottom: 8,
    },
    variantName: {
        fontSize: 14,
        fontFamily: font.medium,
        color: '#333',
        flex: 1,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#f8d7da',
        borderRadius: 4,
    },
    noVariantsText: {
        fontSize: 14,
        fontFamily: font.regular,
        color: '#666',
        textAlign: 'center',
    },
});

export default ProductVariant;