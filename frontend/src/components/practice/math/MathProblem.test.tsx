import { render, screen, fireEvent, waitFor } from '../../../test/utils'
import { MathProblem } from './MathProblem'
import { createMockMathProblem } from '../../../test/utils'
import { vi } from 'vitest'

describe('MathProblem', () => {
  const mockProblem = createMockMathProblem({
    question: 'What is 15 + 27?',
    options: ['40', '42', '44', '46'],
    correctAnswer: '42',
    explanation: '15 + 27 = 42',
    hints: ['Break it down: 15 + 20 + 7', 'Think about place values']
  })

  const mockOnAnswer = vi.fn()
  const mockOnHint = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders problem question and options', () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    expect(screen.getByText('What is 15 + 27?')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('44')).toBeInTheDocument()
    expect(screen.getByText('46')).toBeInTheDocument()
  })

  it('handles answer selection and submission', async () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    // Select an answer
    const correctOption = screen.getByLabelText('42')
    fireEvent.click(correctOption)

    // Submit answer
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalledWith('42')
    })
  })

  it('shows feedback after answer submission', async () => {
    const { rerender } = render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    // Select and submit correct answer
    fireEvent.click(screen.getByLabelText('42'))
    fireEvent.click(screen.getByText('Submit Answer'))

    // Rerender with feedback
    rerender(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
        showFeedback={true}
        isCorrect={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Correct!/)).toBeInTheDocument()
      expect(screen.getByText('15 + 27 = 42')).toBeInTheDocument()
    })
  })

  it('shows incorrect feedback with explanation', async () => {
    const { rerender } = render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    // Select and submit incorrect answer
    fireEvent.click(screen.getByLabelText('40'))
    fireEvent.click(screen.getByText('Submit Answer'))

    // Rerender with incorrect feedback
    rerender(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
        showFeedback={true}
        isCorrect={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Incorrect/)).toBeInTheDocument()
      expect(screen.getByText('15 + 27 = 42')).toBeInTheDocument()
    })
  })

  it('handles hint requests', async () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    const hintButton = screen.getByText('Get Hint')
    fireEvent.click(hintButton)

    await waitFor(() => {
      expect(mockOnHint).toHaveBeenCalled()
    })
  })

  it('displays hints when provided', () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
        currentHint="Break it down: 15 + 20 + 7"
      />
    )

    expect(screen.getByText('Break it down: 15 + 20 + 7')).toBeInTheDocument()
  })

  it('disables submit button when no answer is selected', () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    const submitButton = screen.getByText('Submit Answer')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when answer is selected', () => {
    render(
      <MathProblem
        problem={mockProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    fireEvent.click(screen.getByLabelText('42'))
    
    const submitButton = screen.getByText('Submit Answer')
    expect(submitButton).not.toBeDisabled()
  })

  it('renders mathematical notation correctly', () => {
    const mathProblem = createMockMathProblem({
      question: 'Solve: $x^2 + 5x + 6 = 0$'
    })

    render(
      <MathProblem
        problem={mathProblem}
        onAnswer={mockOnAnswer}
        onHint={mockOnHint}
      />
    )

    expect(screen.getByTestId('inline-math')).toBeInTheDocument()
  })
})