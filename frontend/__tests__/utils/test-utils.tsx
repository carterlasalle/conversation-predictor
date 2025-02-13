import React from 'react'
import { render as rtlRender } from '@testing-library/react'

// Add custom render method that includes providers if needed
function render(ui: React.ReactElement, { ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <>
        {children}
      </>
    )
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render } 