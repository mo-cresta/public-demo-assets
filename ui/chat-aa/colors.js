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

// Function to handle settings
async function handleColorSettings() {
    const currentSettings = getCurrentSettings();

    const settingsPrompt = `Enter new color settings (one per line, format: property: value):

Available properties:
- primaryColor: Main theme color
- textOnPrimary: Text color on primary background  
- visitorBg: Visitor message background color
- textOnVisitor: Text color on visitor messages
- contentBgImage: Background image (just filename or full URL)

Current settings:
primaryColor: ${currentSettings.primaryColor}
textOnPrimary: ${currentSettings.textOnPrimary}
visitorBg: ${currentSettings.visitorBg}
textOnVisitor: ${currentSettings.textOnVisitor}
contentBgImage: ${currentSettings.contentBgImage}

Example input:
primaryColor: purple
textOnPrimary: white
visitorBg: lightblue
contentBgImage: verizon-troubleshooting.png

Leave any line empty or omit it to keep current value.`;

    const newSettings = window.prompt(settingsPrompt);

    if (newSettings) {
        try {
            const updatedSettings = { ...currentSettings }; // Start with current settings
            
            // Parse input - handle both single line and multi-line input
            const lines = newSettings.includes('\n') ? newSettings.split('\n') : [newSettings];
            
            lines.forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) return;
                
                const property = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                
                if (!property || !value) return;
                
                // Handle different property types
                if (['primaryColor', 'textOnPrimary', 'visitorBg', 'textOnVisitor'].includes(property)) {
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
            });

            // Update settings
            updateSettings(updatedSettings);
            alert('Settings updated successfully!');
            
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Error updating settings. Please check the console for details.');
        }
    }
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
    document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
    initializeSettings();
} 