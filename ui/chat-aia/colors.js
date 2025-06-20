// Default settings that match modal.js
const defaultSettings = {
    closeIconColor: 'black',
    chatBackgroundColor: '#f1f2f4',
    chatIcon: 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png',
    headerIcon: 'https://cresta.com/wp-content/uploads/2024/06/cresta-c-80x80-1.png',
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

// Function to handle settings button click
function handleColorSettings() {
    const currentSettings = getCurrentSettings();
    populateForm(currentSettings);
    showSettingsModal();
}

// Function to show the settings modal
function showSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

// Function to close the settings modal
function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Function to populate form with current settings
function populateForm(settings) {
    // Populate all the new color fields
    document.getElementById('titlebarColor').value = settings.titlebarColor || '';
    document.getElementById('chatBackgroundColor').value = settings.chatBackgroundColor || '';
    document.getElementById('titlebarFontColor').value = settings.titlebarFontColor || '';
    document.getElementById('closeIconColor').value = settings.closeIconColor || '';
    document.getElementById('userMessageBackgroundColor').value = settings.userMessageBackgroundColor || '';
    document.getElementById('userMessageTextColor').value = settings.userMessageTextColor || '';
    document.getElementById('aiMessageBackgroundColor').value = settings.aiMessageBackgroundColor || '';
    document.getElementById('aiMessageTextColor').value = settings.aiMessageTextColor || '';
    document.getElementById('sendIconColor').value = settings.sendIconColor || '';
    document.getElementById('inputBorderColor').value = settings.inputBorderColor || '';
    document.getElementById('widgetBackgroundColor').value = settings.widgetBackgroundColor || '';
    document.getElementById('chatIcon').value = settings.chatIcon || '';
    document.getElementById('headerIcon').value = settings.headerIcon || '';
    document.getElementById('backgroundImage').value = settings.backgroundImage || '';
    
    // Populate aiAgentId and namespace from localStorage
    const aiAgentId = localStorage.getItem('aiAgentId') || '';
    const namespace = localStorage.getItem('namespace') || '';
    document.getElementById('aiAgentId').value = aiAgentId;
    document.getElementById('namespace').value = namespace;
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const updatedSettings = {};
        
        // Process each form field
        for (const [property, value] of formData.entries()) {
            if (!value.trim()) continue; // Skip empty values
            
            if (property === 'aiAgentId') {
                // Save aiAgentId to localStorage
                localStorage.setItem('aiAgentId', value);
                console.log('AI Agent ID updated:', value);
            } else if (property === 'namespace') {
                // Save namespace to localStorage
                localStorage.setItem('namespace', value);
                console.log('Namespace updated:', value);
            } else if (property === 'chatIcon' || property === 'headerIcon' || property === 'backgroundImage') {
                // Save URLs directly (icons and background image)
                updatedSettings[property] = value;
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
        localStorage.removeItem('aiAgentId');
        localStorage.removeItem('namespace');
        
        // Update with defaults
        updateSettings(defaultSettings);
        populateForm(defaultSettings);
        showSuccessMessage('Settings reset to defaults! Please refresh the page to see changes.');
    }
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
        const aiAgentId = urlParams.get('aiAgentId');
        const namespace = urlParams.get('namespace') || 'virtual-agent-sandbox';
        
        if (aiAgentId) {
            localStorage.setItem('aiAgentId', aiAgentId);
            console.log('AI Agent ID saved:', aiAgentId);
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