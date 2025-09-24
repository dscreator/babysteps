import React from 'react'
import { StudentLink } from '../../types/parent'
import { Card } from '../common/Card'

interface StudentSelectorProps {
  students: StudentLink[]
  selectedStudentId: string | null
  onStudentSelect: (studentId: string) => void
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentId,
  onStudentSelect
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <button
            key={student.studentId}
            onClick={() => onStudentSelect(student.studentId)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStudentId === student.studentId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${!student.accessGranted ? 'opacity-60' : ''}`}
            disabled={!student.accessGranted}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{student.studentName}</h4>
              {student.accessGranted ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p>Grade {student.gradeLevel}</p>
              <p>Exam: {new Date(student.examDate).toLocaleDateString()}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}