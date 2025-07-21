// Default settings that match modal.js
const defaultSettings = {
    closeIconColor: 'black',
    chatBackgroundColor: '#f1f2f4',
    chatIcon: 'https://cdn.prod.website-files.com/67fe49bf21b9f9d5b910d3c9/68714b1e1f2e554671269174_chat_widget_button%20(1).svg',
    headerIcon: 'https://cdn.prod.website-files.com/67fe49bf21b9f9d5b910d3c9/68714b1e1f2e554671269174_chat_widget_button%20(1).svg',
    backgroundImage: '',
    titlebarColor: 'black',
    titlebarFontColor: 'white',
    userMessageBackgroundColor: 'black',
    userMessageTextColor: 'white',
    aiMessageBackgroundColor: 'black',
    aiMessageTextColor: 'black',
    inputBorderColor: 'black',
    sendIconColor: 'black',
    widgetBackgroundColor: 'white',
};

// Function to update settings - save directly to localStorage
function updateSettings(settings) {
    // Save each setting to localStorage
    Object.keys(settings).forEach(key => {
        if (settings[key] !== null && settings[key] !== undefined) {
            localStorage.setItem(key, settings[key]);
        }
    });
    
    // Apply background image immediately if it was updated
    if (settings.backgroundImage) {
        applyBackgroundImage(settings.backgroundImage);
    }
    
    console.log('Settings saved to localStorage:', settings);
}

// Function to apply background image by updating CSS variable
function applyBackgroundImage(imageUrl) {
    const root = document.documentElement;
    if (imageUrl && imageUrl.trim()) {
        root.style.setProperty('--content-bg-image', `url("${imageUrl}")`);
        root.style.setProperty('--content-bg-color', '#cccccc');
    } else {
        // Reset to default white background if empty
        root.style.setProperty('--content-bg-image', 'none');
        root.style.setProperty('--content-bg-color', 'white');
    }
}

// Function to convert color names to valid CSS values
function convertColor(colorValue) {
    if (!colorValue || colorValue.trim() === '') return null;
    
    const value = colorValue.trim();
    
    // If it's already a valid CSS color format, return as is
    if (value.startsWith('rgb') || value.startsWith('#') || value.startsWith('hsl')) {
        return value;
    }
    
    // For color names, create a temporary element to get computed color
    const tempDiv = document.createElement('div');
    tempDiv.style.color = value;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    const computedColor = getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    // If computed color is different from input, it was a valid color name
    return computedColor !== 'rgba(0, 0, 0, 0)' ? computedColor : null;
}

// Function to convert any color format to hex for color pickers
function convertToHex(colorValue) {
    if (!colorValue || colorValue.trim() === '') return null;
    
    const value = colorValue.trim();
    
    // If it's already hex, return as is
    if (value.startsWith('#')) {
        return value;
    }
    
    // Create a temporary element to get computed color and convert to hex
    const tempDiv = document.createElement('div');
    tempDiv.style.color = value;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    const computedColor = getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    // Convert rgb/rgba to hex
    if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
        return rgbToHex(computedColor);
    }
    
    return null;
}

// Helper function to convert rgb/rgba strings to hex
function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (result && result.length >= 3) {
        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    return rgb; // Return original if conversion fails
}

// Track if form has been populated to avoid overwriting user changes
let formPopulated = false;

// Function to handle settings button click
function handleColorSettings() {
    showSettingsModal();
    
    // Only populate form if it hasn't been populated yet or if modal was closed and reopened
    if (!formPopulated) {
        const currentSettings = getCurrentSettings();
        populateForm(currentSettings);
        populatePresetDropdown(); // Populate preset dropdown
        formPopulated = true;
    }
}

// Function to show the settings modal
function showSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

// Function to close the settings modal
function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
    // Reset form populated flag so settings reload fresh next time
    formPopulated = false;
}

