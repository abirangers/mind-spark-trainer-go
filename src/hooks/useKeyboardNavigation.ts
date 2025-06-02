import { useEffect, useCallback } from 'react'

interface KeyboardNavigationOptions {
  onVisualMatch?: () => void
  onAudioMatch?: () => void
  onPause?: () => void
  onStart?: () => void
  onBack?: () => void
  disabled?: boolean
}

export const useKeyboardNavigation = ({
  onVisualMatch,
  onAudioMatch,
  onPause,
  onStart,
  onBack,
  disabled = false,
}: KeyboardNavigationOptions) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) {
        return
      }

      // Prevent default behavior for game keys
      const gameKeys = ['a', 'l', ' ', 'Enter', 'Escape']
      if (gameKeys.includes(event.key.toLowerCase())) {
        event.preventDefault()
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          onVisualMatch?.()
          break
        case 'l':
          onAudioMatch?.()
          break
        case ' ':
        case 'spacebar':
          onPause?.()
          break
        case 'enter':
          onStart?.()
          break
        case 'escape':
          onBack?.()
          break
        default:
          break
      }
    },
    [onVisualMatch, onAudioMatch, onPause, onStart, onBack, disabled]
  )

  useEffect(() => {
    if (disabled) {
      return
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress, disabled])

  // Return keyboard shortcuts info for display
  const shortcuts = {
    visualMatch: 'A',
    audioMatch: 'L',
    pause: 'Space',
    start: 'Enter',
    back: 'Escape',
  }

  return { shortcuts }
}

// Hook for focus management
export const useFocusManagement = () => {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }, [])

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement
    if (!container) {
      return
    }

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Focus first element
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [])

  return { focusElement, trapFocus }
}
