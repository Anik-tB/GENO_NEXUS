import { render, screen, fireEvent } from '@testing-library/react'
import ActivityStream from '@/app/dashboard/collaboration/components/ActivityStream'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('ActivityStream Component', () => {
  const mockStreams = [
    {
      id: '1',
      ts: Date.now() - 5000,
      time: 'Just now',
      type: 'note' as const,
      author: 'Test User',
      desc: 'This is a test note.',
    },
  ]

  const mockMembers = [
    {
      id: 'u1',
      name: 'Test User',
      role: 'Researcher',
      color: '#000',
      status: 'online' as const,
      viewing: 'Dashboard',
      typing: false,
    },
  ]

  it('renders the stream header', () => {
    render(<ActivityStream streams={mockStreams} members={mockMembers} />)
    expect(screen.getByText('Live Activity Stream')).toBeInTheDocument()
  })

  it('renders stream entries', () => {
    render(<ActivityStream streams={mockStreams} members={mockMembers} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('This is a test note.')).toBeInTheDocument()
  })

  it('allows posting a note', () => {
    const handlePostNote = jest.fn()
    render(
      <ActivityStream
        streams={mockStreams}
        members={mockMembers}
        onPostNote={handlePostNote}
        wsStatus="live"
      />
    )

    const textarea = screen.getByPlaceholderText('Post an activity note, alert, or update…')
    fireEvent.change(textarea, { target: { value: 'New note text' } })
    
    const postButton = screen.getByRole('button', { name: 'Post note' })
    expect(postButton).not.toBeDisabled()
    
    fireEvent.click(postButton)
    expect(handlePostNote).toHaveBeenCalledWith('New note text', 'note')
  })

  it('disables post button when offline', () => {
    render(<ActivityStream streams={mockStreams} members={mockMembers} wsStatus="offline" />)
    const postButton = screen.getByRole('button', { name: 'Post note' })
    expect(postButton).toBeDisabled()
  })
})