// Function to populate form with current settings
function populateForm(settings) {
    // Populate all the color fields (convert to hex if needed for color pickers)
    document.getElementById('titlebarColor').value = convertToHex(settings.titlebarColor) || '#000000';
    document.getElementById('chatBackgroundColor').value = convertToHex(settings.chatBackgroundColor) || '#f1f2f4';
    document.getElementById('titlebarFontColor').value = convertToHex(settings.titlebarFontColor) || '#ffffff';
    document.getElementById('closeIconColor').value = convertToHex(settings.closeIconColor) || '#000000';
    document.getElementById('userMessageBackgroundColor').value = convertToHex(settings.userMessageBackgroundColor) || '#000000';
    document.getElementById('userMessageTextColor').value = convertToHex(settings.userMessageTextColor) || '#ffffff';
    document.getElementById('aiMessageBackgroundColor').value = convertToHex(settings.aiMessageBackgroundColor) || '#000000';
    document.getElementById('aiMessageTextColor').value = convertToHex(settings.aiMessageTextColor) || '#000000';
    document.getElementById('sendIconColor').value = convertToHex(settings.sendIconColor) || '#000000';
    document.getElementById('inputBorderColor').value = convertToHex(settings.inputBorderColor) || '#000000';
    document.getElementById('widgetBackgroundColor').value = convertToHex(settings.widgetBackgroundColor) || '#ffffff';
    document.getElementById('chatIcon').value = settings.chatIcon || '';
    document.getElementById('headerIcon').value = settings.headerIcon || '';
    document.getElementById('backgroundImage').value = settings.backgroundImage || '';
    
    // Populate associatedPhoneNumber, namespace, and chatTitle from localStorage
    const associatedPhoneNumber = localStorage.getItem('aiAgentAssociatedPhoneNumber') || '';
    const namespace = localStorage.getItem('namespace') || '';
    const chatTitle = localStorage.getItem('chatTitle') || '';
    document.getElementById('associatedPhoneNumber').value = associatedPhoneNumber;
    document.getElementById('namespace').value = namespace;
    document.getElementById('chatTitle').value = chatTitle;
}

// Helper function to process icon URLs
function processIconUrl(value, property) {
    if (!value.trim()) return value;
    
        // If value doesn't contain "/" and doesn't start with "http", it's a filename
        if (!value.includes('/') && !value.startsWith('http')) {
            return '../../files/' + value;
        }
    return value;
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const updatedSettings = {};
        
        // Process each form field
        for (const [property, value] of formData.entries()) {
            console.log(`Processing form field: ${property} = ${value}`);
            if (!value.trim()) continue; // Skip empty values
            
            if (property === 'associatedPhoneNumber') {
                // Save associatedPhoneNumber to localStorage
                localStorage.setItem('aiAgentAssociatedPhoneNumber', value);
                console.log('Associated Phone Number updated:', value);
            } else if (property === 'namespace') {
                // Save namespace to localStorage
                localStorage.setItem('namespace', value);
                console.log('Namespace updated:', value);
            } else if (property === 'chatTitle') {
                // Save chatTitle to localStorage
                localStorage.setItem('chatTitle', value);
                console.log('Chat Title updated:', value);
            } else if (property === 'chatIcon' || property === 'headerIcon' || property === 'backgroundImage') {
                // Process URLs (auto-prepend path for icon filenames)
                const processedValue = processIconUrl(value, property);
                updatedSettings[property] = processedValue;
            } else if (Object.keys(defaultSettings).includes(property)) {
                // Handle color properties
                const convertedColor = convertColor(value);
                if (convertedColor) {
                    updatedSettings[property] = convertedColor;
                } else {
                    // If color conversion fails, still save the original value
                    updatedSettings[property] = value;
                }
            }
        }

        // Update settings
        updateSettings(updatedSettings);
        
        // Reset form populated flag so saved settings show up next time
        formPopulated = false;
        
        closeSettingsModal();
        
        // Show success message
        showSuccessMessage('Settings updated successfully! Please refresh the page to see changes.');
        
    } catch (error) {
        console.error('Error updating settings:', error);
        showErrorMessage('Error updating settings. Please check the console for details.');
    }
}

// Function to reset to default settings
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        // Clear all settings from localStorage
        Object.keys(defaultSettings).forEach(key => {
            localStorage.removeItem(key);
        });
        localStorage.removeItem('aiAgentAssociatedPhoneNumber');
        localStorage.removeItem('namespace');
        localStorage.removeItem('chatTitle');
        
        // Update with defaults
        updateSettings(defaultSettings);
        populateForm(defaultSettings);
        showSuccessMessage('Settings reset to defaults! Please refresh the page to see changes.');
    }
}

