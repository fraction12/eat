import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastContainer, showToast } from '@/components/Toast'

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should display a success toast', async () => {
    render(<ToastContainer />)
    showToast('success', 'Operation successful!')
    await waitFor(() => {
      expect(screen.getByText('Operation successful!')).toBeInTheDocument()
    })
  })

  it('should display an error toast', async () => {
    render(<ToastContainer />)
    showToast('error', 'Something went wrong')
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('should display an info toast', async () => {
    render(<ToastContainer />)
    showToast('info', 'Here is some information')
    await waitFor(() => {
      expect(screen.getByText('Here is some information')).toBeInTheDocument()
    })
  })

  it('should auto-dismiss toast after 4 seconds', async () => {
    render(<ToastContainer />)
    showToast('success', 'Auto dismiss test')

    await waitFor(() => {
      expect(screen.getByText('Auto dismiss test')).toBeInTheDocument()
    })

    jest.advanceTimersByTime(4000)

    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss test')).not.toBeInTheDocument()
    })
  })

  it('should allow manual dismissal of toast', async () => {
    const user = userEvent.setup({ delay: null })
    render(<ToastContainer />)
    showToast('success', 'Manual dismiss test')

    await waitFor(() => {
      expect(screen.getByText('Manual dismiss test')).toBeInTheDocument()
    })

    const closeButton = screen.getAllByRole('button')[0]
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Manual dismiss test')).not.toBeInTheDocument()
    })
  })

  it('should display multiple toasts simultaneously', async () => {
    render(<ToastContainer />)
    showToast('success', 'First toast')
    showToast('error', 'Second toast')
    showToast('info', 'Third toast')

    await waitFor(() => {
      expect(screen.getByText('First toast')).toBeInTheDocument()
      expect(screen.getByText('Second toast')).toBeInTheDocument()
      expect(screen.getByText('Third toast')).toBeInTheDocument()
    })
  })
})
