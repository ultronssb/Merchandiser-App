import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
    Image, ScrollView,
    PermissionsAndroid
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Modal from 'react-native-modal';
import { launchImageLibrary } from 'react-native-image-picker';
import { font } from '../Settings/Theme';
import AlertBox from '../common/AlertBox';
import { backendUrl, common, storage } from '../common/Common';
import api from '../service/api';
import states from '../common/StatesAndDistricts.json';
import PickerSelect from '../common/PickerSelect';
import axios from 'axios';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';

const VendorCreate = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { isCreateCustomer, isEditCustomer, customerId } = route.params || {};
    const [activeTab, setActiveTab] = useState('General Info');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [cities, setCities] = useState([]);
    const [region, setRegion] = useState([]);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Initialize customer state
    const [customer, setCustomer] = useState({
        supplier: '',
        email: '',
        password: '',
        mobileNumber: '',
        currency: 'INR',
        purchaseType: '',
        purchaseMode: '',
        gstType: '',
        gstNumber: '',
        msmeCertificateNumber: '',
        panNumber: '',
        cinNumber: '',
        gst: null,
        pan: null,
        msme: null,
        cancel: null,
        legalEntity: '',
        contactPerson: '',
        designation: '',
        contactPersonPhoneNo: '',
        contactPersonAlternativePhoneNo: '',
        contactPersonEmail: '',
        contactPersonAlternativeEmail: '',
        bankName: '',
        branchName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        regionId: '',
        status: 'ACTIVE',
        locations: {
            nickName: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            mobileNo: '',
            email: '',
            pincode: '',
            country: 'INDIA',
            isPrimary: true,
            vendorId: customerId,
            gstNo: '',
            regionId: '',
        },
    });

    // Initialize address state
    const [address, setAddress] = useState({
        nickName: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        mobileNo: '',
        email: '',
        pincode: '',
        country: 'INDIA',
        isPrimary: false,
        vendorId: customerId,
        gstNo: '',
        regionId: '',
    });

    const [addresses, setAddresses] = useState([]);
    const [isError, setIsError] = useState({
        message: '',
        heading: '',
        showAlert: false,
        isRight: false,
        rightButtonText: 'OK',
        triggerFunction: () => { },
    });

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
            fetchAddressData();
        }
        fetchRegion();
    }, [customerId]);

    // Fetch vendor data
    const fetchCustomerData = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`vendor/${customerId}`);
            const customerRes = res.response;
            setCustomer({
                ...customer,
                ...customerRes,
                regionId: customerRes?.regionId || '',
                locations: {
                    ...customerRes?.locations,
                    country: customerRes?.locations?.country || 'INDIA',
                    isPrimary: true,
                },
            });
        } catch (error) {
            showError('Failed to fetch vendor data');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch address data
    const fetchAddressData = async () => {
        try {
            const locationRes = await api.get(`vendorLocations?vendorId=${customerId}`);
            const sortedAddresses = locationRes.response.sort((a, b) => b.isPrimary - a.isPrimary);
            setAddresses(sortedAddresses);
            if (sortedAddresses.length > 0) {
                setCities(states[sortedAddresses[0]?.state] || []);
            }
        } catch (error) {
            showError('Failed to fetch address data');
        }
    };

    // Fetch regions
    const fetchRegion = async () => {
        try {
            const res = await api.get(`region`);
            const data = res.response;
            setRegion(data.map((r) => ({ value: r.id, label: r.name })));
        } catch (error) {
            showError('Failed to fetch region data');
        }
    };

    // Download file
    // const downloadFile = async (filePath) => {
    //     if (!filePath) {
    //         showError('No file to download');
    //         return;
    //     }

    //     try {
    //         setIsLoading(true);
    //         const token = storage.getString('token');
    //         const res = await ReactNativeBlobUtil.config({
    //             fileCache: true,
    //             appendExt: filePath.split('.').pop(),
    //         }).fetch('GET', `${backendUrl}/vendor/download?filePath=${encodeURIComponent(filePath)}`, {
    //             Authorization: `Bearer ${token}`,
    //         });

    //         const fileName = filePath.split('/').pop();
    //         const path = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
    //         await ReactNativeBlobUtil.fs.mv(res.path(), path);
    //         showSuccess(`File downloaded to ${path}`);
    //     } catch (error) {
    //         console.log(error);
    //         showError(error.message || 'Failed to download file');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // Download file

    const requestStoragePermission = async () => {
        try {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            ]);
            return (
                granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
            );
        } catch (err) {
            console.warn(err);
            return false;
        }
    };
    const downloadFile = async (filePath) => {
        if (!filePath) {
            showError('No file to download');
            return;
        }

        try {
            setIsLoading(true);
            const token = storage.getString('token');
            const fileName = filePath.split('/').pop();
            const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`; // For Android
            // For iOS, you can use RNFS.DocumentDirectoryPath or RNFS.LibraryDirectoryPath
            // const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`; // For iOS

            // Request permissions for Android
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
                showError('Storage permission denied');
                return;
            }

            const response = await RNFS.downloadFile({
                fromUrl: `${backendUrl}/vendor/download?filePath=${encodeURIComponent(filePath)}`,
                toFile: downloadDest,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                background: true, // Allows download to continue in the background
                discretionary: true, // Optimizes for battery and network
            }).promise;

            if (response.statusCode === 200) {
                showSuccess(`File downloaded to ${downloadDest}`, () => {
                    navigation.goBack();
                });
            } else {
                showError('Failed to download file');
            }
        } catch (error) {
            console.log(error);
            showError(error.message || 'Failed to download file');
        } finally {
            setIsLoading(false);
        }
    };

    // Show error alert
    const showError = (message) => {
        setIsError({
            message,
            heading: 'Error',
            showAlert: true,
            isRight: false,
            rightButtonText: 'OK',
            triggerFunction: () => { },
        });
    };

    // Show success message
    const showSuccess = (message, onConfirm = () => { }) => {
        setIsError({
            message,
            heading: 'Success',
            showAlert: true,
            isRight: true,
            rightButtonText: 'OK',
            triggerFunction: onConfirm,
        });
    };

    // Close alert
    const closeAlert = () => {
        setIsError(prev => ({ ...prev, showAlert: false }));
    };

    // Handle form changes
    const handleChange = (value, key) => {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            setCustomer(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setCustomer(prev => ({
                ...prev,
                [key]: value,
                ...(key === 'gstNumber' && { approveStatus: value ? 'APPROVED' : 'DRAFT' }),
            }));
        }
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    // Handle image selection
    const handleImagePick = (key) => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                showError(`Image picker error: ${response.errorMessage}`);
                return;
            }
            if (response.assets?.[0]) {
                setCustomer(prev => ({
                    ...prev,
                    [key]: response.assets[0],
                }));
                setErrors(prev => ({ ...prev, [key]: '' }));
            }
        });
    };

    // Remove image
    const handleRemoveImage = (key) => {
        setCustomer(prev => ({ ...prev, [key]: null }));
    };

    // Handle address changes
    const handleAddressChange = (value, key) => {
        setAddress(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    // Handle state selection
    const handleStateChange = (value) => {
        setCustomer(prev => ({
            ...prev,
            locations: { ...prev.locations, state: value, city: '' },
        }));
        setCities(states[value] || []);
        setErrors(prev => ({
            ...prev,
            'locations.state': '',
            'locations.city': '',
        }));
    };

    // Handle address state selection
    const handleAddressStateChange = (value) => {
        setAddress(prev => ({
            ...prev,
            state: value,
            city: '',
        }));
        setCities(states[value] || []);
        setErrors(prev => ({ ...prev, state: '', city: '' }));
    };

    // Handle city selection
    const handleAddressCityChange = (value) => {
        setAddress(prev => ({
            ...prev,
            city: value,
        }));
        setErrors(prev => ({ ...prev, city: '' }));
    };

    // Validate form fields
    const validateFields = () => {
        let tempErrors = {};
        if (!customer.supplier) tempErrors.supplier = 'Company Name is required';
        if (!customer.email) tempErrors.email = 'Email is required';
        if (isCreateCustomer && !customer.password) tempErrors.password = 'Password is required';
        if (!customer.mobileNumber) tempErrors.mobileNumber = 'Mobile No. is required';
        if (!customer.purchaseType) tempErrors.purchaseType = 'Purchase Type is required';
        if (!customer.purchaseMode) tempErrors.purchaseMode = 'Payment Term is required';
        if (!customer.gstType) tempErrors.gstType = 'GST Type is required';
        if (customer.gstType !== 'Un Registered' && !customer.gstNumber)
            tempErrors.gstNumber = 'GST No. is required';
        if (!customer.regionId) tempErrors.regionId = 'Region is required';
        if (addresses.length === 0) {
            if (!customer.locations.address1) tempErrors['locations.address1'] = 'Address 1 is required';
            if (!customer.locations.state) tempErrors['locations.state'] = 'State is required';
            if (!customer.locations.city) tempErrors['locations.city'] = 'City is required';
            if (!customer.locations.pincode) tempErrors['locations.pincode'] = 'Pin Code is required';
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Save vendor
    // const handleSave = async () => {
    //     if (!validateFields()) {
    //         Vibration.vibrate(100);
    //         showError('Please fix validation errors');
    //         return;
    //     }

    //     try {
    //         setIsLoading(true);
    //         const token = storage.getString('token');
    //         const formData = new FormData();
    //         const customerClone = { ...customer };

    //         // Handle image uploads
    //         const imageFields = ['gst', 'pan', 'msme', 'cancel'];
    //         imageFields.forEach((field) => {
    //             if (customerClone[field]?.uri) {
    //                 formData.append(field, {
    //                     uri: customerClone[field].uri,
    //                     name: customerClone[field].fileName || `${field}.jpg`,
    //                     type: customerClone[field].type || 'image/jpeg',
    //                 });
    //                 delete customerClone[field];
    //             }
    //         });

    //         // Create vendorDto file
    //         const vendorDtoPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/vendorDto.json`;
    //         await ReactNativeBlobUtil.fs.writeFile(vendorDtoPath, JSON.stringify(customerClone), 'utf8');
    //         formData.append('vendorDto', {
    //             uri: `file://${vendorDtoPath}`,
    //             name: 'vendorDto.json',
    //             type: 'application/json',
    //         });

    //         // Send request
    //         const response = await axios.post(
    //             `${backendUrl}/vendor/save`,
    //             formData,
    //             {
    //                 headers: {
    //                     'Content-Type': 'multipart/form-data',
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //                 timeout: 30000,
    //             }
    //         );

    //         if (response.data?.response?.id) {
    //             await ReactNativeBlobUtil.fs.unlink(vendorDtoPath);
    //             showSuccess('Vendor saved successfully', () => {
    //                 navigation.navigate('Vendor', { ...route.params });
    //             });
    //         } else {
    //             await ReactNativeBlobUtil.fs.unlink(vendorDtoPath);
    //             showError(response.data?.message || 'Failed to save vendor');
    //         }
    //     } catch (error) {
    //         showError(error.response?.data?.title || error.message || 'An error occurred');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };
    // ... (other imports and code remain unchanged)

    // Inside VendorCreate component, replace the handleSave function with this:
    const handleSave = async () => {
        if (!validateFields()) {
            Vibration.vibrate(100);
            showError('Please fill all required fields');
            return;
        }

        try {
            setIsLoading(true);
            const token = storage.getString('token');
            const formData = new FormData();
            const customerClone = { ...customer };

            // Check if address fields are empty
            const isAddressEmpty =
                !customerClone.locations.address1 &&
                !customerClone.locations.state &&
                !customerClone.locations.city &&
                !customerClone.locations.pincode &&
                !customerClone.locations.address2 &&
                !customerClone.locations.nickName &&
                !customerClone.locations.mobileNo &&
                !customerClone.locations.gstNo &&
                !customerClone.locations.regionId;

            // Remove locations if empty and no addresses exist
            // if (isAddressEmpty && addresses.length === 0) {
            //     delete customerClone.locations;
            // }
            const hasLocationData =
                customerClone.locations.address1 ||
                customerClone.locations.address2 ||
                customerClone.locations.state ||
                customerClone.locations.city ||
                customerClone.locations.pincode;

            if (!hasLocationData) {
                customerClone.locations = null; // Set locations to null if no data
            }
            // Handle image uploads
            const imageFields = ['gst', 'pan', 'msme', 'cancel'];
            imageFields.forEach((field) => {
                if (customerClone[field]?.uri) {
                    formData.append(field, {
                        uri: customerClone[field].uri,
                        name: customerClone[field].fileName || `${field}.jpg`,
                        type: customerClone[field].type || 'image/jpeg',
                    });
                    delete customerClone[field];
                }
            });

            // Create vendorDto file
            const vendorDtoPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/vendorDto.json`;
            await ReactNativeBlobUtil.fs.writeFile(vendorDtoPath, JSON.stringify(customerClone), 'utf8');
            formData.append('vendorDto', {
                uri: `file://${vendorDtoPath}`,
                name: 'vendorDto.json',
                type: 'application/json',
            });

            // Send request
            const response = await axios.post(
                `${backendUrl}/vendor/save`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 30000,
                }
            );

            if (response.data?.response?.id) {
                await ReactNativeBlobUtil.fs.unlink(vendorDtoPath);
                showSuccess('Vendor saved successfully', () => {
                    navigation.goBack();
                });
            } else {
                await ReactNativeBlobUtil.fs.unlink(vendorDtoPath);
                showError(response.data?.message || 'Failed to save vendor');
            }
        } catch (error) {
            showError(error.response?.data?.title || error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // ... (rest of the component code remains unchanged)
    // Save address
    const handleSaveAddress = async () => {
        let tempErrors = {};
        if (!address.address1) tempErrors.address1 = 'Address 1 is required';
        if (!address.state) tempErrors.state = 'State is required';
        if (!address.city) tempErrors.city = 'City is required';
        if (!address.pincode) tempErrors.pincode = 'Pin Code is required';
        setErrors(tempErrors);
        if (Object.keys(tempErrors).length > 0) {
            Vibration.vibrate(100);
            showError('Please fix validation errors');
            return;
        }

        try {
            setIsLoading(true);
            const modified = { ...address, vendorId: customerId, charge: 0 };
            const response = await api.post('vendorLocations/save', modified);

            if (response.message) {
                showSuccess('Address saved successfully', () => {
                    navigation.goBack();
                });
                setAddress({
                    nickName: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    mobileNo: '',
                    email: '',
                    pincode: '',
                    country: 'INDIA',
                    isPrimary: false,
                    vendorId: customerId,
                    gstNo: '',
                    regionId: '',
                });
                setIsModalVisible(false);
                fetchAddressData();
            }
        } catch (error) {
            showError(error.message || 'Failed to save address');
        } finally {
            setIsLoading(false);
        }
    };

    // Set primary address
    const handleSelectPrimaryAddress = async (id) => {
        try {
            const updatedAddresses = addresses.map(addr => ({
                ...addr,
                isPrimary: addr.id === id,
            }));
            const res = await api.put('vendorLocations/update', updatedAddresses);
            showSuccess('Primary address updated successfully', () => {
                navigation.goBack();
            });
            fetchAddressData();
        } catch (error) {
            console.log(error?.response || error);
            showError('Failed to update primary address');
        }
    };

    // Edit address
    const handleEditAddress = (addr) => {
        setAddress(addr);
        setCities(states[addr?.state] || []);
        setIsModalVisible(true);
    };

    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    // Navigation handlers
    const handleCancel = () => {
        navigation.goBack();
    };

    const handleNext = () => {
        const tabs = ['General Info', 'Contact Info', 'Address', 'Bank Info'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const tabs = ['General Info', 'Contact Info', 'Address', 'Bank Info'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    };

    // Form field configurations
    const customerFields = [
        // General Info
        { id: 1, name: 'Company Name', category: 'General Info', fieldType: 'text', key: 'supplier', required: true },
        { id: 2, name: 'Email', category: 'General Info', fieldType: 'text', key: 'email', required: true },
        ...(isCreateCustomer ? [
            { id: 3, name: 'Password', category: 'General Info', fieldType: 'password', key: 'password', required: true }
        ] : []),
        { id: 4, name: 'Mobile No.', category: 'General Info', fieldType: 'text', key: 'mobileNumber', required: true },
        { id: 5, name: 'Currency', category: 'General Info', fieldType: 'text', key: 'currency', value: 'INR', disabled: true },
        {
            id: 6, name: 'Purchase Type', category: 'General Info', fieldType: 'select', key: 'purchaseType',
            options: ['Local', 'Import'], required: true
        },
        {
            id: 7, name: 'Payment Term', category: 'General Info', fieldType: 'select', key: 'purchaseMode',
            options: ['Credit', 'SO', 'DC'], required: true
        },
        {
            id: 8, name: 'GST Type', category: 'General Info', fieldType: 'select', key: 'gstType',
            options: ['Regular', 'Composite', 'Un Registered'], required: true
        },
        {
            id: 9, name: 'GSTN No', category: 'General Info', fieldType: 'text', key: 'gstNumber',
            required: customer.gstType !== 'Un Registered'
        },
        {
            id: 10, name: 'Region', category: 'General Info', fieldType: 'select', key: 'regionId',
            options: region, required: true
        },
        {
            id: 11, name: 'Status', category: 'General Info', fieldType: 'select', key: 'status',
            options: ['ACTIVE', 'INACTIVE']
        },
        { id: 12, name: 'MSME Certificate Number', category: 'General Info', fieldType: 'text', key: 'msmeCertificateNumber' },
        {
            id: 13, name: 'Legal Entity', category: 'General Info', fieldType: 'select', key: 'legalEntity',
            options: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited']
        },
        { id: 14, name: 'PAN Number', category: 'General Info', fieldType: 'text', key: 'panNumber' },
        { id: 15, name: 'CIN Number', category: 'General Info', fieldType: 'text', key: 'cinNumber' },
        { id: 16, name: 'GST Certificate', category: 'General Info', fieldType: 'file', key: 'gst', button: customer.gstDocumentPath && { label: 'View File', onClick: () => downloadFile(customer.gstDocumentPath) } },
        { id: 17, name: 'PAN Card Copy', category: 'General Info', fieldType: 'file', key: 'pan', button: customer.panDocumentPath && { label: 'View File', onClick: () => downloadFile(customer.panDocumentPath) } },
        { id: 18, name: 'MSME Certificate', category: 'General Info', fieldType: 'file', key: 'msme', button: customer.msmeDocumentPath && { label: 'View File', onClick: () => downloadFile(customer.msmeDocumentPath) } },

        // Contact Info
        { id: 19, name: 'Contact Person Name', category: 'Contact Info', fieldType: 'text', key: 'contactPerson' },
        { id: 20, name: 'Designation', category: 'Contact Info', fieldType: 'text', key: 'designation' },
        { id: 21, name: 'Mobile Number', category: 'Contact Info', fieldType: 'text', key: 'contactPersonPhoneNo' },
        { id: 22, name: 'Alternate Mobile', category: 'Contact Info', fieldType: 'text', key: 'contactPersonAlternativePhoneNo' },
        { id: 23, name: 'Email', category: 'Contact Info', fieldType: 'text', key: 'contactPersonEmail', required: true },
        { id: 24, name: 'Alternate Email', category: 'Contact Info', fieldType: 'text', key: 'contactPersonAlternativeEmail' },

        // Bank Info
        { id: 25, name: 'Bank Name', category: 'Bank Info', fieldType: 'text', key: 'bankName' },
        { id: 26, name: 'Branch Name', category: 'Bank Info', fieldType: 'text', key: 'branchName' },
        { id: 27, name: 'Account Holder', category: 'Bank Info', fieldType: 'text', key: 'accountHolderName', required: true },
        { id: 28, name: 'Account Number', category: 'Bank Info', fieldType: 'text', key: 'accountNumber', required: true },
        { id: 29, name: 'IFSC Code', category: 'Bank Info', fieldType: 'text', key: 'ifscCode' },
        { id: 30, name: 'Cancelled Check', category: 'Bank Info', fieldType: 'file', key: 'cancel', button: customer.cancelDocumentPath && { label: 'View File', onClick: () => downloadFile(customer.cancelDocumentPath) } },

        // Address (for initial form when no addresses exist)
        { id: 31, name: 'Address 1', category: 'Address', fieldType: 'text', key: 'locations.address1', required: true },
        { id: 32, name: 'Address 2', category: 'Address', fieldType: 'text', key: 'locations.address2' },
        { id: 33, name: 'Country', category: 'Address', fieldType: 'text', key: 'locations.country', disabled: true },
        { id: 34, name: 'State', category: 'Address', fieldType: 'select', key: 'locations.state', options: Object.keys(states).map(state => ({ value: state, label: state })), required: true },
        { id: 35, name: 'City', category: 'Address', fieldType: 'select', key: 'locations.city', options: cities.map(city => ({ value: city, label: city })), required: true },
        { id: 36, name: 'Pin Code', category: 'Address', fieldType: 'text', key: 'locations.pincode', required: true },
    ];

    // Address form fields
    const addressFields = [
        { id: 1, name: 'Nick Name', fieldType: 'text', key: 'nickName' },
        { id: 2, name: 'Address 1', fieldType: 'text', key: 'address1', required: true },
        { id: 3, name: 'Address 2', fieldType: 'text', key: 'address2' },
        { id: 4, name: 'Country', fieldType: 'text', key: 'country', disabled: true },
        { id: 5, name: 'State', fieldType: 'select', key: 'state', options: Object.keys(states).map(state => ({ value: state, label: state })), required: true },
        { id: 6, name: 'City', fieldType: 'select', key: 'city', options: cities.map(city => ({ value: city, label: city })), required: true },
        { id: 7, name: 'Email', fieldType: 'text', key: 'email' },
        { id: 8, name: 'Phone Number', fieldType: 'text', key: 'mobileNo' },
        { id: 9, name: 'Pin Code', fieldType: 'text', key: 'pincode', required: true },
        { id: 10, name: 'GST Number', fieldType: 'text', key: 'gstNo' },
        { id: 11, name: 'Region', fieldType: 'select', key: 'regionId', options: region },
    ];

    // Render file input field
    const renderFileField = (field) => (
        <View style={styles.fileContainer}>
            <TouchableOpacity
                style={[styles.input, styles.fileInput]}
                onPress={() => handleImagePick(field.key)}
            >
                <Text style={styles.fileText}>
                    {customer[field.key]?.fileName || `Select ${field.name}`}
                </Text>
            </TouchableOpacity>
            {customer[field.key]?.uri && (
                <View style={styles.imagePreviewContainer}>
                    <Image
                        source={{ uri: customer[field.key].uri }}
                        style={styles.imagePreview}
                    />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveImage(field.key)}
                    >
                        <Icon name="trash-2" size={20} color="#ff4d4f" />
                    </TouchableOpacity>
                </View>
            )}
            {field.button && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#0780b2' }]}
                    onPress={field.button.onClick}
                >
                    <Icon name="download" size={20} color="#fff" />
                </TouchableOpacity>
            )}
            {errors[field.key] && (
                <Text style={styles.errorText}>{errors[field.key]}</Text>
            )}
        </View>
    );

    // Render form field based on type
    const renderField = (field) => {
        const value = field.key.includes('.')
            ? customer[field.key.split('.')[0]][field.key.split('.')[1]]
            : customer[field.key];

        const errorKey = field.key.includes('.')
            ? field.key.replace('.', '_')
            : field.key;

        return (
            <View key={field.id} style={styles.formGroup}>
                <Text style={styles.label}>
                    {field.name}
                    {field.required && <Text style={styles.required}> *</Text>}
                </Text>

                {field.fieldType === 'text' && (
                    <TextInput
                        style={[styles.input, errors[errorKey] && styles.inputError]}
                        value={value?.toString()}
                        onChangeText={(text) => handleChange(text, field.key)}
                        placeholder={field.name}
                        keyboardType={field.key.includes('Number') || field.key.includes('pincode') ? 'numeric' : 'default'}
                        editable={!field.disabled}
                    />
                )}

                {field.fieldType === 'password' && (
                    <View style={[styles.input, errors[errorKey] && styles.inputError, { flexDirection: 'row', alignItems: 'center', padding: 0, paddingHorizontal: 5 }]}>
                        <TextInput
                            style={{ flex: 1 }}
                            value={value?.toString()}
                            onChangeText={(text) => handleChange(text, field.key)}
                            placeholder={field.name}
                            secureTextEntry={passwordVisible}
                            keyboardType='default'
                            editable={!field.disabled}
                        />
                        <TouchableOpacity onPress={handleTogglePasswordVisibility}>
                            <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                )}

                {field.fieldType === 'select' && (() => {
                    // normalize options → array of { label, value }
                    const items = (field.options || []).map(opt =>
                        typeof opt === 'string'
                            ? { label: opt, value: opt }
                            : opt
                    );

                    return (
                        <PickerSelect
                            value={value}
                            onValueChange={(val) => {
                                if (field.key === 'locations.state') {
                                    handleStateChange(val);
                                } else {
                                    handleChange(val, field.key);
                                }
                            }}
                            items={items}
                            placeholder={{ label: `Select ${field.name}`, value: null }}
                            disabled={field.disabled}
                        />
                    );
                })()}


                {field.fieldType === 'file' && renderFileField(field)}

                {errors[errorKey] && (
                    <Text style={styles.errorText}>{errors[errorKey]}</Text>
                )}
            </View>
        );
    };

    // Render address card
    const renderAddressCard = ({ item }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressCardHeader}>
                <Text style={styles.addressCardTitle}>Address</Text>
                <View style={styles.primaryContainer}>
                    <Text style={styles.primaryText}>Primary</Text>
                    <TouchableOpacity
                        onPress={() => handleSelectPrimaryAddress(item.id)}
                        disabled={item.isPrimary}
                    >
                        <View style={[styles.radio, item.isPrimary && styles.radioSelected]} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.description}>
                {Object.entries({
                    'Nick Name': item.nickName,
                    'Address 1': item.address1,
                    'Address 2': item.address2,
                    'Country': item.country,
                    'State': item.state,
                    'City': item.city,
                    'Email': item.email,
                    'Phone': item.mobileNo,
                    'Pin Code': item.pincode,
                    'GST': item.gstNo,
                    'Region': region.find(r => r.value === item.regionId)?.label || item.regionId,
                }).map(([label, value], index) => (
                    <View key={index} style={styles.addressLine}>
                        <Text style={styles.addressLabel}>{label} - </Text>
                        <Text style={styles.addressValue} numberOfLines={1}>
                            {value || 'N/A'}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditAddress(item)}
            >
                <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={common.PRIMARY_COLOR} />
                </View>
            )}

            <AlertBox {...isError} setShowAlert={closeAlert} />

            {/* <View style={styles.header}>

                <Text style={styles.headerText}>
                    {isEditCustomer ? 'Edit Vendor' : 'Create Vendor'}
                </Text>
            </View>*/}

            {addresses.length > 0 ? (
                <>
                    <View style={styles.tabContainer}>
                        {['General Info', 'Contact Info', 'Address', 'Bank Info'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {activeTab === 'Address' ? (
                        <View style={styles.scrollContent}>


                            <FlatList
                                data={addresses}
                                renderItem={renderAddressCard}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={styles.addressList}
                                ListHeaderComponent={<TouchableOpacity
                                    style={styles.addAddressButton}
                                    onPress={() => setIsModalVisible(true)}
                                >
                                    <Icon name="plus-circle" size={20} color={common.PRIMARY_COLOR} />
                                    <Text style={styles.addAddressText}>Add Address</Text>
                                </TouchableOpacity>}
                            />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {customerFields
                                .filter(field => field.category === activeTab)
                                .map(renderField)}
                        </ScrollView>
                    )}

                    <View style={styles.buttonContainer}>
                        {activeTab !== 'General Info' && (
                            <TouchableOpacity
                                style={[styles.button, styles.backButton]}
                                onPress={handleBack}
                            >
                                <Icon name="arrow-left" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                        )}

                        {activeTab !== 'Bank Info' && (
                            <TouchableOpacity
                                style={[styles.button, styles.nextButton]}
                                onPress={handleNext}
                            >
                                <Text style={styles.buttonText}>Next</Text>
                                <Icon name="arrow-right" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.buttonText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionHeader}>General Information</Text>
                    {customerFields
                        .filter(field => field.category === 'General Info')
                        .map(renderField)}

                    <Text style={styles.sectionHeader}>Address</Text>
                    {customerFields
                        .filter(field => field.category === 'Address')
                        .map(renderField)}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Address Modal */}
            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => {
                    setAddress({
                        nickName: '',
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        mobileNo: '',
                        email: '',
                        pincode: '',
                        country: 'INDIA',
                        isPrimary: false,
                        vendorId: customerId,
                        gstNo: '',
                        regionId: '',
                    });
                    setIsModalVisible(false);
                }}
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalText}>Address Details</Text>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        {addressFields.map(field => (
                            <View key={field.id} style={styles.formGroup}>
                                <Text style={styles.label}>
                                    {field.name}
                                    {field.required && <Text style={styles.required}> *</Text>}
                                </Text>

                                {field.fieldType === 'text' ? (
                                    <TextInput
                                        style={[styles.input, errors[field.key] && styles.inputError]}
                                        value={address[field.key]?.toString()}
                                        onChangeText={(text) => handleAddressChange(text, field.key)}
                                        placeholder={field.name}
                                        keyboardType={field.key === 'pincode' || field.key === 'mobileNo' ? 'numeric' : 'default'}
                                        editable={!field.disabled}
                                    />
                                ) : (
                                    <PickerSelect
                                        value={address[field.key]}
                                        onValueChange={(val) => {
                                            if (field.key === 'state') {
                                                handleAddressStateChange(val);
                                            } else if (field.key === 'city') {
                                                handleAddressCityChange(val);
                                            } else {
                                                handleAddressChange(val, field.key);
                                            }
                                        }}
                                        items={field.options || []}
                                        placeholder={{ label: `Select ${field.name}`, value: '' }}
                                    />
                                )}
                                {errors[field.key] && (
                                    <Text style={styles.errorText}>{errors[field.key]}</Text>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleSaveAddress}
                    >
                        <Text style={styles.buttonText}>
                            {address.id ? 'Update Address' : 'Save Address'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

// Styles (unchanged)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    backText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 5,
    },
    headerText: {
        fontSize: 18,
        fontFamily: font.semiBold,
        color: '#333',
        marginLeft: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#acd8ffff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingHorizontal: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: common.PRIMARY_COLOR,
        backgroundColor: '#cde8ffff'
    },
    tabText: {
        fontSize: 14,
        color: common.PRIMARY_COLOR, fontFamily: font.semiBold
    }, activeTabText: {
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 100,
    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#333',
        marginBottom: 10,
        marginTop: 20,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        fontFamily: font.semiBold,
    },
    required: {
        color: '#ff4d4f',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#fff', fontFamily: font.regular
    },
    inputError: {
        borderColor: '#ff4d4f',
    },
    fileInput: {
        justifyContent: 'center',
        height: 40,
    },
    fileText: {
        fontSize: 14,
        color: '#666',
        fontFamily: font.regular
    },
    fileContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginRight: 10,
    },
    removeButton: {
        padding: 5,
    },
    errorText: {
        fontSize: 12,
        color: '#ff4d4f',
        marginTop: 5, fontFamily: font.semiBold
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: common.PRIMARY_COLOR,
    },
    addAddressText: {
        fontSize: 14,
        color: common.PRIMARY_COLOR,
        marginLeft: 10,
    },
    addressList: {
        paddingBottom: 100,
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    addressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressCardTitle: {
        fontSize: 16,
        fontFamily: font.semiBold,
        color: '#333',
    },
    primaryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryText: {
        fontSize: 12,
        color: '#333',
        marginRight: 5, fontFamily: font.medium
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: common.PRIMARY_COLOR,
    },
    radioSelected: {
        backgroundColor: common.PRIMARY_COLOR,
    },
    description: {
        marginBottom: 10,
    },
    addressLine: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    addressLabel: {
        fontSize: 14,
        color: '#333', fontFamily: font.semiBold,
        width: 100,
    },
    addressValue: {
        fontSize: 14,
        color: '#666', fontFamily: font.medium,
        flex: 1,
    },
    editButton: {
        backgroundColor: common.PRIMARY_COLOR,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        maxHeight: '80%',
    },
    modalText: {
        fontSize: 18,
        color: '#333',
        marginBottom: 15, fontFamily: font.semiBold
    },
    modalScroll: {
        paddingBottom: 20,
    },
    modalButton: {
        backgroundColor: common.PRIMARY_COLOR,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    button: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: common.PRIMARY_COLOR,
    },
    cancelButton: {
        backgroundColor: '#ff4d4f',
    },
    nextButton: {
        backgroundColor: common.PRIMARY_COLOR,
    },
    buttonText: {
        fontSize: 14,
        color: '#fff',
        marginHorizontal: 5, fontFamily: font.semiBold
    },
});

export default VendorCreate;