// Function to clear chat session storage
function clearChatSessions() {
    if (confirm('Are you sure you want to clear all chat sessions? This will remove chat history and session data.')) {
        const keysToRemove = [];
        
        // Find all localStorage keys that end with the specified patterns
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.endsWith('_EXISTING_SESSION_ID') || key.endsWith('_EXISTING_SESSION_MESSAGES'))) {
                keysToRemove.push(key);
            }
        }
        
        // Remove the found keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('Removed localStorage key:', key);
        });
        
        if (keysToRemove.length > 0) {
            showSuccessMessage(`Cleared ${keysToRemove.length} chat session(s). Page will refresh to apply changes.`);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showSuccessMessage('No chat sessions found to clear.');
        }
    }
}

// Preset Management Functions
function savePreset() {
    const presetName = document.getElementById('presetName').value.trim();
    if (!presetName) {
        showErrorMessage('Please enter a preset name.');
        return;
    }

    // Get current form values
    const currentSettings = {
        associatedPhoneNumber: document.getElementById('associatedPhoneNumber').value,
        namespace: document.getElementById('namespace').value,
        chatTitle: document.getElementById('chatTitle').value,
        chatIcon: document.getElementById('chatIcon').value,
        headerIcon: document.getElementById('headerIcon').value,
        backgroundImage: document.getElementById('backgroundImage').value,
        titlebarColor: document.getElementById('titlebarColor').value,
        titlebarFontColor: document.getElementById('titlebarFontColor').value,
        chatBackgroundColor: document.getElementById('chatBackgroundColor').value,
        userMessageBackgroundColor: document.getElementById('userMessageBackgroundColor').value,
        userMessageTextColor: document.getElementById('userMessageTextColor').value,
        aiMessageBackgroundColor: document.getElementById('aiMessageBackgroundColor').value,
        aiMessageTextColor: document.getElementById('aiMessageTextColor').value,
        sendIconColor: document.getElementById('sendIconColor').value,
        inputBorderColor: document.getElementById('inputBorderColor').value,
        closeIconColor: document.getElementById('closeIconColor').value,
        widgetBackgroundColor: document.getElementById('widgetBackgroundColor').value
    };

    // Get existing presets or initialize empty object
    const presets = JSON.parse(localStorage.getItem('settingsPresets') || '{}');
    
    // Save the preset
    presets[presetName] = currentSettings;
    localStorage.setItem('settingsPresets', JSON.stringify(presets));
    
    // Clear preset name field and refresh dropdown
    document.getElementById('presetName').value = '';
    populatePresetDropdown();
    
    showSuccessMessage(`Preset "${presetName}" saved successfully!`);
}

function loadPreset() {
    const selectedPreset = document.getElementById('presetSelect').value;
    if (!selectedPreset) {
        showErrorMessage('Please select a preset to load.');
        return;
    }

    const presets = JSON.parse(localStorage.getItem('settingsPresets') || '{}');
    const presetData = presets[selectedPreset];
    
    if (!presetData) {
        showErrorMessage('Preset not found.');
        return;
    }

    // Populate form with preset data
    document.getElementById('associatedPhoneNumber').value = presetData.associatedPhoneNumber || '';
    document.getElementById('namespace').value = presetData.namespace || '';
    document.getElementById('chatTitle').value = presetData.chatTitle || '';
    document.getElementById('chatIcon').value = presetData.chatIcon || '';
    document.getElementById('headerIcon').value = presetData.headerIcon || '';
    document.getElementById('backgroundImage').value = presetData.backgroundImage || '';
    document.getElementById('titlebarColor').value = presetData.titlebarColor || '#000000';
    document.getElementById('titlebarFontColor').value = presetData.titlebarFontColor || '#ffffff';
    document.getElementById('chatBackgroundColor').value = presetData.chatBackgroundColor || '#f1f2f4';
    document.getElementById('userMessageBackgroundColor').value = presetData.userMessageBackgroundColor || '#000000';
    document.getElementById('userMessageTextColor').value = presetData.userMessageTextColor || '#ffffff';
    document.getElementById('aiMessageBackgroundColor').value = presetData.aiMessageBackgroundColor || '#000000';
    document.getElementById('aiMessageTextColor').value = presetData.aiMessageTextColor || '#000000';
    document.getElementById('sendIconColor').value = presetData.sendIconColor || '#000000';
    document.getElementById('inputBorderColor').value = presetData.inputBorderColor || '#000000';
    document.getElementById('closeIconColor').value = presetData.closeIconColor || '#000000';
    document.getElementById('widgetBackgroundColor').value = presetData.widgetBackgroundColor || '#ffffff';

    showSuccessMessage(`Preset "${selectedPreset}" loaded successfully!`);
}

