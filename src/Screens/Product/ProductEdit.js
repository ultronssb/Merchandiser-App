import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    FlatList,
    Modal
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import _ from 'lodash';
import { useNavigation } from '@react-navigation/native';
import { backendUrl, common, storage } from '../../common/Common';
import { font } from '../../Settings/Theme';
import api from '../../service/api';
import VendorPicker from '../../common/VendorPicker';
import PickerSelect from '../../common/PickerSelect';
import PickerMultiSelect from '../../common/PickerMultiSelect';
import ProductVariant from './ProductVariant';
import { configureFonts, TouchableRipple } from 'react-native-paper';

export const ProductContext = React.createContext();

const ProductEdit = ({ route }) => {
    const navigation = useNavigation();
    const mode = route?.params?.statusProduct || 'new';
    const productId = route?.params?.productId;

    const initialProductState = {
        vendorId: '',
        vendorUsername: '',
        vendorProductId: '',
        vendorProductName: '',
        gsm: '',
        uom: '',
        imageFile: null,
        width: '',
        fabricContent: { composition: {}, value: '' },
        fabricType: '',
        variants: [],
        sampleAvailable: false,
        swatchAvailable: false,
        coneWeight: '',
        price: '',
        totalProductPercent: 0,
        productCategories: [],
        productCategoriesList: [],
        newProductVariants: [],
        productVariants: []
    };

    const initialCategoryState = {
        key: '',
        value: {},
        heirarchyLabel: '',
        options: [],
        openModal: false,
        count: 2,
        multiSelect: false,
        parentCategory: null,
        isMandatory: false
    };

    const [product, setProduct] = useState(initialProductState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fabricTypes, setFabricTypes] = useState([]);
    const [variantOptions, setVariantOptions] = useState([]);
    const [fabricContent, setFabricContent] = useState({});
    const [selectedFabricPairs, setSelectedFabricPairs] = useState([{ key: '', value: '0' }]);
    const [totalPercent, setTotalPercent] = useState(0);
    const [lastChild, setLastChild] = useState([]);
    const [fCCValue, setFCCValue] = useState('');
    const [fabricValue, setFabricValue] = useState([]);
    const [fabricOptions, setFabricOptions] = useState([]);
    const [inputError, setInputError] = useState({});
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState([]);
    const [categoryPairs, setCategoryPairs] = useState([{ ...initialCategoryState }]);
    const [multiSelect, setMultiselect] = useState({});
    const [selectedValues, setSelectedValues] = useState({});
    const [modalIndex, setModalIndex] = useState(null);

    const uomOptions = [
        { label: 'Kg', value: 'Kg' },
        { label: 'Roll', value: 'Roll' },
        { label: 'Meter', value: 'Meter' },
        { label: 'Yard', value: 'Yard' }
    ];

    const fieldConfig = [
        {
            id: '1', name: 'Vendor', fieldType: 'vendorPicker', key: 'vendorUsername', require: true,
            placeholder: 'Select Vendor', errorMessage: 'vendorId', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '2', name: 'Vendor Product ID', fieldType: 'textField', type: 'text', key: 'vendorProductId', require: true,
            placeholder: 'Enter Vendor Product ID', errorMessage: 'vendorProductId', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '3', name: 'Vendor Product Name', fieldType: 'textField', type: 'text', key: 'vendorProductName', require: true,
            placeholder: 'Enter product name', errorMessage: 'vendorProductName', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '4', name: 'GSM', fieldType: 'textField', type: 'number', key: 'gsm', require: false,
            placeholder: 'Enter GSM', errorMessage: 'gsm', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '5', name: 'UOM', fieldType: 'radio', key: 'uom', require: true,
            placeholder: 'Select UOM', items: uomOptions, errorMessage: 'uom', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '6', name: 'Image', fieldType: 'imageField', key: 'imageFile', require: true,
            placeholder: 'Upload or Select Image', errorMessage: 'imageFile', editableWhen: ['new'],
            viewableIn: ["new", "view", 'in_progress', 'unapproved']
        },
        {
            id: '7', name: 'Width', fieldType: 'textField', type: 'number', key: 'width', require: false,
            placeholder: 'Enter Width', errorMessage: 'width', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '8', name: 'Composition', fieldType: 'compositionField', key: 'fabricContent', require: false,
            placeholder: 'Select or Add Fabric Combination', errorMessage: 'fabricContent', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '9', name: 'Fabric Type', fieldType: 'categoryField', key: 'productCategories', require: false,
            placeholder: 'Select Fabric Type', errorMessage: 'productCategories', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '10', name: 'Variants', fieldType: 'variantField', key: 'variants', require: false,
            placeholder: 'Select Variants', errorMessage: 'variants', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '11', name: 'Sample Available', fieldType: 'checkbox', key: 'sampleAvailable', require: false,
            errorMessage: 'sampleAvailable', editableWhen: ['in_progress'], viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '12', name: 'Swatch Available', fieldType: 'checkbox', key: 'swatchAvailable', require: false,
            errorMessage: 'swatchAvailable', editableWhen: ['in_progress'], viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '13', name: 'Cone Weight', fieldType: 'textField', type: 'number', key: 'coneWeight', require: false,
            placeholder: 'Enter Cone Weight', errorMessage: 'coneWeight', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        },
        {
            id: '14', name: 'Price', fieldType: 'textField', type: 'number', key: 'price', require: false,
            placeholder: 'Enter Price', errorMessage: 'price', editableWhen: ['in_progress'],
            viewableIn: ['in_progress', 'unapproved']
        }
    ];

    // Fetch initial data
    useEffect(() => {
        fetchFabricTypes();
        fetchVariants();
        fetchVariant();
        getFabricValues();
        fetchCategories();
    }, []);

    // Fetch product data when productId and categories are available
    useEffect(() => {
        if (productId && categories.length > 0) {
            fetchProduct(productId);
        }
    }, [productId, categories]);

    // Memoize product categories to prevent unnecessary updates
    const memoizedProductCategories = useMemo(() => product.productCategories, [product.productCategories]);
    const memoizedProductCategoriesList = useMemo(() => product.productCategoriesList, [product.productCategoriesList]);

    // Synchronize categoryPairs with product and categories
    useEffect(() => {
        const mandatoryCategories = categories.filter(cat => cat.isMandatory);
        // Deep comparison to avoid unnecessary updates
        const currentCategoryPairs = JSON.stringify(categoryPairs);
        const newCategoryPairs = JSON.stringify(
            setCategorysAndCategoryPairs(
                memoizedProductCategories,
                memoizedProductCategoriesList,
                mandatoryCategories,
                true // Return value without setting state
            )
        );
        if (currentCategoryPairs !== newCategoryPairs) {
            setCategorysAndCategoryPairs(
                memoizedProductCategories,
                memoizedProductCategoriesList,
                mandatoryCategories
            );
        }
    }, [memoizedProductCategories, memoizedProductCategoriesList, categories]);

    const fetchFabricTypes = async () => {
        try {
            const res = await api.get('fabric?status=ACTIVE');
            setFabricTypes(res.response.map(item => ({ label: item.name, value: item.id })));
        } catch (error) {
            console.log('Error fetching fabric types:', error?.response || error);
        }
    };

    const fetchVariants = async () => {
        try {
            const res = await api.get('variant');
            setVariantOptions(res.response.map(item => ({ label: item.value, value: item.id })));
        } catch (error) {
            console.log('Error fetching variants:', error?.response || error);
        }
    };

    const fetchVariant = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const categories = res.response;
            const category = categories.find(cat => cat.name === 'Fabric Content');
            setFabricContent(category);
            if (category?.child) {
                const emptyNodes = findEmptyChildNodes(category);
                setLastChild(emptyNodes);
            }
        } catch (error) {
            console.log('Error fetching variants:', error?.response || error);
        }
    };

    const getFabricValues = async () => {
        try {
            const res = await api.get(`fabric?status=ACTIVE`);
            setFabricValue(res?.response || []);
            const options = res?.response.map(item => ({
                label: item.value,
                value: item.value
            })) || [];
            setFabricOptions([{ label: "Select Combination", value: "" }, ...options]);
        } catch (error) {
            console.log("Error fetching fabric values: ", error?.response || error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const filteredCategories = res?.response?.filter(
                cat => cat.name?.toLowerCase() !== 'fabric content'
            );
            const categoryNames = filteredCategories.map(cat => cat.name);

            const getLastChildCategories = (selectedKey, childCategories = null) => {
                const childCategory = childCategories
                    ? childCategories
                    : filteredCategories.find(cat => cat.name === selectedKey)?.child || [];
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

            const multiSelectData = {};
            categoryNames.forEach(item => {
                multiSelectData[item] = getLastChildCategories(item);
            });
            setMultiselect(multiSelectData);
            setCategoryName(categoryNames);
            setCategories(filteredCategories);
        } catch (error) {
            console.log('Error fetching categories:', error?.response || error);
        }
    };

    const setCategorysAndCategoryPairs = (productCategories, productCategoriesList, mandatoryCategories, returnOnly = false) => {
        let formattedCategories = [];
        const uniqueCategoryKeys = new Set();

        if (productCategories?.length > 0) {
            formattedCategories = productCategories.map(category => {
                uniqueCategoryKeys.add(category.key);
                return {
                    ...initialCategoryState,
                    options: category?.options || [],
                    key: category?.key,
                    isMandatory: mandatoryCategories.find(cat => cat.name === category.key)?.isMandatory || false,
                    heirarchyLabel: category?.heirarchyLabel || '',
                    value: category?.value || {},
                    multiSelect: category?.multiSelect || false,
                    count: category?.heirarchyLabel
                        ? category.heirarchyLabel.split(' / ').length + 1
                        : 2,
                    parentCategory: null,
                };
            });
        }

        if (productCategoriesList?.length > 0) {
            productCategoriesList.forEach(prod => {
                if (!uniqueCategoryKeys.has(prod.productGroupName)) {
                    uniqueCategoryKeys.add(prod.productGroupName);
                    formattedCategories.push({
                        ...initialCategoryState,
                        heirarchyLabel: prod.name,
                        key: prod.productGroupName,
                        multiSelect: prod.multiSelect,
                        isMandatory: mandatoryCategories.find(cat => cat.name === prod.productGroupName)?.isMandatory || false,
                        options: getParentChild(prod.productGroupName) || [],
                    });
                }
            });
        }

        // Add mandatory categories if not already included
        mandatoryCategories.forEach(category => {
            if (!uniqueCategoryKeys.has(category.name)) {
                uniqueCategoryKeys.add(category.name);
                formattedCategories.push({
                    ...initialCategoryState,
                    options: category?.child || [],
                    key: category.name,
                    isMandatory: true,
                    multiSelect: category.multiSelect || false,
                    count: 2,
                    parentCategory: null,
                });
            }
        });

        if (returnOnly) {
            return formattedCategories;
        }

        if (formattedCategories.length > 0) {
            formattedCategories.sort((a, b) => (b.isMandatory === true) - (a.isMandatory === true));
            setCategoryPairs(formattedCategories);
            // Only update product if productCategories has changed
            const currentProductCategories = JSON.stringify(product.productCategories);
            const newProductCategories = JSON.stringify(formattedCategories.filter(cat => !cat.multiSelect));
            if (currentProductCategories !== newProductCategories) {
                setProduct(prev => ({
                    ...prev,
                    productCategories: formattedCategories.filter(cat => !cat.multiSelect),
                }));
            }
        } else {
            setCategoryPairs([{ ...initialCategoryState }]);
        }

        const updatedSelectedValues = {};
        const uniqueCategoryKeysList = [
            ...new Set(productCategoriesList?.map(category => category?.productGroupName))
        ];
        uniqueCategoryKeysList.forEach(category => {
            const selectedForCategory = productCategoriesList
                ?.filter(item => item.productGroupName === category)
                .map(item => item.id) || [];
            updatedSelectedValues[category] = selectedForCategory;
        });
        setSelectedValues(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(updatedSelectedValues)) {
                return updatedSelectedValues;
            }
            return prev;
        });
    };

    const fetchProduct = async (id) => {
        try {
            const res = await api.get(`draftProduct/get/${id}`); console.log(res);
            if (res?.response) {
                const productData = res.response;
                const vendorRes = await api.get(`vendor/${productData.vendorId}`);
                const fabricContent = productData.fabricContent || { composition: {}, value: '' };
                const compositionPairs = Object.entries(fabricContent.composition || {}).map(([key, value]) => ({
                    key,
                    value: value.toString()
                }));

                const fabricTypeCategory = productData.productCategoriesList?.find(
                    cat => cat.productGroupName === 'Fabric Type'
                );
                const fetchHierarchy = async (parentId) => {
                    let hierarchy = [];
                    let currentId = parentId;
                    while (currentId) {
                        const resp = await api.get(`product-category/category/${currentId}`);
                        const cat = resp.response;
                        if (!cat) break;
                        hierarchy.push(cat.name);
                        currentId = cat.parentId;
                    }
                    return hierarchy.reverse();
                };

                const transformCategories = async () => {
                    const result = [];
                    const productCats = productData.productCategories || {};
                    for (const [key, val] of Object.entries(productCats)) {
                        let details = val;
                        if (!details.name || !details.categoryId) {
                            try {
                                const dres = await api.get(`product-category/category/${val.categoryId}`);
                                details = dres.response;
                            } catch {
                                details = { name: key, categoryId: val.categoryId };
                            }
                        }
                        const hierarchy = await fetchHierarchy(details.categoryId);
                        const heirarchyLabel = hierarchy.length > 1 ? hierarchy?.slice(1).join('/') : details.name;

                        result.push({
                            key,
                            value: details,
                            heirarchyLabel,
                            options: Array.isArray(details.options) ? details.options : [],
                            openModal: false,
                            count: hierarchy.length + 1,
                            multiSelect: details.multiSelect || false,
                        });
                    }
                    return result;
                };

                let restoredCats = [];
                if (productData.productCategories && Object.keys(productData.productCategories).length > 0) {
                    restoredCats = await transformCategories();
                }
                const updatedProduct = {
                    ...productData,
                    status: productData.status || mode,
                    vendorId: productData.vendorId,
                    vendorUsername: vendorRes?.response?.username || '',
                    vendorProductId: productData?.vendorProductCode || productData.vendorProductId || '',
                    gsm: productData.metrics?.weight || '',
                    uom: productData.otherInformation?.unitOfMeasures?.isRoll ? 'Roll' :
                        productData.otherInformation?.unitOfMeasures?.isKg ? 'Kg' :
                            productData.otherInformation?.unitOfMeasures?.isMeter ? 'Meter' : 'Yard',
                    imageFile: productData.vendorImage ? { uri: `${backendUrl}${productData?.vendorImage.replace("/api", "")}` } : null,
                    width: productData.metrics?.width || '',
                    fabricType: fabricTypeCategory ? fabricTypeCategory.name : '',
                    variants: productData.variants || [],
                    sampleAvailable: productData.sampleAvailable || false,
                    swatchAvailable: productData.swatchAvailable || false,
                    coneWeight: productData.otherInformation?.coneWeight || '',
                    price: productData.price || '',
                    totalProductPercent: Object.values(fabricContent.composition || {}).reduce((acc, val) => acc + val, 0) || 0,
                    fabricContent,
                    productCategories: restoredCats,
                    productCategoriesList: productData.productCategoriesList || [],
                    productVariants: productData.productVariants || [],
                    newProductVariants: productData.productVariants || []
                };

                setProduct(updatedProduct);
                setFCCValue(fabricContent.value || '');
                setTotalPercent(Object.values(fabricContent.composition || {}).reduce((acc, val) => acc + val, 0) || 0);
                setSelectedFabricPairs(compositionPairs.length > 0 ? compositionPairs : [{ key: '', value: '0' }]);
            }
        } catch (error) {
            console.log('Error fetching product:', error?.response || error);
            Alert.alert('Error', 'Failed to fetch product data');
        }
    };

    const handleChange = async (value, key) => {
        if (key === 'vendorUsername') {
            try {
                const vendorRes = await api.get(`vendor/${value}`);
                setProduct(prev => ({
                    ...prev,
                    vendorId: value,
                    vendorUsername: vendorRes?.response?.username || ''
                }));
                setErrors(prev => ({ ...prev, vendorId: '' }));
            } catch (error) {
                console.log('Error fetching vendor details:', error?.response || error);
            }
        } else {
            if (key === 'width') {
                setProduct(prev => ({
                    ...prev,
                    metrics: { ...prev.metrics, width: value }
                }));
            }
            setProduct(prev => ({
                ...prev,
                [key]: value
            }));
            setErrors(prev => ({
                ...prev,
                [key]: ''
            }));
        }
    };

    const handleImagePick = async () => {
        const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
        if (res.assets && res.assets[0]) {
            const asset = res.assets[0];
            if (asset.fileSize > 3 * 1024 * 1024) {
                Alert.alert('Error', 'Image must be < 3MB');
            } else {
                handleChange(asset, 'imageFile');
            }
        }
    };

    const findEmptyChildNodes = (node) => {
        const result = [];
        function traverse(node) {
            if (node && node.child && node.child.length === 0) {
                result.push(node);
            }
            if (node && node.child) {
                node.child.forEach(traverse);
            }
        }
        traverse(node);
        return result;
    };

    const keyToNameMap = lastChild.reduce((map, item) => {
        map[item.categoryId] = item.name;
        return map;
    }, {});

    const getAvailableFabricKeys = (currentIndex) => {
        const selectedKeys = selectedFabricPairs.map(pair => pair.key);
        return Object.keys(keyToNameMap).filter(
            key => !selectedKeys.includes(key) || selectedFabricPairs[currentIndex].key === key
        );
    };
    const handleSubmit = async () => {
        const token = storage.getString('token');
        setIsSubmitting(true);
        setLoading(true);

        const formData = new FormData();
        let updatedProduct = {
            ...product,
            vendorId: product.vendorId,
            vendorProductCode: product.vendorProductId,
            productCategories: mode === 'new'
                ? null
                : product.productCategories.reduce((acc, cat) => {
                    if (!cat.key || !cat.value) return acc;
                    acc[cat.key] = cat.value;

                    return acc;
                }, {}),
            productVariants: product?.newProductVariants || [],
            metrics: {
                ...product.metrics,
                weight: product.gsm,
                width: product.width || ''
            },
            vendorProductInfo: {
                vendorId: product.vendorId,
                draftProductId: product.draftProductId,
                costPrice: product.price || '',
                swatchAvailable: product.swatchAvailable || false,
                sampleAvailable: product.sampleAvailable || false,
                coneWeight: product.coneWeight || '',
            }
        };

        console.log(updatedProduct);

        if (product.imageFile && product.imageFile.uri && !product.imageFile.uri.startsWith(backendUrl)) {
            formData.append('image', {
                uri: product.imageFile.uri,
                name: product.imageFile.fileName || 'image.jpeg',
                type: product.imageFile.type || 'image/jpeg',
            });
        }

        formData.append('product', JSON.stringify(updatedProduct));

        try {
            await axios.post(`${backendUrl}/draftProduct`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Product created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            setProduct(initialProductState);
            setErrors({});
            setTotalPercent(0);
            setFCCValue('');
        } catch (error) {
            console.log(error?.response || error);
            Alert.alert('Error', 'Failed to create product: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const handleFabricSelectChange = (index, selectedValue) => {
        const newPairs = [...selectedFabricPairs];
        const oldKey = newPairs[index].key;
        const oldValue = parseInt(newPairs[index].value, 10) || 0;

        newPairs[index].key = selectedValue || '';
        newPairs[index].value = selectedValue ? newPairs[index].value : '0';

        const newValue = parseInt(newPairs[index].value, 10) || 0;
        const updatedTotal = totalPercent - oldValue + newValue;

        setSelectedFabricPairs(newPairs);
        setTotalPercent(updatedTotal);

        setProduct(prev => {
            const updatedComposition = { ...prev.fabricContent.composition };
            if (oldKey && oldKey !== selectedValue) {
                delete updatedComposition[oldKey];
            }
            if (selectedValue) {
                updatedComposition[selectedValue] = newValue;
            }

            return {
                ...prev,
                totalProductPercent: updatedTotal,
                fabricContent: {
                    ...prev.fabricContent,
                    composition: updatedComposition
                }
            };
        });

        const pairsObject = newPairs.reduce((acc, pair) => {
            if (pair.key && pair.value) {
                acc[pair.key] = parseInt(pair.value, 10);
            }
            return acc;
        }, {});

        if (Object.keys(pairsObject).length > 0) {
            fabricContentCode(pairsObject);
        } else {
            setFCCValue('');
            setProduct(prev => ({
                ...prev,
                fabricContent: {
                    ...prev.fabricContent,
                    value: ''
                }
            }));
        }

        setErrors(prev => ({
            ...prev,
            fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
        }));
    };

    const handleFabricValueChange = (index, value) => {
        const newPairs = [...selectedFabricPairs];
        const key = newPairs[index].key;
        const previousValue = parseInt(newPairs[index].value, 10) || 0;

        if (value !== '' && isNaN(parseInt(value, 10))) {
            return;
        }

        newPairs[index].value = value;
        const newValue = parseInt(value, 10) || 0;
        const updatedTotal = totalPercent - previousValue + newValue;

        setSelectedFabricPairs(newPairs);
        setTotalPercent(updatedTotal);

        if (key) {
            setProduct(prev => ({
                ...prev,
                totalProductPercent: updatedTotal,
                fabricContent: {
                    ...prev.fabricContent,
                    composition: {
                        ...prev.fabricContent.composition,
                        [key]: newValue
                    }
                }
            }));

            const pairsObject = newPairs.reduce((acc, pair) => {
                if (pair.key && pair.value) {
                    acc[pair.key] = parseInt(pair.value, 10);
                }
                return acc;
            }, {});

            fabricContentCode(pairsObject);
        }

        setErrors(prev => ({
            ...prev,
            fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
        }));
    };

    const fabricContentCode = async (newPairs) => {
        try {
            const results = await Promise.all(
                Object.entries(newPairs).map(async ([key, value]) => {
                    const res = await api.get(`product-category/category/${key}`);
                    const name = res.response.name;
                    const fcc = name.substring(0, 3).toUpperCase();
                    return `${fcc}-${value}%`;
                })
            );
            const formattedFCC = results.join(' ');
            setProduct(prev => ({
                ...prev,
                fabricContent: {
                    ...prev.fabricContent,
                    value: formattedFCC
                }
            }));
            setFCCValue(formattedFCC);
        } catch (error) {
            console.log("Error generating fabric content code: ", error?.response || error);
        }
    };

    const addNewFabricPair = () => {
        if (totalPercent < 100) {
            setSelectedFabricPairs([...selectedFabricPairs, { key: '', value: '0' }]);
            setErrors(prev => ({
                ...prev,
                fabricContent: ''
            }));
        } else {
            setErrors(prev => ({
                ...prev,
                fabricContent: 'Total fabric content cannot exceed 100%'
            }));
        }
    };

    const removeFabricPair = (index) => {
        const newPairs = [...selectedFabricPairs];
        const removedKey = newPairs[index].key;
        const removedValue = parseInt(newPairs[index].value, 10) || 0;
        const updatedTotal = totalPercent - removedValue;

        newPairs.splice(index, 1);
        setSelectedFabricPairs(newPairs);
        setTotalPercent(updatedTotal);

        setProduct(prev => {
            const { [removedKey]: _, ...newComposition } = prev.fabricContent.composition;
            return {
                ...prev,
                totalProductPercent: updatedTotal,
                fabricContent: {
                    ...prev.fabricContent,
                    composition: newComposition
                }
            };
        });

        const pairsObject = newPairs.reduce((acc, pair) => {
            if (pair.key && pair.value) {
                acc[pair.key] = parseInt(pair.value, 10);
            }
            return acc;
        }, {});

        if (Object.keys(pairsObject).length > 0) {
            fabricContentCode(pairsObject);
        } else {
            setFCCValue('');
            setProduct(prev => ({
                ...prev,
                fabricContent: {
                    ...prev.fabricContent,
                    value: ''
                }
            }));
        }

        setErrors(prev => ({
            ...prev,
            fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
        }));
    };
    const handleRequestInfo = async () => {
        console.log(product);
    };

    const handleFabricChange = (selectedValue) => {
        const selectedFabric = fabricValue.find(fabric => fabric.value === selectedValue);
        if (!selectedFabric) {
            setSelectedFabricPairs([{ key: '', value: '0' }]);
            setTotalPercent(0);
            setFCCValue('');
            setProduct(prev => ({
                ...prev,
                totalProductPercent: 0,
                fabricContent: {
                    ...prev.fabricContent,
                    composition: {},
                    value: ''
                }
            }));
            setErrors(prev => ({ ...prev, fabricContent: '' }));
            return;
        }

        const compositionArray = Object.entries(selectedFabric.composition);
        const pairValues = selectedFabric.value.split(' ').map(item => {
            const match = item.match(/(\d+)%/);
            return match ? parseInt(match[1], 10) : 0;
        });

        const valueOrderMap = pairValues.reduce((acc, value, index) => {
            acc[value] = index;
            return acc;
        }, {});

        const sortedPairs = compositionArray.sort((a, b) => {
            return valueOrderMap[a[1]] - valueOrderMap[b[1]];
        });

        const newPairs = sortedPairs.map(([key, value]) => ({
            key,
            value: value.toString()
        }));

        const totalSum = sortedPairs.reduce((sum, [_, value]) => sum + parseInt(value, 10) || 0, 0);

        setSelectedFabricPairs(newPairs);
        setTotalPercent(totalSum);
        setFCCValue(selectedFabric.value);

        setProduct(prev => ({
            ...prev,
            totalProductPercent: totalSum,
            fabricContent: {
                ...prev.fabricContent,
                composition: sortedPairs.reduce((acc, [key, value]) => {
                    acc[key] = parseInt(value, 10);
                    return acc;
                }, {}),
                value: selectedFabric.value
            }
        }));

        setErrors(prev => ({
            ...prev,
            fabricContent: totalSum > 100 ? 'Total fabric content cannot exceed 100%' : ''
        }));
    };

    const handleVariantChange = (variants) => {
        setProduct(prev => ({
            ...prev,
            variants
        }));
    };

    const handleCategorySelectChange = (index, selectedKey) => {
        const newPairs = [...categoryPairs];
        newPairs[index] = {
            ...initialCategoryState,
            key: selectedKey,
            options: getParentChild(selectedKey),
            isMandatory: categories.find(cat => cat.name === selectedKey)?.isMandatory || false
        };
        const childCategory = categories.find(cat => cat.name === selectedKey);
        if (!childCategory?.multiSelect) {
            setProduct(prev => ({ ...prev, productCategories: newPairs }));
        }
        setCategoryPairs(newPairs);
        setInputError(prev => ({ ...prev, categoryErrors: {} }));
    };

    const openCategoryModal = (index, value) => {
        setModalIndex(value ? index : null);
    };

    const addNewCategoryPair = () => {
        setCategoryPairs([...categoryPairs, { ...initialCategoryState }]);
    };

    const removeCategoryPair = (index, catname) => {
        const newPairs = [...categoryPairs];
        newPairs.splice(index, 1);
        setCategoryPairs(newPairs);
        if (catname) {
            setSelectedValues(prevState => {
                const newState = { ...prevState };
                delete newState[catname];
                return newState;
            });
            const list = product?.productCategoriesList?.filter(
                item => item.productGroupName !== catname
            );
            setProduct(prevProduct => ({
                ...prevProduct,
                productCategoriesList: list,
            }));
        }
        setProduct(prev => ({
            ...prev,
            productCategories: (newPairs || []).filter(cat => !cat.multiSelect),
        }));
    };

    const selectCategory = (index, cat) => {
        const newPairs = [...categoryPairs];
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
                newPairs[index].parentCategory = null;
                setProduct(prev => ({
                    ...prev,
                    productCategories: newPairs.filter(cat => !cat.multiSelect),
                    fabricType: newPairs[index].key === 'Fabric Type' ? cat.name : prev.fabricType,
                    productCategoriesList: [
                        ...prev.productCategoriesList.filter(item => item.productGroupName !== newPairs[index].key),
                        // ...(newPairs[index].key === 'Fabric Type' ? [{ productGroupName: 'Fabric Type', name: cat.name, id: cat.id }] : []),
                    ],
                }));
            } else {
                newPairs[index].heirarchyLabel = label
                    ? `${label} / ${cat.name}`
                    : cat.name;
                newPairs[index].count = newPairs[index].count + 1;
                newPairs[index].options = cat.child || [];
                newPairs[index].parentCategory = cat;
            }
        } else {
            newPairs[index].heirarchyLabel = '';
            newPairs[index].count = 2;
            newPairs[index].options = getParentChild(newPairs[index].key);
            newPairs[index].parentCategory = null;
            setProduct(prev => ({
                ...prev,
                fabricType: newPairs[index].key === 'Fabric Type' ? '' : prev.fabricType,
                productCategoriesList: prev.productCategoriesList.filter(item => item.productGroupName !== newPairs[index].key),
            }));
        }
        setCategoryPairs(newPairs);
        setInputError(prev => ({ ...prev, categoryErrors: {} }));
    };

    const removeCategory = (index) => {
        const newPairs = [...categoryPairs];
        newPairs[index].heirarchyLabel = '';
        newPairs[index].value = {};
        newPairs[index].count = 2;
        newPairs[index].options = getParentChild(newPairs[index].key);
        newPairs[index].parentCategory = null;
        setCategoryPairs(newPairs);
        setProduct(prev => ({
            ...prev,
            productCategories: newPairs.filter(cat => !cat.multiSelect),
        }));

        if (newPairs[index].key === 'Fabric Type') {
            setProduct(prev => ({
                ...prev,
                fabricType: ''
            }));
        }
        openCategoryModal(index, false);
    };

    const getParentChild = (key) => {
        return categories.find(cat => cat.name === key)?.child || [];
    };

    const getAvailableCategoryKeys = (currentIndex) => {
        const selectedKeys = categoryPairs.map(pair => pair.key);
        return categoryName.filter(
            key => !selectedKeys.includes(key) || categoryPairs[currentIndex].key === key
        );
    };

    const goBackInHierarchy = (index) => {
        const newPairs = [...categoryPairs];
        const pair = newPairs[index];
        if (pair.parentCategory && pair.parentCategory.parentId) {
            api.get(`product-category/category/${pair.parentCategory.parentId}`)
                .then(res => {
                    const parentCategory = res.response;
                    if (parentCategory) {
                        newPairs[index].options = parentCategory.child || [];
                        newPairs[index].parentCategory = parentCategory;
                        const splitLabel = pair.heirarchyLabel.split(' / ');
                        splitLabel.pop();
                        newPairs[index].heirarchyLabel = splitLabel.join(' / ');
                        newPairs[index].count = pair.count - 1;
                        setCategoryPairs(newPairs);
                    }
                })
                .catch(error => {
                    console.log('Error fetching parent category:', error);
                });
        } else {
            newPairs[index].options = getParentChild(pair.key);
            newPairs[index].heirarchyLabel = '';
            newPairs[index].count = 2;
            newPairs[index].parentCategory = null;
            setCategoryPairs(newPairs);
        }
    };

    const handleMultiSelectChange = (categoryKey, newSelectedValues) => {
        const list = product?.productCategoriesList?.filter(
            item => item?.productGroupName !== categoryKey
        ) || [];
        const updatedList = [
            ...list,
            ...multiSelect[categoryKey]?.filter(item =>
                newSelectedValues.includes(item.id)
            ),
        ];
        setSelectedValues(prev => ({
            ...prev,
            [categoryKey]: newSelectedValues,
        }));
        setProduct(prev => ({
            ...prev,
            productCategoriesList: updatedList,
        }));
    };

    const getVisibleFields = () => {
        return fieldConfig.filter(field => field.viewableIn.includes(mode));
    };

    const isEditable = (field) => {
        return field.editableWhen.includes(mode);
    };

    const renderRadioButton = (item, selectedValue, onChange, isEditable) => (
        <View key={item.value} style={styles.radioContainer}>
            <TouchableOpacity
                onPress={() => isEditable && onChange(item.value)}
                disabled={!isEditable}
            >
                <MaterialIcon
                    name={selectedValue === item.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={24}
                    color={isEditable ? common.PRIMARY_COLOR : '#888'}
                />
            </TouchableOpacity>
            <Text style={[styles.radioLabel, !isEditable && styles.disabledText]}>
                {item.label}
            </Text>
        </View>
    );

    const renderFabricPairItem = ({ item, index }) => (
        <View style={styles.pairRow} key={index}>
            <View style={styles.pickerContainer}>
                <PickerSelect
                    value={item.key}
                    onValueChange={(value) => handleFabricSelectChange(index, value)}
                    items={[
                        { label: "Select Fabric", value: "" },
                        ...getAvailableFabricKeys(index).map(key => ({
                            label: keyToNameMap[key],
                            value: key
                        }))
                    ]}
                    placeholder={{ label: "Select Fabric" }}
                />
            </View>
            <View style={styles.valueContainer}>
                <TextInput
                    value={item.value}
                    style={[styles.valueInput, errors.fabricContent && { borderColor: 'red' }]}
                    keyboardType="numeric"
                    onChangeText={(text) => handleFabricValueChange(index, text)}
                    editable={!!item.key}
                />
                <MaterialIcon
                    name="percent"
                    size={20}
                    style={styles.percentIcon}
                />
                {index > 0 && (
                    <TouchableOpacity
                        onPress={() => removeFabricPair(index)}
                        style={styles.deleteButton}
                    >
                        <Icon name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderCategoryPairItem = ({ item, index }) => (
        <View key={index} style={styles.categoryRow}>
            <View style={styles.categoryColumn}>
                <PickerSelect
                    value={item.key}
                    onValueChange={(value) => handleCategorySelectChange(index, value)}
                    items={getAvailableCategoryKeys(index).map(key => ({
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
            <View style={styles.levelColumn}>
                {!item.multiSelect ? (
                    <TouchableOpacity
                        style={[
                            styles.levelInput,
                            { opacity: item.key ? 1 : 0.5 },
                        ]}
                        onPress={() => item.key && openCategoryModal(index, true)}
                        disabled={!item.key}
                    >
                        <TextInput
                            style={styles.inputText}
                            placeholder="Select a category"
                            value={item.heirarchyLabel}
                            editable={false}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>
                ) : (
                    <PickerMultiSelect
                        groupName={item.key}
                        items={
                            multiSelect[item.key]?.map(item => ({
                                value: item.id,
                                label: item.name,
                            })) || []
                        }
                        selectedItems={selectedValues[item.key] || []}
                        onSelectionsChange={(newSelectedValues) => handleMultiSelectChange(item.key, newSelectedValues)}
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
            <View style={styles.actionColumn}>
                {index > 0 && item.key !== 'Fabric Type' && !item.isMandatory && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeCategoryPair(index, item.key)}
                    >
                        <Icon name="trash" size={20} color="#dc3545" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderField = (field) => {
        const value = product[field.key];
        const isEditableField = isEditable(field);

        switch (field.fieldType) {
            case 'vendorPicker':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {mode !== "new" && product?.vendorUsername !== null ?
                            <TextInput
                                style={[styles.input, true && styles.disabledInput, errors[field.errorMessage] && { borderColor: 'red' }]}
                                value={product?.vendorUsername || ''}
                                onChangeText={(val) => handleChange(val, field.key)}
                                placeholder={field.placeholder}
                                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                                editable={false}
                                placeholderTextColor="#999"
                            />
                            : <VendorPicker
                                value={product.vendorId}
                                onValueChange={(val) => handleChange(val, field.key)}
                                placeholder={field.placeholder}
                                disabled={!isEditableField}
                            />}
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'textField':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        <TextInput
                            style={[styles.input, !isEditableField && styles.disabledInput, errors[field.errorMessage] && { borderColor: 'red' }]}
                            value={value ? value.toString() : ''}
                            onChangeText={(val) => handleChange(val, field.key)}
                            placeholder={field.placeholder}
                            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                            editable={isEditableField}
                            placeholderTextColor="#999"
                        />
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'radio':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        <View style={styles.radioGroup}>
                            {field.items.map(item =>
                                renderRadioButton(item, value, (val) => handleChange(val, field.key), isEditableField)
                            )}
                        </View>
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'imageField':
                const uri = value?.uri ? value.uri : value;
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditableField && (
                            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                                <Text style={styles.imageButtonText}>
                                    {value ? 'Change Image' : field.placeholder}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {value ? <Image source={{ uri }} style={styles.image} /> : <View style={styles.image} />}
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'compositionField':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditableField ? (
                            <>
                                <View style={styles.topSection}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Fabric Content Code</Text>
                                        <TextInput
                                            style={[styles.input, errors[field.key] && { borderColor: 'red' }]}
                                            value={fCCValue}
                                            editable={false}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>FCC Combination</Text>
                                        <PickerSelect
                                            value={product?.fabricContent?.value}
                                            onValueChange={handleFabricChange}
                                            items={fabricOptions}
                                            placeholder={{ label: field.placeholder, value: '' }}
                                        />
                                    </View>
                                </View>
                                <View style={styles.bottomSection}>
                                    <View style={styles.headerRow}>
                                        <Text style={styles.headerText}>Fabric</Text>
                                        <Text style={styles.headerText}>Composition(%)</Text>
                                    </View>
                                    <FlatList
                                        data={selectedFabricPairs}
                                        renderItem={renderFabricPairItem}
                                        keyExtractor={(item, index) => index.toString()}
                                        scrollEnabled={false}
                                    />
                                    {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                                    {totalPercent < 100 && (
                                        <TouchableOpacity
                                            onPress={addNewFabricPair}
                                            style={styles.addButton}
                                        >
                                            <Icon name="plus" size={16} color="#1976d2" />
                                            <Text style={styles.addButtonText}>Add another attribute</Text>
                                        </TouchableOpacity>
                                    )}
                                    <View style={styles.totalContainer}>
                                        <Text style={styles.totalText}>
                                            Overall Composition Percentage: <Text style={errors[field.key] ? { color: 'red' } : totalPercent === 100 ? { color: 'green' } : {}}>{totalPercent}%</Text>
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.readOnlyText}>
                                {fCCValue || 'No composition set'}
                            </Text>
                        )}
                    </View>
                );

            case 'categoryField':
                const categoryDisplay = product.productCategoriesList
                    .filter(cat => cat.productGroupName === field.name)
                    .map(cat => cat.name)
                    .join(', ') || `No ${field.name} selected`;
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditableField ? (
                            <View style={styles.inputContainer}>
                                <View style={styles.headerRow}>
                                    <Text style={[styles.label, { flex: 1 }]}>Category *</Text>
                                    <Text style={[styles.label, { flex: 2 }]}>Level *</Text>
                                    <View style={styles.actionColumn} />
                                </View>
                                <FlatList
                                    data={categoryPairs}
                                    renderItem={renderCategoryPairItem}
                                    keyExtractor={(item, index) => index.toString()}
                                    scrollEnabled={false}
                                />
                                {_.size(categories) > _.size(categoryPairs) && (
                                    <TouchableOpacity style={styles.addButton} onPress={addNewCategoryPair}>
                                        <Icon name="plus" size={20} color="#007bff" />
                                        <Text style={styles.addButtonText}>Add another category</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.readOnlyText}>{categoryDisplay}</Text>
                        )}
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'checkbox':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditableField ? (
                            <View style={styles.checkboxGroup}>
                                <TouchableOpacity
                                    style={[styles.checkboxButton, value && styles.checkboxButtonActive]}
                                    onPress={() => handleChange(true, field.key)}
                                >
                                    <Text style={[styles.checkboxButtonText, value && styles.checkboxButtonTextActive]}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.checkboxButton, !value && styles.checkboxButtonActive]}
                                    onPress={() => handleChange(false, field.key)}
                                >
                                    <Text style={[styles.checkboxButtonText, !value && styles.checkboxButtonTextActive]}>No</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.readOnlyText}>
                                {value ? 'Yes' : 'No'}
                            </Text>
                        )}
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'variantField':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditableField ? (
                            <ProductVariant
                                variants={product.variants || []}
                                onVariantChange={handleVariantChange}
                            />
                        ) : (
                            <Text style={styles.readOnlyText}>
                                {(product.variants || []).map(v => v.value).join(', ') || 'None selected'}
                            </Text>
                        )}
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <ProductContext.Provider value={{
            product, setProduct, inputError, setInputError
        }}>
            <View style={styles.container}>
                <ScrollView>
                    {getVisibleFields().map(field => renderField(field))}
                    <View style={{ flexDirection: 'column' }}>
                        {(mode === 'new' || mode === 'in_progress') && (
                            <TouchableRipple
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                rippleColor={'rgba(0, 0, 0, .32)'}
                                borderless={true}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? 'Submitting...' : productId ? 'Update Product' : 'Create Product'}
                                </Text>
                            </TouchableRipple>
                        )}
                        {(mode === 'in_progress') && (
                            <TouchableRipple
                                style={[styles.submitButton, { backgroundColor: "#fff" }]}
                                onPress={handleRequestInfo}
                                disabled={isSubmitting}
                                borderless={true}
                                rippleColor={'rgba(0, 0, 0, .32)'}
                            >
                                <Text style={[styles.submitButtonText, { color: common.PRIMARY_COLOR }]}>
                                    Request Info
                                </Text>
                            </TouchableRipple>
                        )}
                    </View>
                </ScrollView>

                {modalIndex !== null && (
                    <Modal visible={true} animationType="slide" transparent>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Search all categories</Text>
                                    <TouchableOpacity onPress={() => openCategoryModal(modalIndex, false)}>
                                        <Icon name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.modalContent}>
                                    {(!categoryPairs[modalIndex].value || categoryPairs[modalIndex].options.length > 0) && (
                                        <>
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="Enter a category name"
                                            />
                                            <View style={styles.levelContainer}>
                                                <Text style={styles.levelText}>Level {categoryPairs[modalIndex].count}</Text>
                                                <View style={styles.divider} />
                                            </View>
                                            <View style={{ maxHeight: 300 }}>
                                                <ScrollView nestedScrollEnabled>
                                                    {categoryPairs[modalIndex].options.map(cat => (
                                                        <TouchableOpacity
                                                            key={cat.id.toString()}
                                                            style={styles.categoryItem}
                                                            onPress={() => selectCategory(modalIndex, cat)}
                                                        >
                                                            <Text style={styles.categoryText}>{cat.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        </>
                                    )}
                                    {categoryPairs[modalIndex].heirarchyLabel && (
                                        <View style={styles.heirarchyContainer}>
                                            <Text style={styles.heirarchyText}>
                                                {categoryPairs[modalIndex].heirarchyLabel}
                                            </Text>
                                            <View style={styles.heirarchyActions}>
                                                <TouchableOpacity onPress={() => goBackInHierarchy(modalIndex)}>
                                                    <Icon name="arrow-left" size={20} color="#007bff" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => removeCategory(modalIndex)}>
                                                    <Icon name="trash" size={20} color="#dc3545" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}

                {loading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={common.PRIMARY_COLOR} />
                    </View>
                )}
            </View>
        </ProductContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontFamily: font.semiBold,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        color: '#333',
        fontFamily: font.regular,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#888',
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        marginBottom: 10,
    },
    radioLabel: {
        marginLeft: 8,
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    disabledText: {
        color: '#888',
    },
    imageButton: {
        backgroundColor: '#e9ecef',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10,
    },
    imageButtonText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    image: {
        width: 200,
        height: 200,
        resizeMode: 'cover',
        alignSelf: 'center',
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    readOnlyText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    checkboxGroup: {
        flexDirection: 'row',
        marginTop: 8,
    },
    checkboxButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 10,
        marginRight: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    checkboxButtonActive: {
        backgroundColor: common.PRIMARY_COLOR,
        borderColor: common.PRIMARY_COLOR,
    },
    checkboxButtonText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    checkboxButtonTextActive: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: common.PRIMARY_COLOR,
        padding: 15,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 2,
        borderColor: common.PRIMARY_COLOR
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: font.semiBold,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
        fontFamily: font.semiBold,
    },
    topSection: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    bottomSection: {
        marginTop: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'center',
        fontFamily: font.bold,
    },
    pairRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'center',
    },
    pickerContainer: {
        flex: 1,
        marginRight: 10,
        overflow: 'hidden',
    },
    valueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
    },
    valueInput: {
        flex: 1,
        padding: 10,
        height: 40,
        color: '#333',
        fontFamily: font.regular,
    },
    percentIcon: {
        padding: 10,
        color: '#666',
    },
    deleteButton: {
        padding: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginTop: 5,
    },
    addButtonText: {
        color: '#1976d2',
        fontFamily: font.semiBold,
        marginLeft: 5,
    },
    totalContainer: {
        marginTop: 15,
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    totalText: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#333',
    },
    inputContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
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
    removeButton: {
        padding: 8,
        backgroundColor: '#f8d7da',
        borderRadius: 4,
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
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
});

export default ProductEdit;