import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { backendUrl, storage } from '../../common/Common';
import PickerSelect from '../../common/PickerSelect';
import VendorPicker from '../../common/VendorPicker';
import api from '../../service/api';
import CustomToast from '../../service/hook/Toast/CustomToast';
import { font } from '../../Settings/Theme';

const MinimalProductCreate = ({ route }) => {
    const navigation = useNavigation();
    const initialProductState = {
        vendorId: '',
        vendorUsername: '', // New field to store username for display
        vendorProductName: '',
        gsm: '',
        fabricContent: { composition: {}, value: '' },
        totalProductPercent: 0,
        imageFile: null
    };

    const fieldConfig = [
        {
            id: '1',
            name: 'Vendor ID',
            fieldType: route?.params?.productId ? 'textField' : 'vendorPicker',
            key: 'vendorUsername', // Changed to vendorUsername for display
            require: true,
            placeholder: 'Select Vendor',
            errorMessage: 'vendorId',
            disable: !!route?.params?.productId
        },
        {
            id: '2',
            name: 'Vendor Product Name',
            fieldType: 'textField',
            type: 'text',
            key: 'vendorProductName',
            require: true,
            placeholder: 'Enter product name',
            errorMessage: 'vendorProductName'
        },
        {
            id: '3',
            name: 'GSM',
            fieldType: 'textField',
            type: 'number',
            key: 'gsm',
            require: false,
            placeholder: 'Enter GSM',
            errorMessage: 'gsm'
        },
        {
            id: '4',
            name: 'Fabric Content',
            fieldType: 'compositionField',
            key: 'fabricContent',
            require: false,
            placeholder: 'Select or Add Fabric Combination',
            errorMessage: 'fabricContent'
        },
        {
            id: '5',
            name: 'Product Image',
            fieldType: 'imageField',
            key: 'imageFile',
            require: true,
            placeholder: 'Upload or Select Image',
            errorMessage: 'imageFile'
        }
    ];
    const [product, setProduct] = useState(initialProductState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fabricContent, setFabricContent] = useState({});
    const [selectedPairs, setSelectedPairs] = useState([{ key: '', value: '0' }]);
    const [totalPercent, setTotalPercent] = useState(0);
    const [lastChild, setLastChild] = useState([]);
    const [fCCValue, setFCCValue] = useState('');
    const [fabricValue, setFabricValue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fabricOptions, setFabricOptions] = useState([]);

    useEffect(() => {
        fetchVariant();
        getFabricValues();
        setFCCValue(product?.fabricContent?.value || '');
        setTotalPercent(product?.totalProductPercent || 0);
    }, []);

    useEffect(() => {
        if (fabricContent && fabricContent.child) {
            const emptyNodes = findEmptyChildNodes(fabricContent);
            setLastChild(emptyNodes);
        }
        setSelectedPairsFromProduct();
    }, [fabricContent, product.fabricContent]);

    useEffect(() => {
        if (route?.params?.productId) {
            fetchProduct(route?.params?.productId);
        }
    }, [route?.params?.productId]);

    const fetchVariant = async () => {
        try {
            const res = await api.get('product-category?status=ACTIVE');
            const categories = res.response;
            const category = categories.find(cat => cat.name === 'Fabric Content');
            setFabricContent(category);
        } catch (error) {
            console.log('Error fetching variants:', error);
            CustomToast.show('Failed to load fabric content');
        }
    };

    const setSelectedPairsFromProduct = () => {
        const { fabricContent } = product;
        const keys = Object.keys(fabricContent?.composition || {});
        if (_.size(keys) > 0) {
            const pairs = _.map(keys, key => ({
                key: key,
                value: fabricContent?.composition[key]?.toString() || '0'
            }));
            setSelectedPairs(pairs);
        }
    };

    const fetchProduct = async (id) => {
        try {
            const res = await api.get(`draftProduct/get/${id}`);
            if (res?.response !== null) {
                const vendorRes = await api.get(`vendor/${res?.response?.vendorId}`);
                setProduct({
                    ...res?.response,
                    vendorId: res?.response?.vendorId, // Store actual vendor ID
                    vendorUsername: vendorRes?.response?.username || '', // Store username for display
                    gsm: res?.response?.metrics?.weight,
                    imageFile: res?.response?.image
                });
                setFCCValue(res?.response?.fabricContent?.value || '');
                const percent = Object.values(res?.response?.fabricContent?.composition).reduce((acc, val) => acc + val, 0);
                setTotalPercent(percent || 0);
            }
        } catch (error) {
            console.log('Error fetching product:', error);
            CustomToast.show('Failed to load product');
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
            console.log("Error fetching fabric values: ", error);
            CustomToast.show('Failed to load fabric values');
        }
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
            console.log("Error generating fabric content code: ", error);
            CustomToast.show('Failed to generate fabric content code');
        }
    };

    const keyToNameMap = lastChild.reduce((map, item) => {
        map[item.categoryId] = item.name;
        return map;
    }, {});

    const getAvailableKeys = (currentIndex) => {
        const selectedKeys = selectedPairs.map(pair => pair.key);
        return Object.keys(keyToNameMap).filter(
            key => !selectedKeys.includes(key) || selectedPairs[currentIndex].key === key
        );
    };

    // const handleChange = (value, key) => {
    //     setProduct(prev => ({
    //         ...prev,
    //         [key]: value
    //     }));
    //     setErrors(prev => ({
    //         ...prev,
    //         [key]: ''
    //     }));
    // };
    const handleChange = async (value, key) => {
        if (key === 'vendorUsername') {
            try {
                // Fetch vendor details using the selected vendorId
                const vendorRes = await api.get(`vendor/${value}`);
                setProduct(prev => ({
                    ...prev,
                    vendorId: value, // Update vendorId
                    vendorUsername: vendorRes?.response?.username || '' // Update vendorUsername
                }));
                setErrors(prev => ({
                    ...prev,
                    vendorId: '' // Clear error for vendorId
                }));
            } catch (error) {
                console.log('Error fetching vendor details:', error);
                CustomToast.show('Failed to load vendor details');
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
        const newPairs = [...selectedPairs];
        const key = newPairs[index].key;
        const previousValue = parseInt(newPairs[index].value, 10) || 0;

        if (value !== '' && isNaN(parseInt(value, 10))) {
            return;
        }

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

    const addNewPair = () => {
        if (totalPercent < 100) {
            setSelectedPairs([...selectedPairs, { key: '', value: '0' }]);
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

    const handleFabricChange = (selectedValue) => {
        const selectedFabric = fabricValue.find(fabric => fabric.value === selectedValue);
        if (!selectedFabric) {
            setSelectedPairs([{ key: '', value: '0' }]);
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

        setSelectedPairs(newPairs);
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

    const validateFields = () => {
        const tempErrors = {};
        fieldConfig.forEach(field => {
            if (field.require) {
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
        if (!validateFields()) {
            Vibration.vibrate(100);
            return;
        }
        const token = storage.getString('token');
        setIsSubmitting(true);
        setLoading(true);

        const formData = new FormData();
        let updatedProduct = {
            ...product,
            vendorId: product.vendorId // Ensure actual vendorId is used
        };
        if (!updatedProduct.metrics) {
            updatedProduct.metrics = {};
        }
        if (product.gsm && product.gsm.length > 0) {
            updatedProduct.metrics.weight = product.gsm;
        }
        if (product.fabricContent.value) {
            updatedProduct.fabricContent.value = product.fabricContent.value;
        } else {
            updatedProduct.fabricContent.value = null;
        }
        formData.append('product', JSON.stringify(updatedProduct));
        if (product.imageFile) {
            formData.append('image', {
                uri: product.imageFile.uri,
                name: product.imageFile.fileName || 'image.jpeg',
                type: product.imageFile.type || 'image/jpeg',
            });
        }

        try {
            await axios.post(`${backendUrl}/draftProduct`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Product created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            setProduct(initialProductState);
            setErrors({});
            setSelectedPairs([{ key: '', value: '0' }]);
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

    const renderPairItem = ({ item, index }) => (
        <View style={styles.pairRow} key={index}>
            <View style={styles.pickerContainer}>
                <PickerSelect
                    value={item.key}
                    onValueChange={(value) => handleFabricSelectChange(index, value)}
                    items={[
                        { label: "Select Fabric", value: "" },
                        ...getAvailableKeys(index).map(key => ({
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
                        onPress={() => removePair(index)}
                        style={styles.deleteButton}
                    >
                        <Icon name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderField = (field) => {
        const value = field.key === 'fabricContent' ? product[field.key].value :
            field.key === 'vendorUsername' ? product[field.key] : product[field.key] || '';
        if (field.fieldType === 'textField') {
            return (
                <View key={field.id} style={styles.formGroup}>
                    <Text style={styles.label}>
                        {field.name}
                        {field.require && <Text style={styles.errorText}> *</Text>}
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors[field.errorMessage] && { borderColor: 'red' },
                            field.disable && { backgroundColor: '#e0e0e0' } // Disabled background color
                        ]}
                        value={String(value)}
                        onChangeText={text => handleChange(text, field.key)}
                        placeholder={field.placeholder}
                        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                        placeholderTextColor="#999"
                        editable={!field.disable}
                    />
                    {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                </View>
            );
        } else if (field.fieldType === 'vendorPicker') {
            return (
                <View key={field.id} style={styles.formGroup}>
                    <Text style={styles.label}>
                        {field.name}
                        {field.require && <Text style={styles.errorText}> *</Text>}
                    </Text>
                    <VendorPicker
                        value={product.vendorId} // Pass vendorId as value
                        onValueChange={(val) => handleChange(val, field.key)} // Trigger handleChange with vendorId
                        placeholder={field.placeholder}
                    />
                    {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
                </View>
            );
            // const renderField = (field) => {
            //     const value = field.key === 'fabricContent' ? product[field.key].value : 
            //                   field.key === 'vendorUsername' ? product[field.key] : product[field.key] || '';
            //     if (field.fieldType === 'textField') {
            //         return (
            //             <View key={field.id} style={styles.formGroup}>
            //                 <Text style={styles.label}>
            //                     {field.name}
            //                     {field.require && <Text style={styles.errorText}> *</Text>}
            //                 </Text>
            //                 <TextInput
            //                     style={[styles.input, errors[field.errorMessage] && { borderColor: 'red' },field.disable && { backgroundColor: '#e0e0e0' }]}
            //                     value={String(value)}
            //                     onChangeText={text => handleChange(text, field.key)}
            //                     placeholder={field.placeholder}
            //                     keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            //                     placeholderTextColor="#999"
            //                     editable={!field.disable}
            //                 />
            //                 {errors[field.errorMessage] && <Text style={styles.errorText}>{errors[field.errorMessage]}</Text>}
            //             </View>
            //         );
            //     } else if (field.fieldType === 'vendorPicker') {
            //         return (
            //             <View key={field.id} style={styles.formGroup}>
            //                 <Text style={styles.label}>
            //                     {field.name}
            //                     {field.require && <Text style={styles.errorText}> *</Text>}
            //                 </Text>
            //                 <VendorPicker
            //                     value={value}
            //                     onValueChange={val => handleChange(val, field.key)}
            //                     placeholder={field.placeholder}
            //                 />
            //                 {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
            //             </View>
            //         );
        } else if (field.fieldType === 'compositionField') {
            return (
                <View key={field.id} style={styles.formGroup}>
                    <Text style={styles.label}>
                        {field.name}
                        {field.require && <Text style={styles.errorText}> *</Text>}
                    </Text>
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
                                value={value}
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
                            data={selectedPairs}
                            renderItem={renderPairItem}
                            keyExtractor={(item, index) => index.toString()}
                            scrollEnabled={false}
                        />
                        {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                        {totalPercent < 100 && (
                            <TouchableOpacity
                                onPress={addNewPair}
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
                </View>
            );
        } else if (field.fieldType === 'imageField') {
            const uri = value?.uri ? value.uri : `${backendUrl}${value.replace('/api', '')}`;
            return (
                <View key={field.id} style={styles.formGroup}>
                    <Text style={styles.label}>
                        {field.name}
                        {field.require && <Text style={styles.errorText}> *</Text>}
                    </Text>
                    <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                        <Text style={styles.imageButtonText}>
                            {value ? 'Change Image' : field.placeholder}
                        </Text>
                    </TouchableOpacity>
                    {value && <Image source={{ uri: uri }} style={styles.image} />}
                    {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
                </View>
            );
        }
        return null;
    };

    return (<>
        <ScrollView style={styles.container}>
            {fieldConfig.map(field => renderField(field))}


            <View style={styles.buttonRow}>
                <TouchableRipple
                    rippleColor={'rgba(0, 0, 0, .32)'}
                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Text>
                </TouchableRipple>
            </View>
        </ScrollView>
        {loading &&
            <View style={styles.loaderContainer}>
                <ActivityIndicator size={'large'} color={common.PRIMARY_COLOR} />
            </View>
        }
    </>
    );
};

// import { useNavigation } from '@react-navigation/native';
// import axios from 'axios';
// import _ from 'lodash';
// import React, { useEffect, useState } from 'react';
// import {
//     Alert,
//     FlatList,
//     Image,
//     ScrollView,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     Vibration,
//     View
// } from 'react-native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { TouchableRipple } from 'react-native-paper';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
// import { backendUrl, storage } from '../../common/Common';
// import PickerSelect from '../../common/PickerSelect';
// import VendorPicker from '../../common/VendorPicker';
// import api from '../../service/api';
// import CustomToast from '../../service/hook/Toast/CustomToast';
// import { font } from '../../Settings/Theme';

// const MinimalProductCreate = ({route}) => {
//     const navigation = useNavigation();
//     const initialProductState = {
//         vendorId: '',
//         vendorProductName: '',
//         gsm: '',
//         fabricContent: { composition: {}, value: '' },
//         totalProductPercent: 0,
//         imageFile: null
//     };

//     const fieldConfig = [
//         {
//             id: '1',
//             name: 'Vendor ID',
//             fieldType: 'textField',
//             key: 'vendorId',
//             require: true,
//             placeholder: 'Select Vendor',
//             errorMessage: 'vendorId',
//             disable:true
//         },
//         {
//             id: '2',
//             name: 'Vendor Product Name',
//             fieldType: 'textField',
//             type: 'text',
//             key: 'vendorProductName',
//             require: true,
//             placeholder: 'Enter product name',
//             errorMessage: 'vendorProductName'
//         },
//         {
//             id: '3',
//             name: 'GSM',
//             fieldType: 'textField',
//             type: 'number',
//             key: 'gsm',
//             require: false,
//             placeholder: 'Enter GSM',
//             errorMessage: 'gsm'
//         },
//         {
//             id: '4',
//             name: 'Fabric Content',
//             fieldType: 'compositionField',
//             key: 'fabricContent',
//             require: false,
//             placeholder: 'Select or Add Fabric Combination',
//             errorMessage: 'fabricContent'
//         },
//         {
//             id: '5',
//             name: 'Product Image',
//             fieldType: 'imageField',
//             key: 'imageFile',
//             require: true,
//             placeholder: 'Upload or Select Image',
//             errorMessage: 'imageFile'
//         }
//     ];
//     const [product, setProduct] = useState(initialProductState);
//     const [errors, setErrors] = useState({});
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [fabricContent, setFabricContent] = useState({});
//     const [selectedPairs, setSelectedPairs] = useState([{ key: '', value: '0' }]);
//     const [totalPercent, setTotalPercent] = useState(0);
//     const [lastChild, setLastChild] = useState([]);
//     const [fCCValue, setFCCValue] = useState('');
//     const [fabricValue, setFabricValue] = useState([]);
//     const [fabricOptions, setFabricOptions] = useState([]);

//     useEffect(() => {
//         fetchVariant();
//         getFabricValues();
//         setFCCValue(product?.fabricContent?.value || '');
//         setTotalPercent(product?.totalProductPercent || 0);

//     }, []);

//     useEffect(() => {
//         if (fabricContent && fabricContent.child) {
//             const emptyNodes = findEmptyChildNodes(fabricContent);
//             setLastChild(emptyNodes);
//         }
//             setSelectedPairsFromProduct();
//     }, [fabricContent,product.fabricContent]);

//     const fetchVariant = async () => {
//         try {
//             const res = await api.get('product-category?status=ACTIVE');
//             const categories = res.response;
//             const category = categories.find(cat => cat.name === 'Fabric Content');
//             setFabricContent(category);
//         } catch (error) {
//             console.log('Error fetching variants:', error);
//             CustomToast.show('Failed to load fabric content');
//         }
//     };


//     const setSelectedPairsFromProduct = () => {
//         const { fabricContent } = product;
//         const keys = Object.keys(fabricContent?.composition || {});
//         if (_.size(keys) > 0) {
//             const pairs = _.map(keys, key => ({
//                 key: key,
//                 value: fabricContent?.composition[key]?.toString() || '0'
//             }));
//             setSelectedPairs(pairs);
//         }
//     };
//     useEffect(()=>{
// fetchProduct(route?.params?.productId);
//     },[route.params.productId])
// const fetchProduct = async (id) => {
//     const res  = await api.get(`draftProduct/get/${id}`);
//     if(res?.response !== null){
//         setProduct({
//             ...res?.response,
//             gsm : res?.response?.metrics?.weight,
//             imageFile : res?.response?.image
//         });
//                     const res = await api.get(`vendor/${res?.response?.vendorId}`);
// if(res?.response !== null){
// setProduct(prev =>({
//     ...prev,
// vendorId : res?.response?.username
// }))


// }
//         setFCCValue(res?.response?.fabricContent?.value || '');
//         const precent = Object.values(res?.response?.fabricContent?.composition).reduce((acc, val) => acc + val, 0);
//         setTotalPercent(precent || 0);
//         // setSelectedPairsFromProduct();
//     }
// }
//     function findEmptyChildNodes(node) {
//         const result = [];
//         function traverse(node) {
//             if (node && node.child && node.child.length === 0) {
//                 result.push(node);
//             }
//             if (node && node.child) {
//                 node.child.forEach(traverse);
//             }
//         }
//         traverse(node);
//         return result;
//     }

//     const getFabricValues = async () => {
//         try {
//             const res = await api.get(`fabric?status=ACTIVE`);
//             setFabricValue(res?.response || []);
//             const options = res?.response.map(item => ({
//                 label: item.value,
//                 value: item.value
//             })) || [];
//             setFabricOptions([{ label: "Select Combination", value: "" }, ...options]);
//         } catch (error) {
//             console.log("Error fetching fabric values: ", error);
//             CustomToast.show('Failed to load fabric values');
//         }
//     };

//     const fabricContentCode = async (newPairs) => {
//         try {
//             const results = await Promise.all(
//                 Object.entries(newPairs).map(async ([key, value]) => {
//                     const res = await api.get(`product-category/category/${key}`);
//                     const name = res.response.name;
//                     const fcc = name.substring(0, 3).toUpperCase();
//                     return `${fcc}-${value}%`;
//                 })
//             );
//             const formattedFCC = results.join(' ');
//             setProduct(prev => ({
//                 ...prev,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     value: formattedFCC
//                 }
//             }));
//             setFCCValue(formattedFCC);
//         } catch (error) {
//             console.log("Error generating fabric content code: ", error);
//             CustomToast.show('Failed to generate fabric content code');
//         }
//     };

//     const keyToNameMap = lastChild.reduce((map, item) => {
//         map[item.categoryId] = item.name;
//         return map;
//     }, {});

//     const getAvailableKeys = (currentIndex) => {
//         const selectedKeys = selectedPairs.map(pair => pair.key);
//         return Object.keys(keyToNameMap).filter(
//             key => !selectedKeys.includes(key) || selectedPairs[currentIndex].key === key
//         );
//     };

//     const handleChange = (value, key) => {
//         setProduct(prev => ({
//             ...prev,
//             [key]: value
//         }));
//         setErrors(prev => ({
//             ...prev,
//             [key]: ''
//         }));
//     };

//     const handleFabricSelectChange = (index, selectedValue) => {
//         const newPairs = [...selectedPairs];
//         const oldKey = newPairs[index].key;
//         const oldValue = parseInt(newPairs[index].value, 10) || 0;

//         newPairs[index].key = selectedValue || '';
//         newPairs[index].value = selectedValue ? newPairs[index].value : '0';

//         const newValue = parseInt(newPairs[index].value, 10) || 0;
//         const updatedTotal = totalPercent - oldValue + newValue;

//         setSelectedPairs(newPairs);
//         setTotalPercent(updatedTotal);

//         setProduct(prev => {
//             const updatedComposition = { ...prev.fabricContent.composition };
//             if (oldKey && oldKey !== selectedValue) {
//                 delete updatedComposition[oldKey];
//             }
//             if (selectedValue) {
//                 updatedComposition[selectedValue] = newValue;
//             }

//             return {
//                 ...prev,
//                 totalProductPercent: updatedTotal,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     composition: updatedComposition
//                 }
//             };
//         });

//         const pairsObject = newPairs.reduce((acc, pair) => {
//             if (pair.key && pair.value) {
//                 acc[pair.key] = parseInt(pair.value, 10);
//             }
//             return acc;
//         }, {});

//         if (Object.keys(pairsObject).length > 0) {
//             fabricContentCode(pairsObject);
//         } else {
//             setFCCValue('');
//             setProduct(prev => ({
//                 ...prev,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     value: ''
//                 }
//             }));
//         }

//         setErrors(prev => ({
//             ...prev,
//             fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
//         }));
//     };

//     const handleFabricValueChange = (index, value) => {
//         const newPairs = [...selectedPairs];
//         const key = newPairs[index].key;
//         const previousValue = parseInt(newPairs[index].value, 10) || 0;

//         if (value !== '' && isNaN(parseInt(value, 10))) {
//             return;
//         }

//         newPairs[index].value = value;
//         const newValue = parseInt(value, 10) || 0;
//         const updatedTotal = totalPercent - previousValue + newValue;

//         setSelectedPairs(newPairs);
//         setTotalPercent(updatedTotal);

//         if (key) {
//             setProduct(prev => ({
//                 ...prev,
//                 totalProductPercent: updatedTotal,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     composition: {
//                         ...prev.fabricContent.composition,
//                         [key]: newValue
//                     }
//                 }
//             }));

//             const pairsObject = newPairs.reduce((acc, pair) => {
//                 if (pair.key && pair.value) {
//                     acc[pair.key] = parseInt(pair.value, 10);
//                 }
//                 return acc;
//             }, {});

//             fabricContentCode(pairsObject);
//         }

//         setErrors(prev => ({
//             ...prev,
//             fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
//         }));
//     };

//     const addNewPair = () => {
//         if (totalPercent < 100) {
//             setSelectedPairs([...selectedPairs, { key: '', value: '0' }]);
//             setErrors(prev => ({
//                 ...prev,
//                 fabricContent: ''
//             }));
//         } else {
//             setErrors(prev => ({
//                 ...prev,
//                 fabricContent: 'Total fabric content cannot exceed 100%'
//             }));
//         }
//     };

//     const removePair = (index) => {
//         const newPairs = [...selectedPairs];
//         const removedKey = newPairs[index].key;
//         const removedValue = parseInt(newPairs[index].value, 10) || 0;
//         const updatedTotal = totalPercent - removedValue;

//         newPairs.splice(index, 1);
//         setSelectedPairs(newPairs);
//         setTotalPercent(updatedTotal);

//         setProduct(prev => {
//             const { [removedKey]: _, ...newComposition } = prev.fabricContent.composition;
//             return {
//                 ...prev,
//                 totalProductPercent: updatedTotal,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     composition: newComposition
//                 }
//             };
//         });

//         const pairsObject = newPairs.reduce((acc, pair) => {
//             if (pair.key && pair.value) {
//                 acc[pair.key] = parseInt(pair.value, 10);
//             }
//             return acc;
//         }, {});

//         if (Object.keys(pairsObject).length > 0) {
//             fabricContentCode(pairsObject);
//         } else {
//             setFCCValue('');
//             setProduct(prev => ({
//                 ...prev,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     value: ''
//                 }
//             }));
//         }

//         setErrors(prev => ({
//             ...prev,
//             fabricContent: updatedTotal > 100 ? 'Total fabric content cannot exceed 100%' : ''
//         }));
//     };

//     const handleFabricChange = (selectedValue) => {
//         const selectedFabric = fabricValue.find(fabric => fabric.value === selectedValue);
//         if (!selectedFabric) {
//             setSelectedPairs([{ key: '', value: '0' }]);
//             setTotalPercent(0);
//             setFCCValue('');
//             setProduct(prev => ({
//                 ...prev,
//                 totalProductPercent: 0,
//                 fabricContent: {
//                     ...prev.fabricContent,
//                     composition: {},
//                     value: ''
//                 }
//             }));
//             setErrors(prev => ({ ...prev, fabricContent: '' }));
//             return;
//         }

//         const compositionArray = Object.entries(selectedFabric.composition);
//         const pairValues = selectedFabric.value.split(' ').map(item => {
//             const match = item.match(/(\d+)%/);
//             return match ? parseInt(match[1], 10) : 0;
//         });

//         const valueOrderMap = pairValues.reduce((acc, value, index) => {
//             acc[value] = index;
//             return acc;
//         }, {});

//         const sortedPairs = compositionArray.sort((a, b) => {
//             return valueOrderMap[a[1]] - valueOrderMap[b[1]];
//         });

//         const newPairs = sortedPairs.map(([key, value]) => ({
//             key,
//             value: value.toString()
//         }));

//         const totalSum = sortedPairs.reduce((sum, [_, value]) => sum + parseInt(value, 10) || 0, 0);

//         setSelectedPairs(newPairs);
//         setTotalPercent(totalSum);
//         setFCCValue(selectedFabric.value);

//         setProduct(prev => ({
//             ...prev,
//             totalProductPercent: totalSum,
//             fabricContent: {
//                 ...prev.fabricContent,
//                 composition: sortedPairs.reduce((acc, [key, value]) => {
//                     acc[key] = parseInt(value, 10);
//                     return acc;
//                 }, {}),
//                 value: selectedFabric.value
//             }
//         }));

//         setErrors(prev => ({
//             ...prev,
//             fabricContent: totalSum > 100 ? 'Total fabric content cannot exceed 100%' : ''
//         }));
//     };

//     const handleImagePick = async () => {
//         const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
//         if (res.assets && res.assets[0]) {
//             const asset = res.assets[0];
//             if (asset.fileSize > 3 * 1024 * 1024) {
//                 Alert.alert('Error', 'Image must be < 3MB');
//             } else {
//                 handleChange(asset, 'imageFile');
//             }
//         }
//     };

//     const validateFields = () => {
//         const tempErrors = {};
//         fieldConfig.forEach(field => {
//             if (field.require) {
//                 const value = field.key === 'fabricContent' ? product[field.key].value : product[field.key];
//                 if (!value) {
//                     tempErrors[field.key] = `${field.name} is required`;
//                 }
//             }
//             if (field.key === 'fabricContent' && product[field.key].value && totalPercent !== 100) {
//                 tempErrors[field.key] = 'Total composition percentage must be 100% when fabric content is provided';
//             }
//         });
//         setErrors(tempErrors);
//         return Object.keys(tempErrors).length === 0;
//     };

//     const handleSubmit = async () => {
//         if (!validateFields()) {
//             Vibration.vibrate(100);
//             return;
//         }
// const token =storage.getString('token')
//         setIsSubmitting(true);
//         const formData = new FormData();
//         let updatedProduct = {...product}
//         // formData.append('vendorId', product.vendorId);
//         // formData.append('vendorProductName', product.vendorProductName);
//         // formData.append('gsm', product.gsm);
//         // if (product.fabricContent.value) {
//         //     formData.append('composition', product.fabricContent.value);
//         // } else {
//         //     formData.append('composition', null);
//         // }
//         console.log("first231")
//         console.log(product)
// if (!updatedProduct.metrics) {
//     updatedProduct.metrics = {};
// }

// if (product.gsm && product.gsm.length > 0) {
//     updatedProduct.metrics.weight = product.gsm;
// }
//         if (product.fabricContent.value) {
//             updatedProduct.fabricContent.value = product.fabricContent.value
//         }else{
//             updatedProduct.fabricContent.value = null
//         }
//         formData.append('product', JSON.stringify(updatedProduct));
//         if (product.imageFile) {
//             formData.append('image', {
//                 uri: product.imageFile.uri,
//                 name: product.imageFile.fileName || 'image.jpeg',
//                 type: product.imageFile.type || 'image/jpeg',
//             });
//         }

//         try {
//             await axios.post(`${backendUrl}/draftProduct`, formData, {
//                 headers: { 'Content-Type': 'multipart/form-data',Authorization : `Bearer ${token}` },
//             });
//             Alert.alert('Success', 'Product created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
//             setProduct(initialProductState);
//             setErrors({});
//             setSelectedPairs([{ key: '', value: '0' }]);
//             setTotalPercent(0);
//             setFCCValue('');
//         } catch (error) {
//             console.log(error?.response || error)
//             Alert.alert('Error', 'Failed to create product: ' + (error.message || 'Unknown error'));
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const renderPairItem = ({ item, index }) => (
//         <View style={styles.pairRow} key={index}>
//             <View style={styles.pickerContainer}>
//                 <PickerSelect
//                     value={item.key}
//                     onValueChange={(value) => handleFabricSelectChange(index, value)}
//                     items={[
//                         { label: "Select Fabric", value: "" },
//                         ...getAvailableKeys(index).map(key => ({
//                             label: keyToNameMap[key],
//                             value: key
//                         }))
//                     ]}
//                     placeholder={{ label: "Select Fabric" }}
//                 />
//             </View>
//             <View style={styles.valueContainer}>
//                 <TextInput
//                     value={item.value}
//                     style={[styles.valueInput, errors.fabricContent && { borderColor: 'red' }]}
//                     keyboardType="numeric"
//                     onChangeText={(text) => handleFabricValueChange(index, text)}
//                     editable={!!item.key}
//                 />
//                 <MaterialIcon
//                     name="percent"
//                     size={20}
//                     style={styles.percentIcon}
//                 />
//                 {index > 0 && (
//                     <TouchableOpacity
//                         onPress={() => removePair(index)}
//                         style={styles.deleteButton}
//                     >
//                         <Icon name="trash" size={20} color="#ff4444" />
//                     </TouchableOpacity>
//                 )}
//             </View>
//         </View>
//     );

//     const renderField = (field) => {
//         const value = field.key === 'fabricContent' ? product[field.key].value : product[field.key] || '';
//         if (field.fieldType === 'textField') {
//             return (
//                 <View key={field.id} style={styles.formGroup}>
//                     <Text style={styles.label}>
//                         {field.name}
//                         {field.require && <Text style={styles.errorText}> *</Text>}
//                     </Text>
//                     <TextInput
//                         style={[styles.input, errors[field.key] && { borderColor: 'red' }]}
//                         value={String(value)}
//                         onChangeText={text => handleChange(text, field.key)}
//                         placeholder={field.placeholder}
//                         keyboardType={field.type === 'number' ? 'numeric' : 'default'}
//                         placeholderTextColor="#999"
//                     />
//                     {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
//                 </View>
//             );
//         } else if (field.fieldType === 'vendorPicker') {
//             return (
//                 <View key={field.id} style={styles.formGroup}>
//                     <Text style={styles.label}>
//                         {field.name}
//                         {field.require && <Text style={styles.errorText}> *</Text>}
//                     </Text>
//                     <VendorPicker
//                         value={value}
//                         onValueChange={val => handleChange(val, field.key)}
//                         placeholder={field.placeholder}
//                     />
//                     {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
//                 </View>
//             );
//         } else if (field.fieldType === 'compositionField') {
//             return (
//                 <View key={field.id} style={styles.formGroup}>
//                     <Text style={styles.label}>
//                         {field.name}
//                         {field.require && <Text style={styles.errorText}> *</Text>}
//                     </Text>
//                     <View style={styles.topSection}>
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>Fabric Content Code</Text>
//                             <TextInput
//                                 style={[styles.input, errors[field.key] && { borderColor: 'red' }]}
//                                 value={fCCValue}
//                                 editable={false}
//                             />
//                         </View>
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>FCC Combination</Text>
//                             <PickerSelect
//                                 value={value}
//                                 onValueChange={handleFabricChange}
//                                 items={fabricOptions}
//                                 placeholder={{ label: field.placeholder, value: '' }}
//                             />
//                         </View>
//                     </View>
//                     <View style={styles.bottomSection}>
//                         <View style={styles.headerRow}>
//                             <Text style={styles.headerText}>Fabric</Text>
//                             <Text style={styles.headerText}>Composition(%)</Text>
//                         </View>
//                         <FlatList
//                             data={selectedPairs}
//                             renderItem={renderPairItem}
//                             keyExtractor={(item, index) => index.toString()}
//                             scrollEnabled={false}
//                         />
//                         {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
//                         {totalPercent < 100 && (
//                             <TouchableOpacity
//                                 onPress={addNewPair}
//                                 style={styles.addButton}
//                             >
//                                 <Icon name="plus" size={16} color="#1976d2" />
//                                 <Text style={styles.addButtonText}>Add another attribute</Text>
//                             </TouchableOpacity>
//                         )}
//                         <View style={styles.totalContainer}>
//                             <Text style={styles.totalText}>
//                                 Overall Composition Percentage: <Text style={errors[field.key] ? { color: 'red' } : totalPercent === 100 ? { color: 'green' } : {}}>{totalPercent}%</Text>
//                             </Text>
//                         </View>
//                     </View>
//                 </View>
//             );
//         } else if (field.fieldType === 'imageField') {
//             const uri = value?.uri ? value.uri : `${backendUrl}${value.replace('/api', '')}`;
//             return (
//                 <View key={field.id} style={styles.formGroup}>
//                     <Text style={styles.label}>
//                         {field.name}
//                         {field.require && <Text style={styles.errorText}> *</Text>}
//                     </Text>
//                     <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
//                         <Text style={styles.imageButtonText}>
//                             {value ? 'Change Image' : field.placeholder}
//                         </Text>
//                     </TouchableOpacity>
//                     {value && <Image source={{ uri: uri}} style={styles.image} />}
//                     {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
//                 </View>
//             );
//         }
//         return null;
//     };

//     return (
//         <ScrollView style={styles.container}>
//             {fieldConfig.map(field => renderField(field))}
//             <View style={styles.buttonRow}>
//                 <TouchableRipple
//                     rippleColor={'rgba(0, 0, 0, .32)'}
//                     style={[styles.submitButton, isSubmitting && styles.disabledButton]}
//                     onPress={handleSubmit}
//                     disabled={isSubmitting}
//                 >
//                     <Text style={styles.submitButtonText}>
//                         {isSubmitting ? 'Submitting...' : 'Submit'}
//                     </Text>
//                 </TouchableRipple>
//             </View>
//         </ScrollView>
//     );
// };

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    formGroup: { marginBottom: 15 },
    label: { fontSize: 16, marginBottom: 8, fontFamily: font.semiBold, color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 5,
        fontSize: 14,
        fontFamily: font.regular,
        color: '#333'
    }, loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 4,
        marginBottom: 5
    },
    pickerText: { fontSize: 16, color: '#333', fontFamily: font.semiBold },
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
        maxHeight: '75%'
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
    vendorText: { fontSize: 14, color: '#333', fontFamily: font.regular },
    closeButton: {
        marginTop: 20,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#007bff',
        borderRadius: 6
    },
    closeText: { color: '#fff', fontSize: 14, fontFamily: font.semiBold },
    imageButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 5
    },
    imageButtonText: { fontSize: 16, color: '#333', fontFamily: font.semiBold },
    image: { width: 200, height: 200, marginBottom: 5, alignSelf: 'center', backgroundColor: '#ccc' },
    submitButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        flex: 1,
        marginBottom: 50
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontFamily: font.semiBold },
    disabledButton: { backgroundColor: '#aaa' },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        fontFamily: font.semiBold
    },
    topSection: {
        marginBottom: 20
    },
    inputGroup: {
        marginBottom: 15
    },
    bottomSection: {
        marginTop: 10
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    headerText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'center',
        fontFamily: font.bold
    },
    pairRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'center'
    },
    pickerContainer: {
        flex: 1,
        marginRight: 10,
        // borderWidth: 1,
        // borderColor: '#ccc',
        // borderRadius: 4,
        overflow: 'hidden'
    },
    valueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4
    },
    valueInput: {
        flex: 1,
        padding: 10,
        height: 40,
        color: '#333',
        fontFamily: font.regular
    },
    percentIcon: {
        padding: 10,
        color: '#666'
    },
    deleteButton: {
        padding: 10
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginTop: 5
    },
    addButtonText: {
        color: '#1976d2',
        fontFamily: font.semiBold,
        marginLeft: 5
    },
    totalContainer: {
        marginTop: 15,
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    totalText: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#333'
    }
});

export default MinimalProductCreate;