function deletePreset() {
    const selectedPreset = document.getElementById('presetSelect').value;
    if (!selectedPreset) {
        showErrorMessage('Please select a preset to delete.');
        return;
    }

    if (!confirm(`Are you sure you want to delete the preset "${selectedPreset}"?`)) {
        return;
    }

    const presets = JSON.parse(localStorage.getItem('settingsPresets') || '{}');
    delete presets[selectedPreset];
    localStorage.setItem('settingsPresets', JSON.stringify(presets));
    
    // Reset dropdown and refresh
    document.getElementById('presetSelect').value = '';
    populatePresetDropdown();
    
    showSuccessMessage(`Preset "${selectedPreset}" deleted successfully!`);
}

function populatePresetDropdown() {
    const presets = JSON.parse(localStorage.getItem('settingsPresets') || '{}');
    const dropdown = document.getElementById('presetSelect');
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- Select a preset --</option>';
    
    // Add preset options
    Object.keys(presets).sort().forEach(presetName => {
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        dropdown.appendChild(option);
    });
}

// Function to show success message
function showSuccessMessage(message) {
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 4000);
}

// Function to show error message
function showErrorMessage(message) {
    const toast = createToast(message, 'error');
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 4000);
}

// Function to create toast notification
function createToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-size: 14px;
        font-weight: 500;
        animation: toastSlideIn 0.3s ease-out;
        max-width: 300px;
    `;
    toast.textContent = message;
    return toast;
}

// Function to get current settings from localStorage
function getCurrentSettings() {
    const settings = {};
    
    // Get all settings from localStorage, using defaults if not found
    Object.keys(defaultSettings).forEach(key => {
        settings[key] = localStorage.getItem(key) || defaultSettings[key];
    });
    
    return settings;
}

// Function to initialize settings (not needed for modal.js approach, but kept for compatibility)
function initializeSettings() {
    // Settings are now handled directly by modal.js reading from localStorage
    console.log('Settings initialization - modal.js will handle configuration');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
} else {
    initializeAll();
}

// Function to initialize everything
function initializeAll() {
    initializeEventListeners();
    initializeUrlParams();
    initializeBackgroundImage();
    // Populate preset dropdown on page load if modal exists
    if (document.getElementById('presetSelect')) {
        populatePresetDropdown();
    }
}

// Function to initialize background image from localStorage
function initializeBackgroundImage() {
    const savedBackgroundImage = localStorage.getItem('backgroundImage');
    // Always apply background settings - either saved image or default white
    applyBackgroundImage(savedBackgroundImage || '');
}

// Function to initialize and save URL parameters
function initializeUrlParams() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const phoneNumber = urlParams.get('aiAgentAssociatedPhoneNumber');
        const namespace = urlParams.get('namespace') || 'virtual-agent-sandbox';
        
        if (phoneNumber) {
            localStorage.setItem('aiAgentAssociatedPhoneNumber', phoneNumber);
            console.log('Associated Phone Number saved:', phoneNumber);
        }
        
        if (namespace) {
            localStorage.setItem('namespace', namespace);
            console.log('Namespace saved:', namespace);
        }
    } catch (e) {
        console.warn('Could not save URL parameters to localStorage:', e);
    }
}

// Function to initialize event listeners
function initializeEventListeners() {
    // Form submission handler
    const form = document.getElementById('colorSettingsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Close modal when clicking outside of it
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeSettingsModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeSettingsModal();
        }
    });
}