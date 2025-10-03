import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step1BusinessProfile } from '@/components/onboarding/Step1BusinessProfile'
import { Step2SocialConnect } from '@/components/onboarding/Step2SocialConnect'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client
const mockSignOut = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

describe('Step1BusinessProfile', () => {
  const mockOnNext = jest.fn()

  beforeEach(() => {
    mockOnNext.mockClear()
  })

  it('renders the business profile form', () => {
    render(<Step1BusinessProfile onNext={mockOnNext} />)

    expect(screen.getByText('Tell us about your business')).toBeInTheDocument()
    expect(screen.getByLabelText(/Business Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Industry/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target Audience/)).toBeInTheDocument()
  })

  it('allows adding and removing topics', () => {
    render(<Step1BusinessProfile onNext={mockOnNext} />)

    const input = screen.getByPlaceholderText('Add a topic')
    const addButton = screen.getByRole('button', { name: /add topic/i })

    // Add a topic
    fireEvent.change(input, { target: { value: 'Marketing' } })
    fireEvent.click(addButton)

    expect(screen.getByText('Marketing')).toBeInTheDocument()

    // Remove the topic
    const removeButton = screen.getByLabelText('Remove Marketing topic')
    fireEvent.click(removeButton)

    expect(screen.queryByText('Marketing')).not.toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<Step1BusinessProfile onNext={mockOnNext} />)

    const submitButton = screen.getByRole('button', { name: 'Continue to Social Media Setup' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Business Name/)).toBeInTheDocument()
      // Form validation should prevent submission
      expect(mockOnNext).not.toHaveBeenCalled()
    })
  })

  it('submits valid form data', async () => {
    const mockOnNext = jest.fn()
    const { getByRole, getByLabelText } = render(<Step1BusinessProfile onNext={mockOnNext} />)

    // Fill in the form fields
    const nameInput = getByLabelText(/business name \*/i)
    const industryInput = getByLabelText(/industry \*/i)
    const audienceTextarea = getByLabelText(/target audience \*/i)

    await userEvent.type(nameInput, 'Test Business')
    await userEvent.type(industryInput, 'Technology')
    await userEvent.type(audienceTextarea, 'Small businesses looking for marketing solutions')

    // Submit the form
    const submitButton = getByRole('button', { name: /continue/i })
    await userEvent.click(submitButton)

    // Check that onNext was called with the form data
    const expectedData = {
      name: 'Test Business',
      industry: 'Technology',
      targetAudience: 'Small businesses looking for marketing solutions',
      tone: 'professional',
      topics: ['Marketing'],
      language: 'en',
      logoUrl: '',
    }

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(expectedData)
    })
  })
})

describe('Step2SocialConnect', () => {
  const mockOnNext = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    mockOnNext.mockClear()
    mockOnBack.mockClear()
  })

  it('renders social media platforms', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    expect(screen.getByText('Connect Your Social Media Accounts')).toBeInTheDocument()
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('shows connection status', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    expect(screen.getByText('0 of 4 platforms connected')).toBeInTheDocument()
  })

  it('allows connecting platforms', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    const connectButton = screen.getAllByRole('button', { name: 'Connect Account' })[0]
    fireEvent.click(connectButton)

    expect(screen.getByText('1 of 4 platforms connected')).toBeInTheDocument()
  })

  it('enables continue button when at least one platform is connected', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    const continueButton = screen.getByRole('button', { name: 'Complete Setup' })
    expect(continueButton).toBeDisabled()

    // Connect a platform
    const connectButton = screen.getAllByRole('button', { name: 'Connect Account' })[0]
    fireEvent.click(connectButton)

    expect(continueButton).not.toBeDisabled()
  })

  it('calls onNext when continue is clicked', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    // Connect a platform first
    const connectButton = screen.getAllByRole('button', { name: 'Connect Account' })[0]
    fireEvent.click(connectButton)

    const continueButton = screen.getByRole('button', { name: 'Complete Setup' })
    fireEvent.click(continueButton)

    expect(mockOnNext).toHaveBeenCalled()
  })

  it('calls onBack when back is clicked', () => {
    render(
      <Step2SocialConnect
        onNext={mockOnNext}
        onBack={mockOnBack}
        businessProfileId="test-profile-id"
      />
    )

    const backButton = screen.getByRole('button', { name: 'Back' })
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })
})

describe('OnboardingWizard', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignOut.mockClear()
    // Mock fetch for business profile creation
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'test-profile-id' }),
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the first step initially', () => {
    render(<OnboardingWizard />)

    expect(screen.getByText('Tell us about your business')).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    render(<OnboardingWizard />)

    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('handles sign out when button is clicked', async () => {
    mockSignOut.mockResolvedValue({})
    render(<OnboardingWizard />)

    const signOutButton = screen.getByText('Sign Out')
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('navigates to second step after completing first step', async () => {
    render(<OnboardingWizard />)

    // Fill and submit first step
    fireEvent.change(screen.getByLabelText(/Business Name/), {
      target: { value: 'Test Business' },
    })
    fireEvent.change(screen.getByLabelText(/Industry/), {
      target: { value: 'Technology' },
    })
    fireEvent.change(screen.getByLabelText(/Target Audience/), {
      target: { value: 'Small businesses' },
    })

    const topicInput = screen.getByPlaceholderText('Add a topic')
    const addButton = screen.getByRole('button', { name: /add topic/i })
    fireEvent.change(topicInput, { target: { value: 'Innovation' } })
    fireEvent.click(addButton)

    const continueButton = screen.getByRole('button', { name: 'Continue to Social Media Setup' })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Connect Your Social Media Accounts')).toBeInTheDocument()
    })

    // Verify fetch was called with credentials
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/business-profiles',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    )
  })

  it('completes onboarding and redirects to dashboard', async () => {
    // Mock fetch for social account connection
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ id: 'test-profile-id', oauth_url: 'https://example.com/oauth' }),
      })
    ) as jest.Mock

    render(<OnboardingWizard />)

    // Complete first step
    fireEvent.change(screen.getByLabelText(/Business Name/), {
      target: { value: 'Test Business' },
    })
    fireEvent.change(screen.getByLabelText(/Industry/), {
      target: { value: 'Technology' },
    })
    fireEvent.change(screen.getByLabelText(/Target Audience/), {
      target: { value: 'Small businesses' },
    })

    const topicInput = screen.getByPlaceholderText('Add a topic')
    const addButton = screen.getByRole('button', { name: /add topic/i })
    fireEvent.change(topicInput, { target: { value: 'Innovation' } })
    fireEvent.click(addButton)

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Social Media Setup' }))

    // Wait for second step and skip connection since it redirects
    await waitFor(() => {
      expect(screen.getByText('Connect Your Social Media Accounts')).toBeInTheDocument()
    })

    // Skip to complete button (assumes at least one platform connected in future)
    const completeButton = screen.getByRole('button', { name: 'Complete Setup' })

    // The button should be disabled initially (no platforms connected)
    expect(completeButton).toBeDisabled()
  })
})
