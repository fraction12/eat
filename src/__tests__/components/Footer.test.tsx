import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/Footer'

describe('Footer', () => {
  it('should render the app name in copyright', () => {
    render(<Footer />)
    expect(screen.getByText(/© .* Eat\. All rights reserved\./i)).toBeInTheDocument()
  })

  it('should display the current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument()
  })

  it('should render the creator information', () => {
    render(<Footer />)
    expect(screen.getByText(/Dushyant/i)).toBeInTheDocument()
  })

  it('should have a mailto link', () => {
    render(<Footer />)
    const emailLink = screen.getByRole('link', { name: /Dushyant/i })
    expect(emailLink).toHaveAttribute('href', 'mailto:dushyantgarg3@gmail.com')
  })

  it('should render copyright text', () => {
    render(<Footer />)
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })
})
