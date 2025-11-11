import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

const DEFAULT_SETTINGS = {
  // Appearance (Priority 1)
  colorTheme: 'emerald', // 'default' | 'emerald' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'rose' | 'yellow' | 'classic'
  themeMode: 'light', // 'light' | 'dark'
  conversationView: 'detailed', // 'detailed' | 'messaging'
  fontSize: 'medium', // 'small' | 'small-medium' | 'medium' | 'medium-large' | 'large'
  density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
  enableAnimations: true,
  codeTheme: 'github-dark', // 'github-dark' | 'monokai' | 'solarized-light'
  borderRadius: 'rounded', // 'sharp' | 'rounded' | 'extra-rounded'
  fontFamily: 'inter', // 'inter' | 'geist' | 'roboto' | 'poppins' | 'montserrat' | 'open-sans' | 'lato' | 'raleway' | 'nunito' | 'ubuntu' | 'rubik' | 'source-sans' | 'noto-sans' | 'pt-sans' | 'oswald' | 'dm-sans' | 'work-sans' | 'space-grotesk' | 'playfair' | 'merriweather' | 'bebas' | 'quicksand' | 'karla' | 'outfit' | 'jakarta' | 'manrope' | 'lexend' | 'archivo' | 'system'

  // Search & Index (Priority 2)
  autoIndexOnStartup: false,
  resultsPerPage: 25, // 10 | 25 | 50 | 100
  searchHistory: true,
  highlightColor: 'yellow', // 'yellow' | 'blue' | 'green'

  // Session Management (Priority 2)
  defaultSort: 'last-updated', // 'last-updated' | 'title' | 'message-count'
  defaultView: 'all', // 'all' | 'visible' | 'hidden'
  sessionPageSize: 50, // 25 | 50 | 100
  autoHideOldSessions: false,
  autoHideDays: 30,

  // Display Preferences (Priority 3)
  showTimestamps: 'on-hover', // 'always' | 'on-hover' | 'never'
  showToolIcons: true,
  messageGrouping: true,
  markdownPreview: true,

  // Advanced
  developerMode: false,
  keyboardShortcuts: true,
  betaFeatures: false
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem('claudex-settings')
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      } catch (e) {
        console.error('Failed to parse settings:', e)
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  // Persist to localStorage whenever settings change
  useEffect(() => {
    console.log('[Settings] Saving to localStorage:', settings)
    localStorage.setItem('claudex-settings', JSON.stringify(settings))
  }, [settings])

  // Apply theme changes dynamically
  useEffect(() => {
    console.log('[Theme] Applying theme:', {
      colorTheme: settings.colorTheme,
      themeMode: settings.themeMode,
      fontSize: settings.fontSize,
      density: settings.density
    })

    // Remove existing theme links
    const existingThemeLink = document.getElementById('theme-stylesheet')
    if (existingThemeLink) {
      console.log('[Theme] Removing existing theme link:', existingThemeLink.href)
      existingThemeLink.remove()
    }

    const existingDarkLink = document.getElementById('dark-theme-stylesheet')
    if (existingDarkLink) {
      console.log('[Theme] Removing existing dark theme link')
      existingDarkLink.remove()
    }

    // Create new theme stylesheet link
    const link = document.createElement('link')
    link.id = 'theme-stylesheet'
    link.rel = 'stylesheet'
    link.href = `/src/styles/themes/${settings.colorTheme}.css`
    console.log('[Theme] Loading color theme:', link.href)

    // CRITICAL FIX: Wait for color theme to load before applying dark mode
    link.onload = () => {
      console.log('[Theme] Color theme CSS loaded successfully')

      // Now apply dark mode AFTER color theme is fully loaded
      if (settings.themeMode === 'dark') {
        console.log('[Theme] Enabling dark mode (after color theme loaded)')
        document.documentElement.setAttribute('data-theme', 'dark')

        // Load dark theme CSS AFTER color theme
        const darkStylesheet = document.createElement('link')
        darkStylesheet.id = 'dark-theme-stylesheet'
        darkStylesheet.rel = 'stylesheet'
        darkStylesheet.href = '/src/styles/themes/dark.css'

        darkStylesheet.onload = () => {
          console.log('[Theme] Dark theme CSS loaded successfully')

          // Force browser repaint to ensure styles are applied
          document.body.style.display = 'none'
          document.body.offsetHeight // Trigger reflow
          document.body.style.display = ''

          console.log('[Theme] Theme application complete: dark mode active')
        }

        darkStylesheet.onerror = () => {
          console.error('[Theme] Failed to load dark theme CSS')
        }

        console.log('[Theme] Loading dark theme CSS:', darkStylesheet.href)
        document.head.appendChild(darkStylesheet)
      } else {
        console.log('[Theme] Light mode active')
        document.documentElement.removeAttribute('data-theme')
      }
    }

    link.onerror = () => {
      console.error('[Theme] Failed to load color theme CSS:', link.href)
    }

    document.head.appendChild(link)

    // Apply font size, density, border radius, and font family classes
    const className = `font-size-${settings.fontSize} density-${settings.density} border-${settings.borderRadius} font-${settings.fontFamily}`
    console.log('[Theme] Applying className:', className)
    document.documentElement.className = className

    // Apply animations preference
    if (!settings.enableAnimations) {
      console.log('[Theme] Disabling animations')
      document.documentElement.style.setProperty('--animation-duration', '0s')
    } else {
      console.log('[Theme] Enabling animations')
      document.documentElement.style.removeProperty('--animation-duration')
    }

    // Apply border radius CSS variable
    const borderRadiusValues = {
      'sharp': '0px',
      'rounded': '0.5rem',
      'extra-rounded': '1rem'
    }
    document.documentElement.style.setProperty('--border-radius', borderRadiusValues[settings.borderRadius])
    console.log('[Theme] Border radius:', borderRadiusValues[settings.borderRadius])

    // Apply font family CSS variable
    const fontFamilyValues = {
      'inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'geist': '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
      'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
      'poppins': '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
      'montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
      'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'lato': '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
      'raleway': '"Raleway", -apple-system, BlinkMacSystemFont, sans-serif',
      'nunito': '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
      'ubuntu': '"Ubuntu", -apple-system, BlinkMacSystemFont, sans-serif',
      'rubik': '"Rubik", -apple-system, BlinkMacSystemFont, sans-serif',
      'source-sans': '"Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif',
      'noto-sans': '"Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'pt-sans': '"PT Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'oswald': '"Oswald", -apple-system, BlinkMacSystemFont, sans-serif',
      'dm-sans': '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'work-sans': '"Work Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'space-grotesk': '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
      'playfair': '"Playfair Display", Georgia, serif',
      'merriweather': '"Merriweather", Georgia, serif',
      'bebas': '"Bebas Neue", -apple-system, BlinkMacSystemFont, sans-serif',
      'quicksand': '"Quicksand", -apple-system, BlinkMacSystemFont, sans-serif',
      'karla': '"Karla", -apple-system, BlinkMacSystemFont, sans-serif',
      'outfit': '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
      'jakarta': '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      'manrope': '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif',
      'lexend': '"Lexend", -apple-system, BlinkMacSystemFont, sans-serif',
      'archivo': '"Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
    document.documentElement.style.setProperty('--font-family', fontFamilyValues[settings.fontFamily] || fontFamilyValues['inter'])
    console.log('[Theme] Font family:', settings.fontFamily)

    // Apply font size CSS variable
    const fontSizeValues = {
      'small': '0.875rem',           // 14px
      'small-medium': '0.9375rem',   // 15px
      'medium': '1rem',              // 16px (default)
      'medium-large': '1.0625rem',   // 17px
      'large': '1.125rem'            // 18px
    }
    document.documentElement.style.setProperty('--base-font-size', fontSizeValues[settings.fontSize] || fontSizeValues['medium'])
    console.log('[Theme] Font size:', settings.fontSize, fontSizeValues[settings.fontSize])

    console.log('[Theme] Theme applied successfully')
  }, [settings.colorTheme, settings.themeMode, settings.fontSize, settings.density, settings.enableAnimations, settings.borderRadius, settings.fontFamily])

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (updates) => {
    console.log('[Settings] Updating settings with:', updates)
    setSettings(prev => {
      const newSettings = {
        ...prev,
        ...updates
      }
      console.log('[Settings] New settings state:', newSettings)
      return newSettings
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('claudex-settings')
  }

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'claudex-settings.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          setSettings({ ...DEFAULT_SETTINGS, ...imported })
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
