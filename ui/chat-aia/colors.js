// Default colors and settings
const defaultSettings = {
    primaryColor: 'rgb(162, 21, 35)',
    textOnPrimary: 'white',
    visitorBg: 'white',
    textOnVisitor: 'black',
    contentBgImage: 'url("./images/verizon-troubleshooting.png")'
};

// Function to update settings
function updateSettings(settings) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--text-on-primary', settings.textOnPrimary);
    root.style.setProperty('--visitor-bg', settings.visitorBg);
    root.style.setProperty('--text-on-visitor', settings.textOnVisitor);
    root.style.setProperty('--content-bg-image', settings.contentBgImage);
    
    // Save to localStorage instead of Chrome storage
    try {
        localStorage.setItem('colorSettings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Could not save settings to localStorage:', e);
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
    document.getElementById('primaryColor').value = settings.primaryColor || '';
    document.getElementById('textOnPrimary').value = settings.textOnPrimary || '';
    document.getElementById('visitorBg').value = settings.visitorBg || '';
    document.getElementById('textOnVisitor').value = settings.textOnVisitor || '';
    
    // Clean up background image display (remove url() wrapper for display)
    let bgImage = settings.contentBgImage || '';
    if (bgImage.startsWith('url("') && bgImage.endsWith('")')) {
        bgImage = bgImage.slice(5, -2); // Remove url(" and ")
        if (bgImage.startsWith('./images/')) {
            bgImage = bgImage.slice(9); // Remove ./images/ prefix for display
        }
    }
    document.getElementById('contentBgImage').value = bgImage;
        
    // Populate aiAgentId from localStorage
    const aiAgentId = localStorage.getItem('aiAgentId') || '';
    document.getElementById('aiAgentId').value = aiAgentId;
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const currentSettings = getCurrentSettings();
        const updatedSettings = { ...currentSettings };
        
        // Process each form field
        for (const [property, value] of formData.entries()) {
            if (!value.trim()) continue; // Skip empty values
            
            if (property === 'aiAgentId') {
                // Save aiAgentId to localStorage
                localStorage.setItem('aiAgentId', value);
                console.log('AI Agent ID updated:', value);
            } else if (['primaryColor', 'textOnPrimary', 'visitorBg', 'textOnVisitor'].includes(property)) {
                const convertedColor = convertColor(value);
                if (convertedColor) {
                    updatedSettings[property] = convertedColor;
                }
            } else if (property === 'contentBgImage') {
                // Handle background image
                if (value.startsWith('url(')) {
                    updatedSettings[property] = value;
                } else if (value.includes('.')) {
                    // If it's just a filename with extension, assume it's in the images folder
                    updatedSettings[property] = `url("./images/${value}")`;
                } else {
                    updatedSettings[property] = value;
                }
            }
        }

        // Update settings
        updateSettings(updatedSettings);
        closeSettingsModal();
        
        // Show success message
        showSuccessMessage('Settings updated successfully!');
        
    } catch (error) {
        console.error('Error updating settings:', error);
        showErrorMessage('Error updating settings. Please check the console for details.');
    }
}

// Function to reset to default settings
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        updateSettings(defaultSettings);
        localStorage.removeItem('aiAgentId');
        populateForm(defaultSettings);
        showSuccessMessage('Settings reset to defaults!');
    }
}

// Function to show success message
function showSuccessMessage(message) {
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
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
    `;
    toast.textContent = message;
    return toast;
}

// Function to get current settings
function getCurrentSettings() {
    const root = document.documentElement;
    return {
        primaryColor: getComputedStyle(root).getPropertyValue('--primary-color').trim() || defaultSettings.primaryColor,
        textOnPrimary: getComputedStyle(root).getPropertyValue('--text-on-primary').trim() || defaultSettings.textOnPrimary,
        visitorBg: getComputedStyle(root).getPropertyValue('--visitor-bg').trim() || defaultSettings.visitorBg,
        textOnVisitor: getComputedStyle(root).getPropertyValue('--text-on-visitor').trim() || defaultSettings.textOnVisitor,
        contentBgImage: getComputedStyle(root).getPropertyValue('--content-bg-image').trim() || defaultSettings.contentBgImage
    };
}

// Function to initialize settings
function initializeSettings() {
    try {
        const savedSettings = localStorage.getItem('colorSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            updateSettings(settings);
        } else {
            updateSettings(defaultSettings);
        }
    } catch (e) {
        console.warn('Could not load settings from localStorage, using defaults:', e);
        updateSettings(defaultSettings);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll);
} else {
    initializeAll();
}

// Function to initialize everything
function initializeAll() {
    initializeSettings();
    initializeEventListeners();
    initializeUrlParams();
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