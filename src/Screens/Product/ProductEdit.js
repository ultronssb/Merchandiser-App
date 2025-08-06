import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    FlatList
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
import ProductCategorys from './CategoryType';


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
    };

    const [product, setProduct] = useState(initialProductState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fabricTypes, setFabricTypes] = useState([]);
    const [variantOptions, setVariantOptions] = useState([]);
    const [fabricContent, setFabricContent] = useState({});
    const [selectedPairs, setSelectedPairs] = useState([{ key: '', value: '0' }]);
    const [totalPercent, setTotalPercent] = useState(0);
    const [lastChild, setLastChild] = useState([]);
    const [fCCValue, setFCCValue] = useState('');
    const [fabricValue, setFabricValue] = useState([]);
    const [fabricOptions, setFabricOptions] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showCompositionModal, setShowCompositionModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState([]);
    const [categoryPairs, setCategoryPairs] = useState([{ key: '', value: {} }]);

    const uomOptions = [
        { label: 'Kg', value: 'Kg' },
        { label: 'Meter', value: 'Meter' },
        { label: 'Yard', value: 'Yard' }
    ];


    const fieldConfig = [
        {
            id: '1', name: 'Vendor', fieldType: 'vendorPicker', key: 'vendorUsername', require: true,
            placeholder: 'Select Vendor', errorMessage: 'vendorId', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '2', name: 'Vendor Product ID', fieldType: 'textField', type: 'text', key: 'vendorProductId', require: true,
            placeholder: 'Enter Vendor Product ID', errorMessage: 'vendorProductId', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '3', name: 'Vendor Product Name', fieldType: 'textField', type: 'text', key: 'vendorProductName', require: true,
            placeholder: 'Enter product name', errorMessage: 'vendorProductName', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '4', name: 'GSM', fieldType: 'textField', type: 'number', key: 'gsm', require: false,
            placeholder: 'Enter GSM', errorMessage: 'gsm', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '5', name: 'UOM', fieldType: 'radio', key: 'uom', require: true,
            placeholder: 'Select UOM', items: uomOptions, errorMessage: 'uom', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '6', name: 'Image', fieldType: 'imageField', key: 'imageFile', require: true,
            placeholder: 'Upload or Select Image', errorMessage: 'imageFile', editableWhen: ['new'],
            viewableIn: ["view", 'in_progress', 'unapproved']
        },
        {
            id: '7', name: 'Width', fieldType: 'textField', type: 'number', key: 'width', require: false,
            placeholder: 'Enter Width', errorMessage: 'width', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        },
        {
            id: '8', name: 'Composition', fieldType: 'compositionField', key: 'fabricContent', require: false,
            placeholder: 'Select or Add Fabric Combination', errorMessage: 'fabricContent', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        },
        {
            id: '9', name: 'Fabric Type', fieldType: 'categoryField', key: 'fabricType', require: false,
            placeholder: 'Select Fabric Type', errorMessage: 'fabricType', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        },
        {
            id: '10', name: 'Variants', fieldType: 'variantField', key: 'variants', require: false,
            placeholder: 'Select Variants', errorMessage: 'variants', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        },
        {
            id: '11', name: 'Sample Available', fieldType: 'checkbox', key: 'sampleAvailable', require: false,
            errorMessage: 'sampleAvailable', editableWhen: ['in_progress'], viewableIn: ['unapproved']
        },
        {
            id: '12', name: 'Swatch Available', fieldType: 'checkbox', key: 'swatchAvailable', require: false,
            errorMessage: 'swatchAvailable', editableWhen: ['in_progress'], viewableIn: ['unapproved']
        },
        {
            id: '13', name: 'Cone Weight', fieldType: 'textField', type: 'number', key: 'coneWeight', require: false,
            placeholder: 'Enter Cone Weight', errorMessage: 'coneWeight', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        },
        {
            id: '14', name: 'Price', fieldType: 'textField', type: 'number', key: 'price', require: false,
            placeholder: 'Enter Price', errorMessage: 'price', editableWhen: ['in_progress'],
            viewableIn: ['unapproved']
        }
    ];

    useEffect(() => {
        fetchFabricTypes();
        // fetchVariants();
        fetchVariant();
        getFabricValues();
        fetchCategories();

        if (productId) {
            fetchProduct(productId);
        }
    }, [productId]);


    const fetchFabricTypes = async () => {
        try {
            const res = await api.get('fabric?status=ACTIVE');
            setFabricTypes(res.response.map(item => ({ label: item.name, value: item.id })));
        } catch (error) {
            console.log('Error fetching fabric types:', error);
        }
    };

    const fetchVariants = async () => {
        try {
            const res = await api.get('variant');
            setVariantOptions(res.response.map(item => ({ label: item.value, value: item.id })));
        } catch (error) {
            console.log('Error fetching variants:', error);
        }
    };

    const fetchVariant = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const categories = res.response;
            const category = categories.find(cat => cat.name === 'Fabric Content');
            setFabricContent(category);
        } catch (error) {
            console.log('Error fetching variants:', error);
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
            setFabricOptions(options);
        } catch (error) {
            console.log("Error fetching fabric values: ", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const categories = res?.response?.filter(
                cat => cat.name?.toLowerCase() !== 'fabric content'
            );
            const categoryNames = categories.map(res => res.name);
            setCategoryName(categoryNames);
            setCategories(categories);
        } catch (error) {
            console.log('Error fetching categories:', error);
        }
    };

    const fetchProduct = async (id) => {
        try {
            const res = await api.get(`draftProduct/get/${id}`);
            if (res?.response) {
                const vendorRes = await api.get(`vendor/${res.response.vendorId}`);
                setProduct({
                    ...res.response,
                    status: res.response.status || mode,
                    vendorId: res.response.vendorId,
                    vendorUsername: vendorRes?.response?.username || '',
                    vendorProductId: res.response.vendorProductId || '',
                    gsm: res.response.metrics?.weight || '',
                    uom: res.response.otherInformation?.unitOfMeasures?.isRoll ? 'Roll' :
                        res.response.otherInformation?.unitOfMeasures?.isKg ? 'Kg' :
                            res.response.otherInformation?.unitOfMeasures?.isMeter ? 'Meter' : 'Yard',
                    imageFile: res.response.image ? { uri: `${backendUrl}${res.response.image.replace("/api", "")}` } : null,
                    width: res.response.metrics?.width || '',
                    fabricType: res.response.fabricType || '',
                    variants: res.response.variants || [],
                    sampleAvailable: res.response.sampleAvailable || false,
                    swatchAvailable: res.response.swatchAvailable || false,
                    coneWeight: res.response.otherInformation?.coneWeight || '',
                    price: res.response.price || '',
                    totalProductPercent: Object.values(res.response.fabricContent?.composition || {}).reduce((acc, val) => acc + val, 0) || 0,
                });
                setFCCValue(res.response.fabricContent?.value || '');
                setTotalPercent(Object.values(res.response.fabricContent?.composition || {}).reduce((acc, val) => acc + val, 0) || 0);
            }
        } catch (error) {
            console.log('Error fetching product:', error);
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
                console.log('Error fetching vendor details:', error);
            }
        } else {
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

    const getAvailableKeys = (currentIndex) => {
        const selectedKeys = selectedPairs.map(pair => pair.key);
        return Object.keys(
            lastChild.reduce((map, item) => {
                map[item.categoryId] = item.name;
                return map;
            }, {})
        ).filter(
            key => !selectedKeys.includes(key) || selectedPairs[currentIndex].key === key
        );
    };

    const handleFabricSelectChange = (index, selectedValue) => {
        const newPairs = [...selectedPairs];
        const oldKey = newPairs[index].key;
        const oldValue = parseInt(newPairs[index].value, 10) || 0;

        newPairs[index].key = selectedValue || '';
        newPairs[index].value = selectedValue ? newPairs[index].value : '0';

        const newValue = parseInt(newPairs[index].value, 10) || 0;
        const updatedTotal = totalPercent - oldValue + newValue;

        setSelectedPairs(newPairs);
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
                fabricContent: { ...prev.fabricContent, composition: updatedComposition }
            };
        });

        const pairsObject = newPairs.reduce((acc, pair) => {
            if (pair.key && pair.value) {
                acc[pair.key] = parseInt(pair.value, 10);
            }
            return acc;
        }, {});

        if (Object.keys(pairsObject).length > 0) {
            generateFabricContentCode(pairsObject);
        } else {
            setFCCValue('');
            setProduct(prev => ({
                ...prev,
                fabricContent: { ...prev.fabricContent, value: '' }
            }));
        }
    };

    const handleFabricValueChange = (index, value) => {
        const newPairs = [...selectedPairs];
        const key = newPairs[index].key;
        const previousValue = parseInt(newPairs[index].value, 10) || 0;

        if (value !== '' && isNaN(parseInt(value, 10))) return;

        newPairs[index].value = value;
        const newValue = parseInt(value, 10) || 0;
        const updatedTotal = totalPercent - previousValue + newValue;

        setSelectedPairs(newPairs);
        setTotalPercent(updatedTotal);

        if (key) {
            setProduct(prev => ({
                ...prev,
                totalProductPercent: updatedTotal,
                fabricContent: {
                    ...prev.fabricContent,
                    composition: { ...prev.fabricContent.composition, [key]: newValue }
                }
            }));

            const pairsObject = newPairs.reduce((acc, pair) => {
                if (pair.key && pair.value) {
                    acc[pair.key] = parseInt(pair.value, 10);
                }
                return acc;
            }, {});
            generateFabricContentCode(pairsObject);
        }
    };

    const generateFabricContentCode = async (pairs) => {
        try {
            const results = await Promise.all(
                Object.entries(pairs).map(async ([key, value]) => {
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
            console.log("Error generating fabric content code: ", error);
        }
    };

    const addNewPair = () => {
        if (totalPercent < 100) {
            setSelectedPairs([...selectedPairs, { key: '', value: '0' }]);
            setErrors(prev => ({ ...prev, fabricContent: '' }));
        }
    };

    const removePair = (index) => {
        const newPairs = [...selectedPairs];
        const removedKey = newPairs[index].key;
        const removedValue = parseInt(newPairs[index].value, 10) || 0;
        const updatedTotal = totalPercent - removedValue;

        newPairs.splice(index, 1);
        setSelectedPairs(newPairs);
        setTotalPercent(updatedTotal);

        setProduct(prev => {
            const { [removedKey]: _, ...newComposition } = prev.fabricContent.composition;
            return {
                ...prev,
                totalProductPercent: updatedTotal,
                fabricContent: { ...prev.fabricContent, composition: newComposition }
            };
        });

        const pairsObject = newPairs.reduce((acc, pair) => {
            if (pair.key && pair.value) {
                acc[pair.key] = parseInt(pair.value, 10);
            }
            return acc;
        }, {});

        if (Object.keys(pairsObject).length > 0) {
            generateFabricContentCode(pairsObject);
        } else {
            setFCCValue('');
            setProduct(prev => ({
                ...prev,
                fabricContent: { ...prev.fabricContent, value: '' }
            }));
        }
    };

    const handleFabricChange = (selectedValue) => {
        const selectedFabric = fabricValue.find(fabric => fabric.value === selectedValue);
        if (!selectedFabric) return;

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

        setSelectedPairs(newPairs);
        setTotalPercent(totalSum);

        const pairsObject = sortedPairs.reduce((acc, [key, value]) => {
            acc[key] = parseInt(value, 10);
            return acc;
        }, {});

        setProduct(prev => ({
            ...prev,
            totalProductPercent: totalSum,
            fabricContent: {
                ...prev.fabricContent,
                composition: pairsObject,
                value: selectedFabric.value
            }
        }));

        setFCCValue(selectedFabric.value);
    };


    const handleVariantChange = (variants) => {
        setProduct(prev => ({
            ...prev,
            variants: variants
        }));
    };


    const handleFabricTypeChange = (fabricType) => {
        setProduct(prev => ({
            ...prev,
            fabricType: fabricType
        }));
        setShowCategoryModal(false);
    };


    const validateFields = () => {
        const tempErrors = {};
        fieldConfig.forEach(field => {
            if (field.require && field.editableWhen.includes(mode)) {
                const value = field.key === 'fabricContent' ? product[field.key].value :
                    field.key === 'vendorUsername' ? product['vendorId'] : product[field.key];
                if (!value) {
                    tempErrors[field.errorMessage] = `${field.name} is required`;
                }
            }
            if (field.key === 'fabricContent' && product[field.key].value && totalPercent !== 100) {
                tempErrors[field.key] = 'Total composition percentage must be 100% when fabric content is provided';
            }
        });
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateFields()) return;

        setLoading(true);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            const updatedProduct = {
                ...product,
                metrics: {
                    weight: product.gsm,
                    width: product.width
                },
                otherInformation: {
                    coneWeight: product.coneWeight,
                    unitOfMeasures: {
                        isKg: product.uom === 'Kg',
                        isMeter: product.uom === 'Meter',
                        isYard: product.uom === 'Yard'
                    }
                }
            };

            formData.append('product', JSON.stringify(updatedProduct));

            if (product.imageFile && product.imageFile.uri) {
                formData.append('image', {
                    uri: product.imageFile.uri,
                    name: 'image.jpg',
                    type: 'image/jpeg'
                });
            }

            const token = storage.getString('token');
            const url = `${backendUrl}/draftProduct`;

            const method = 'post';

            await axios[method](url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            Alert.alert(
                'Success',
                productId ? 'Product updated successfully' : 'Product created successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.log('Submission error:', error?.response || error?.message);
            Alert.alert('Error', 'Failed to save product');
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };


    const getVisibleFields = () => {
        if (mode === 'new') {
            return fieldConfig.filter(field => field.editableWhen.includes('new'));
        } else if (mode === 'in_progress') {
            return fieldConfig.filter(field =>
                field.editableWhen.includes('in_progress') ||
                field.viewableIn.includes('in_progress')
            );
        } else if (mode === 'unapproved') {
            return fieldConfig.filter(field =>
                field.viewableIn.includes('unapproved') &&
                (field.editableWhen.includes('new') || field.editableWhen.includes('in_progress'))
            );
        }
        return [];
    };


    const renderRadioButton = (item, selectedValue, onSelect, isEditable) => (
        <TouchableOpacity
            key={item.value}
            style={styles.radioContainer}
            onPress={() => isEditable && onSelect(item.value)}
            disabled={!isEditable}
        >
            <Icon
                name={selectedValue === item.value ? 'dot-circle-o' : 'circle-o'}
                size={20}
                color={isEditable ? common.PRIMARY_COLOR : '#999'}
            />
            <Text style={[styles.radioLabel, !isEditable && styles.disabledText]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderPairItem = ({ item, index }) => (
        <View style={styles.pairRow} key={index}>
            <View style={styles.pickerContainer}>
                <PickerSelect
                    value={item.key}
                    onValueChange={(value) => handleFabricSelectChange(index, value)}
                    items={[
                        { label: "Select Fabric", value: "" },
                        ...getAvailableKeys(index).map(key => ({
                            label: lastChild.find(lc => lc.categoryId === key)?.name || key,
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
                <MaterialIcon name="percent" size={20} style={styles.percentIcon} />
                {index > 0 && (
                    <TouchableOpacity onPress={() => removePair(index)} style={styles.deleteButton}>
                        <Icon name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderField = (field) => {
        const isViewMode = mode === 'unapproved';
        const isEditable = !isViewMode && field.editableWhen.includes(mode);
        const value = product[field.key];

        switch (field.fieldType) {
            case 'textField':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        <TextInput
                            style={[styles.input, errors[field.errorMessage] && { borderColor: 'red' }, !isEditable && styles.disabledInput]}
                            value={String(value)}
                            onChangeText={text => handleChange(text, field.key)}
                            placeholder={field.placeholder}
                            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                            editable={isEditable}
                        />
                        {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                    </View>
                );

            case 'vendorPicker':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        <VendorPicker
                            value={product.vendorId}
                            onValueChange={(val) => handleChange(val, 'vendorUsername')}
                            placeholder={field.placeholder}
                            disabled={!isEditable}
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
                                renderRadioButton(item, value, (val) => handleChange(val, field.key), isEditable)
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
                        {isEditable && (
                            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                                <Text style={styles.imageButtonText}>
                                    {value ? 'Change Image' : field.placeholder}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {value && <Image source={{ uri }} style={styles.image} />}
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
                        {isEditable ? (
                            <>
                                <TouchableOpacity
                                    style={styles.compositionButton}
                                    onPress={() => setShowCompositionModal(true)}
                                >
                                    <Text style={styles.compositionButtonText}>
                                        {fCCValue || 'Setup Composition'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.totalText}>
                                    Total: {totalPercent}%
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.readOnlyText}>
                                {fCCValue || 'No composition set'}
                            </Text>
                        )}
                        {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                    </View>
                );

            case 'categoryField':
                return (
                    <View key={field.id} style={styles.formGroup}>
                        <Text style={styles.label}>
                            {field.name}
                            {field.require && <Text style={styles.errorText}> *</Text>}
                        </Text>
                        {isEditable ? (
                            <TouchableOpacity
                                style={styles.categoryButton}
                                onPress={() => setShowCategoryModal(true)}
                            >
                                <Text style={styles.categoryButtonText}>
                                    {product.fabricType || 'Select Fabric Type'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.readOnlyText}>
                                {product.fabricType || 'No fabric type selected'}
                            </Text>
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
                        {isEditable ? (
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
                        {isEditable ? (
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
        <ProductContext.Provider value={{ product, setProduct }}>
            <View style={styles.container}>
                <ScrollView>
                    {getVisibleFields().map(field => renderField(field))}

                    {(mode === 'new' || mode === 'in_progress') && (
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Submitting...' : productId ? 'Update Product' : 'Create Product'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Composition Modal */}
                <Modal visible={showCompositionModal} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Fabric Composition</Text>
                            <TouchableOpacity onPress={() => setShowCompositionModal(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fabric Content Code</Text>
                                <TextInput
                                    style={styles.input}
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
                                    placeholder={{ label: "Select Combination" }}
                                />
                            </View>

                            <View style={styles.headerRow}>
                                <Text style={styles.headerText}>Fabric</Text>
                                <Text style={styles.headerText}>Composition(%)</Text>
                            </View>

                            <FlatList
                                data={selectedPairs}
                                renderItem={renderPairItem}
                                keyExtractor={(item, index) => index.toString()}
                            />

                            {totalPercent < 100 && (
                                <TouchableOpacity onPress={addNewPair} style={styles.addButton}>
                                    <Icon name="plus" size={16} color="#1976d2" />
                                    <Text style={styles.addButtonText}>Add another attribute</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.totalContainer}>
                                <Text style={styles.totalText}>
                                    Overall Composition Percentage: {totalPercent}%
                                </Text>
                                {errors.fabricContent && (
                                    <Text style={styles.errorText}>{errors.fabricContent}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={() => setShowCompositionModal(false)}
                            >
                                <Text style={styles.modalSaveButtonText}>Save Composition</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Category/Fabric Type Modal */}
                <Modal visible={showCategoryModal} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Fabric Type</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ProductCategorys
                            onSelect={handleFabricTypeChange}
                            categories={categories}
                        />
                    </View>
                </Modal>

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
        resizeMode: 'contain',
        alignSelf: 'center',
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    compositionButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        marginBottom: 10,
    },
    compositionButtonText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    categoryButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        marginBottom: 10,
    },
    categoryButtonText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
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
        marginBottom: 40,
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
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    multiSelectContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        minHeight: 50,
        justifyContent: 'center',
    },
    multiSelectText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: font.bold,
        color: '#333',
    },
    modalContent: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    headerText: {
        fontFamily: font.semiBold,
        fontSize: 16,
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    pairRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'center',
    },
    pickerContainer: {
        flex: 1,
        marginRight: 10,
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
        textAlign: 'center',
    },
    modalSaveButton: {
        backgroundColor: common.PRIMARY_COLOR,
        padding: 15,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 20,
    },
    modalSaveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: font.semiBold,
    },
    categoryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 16,
        fontFamily: font.regular,
        color: '#333',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTypeContainer: {
        flex: 1,
        padding: 16,
    },
    categoryTypeTitle: {
        fontSize: 18,
        fontFamily: font.bold,
        marginBottom: 16,
        color: '#333',
    },
});

export default ProductEdit;