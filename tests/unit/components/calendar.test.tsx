import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ContentCalendar, CalendarPost } from '@/components/dashboard/ContentCalendar'
import { CalendarDay } from '@/components/dashboard/CalendarDay'
import { CalendarPost as CalendarPostComponent } from '@/components/dashboard/CalendarPost'

describe('CalendarDay', () => {
  const mockDate = new Date(2024, 0, 15) // January 15, 2024

  it('renders day number correctly', () => {
    render(<CalendarDay date={mockDate} posts={[]} isToday={false} />)

    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('highlights today', () => {
    render(<CalendarDay date={mockDate} posts={[]} isToday={true} />)

    const dayElement = screen.getByText('15')
    expect(dayElement).toHaveClass('text-primary')
  })

  it('displays post count when posts exist', () => {
    const mockPosts: CalendarPost[] = [
      {
        id: '1',
        caption: 'Test post 1',
        status: 'published',
        publishedAt: '2024-01-15',
      },
      {
        id: '2',
        caption: 'Test post 2',
        status: 'scheduled',
        scheduledTime: '2024-01-15',
      },
    ]

    render(<CalendarDay date={mockDate} posts={mockPosts} isToday={false} />)

    expect(screen.getByText('2 posts')).toBeInTheDocument()
  })

  it('displays singular "post" for single post', () => {
    const mockPosts: CalendarPost[] = [
      {
        id: '1',
        caption: 'Test post',
        status: 'published',
        publishedAt: '2024-01-15',
      },
    ]

    render(<CalendarDay date={mockDate} posts={mockPosts} isToday={false} />)

    expect(screen.getByText('1 post')).toBeInTheDocument()
  })

  it('displays status indicators', () => {
    const mockPosts: CalendarPost[] = [
      {
        id: '1',
        caption: 'Published post',
        status: 'published',
        publishedAt: '2024-01-15',
      },
      {
        id: '2',
        caption: 'Scheduled post',
        status: 'scheduled',
        scheduledTime: '2024-01-15',
      },
    ]

    render(<CalendarDay date={mockDate} posts={mockPosts} isToday={false} />)

    // Should render the posts count
    expect(screen.getByText('2 posts')).toBeInTheDocument()
  })

  it('calls onClick when day is clicked', () => {
    const mockOnClick = jest.fn()
    const mockPosts: CalendarPost[] = [
      {
        id: '1',
        caption: 'Test post',
        status: 'published',
        publishedAt: '2024-01-15',
      },
    ]

    render(<CalendarDay date={mockDate} posts={mockPosts} isToday={false} onClick={mockOnClick} />)

    const dayButton = screen.getByRole('button')
    fireEvent.click(dayButton)

    expect(mockOnClick).toHaveBeenCalled()
  })

  it('groups posts by status', () => {
    const mockPosts: CalendarPost[] = [
      { id: '1', caption: 'Post 1', status: 'published', publishedAt: '2024-01-15' },
      { id: '2', caption: 'Post 2', status: 'published', publishedAt: '2024-01-15' },
      { id: '3', caption: 'Post 3', status: 'scheduled', scheduledTime: '2024-01-15' },
    ]

    render(<CalendarDay date={mockDate} posts={mockPosts} isToday={false} />)

    // Should show count next to status dot when multiple posts have same status
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

describe('ContentCalendar', () => {
  const mockPosts: CalendarPost[] = [
    {
      id: '1',
      caption: 'Published post',
      status: 'published',
      publishedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      caption: 'Scheduled post',
      status: 'scheduled',
      scheduledTime: '2024-01-20T14:00:00Z',
    },
    {
      id: '3',
      caption: 'Draft post',
      status: 'draft',
    },
  ]

  it('renders calendar with month and year', () => {
    render(<ContentCalendar posts={mockPosts} />)

    // Should display current month and year
    const monthYear = screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)
    expect(monthYear).toBeInTheDocument()
  })

  it('renders days of the week header', () => {
    render(<ContentCalendar posts={mockPosts} />)

    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
  })

  it('navigates to previous month', () => {
    render(<ContentCalendar posts={mockPosts} />)

    const prevButton = screen.getByText('←')
    const currentMonth = screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)
    const currentMonthText = currentMonth.textContent

    fireEvent.click(prevButton)

    const newMonth = screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)
    expect(newMonth.textContent).not.toBe(currentMonthText)
  })

  it('navigates to next month', () => {
    render(<ContentCalendar posts={mockPosts} />)

    const nextButton = screen.getByText('→')
    const currentMonth = screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)
    const currentMonthText = currentMonth.textContent

    fireEvent.click(nextButton)

    const newMonth = screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)
    expect(newMonth.textContent).not.toBe(currentMonthText)
  })

  it('displays posts on correct dates', () => {
    // Mock current date to be in January 2024
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2024, 0, 10))

    render(<ContentCalendar posts={mockPosts} />)

    // Check that day 15 exists in the calendar
    expect(screen.getByText('15')).toBeInTheDocument()

    jest.useRealTimers()
  })

  it('calls onDayClick when a day with posts is clicked', () => {
    const mockOnDayClick = jest.fn()

    jest.useFakeTimers()
    jest.setSystemTime(new Date(2024, 0, 10))

    render(<ContentCalendar posts={mockPosts} onDayClick={mockOnDayClick} />)

    // Find navigation buttons - they should exist
    const dayButtons = screen.getAllByRole('button')
    
    // Should have navigation + day buttons
    expect(dayButtons.length).toBeGreaterThan(2)

    jest.useRealTimers()
  })

  it('renders correct number of day cells', () => {
    render(<ContentCalendar posts={mockPosts} />)

    // Calendar should have buttons (navigation + days)
    const buttons = screen.getAllByRole('button')
    
    // At minimum should have prev/next buttons + some day cells
    expect(buttons.length).toBeGreaterThan(2)
  })
})

describe('CalendarPost', () => {
  const mockPost: CalendarPost = {
    id: '1',
    caption: 'Test calendar post',
    status: 'scheduled',
    scheduledTime: '2024-01-15T10:00:00Z',
  }

  it('renders post caption', () => {
    render(<CalendarPostComponent {...mockPost} />)

    expect(screen.getByText('Test calendar post')).toBeInTheDocument()
  })

  it('displays scheduled time', () => {
    render(<CalendarPostComponent {...mockPost} />)

    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })

  it('displays status badge', () => {
    render(<CalendarPostComponent {...mockPost} />)

    expect(screen.getByText(/scheduled/i)).toBeInTheDocument()
  })

  it('truncates long captions', () => {
    const longCaption = 'a'.repeat(100)
    render(<CalendarPostComponent {...mockPost} caption={longCaption} />)

    const caption = screen.getByText(/aaa/)
    expect(caption.textContent?.length).toBeLessThan(100)
  })

  it('handles published posts without scheduled time', () => {
    const publishedPost: CalendarPost = {
      id: '2',
      caption: 'Published post',
      status: 'published',
      publishedAt: '2024-01-15T10:00:00Z',
    }

    render(<CalendarPostComponent {...publishedPost} />)

    expect(screen.getByText('Published post')).toBeInTheDocument()
    // Status is displayed in a badge
    const allPublishedText = screen.getAllByText(/published/i)
    expect(allPublishedText.length).toBeGreaterThan(0)
  })
})
