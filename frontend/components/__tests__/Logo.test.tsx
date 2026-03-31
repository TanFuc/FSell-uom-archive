import { render, screen } from '@testing-library/react'
import Logo from '../Logo'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

// Mock useSettings hook to avoid API calls in tests
jest.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({
    data: {
      logoUrl: '/test-logo.png',
      brandNameVi: 'Test Brand',
    },
    isLoading: false,
  }),
}))

describe('Logo Component', () => {
  it('renders correctly', () => {
    render(<Logo variant="png" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })
})
