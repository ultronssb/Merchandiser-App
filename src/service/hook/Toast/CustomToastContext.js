import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions, Appearance } from 'react-native';
import { font } from '../../../Settings/Theme';
import { common } from '../../../common/Common';

const { width } = Dimensions.get('window');

export const ToastContext = createContext({
    show: () => { },
});

export const ToastProvider = ({ children }) => {
    // State for current toast and queue
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        withIcon: false,
    });
    const [toastQueue, setToastQueue] = useState([]); // Queue for pending toasts
    const opacity = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null); // Track the current animation
    // const isProcessingRef = useRef(false); // Track if a toast is being processed

    const theme = 'dark'; // Hardcoded as per your code
    // const theme = Appearance.getColorScheme();
    const backgroundColor =
        theme === 'dark' ? 'rgba(15, 15, 15, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    const textColor = theme === 'dark' ? '#fff' : '#333';

    // Process the next toast in the queue
    const processNextToast = useCallback(() => {
        if (toastQueue.length === 0) return;

        // isProcessingRef.current = true;

        // Get the next toast from the queue
        setToastQueue(prev => {
            const nextToast = prev[0];
            setToast({
                visible: true,
                message: nextToast?.message,
                withIcon: nextToast?.withIcon,
            });
            return prev.slice(1); // Remove the processed toast from the queue
        });

        // Reset opacity
        opacity.setValue(0);

        // Animation: 300ms fade-in + 2400ms display + 300ms fade-out = 3000ms
        animationRef.current = Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2400), // Adjusted to make total duration ~3000ms
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]);

        animationRef.current.start(() => {
            setToast(prev => (prev.visible ? { ...prev, visible: false } : prev));
            animationRef.current = null;
            // isProcessingRef.current = false;
            // Process the next toast after a short delay to ensure smooth transition
            setTimeout(() => processNextToast(), 100);
        });
    }, [opacity, toastQueue]);

    // Memoized show function
    const show = useCallback((msg, icon = false) => {
        // Add new toast to the queue
        setToastQueue(prev => [...prev, { message: msg, withIcon: icon }]);

        // Start processing if not already processing
        // if (!isProcessingRef.current) {
        //     processNextToast();
        // }
    }, [processNextToast]);

    // Cleanup animations on component unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
                animationRef.current = null;
            }
            // isProcessingRef.current = false;
            setToastQueue([]); // Clear queue on unmount
        };
    }, []);
    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            {toast.visible && (
                <Animated.View
                    style={[styles.toastContainer, { opacity, backgroundColor }]}
                >
                    <View style={styles.toastContent}>
                        {/* {toast.withIcon && (
                            // Add icon rendering logic here if needed
                            // Example: <Icon name="info" size={20} color={textColor} />
                            <Text style={[styles.toastText, { color: textColor }]}>Icon</Text>
                        )} */}
                        <Text style={[styles.toastText, { color: textColor }]}>
                            {toast?.message ? toast.message : 'Something went wrong'}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 16,
        zIndex: 9999,
        elevation: 10,
        maxWidth: width - 40,
        shadowColor: common.PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toastText: {
        fontSize: 14,
        marginLeft: 10,
        fontFamily: font.regular,
        flexShrink: 1,
    },
});