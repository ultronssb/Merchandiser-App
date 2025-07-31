let toastInstance = null;

export const setToastRef = (ref) => {
    toastInstance = ref;
};

const CustomToast = {
    show: (message, withIcon = false, duration = 1500) => {
        if (toastInstance) {
            toastInstance.show(message, withIcon, duration);
        } else {
            console.warn('CustomToast: Not initialized yet.');
        }
    },
};

export default CustomToast;